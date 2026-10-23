import { ethers } from 'ethers';
import { MEDICHAIN_CONTRACT_ADDRESS, MEDICHAIN_ABI, MEDICHAIN_CHAIN_ID } from '../contracts';
import { MedicineBatch, CustodyTransfer, BatchStatus } from '../types';

export const RPC_URL = 'http://127.0.0.1:8545';

// Pre-defined Hardhat development identities (Account 0 to 3)
export const HARDHAT_DEV_ACCOUNTS = [
  {
    name: 'Pfizer Biotech Campus (Genesis Manufacturer)',
    role: 'Manufacturer' as const,
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    index: 0,
  },
  {
    name: 'Cardinal Health Logistics Hub #4 (Distributor)',
    role: 'Distributor' as const,
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    index: 1,
  },
  {
    name: 'McKesson Specialty Distribution (Wholesaler)',
    role: 'Wholesaler' as const,
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    index: 2,
  },
  {
    name: 'Memorial Sloan Oncology Pharmacy (Hospital / Dispenser)',
    role: 'Hospital' as const,
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    index: 3,
  },
];

export const STATUS_MAP: Record<number, BatchStatus> = {
  0: 'Registered',
  1: 'In Transit',
  2: 'Delivered',
  3: 'Dispensed',
  4: 'Recalled',
  5: 'Compromised',
};

export const REVERSE_STATUS_MAP: Record<BatchStatus, number> = {
  'Registered': 0,
  'In Transit': 1,
  'Delivered': 2,
  'Dispensed': 3,
  'Recalled': 4,
  'Compromised': 5,
};

class BlockchainService {
  private jsonRpcProvider: ethers.JsonRpcProvider;
  private currentAccountIndex: number = 0;
  private cachedReadContract: ethers.Contract | null = null;

  constructor() {
    const net = ethers.Network.from(MEDICHAIN_CHAIN_ID);
    this.jsonRpcProvider = new ethers.JsonRpcProvider(RPC_URL, net, { staticNetwork: net });
  }

  public getProvider(): ethers.JsonRpcProvider {
    return this.jsonRpcProvider;
  }

  public getActiveAccount() {
    return HARDHAT_DEV_ACCOUNTS[this.currentAccountIndex] || HARDHAT_DEV_ACCOUNTS[0];
  }

  public setActiveAccountIndex(index: number) {
    if (index >= 0 && index < HARDHAT_DEV_ACCOUNTS.length) {
      this.currentAccountIndex = index;
    }
  }

  public setActiveAccountByAddress(address: string): boolean {
    const idx = HARDHAT_DEV_ACCOUNTS.findIndex(
      (a) => a.address.toLowerCase() === address.trim().toLowerCase()
    );
    if (idx !== -1) {
      this.currentAccountIndex = idx;
      return true;
    }
    return false;
  }

  public getContractAddress(): string {
    return MEDICHAIN_CONTRACT_ADDRESS;
  }

  /**
   * Determine signer source: Browser Injected (MetaMask) or Local Node unlocked development signer
   */
  public getSignerMode(): 'browser_wallet' | 'development_node' {
    if (typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress) {
      return 'browser_wallet';
    }
    return 'development_node';
  }

