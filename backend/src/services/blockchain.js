const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

const BATCH_STATUS_NAMES = [
  'Registered',
  'In Transit',
  'Delivered',
  'Dispensed',
  'Recalled',
  'Compromised'
];

let provider = null;
let contract = null;
let contractAddress = null;
let contractAbi = null;

function initializeBlockchain() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const chainId = Number(process.env.CHAIN_ID || 31337);
  const net = ethers.Network.from(chainId);
  provider = new ethers.JsonRpcProvider(rpcUrl, net, { staticNetwork: net });

  // 1. Try loading ABI and address from frontend contracts
  try {
    const contractsJsonPath = path.resolve(__dirname, '../../../frontend/src/contracts/MediChain.json');
    if (fs.existsSync(contractsJsonPath)) {
      const data = JSON.parse(fs.readFileSync(contractsJsonPath, 'utf8'));
      contractAddress = process.env.MEDICHAIN_CONTRACT_ADDRESS || data.address;
      contractAbi = data.abi;
    }
  } catch (err) {
    console.warn(`[Blockchain] Could not load frontend contract JSON: ${err.message}`);
  }

  // 2. Try loading from blockchain/deployed-contract.json
  if (!contractAddress || !contractAbi) {
    try {
      const deployedJsonPath = path.resolve(__dirname, '../../../blockchain/deployed-contract.json');
      if (fs.existsSync(deployedJsonPath)) {
        const data = JSON.parse(fs.readFileSync(deployedJsonPath, 'utf8'));
        contractAddress = process.env.MEDICHAIN_CONTRACT_ADDRESS || data.address;
        contractAbi = contractAbi || data.abi;
      }
    } catch (err) {
      console.warn(`[Blockchain] Could not load deployed-contract.json: ${err.message}`);
    }
  }

  // 3. Fallback to blockchain/artifacts if needed
  if (!contractAbi) {
    try {
      const artifactPath = path.resolve(__dirname, '../../../blockchain/artifacts/contracts/MediChain.sol/MediChain.json');
      if (fs.existsSync(artifactPath)) {
        const data = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        contractAbi = data.abi;
      }
    } catch (err) {
      console.warn(`[Blockchain] Could not load artifact JSON: ${err.message}`);
    }
  }

  contractAddress = process.env.MEDICHAIN_CONTRACT_ADDRESS || contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  if (contractAbi && contractAddress) {
    contract = new ethers.Contract(contractAddress, contractAbi, provider);
  }
}

// Initialize on module load
initializeBlockchain();

class BlockchainService {
  static async checkStatus() {
    if (!provider) initializeBlockchain();
    try {
      // 1.5s timeout check for JSON-RPC ping
      const networkPromise = provider.getNetwork();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC connection timed out')), 1500)
      );
      
      const network = await Promise.race([networkPromise, timeoutPromise]);
      const blockNumber = await provider.getBlockNumber();
      const code = await provider.getCode(contractAddress).catch(() => '0x');
      const contractDeployed = code !== '0x' && code !== '0x0';

      return {
        connected: true,
        rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
        chainId: Number(network.chainId),
        latestBlockNumber: blockNumber,
        contractAddress: contractAddress,
        contractDeployed,
      };
    } catch (err) {
      return {
        connected: false,
        rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
        contractAddress: contractAddress,
        contractDeployed: false,
        error: err.message,
        note: 'Standalone Hardhat node offline or unreachable'
      };
    }
  }

  static async getOnChainBatch(batchId) {
    if (!contract) initializeBlockchain();
    if (!contract) {
      return { verifiedOnChain: false, error: 'Contract ABI or provider not initialized' };
    }

    try {
      const exists = await contract.batchExists(batchId);
      if (!exists) {
        return { verifiedOnChain: false, batchId, reason: 'Batch not registered on blockchain' };
      }

      const raw = await contract.getBatch(batchId);
      const rawHistory = await contract.getBatchHistory(batchId);

      const statusIndex = Number(raw.status);
      const statusLabel = BATCH_STATUS_NAMES[statusIndex] || 'Unknown';

      const history = rawHistory.map((h, idx) => ({
        step: idx + 1,
        from: h.from,
        to: h.to,
        timestamp: new Date(Number(h.timestamp) * 1000).toISOString(),
        location: h.location,
        temperatureCelsius: Number(h.temperatureTimesTen) / 10,
        notes: h.notes,
        isGenesis: idx === 0,
      }));

      return {
        verifiedOnChain: true,
        sourceOfTruth: 'MediChain.sol Ethereum Smart Contract',
        contractAddress,
        batchId: raw.batchId,
        medicineName: raw.medicineName,
        manufacturer: raw.manufacturer,
        currentCustodian: raw.currentCustodian,
        quantity: Number(raw.quantity),
        manufacturingDate: new Date(Number(raw.manufacturingDate) * 1000).toISOString().split('T')[0],
        expiryDate: new Date(Number(raw.expiryDate) * 1000).toISOString().split('T')[0],
        registrationTimestamp: new Date(Number(raw.registrationTimestamp) * 1000).toISOString(),
        status: statusLabel,
        statusCode: statusIndex,
        custodyHistory: history,
      };
    } catch (err) {
      return {
        verifiedOnChain: false,
        batchId,
        error: err.message,
      };
    }
  }

  static async getOnChainBatchIds() {
    if (!contract) initializeBlockchain();
    if (!contract) return [];

    try {
      const totalCount = await contract.getBatchCount();
      const count = Number(totalCount);
      const ids = [];

      for (let i = 0; i < count; i++) {
        const id = await contract.getBatchIdAtIndex(i);
        ids.push(id);
      }
      return ids;
    } catch {
      return [];
    }
  }
}

module.exports = {
  BlockchainService,
};