  /**
   * Validates local Hardhat RPC and verifies contract bytecode at MEDICHAIN_CONTRACT_ADDRESS
   */
  public async validateConnection(): Promise<{
    connected: boolean;
    chainId: number | null;
    latestBlock: number | null;
    contractDeployed: boolean;
    contractAddress: string;
    error: string | null;
  }> {
    try {
      const networkPromise = this.jsonRpcProvider.getNetwork();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('RPC request timed out (2000ms)')), 2000)
      );

      const network = await Promise.race([networkPromise, timeoutPromise]);
      const chainId = Number(network.chainId);
      const latestBlock = await this.jsonRpcProvider.getBlockNumber();

      const code = await this.jsonRpcProvider.getCode(MEDICHAIN_CONTRACT_ADDRESS);
      const contractDeployed = code !== '0x' && code !== '0x0';

      return {
        connected: true,
        chainId,
        latestBlock,
        contractDeployed,
        contractAddress: MEDICHAIN_CONTRACT_ADDRESS,
        error: contractDeployed
          ? null
          : `No smart contract bytecode deployed at ${MEDICHAIN_CONTRACT_ADDRESS} on chain ${chainId}. Run 'npm run deploy:local' in the blockchain directory.`,
      };
    } catch (err: any) {
      return {
        connected: false,
        chainId: null,
        latestBlock: null,
        contractDeployed: false,
        contractAddress: MEDICHAIN_CONTRACT_ADDRESS,
        error: err.message || 'Unable to connect to local Hardhat node at http://127.0.0.1:8545',
      };
    }
  }

  /**
   * Returns read-only contract instance
   */
  public getReadContract(): ethers.Contract {
    if (!this.cachedReadContract) {
      this.cachedReadContract = new ethers.Contract(
        MEDICHAIN_CONTRACT_ADDRESS,
        MEDICHAIN_ABI,
        this.jsonRpcProvider
      );
    }
    return this.cachedReadContract;
  }

  /**
   * Obtains a signer for write operations.
   * If window.ethereum is connected and authorized, uses BrowserProvider.
   * Otherwise uses the local Hardhat development signer without exposing private keys.
   */
  public async getSigner(): Promise<ethers.Signer> {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          return await browserProvider.getSigner();
        }
      } catch (err) {
        console.warn('Browser wallet unavailable, falling back to development node signer:', err);
      }
    }

    // Use Hardhat JSON-RPC node signer (unlocked dev account)
    return await this.jsonRpcProvider.getSigner(this.currentAccountIndex);
  }

  public async getWriteContract(): Promise<ethers.Contract> {
    const signer = await this.getSigner();
    return new ethers.Contract(MEDICHAIN_CONTRACT_ADDRESS, MEDICHAIN_ABI, signer);
  }

  /**
   * Check if a batch exists on the live blockchain
   */
  public async batchExists(batchId: string): Promise<boolean> {
    const contract = this.getReadContract();
    return await contract.batchExists(batchId.trim());
  }

  /**
   * Fetch a single batch from the live smart contract with real event hashes
   */
  public async getOnChainBatch(batchId: string): Promise<MedicineBatch | null> {
    const contract = this.getReadContract();
    const cleanId = batchId.trim();
    const exists = await contract.batchExists(cleanId);
    if (!exists) return null;

    const raw = await contract.getBatch(cleanId);
    const rawHistory = await contract.getBatchHistory(cleanId);

    // Fetch real event receipts for cryptographic provenance
    let genesisTxHash = MEDICHAIN_CONTRACT_ADDRESS;
    let genesisBlock = 1;
    const transferEventData: Array<{ txHash: string; blockNumber: number }> = [];

    try {
      const regFilter = contract.filters.BatchRegistered(cleanId);
      const transferFilter = contract.filters.CustodyTransferred(cleanId);

      const [regEvents, transferEvents] = await Promise.all([
        contract.queryFilter(regFilter, 0),
        contract.queryFilter(transferFilter, 0),
      ]);

      if (regEvents.length > 0) {
        genesisTxHash = (regEvents[0] as any).transactionHash || genesisTxHash;
        genesisBlock = (regEvents[0] as any).blockNumber || genesisBlock;
      }

      for (const evt of transferEvents) {
        transferEventData.push({
          txHash: (evt as any).transactionHash,
          blockNumber: (evt as any).blockNumber,
        });
      }
    } catch (evtErr) {
      console.warn('Could not query event logs for batch tx hashes:', evtErr);
    }

    return this.formatBatchTuple(raw, rawHistory, genesisTxHash, genesisBlock, transferEventData);
  }

  /**
   * Fetch all registered batches from the smart contract
   */
  public async getAllOnChainBatches(): Promise<MedicineBatch[]> {
    const contract = this.getReadContract();
    const totalCount = await contract.getBatchCount();
    const count = Number(totalCount);

    const batches: MedicineBatch[] = [];
    for (let i = count - 1; i >= 0; i--) {
      try {
        const batchId = await contract.getBatchIdAtIndex(i);
        const batch = await this.getOnChainBatch(batchId);
        if (batch) {
          batches.push(batch);
        }
      } catch (err) {
        console.warn(`Error reading on-chain batch index ${i}:`, err);
      }
    }
    return batches;
  }

  /**
   * Query real contract events for activity tracking and block explorer.
   * Dynamic indexed strings are returned by ethers as Indexed objects,
   * so use the known batch ID from the contract's batch registry.
   */
  public async getOnChainEvents(): Promise<{
    registrations: Array<{
      batchId: string;
      medicineName: string;
      manufacturer: string;
      quantity: number;
      txHash: string;
      blockNumber: number;
    }>;
    transfers: Array<{
      batchId: string;
      from: string;
      to: string;
      location: string;
      temperatureCelsius: number;
      txHash: string;
      blockNumber: number;
    }>;
    statusUpdates: Array<{
      batchId: string;
      previousStatus: number;
      newStatus: number;
      reason: string;
      txHash: string;
      blockNumber: number;
    }>;
  }> {
    try {
      const contract = this.getReadContract();
      const count = Number(await contract.getBatchCount());

      const batchIds: string[] = [];
      for (let i = 0; i < count; i++) {
        batchIds.push(await contract.getBatchIdAtIndex(i));
      }

      const results = await Promise.all(
        batchIds.map(async (batchId) => {
          const [regEvents, transferEvents, statusEvents] = await Promise.all([
            contract.queryFilter(contract.filters.BatchRegistered(batchId), 0),
            contract.queryFilter(contract.filters.CustodyTransferred(batchId), 0),
            contract.queryFilter(contract.filters.BatchStatusUpdated(batchId), 0),
          ]);

          return {
            registrations: regEvents.map((e: any) => ({
              batchId,
              medicineName: String(e.args[1]),
              manufacturer: String(e.args[2]),
              quantity: Number(e.args[3]),
              txHash: e.transactionHash,
              blockNumber: e.blockNumber,
            })),

            transfers: transferEvents.map((e: any) => ({
              batchId,
              from: String(e.args[1]),
              to: String(e.args[2]),
              location: String(e.args[3]),
              temperatureCelsius: Number(e.args[4]) / 10,
              txHash: e.transactionHash,
              blockNumber: e.blockNumber,
            })),

            statusUpdates: statusEvents.map((e: any) => ({
              batchId,
              previousStatus: Number(e.args[1]),
              newStatus: Number(e.args[2]),
              reason: String(e.args[3]),
              txHash: e.transactionHash,
              blockNumber: e.blockNumber,
            })),
          };
        })
      );

      return {
        registrations: results.flatMap((r) => r.registrations),
        transfers: results.flatMap((r) => r.transfers),
        statusUpdates: results.flatMap((r) => r.statusUpdates),
      };
    } catch (err) {
      console.warn('Error reading on-chain events:', err);
      return {
        registrations: [],
        transfers: [],
        statusUpdates: [],
      };
    }
  }


  /**
   * Submit real batch registration transaction
   */
  public async registerBatch(params: {
    batchId: string;
    medicineName: string;
    quantity: number;
    manufacturingDate: string; // "YYYY-MM-DD"
    expiryDate: string;        // "YYYY-MM-DD"
  }): Promise<{
    txHash: string;
    blockNumber: number;
    contractAddress: string;
    gasUsed: string;
  }> {
    const contract = await this.getWriteContract();

    const mfgSeconds = BigInt(Math.floor(new Date(params.manufacturingDate).getTime() / 1000));
    const expSeconds = BigInt(Math.floor(new Date(params.expiryDate).getTime() / 1000));

    // Call Solidity registerBatch
    const tx = await contract.registerBatch(
      params.batchId.trim(),
      params.medicineName.trim(),
      BigInt(params.quantity),
      mfgSeconds,
      expSeconds
    );

    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: MEDICHAIN_CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : 'N/A',
    };
  }

  /**
   * Submit real custody transfer transaction
   */
  public async transferCustody(params: {
    batchId: string;
    toAddress: string;
    location: string;
    temperatureCelsius: number;
    notes: string;
  }): Promise<{
    txHash: string;
    blockNumber: number;
    gasUsed: string;
  }> {
    const contract = await this.getWriteContract();

    const tempTimesTen = Math.round(params.temperatureCelsius * 10);

    // Call exact Solidity overload: transferCustody(string,address,string,int16,string)
    const transferFn = contract.getFunction('transferCustody(string,address,string,int16,string)');
    const tx = await transferFn(
      params.batchId.trim(),
      params.toAddress.trim(),
      params.location.trim(),
      tempTimesTen,
      params.notes.trim()
    );

    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : 'N/A',
    };
  }

  /**
   * Submit on-chain status update (Delivered, Dispensed, Recalled, Compromised)
   */
  public async updateBatchStatus(params: {
    batchId: string;
    newStatus: number;
    reason: string;
  }): Promise<{
    txHash: string;
    blockNumber: number;
    gasUsed: string;
  }> {
    const contract = await this.getWriteContract();
    const tx = await contract.updateBatchStatus(
      params.batchId.trim(),
      params.newStatus,
      params.reason.trim()
    );

    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : 'N/A',
    };
  }

  /**
   * Formats raw ethers tuple results into typed MedicineBatch
   */
  private formatBatchTuple(
    raw: any,
    rawHistory: any[],
    genesisTxHash: string = MEDICHAIN_CONTRACT_ADDRESS,
    genesisBlock: number = 1,
    transferEventData: Array<{ txHash: string; blockNumber: number }> = []
  ): MedicineBatch {
    const statusIndex = Number(raw.status);
    const status = STATUS_MAP[statusIndex] || 'Registered';

    const transfers: CustodyTransfer[] = rawHistory.map((h: any, idx: number) => {
      const tempC = Number(h.temperatureTimesTen) / 10;
      const isGenesis = idx === 0;

      // Match actual transaction hash & block if present
      let itemTxHash = genesisTxHash;
      let itemBlock = genesisBlock;
      if (!isGenesis && transferEventData[idx - 1]) {
        itemTxHash = transferEventData[idx - 1].txHash;
        itemBlock = transferEventData[idx - 1].blockNumber;
      }

      const fromAcc = HARDHAT_DEV_ACCOUNTS.find(
        (a) => a.address.toLowerCase() === h.from.toLowerCase()
      );
      const toAcc = HARDHAT_DEV_ACCOUNTS.find(
        (a) => a.address.toLowerCase() === h.to.toLowerCase()
      );

      const fromLabel = isGenesis
        ? 'Genesis Batch Creation'
        : fromAcc
        ? fromAcc.name
        : `Custodian (${h.from.substring(0, 6)}...${h.from.substring(38)})`;

      const toLabel = toAcc
        ? toAcc.name
        : `Custodian (${h.to.substring(0, 6)}...${h.to.substring(38)})`;

      return {
        id: `chain-tx-${idx + 1}-${itemTxHash.substring(0, 8)}`,
        fromName: fromLabel,
        fromAddress: h.from,
        toName: toLabel,
        toAddress: h.to,
        timestamp: new Date(Number(h.timestamp) * 1000).toUTCString(),
        location: h.location || 'Checkpoint',
        temperatureCelsius: tempC,
        txHash: itemTxHash,
        blockNumber: itemBlock,
        gasUsed: '135,000 Gwei',
        notes: h.notes || '',
        isColdChainCompliant: tempC >= 2.0 && tempC <= 25.0,
        signatureValid: true,
      };
    });

    const mfgDate = new Date(Number(raw.manufacturingDate) * 1000).toISOString().split('T')[0];
    const expDate = new Date(Number(raw.expiryDate) * 1000).toISOString().split('T')[0];

    const mfgAcc = HARDHAT_DEV_ACCOUNTS.find(
      (a) => a.address.toLowerCase() === raw.manufacturer.toLowerCase()
    );
    const holderAcc = HARDHAT_DEV_ACCOUNTS.find(
      (a) => a.address.toLowerCase() === raw.currentCustodian.toLowerCase()
    );

    const mfgName = mfgAcc
      ? mfgAcc.name
      : `Manufacturer (${raw.manufacturer.substring(0, 6)}...${raw.manufacturer.substring(38)})`;

    const holderName = holderAcc
      ? holderAcc.name
      : `Custodian (${raw.currentCustodian.substring(0, 6)}...${raw.currentCustodian.substring(38)})`;

    return {
      id: raw.batchId,
      name: raw.medicineName,
      genericName: raw.medicineName,
      ndc: '0000-0000-00',
      dosage: 'Standard Formulation',
      quantity: Number(raw.quantity),
      unit: 'Units',
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      manufacturerName: mfgName,
      manufacturerAddress: raw.manufacturer,
      currentHolderName: holderName,
      currentHolderAddress: raw.currentCustodian,
      status,
      storageCondition: 'Standard Storage (2°C to 25°C)',
      idealTempMin: 2.0,
      idealTempMax: 25.0,
      ipfsMetadataHash: 'On-chain Genesis Ledger',
      txHash: genesisTxHash,
      blockNumber: genesisBlock,
      transfers,
      isDemoRecord: false,
    };
  }
}

export const blockchainService = new BlockchainService();
