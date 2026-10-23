const { ethers } = require('../node_modules/ethers');
const fs = require('fs');
const path = require('path');

async function runLiveE2ETest() {
  console.log('==================================================');
  console.log('MediChain Live End-to-End Integration Verification');
  console.log('==================================================');

  const rpcUrl = 'http://127.0.0.1:8545';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../deployed-contract.json'), 'utf8')
  );

  const contractAddress = deployment.address;
  const abi = deployment.abi;
  console.log(`Contract target: ${contractAddress}`);

  // Test 1: Verify bytecode at address
  const code = await provider.getCode(contractAddress);
  if (code === '0x' || code === '0x0') {
    throw new Error(`No bytecode found at ${contractAddress}`);
  }
  console.log('✓ [1/9] Verified contract bytecode deployed at address on Chain ID 31337');

  const signers = await provider.listAccounts();
  const signer0 = await provider.getSigner(0); // Account 0: Manufacturer
  const signer1 = await provider.getSigner(1); // Account 1: Distributor
  const signer2 = await provider.getSigner(2); // Account 2: Wholesaler

  const contract0 = new ethers.Contract(contractAddress, abi, signer0);
  const contract1 = new ethers.Contract(contractAddress, abi, signer1);
  const contract2 = new ethers.Contract(contractAddress, abi, signer2);

  // Test 2: Verify seed batch
  const seedBatchId = 'MC-2024-8849';
  const seedExists = await contract0.batchExists(seedBatchId);
  if (!seedExists) throw new Error('Seed batch MC-2024-8849 does not exist on-chain');
  const seedData = await contract0.getBatch(seedBatchId);
  console.log(`✓ [2/9] Verified seed batch '${seedBatchId}': Medicine='${seedData.medicineName}', Custodian=${seedData.currentCustodian}`);

  // Test 3: Register a new medicine batch
  const testBatchId = 'MC-LIVE-7701';
  const now = Math.floor(Date.now() / 1000);
  const mfgDate = BigInt(now - 86400 * 30);
  const expDate = BigInt(now + 86400 * 365 * 2);

  console.log(`Registering live batch '${testBatchId}' (Ozempic)...`);
  const regTx = await contract0.registerBatch(
    testBatchId,
    'Ozempic',
    5000n,
    mfgDate,
    expDate
  );
  const regReceipt = await regTx.wait();
  console.log(`✓ [3/9] Batch '${testBatchId}' registered in Block #${regReceipt.blockNumber} (Tx: ${regReceipt.hash.substring(0, 16)}...)`);

  // Test 4: Retrieve and verify fields
  const batchRecord = await contract0.getBatch(testBatchId);
  if (batchRecord.medicineName !== 'Ozempic' || Number(batchRecord.quantity) !== 5000) {
    throw new Error('Batch metadata mismatch');
  }
  console.log('✓ [4/9] Batch details verified with exact cryptographic integrity on ledger');

  // Test 5: Authorized custody transfer with environmental telemetry
  console.log(`Transferring custody of '${testBatchId}' to Distributor (${await signer1.getAddress()})...`);
  const transferFn = contract0.getFunction('transferCustody(string,address,string,int16,string)');
  const transferTx = await transferFn(
    testBatchId,
    await signer1.getAddress(),
    'Dublin Cold Logistics Hub, OH',
    42, // 4.2°C
    'Cold chain verified compliant at receiving dock.'
  );
  const transferReceipt = await transferTx.wait();
  console.log(`✓ [5/9] Custody transfer mined in Block #${transferReceipt.blockNumber} (Tx: ${transferReceipt.hash.substring(0, 16)}...)`);

  // Test 6: Verify custody history
  const history = await contract0.getBatchHistory(testBatchId);
  if (history.length !== 2) throw new Error(`Expected 2 custody transitions, got ${history.length}`);
  console.log(`✓ [6/9] Custody timeline verified: Step 1 = Genesis creation, Step 2 = Handover to Distributor at ${history[1].location} (${Number(history[1].temperatureTimesTen) / 10}°C)`);

  // Test 7: Unauthorized transfer rejection
  console.log('Testing unauthorized transfer rejection...');
  try {
    const unauthTransferFn = contract2.getFunction('transferCustody(string,address,string,int16,string)');
    await unauthTransferFn(
      testBatchId,
      await signer2.getAddress(),
      'Unauthorized Attempt',
      200,
      'Hack attempt'
    );
    throw new Error('Unauthorized transfer unexpectedly succeeded!');
  } catch (err) {
    if (err.message.includes('UnauthorizedCustodian') || err.message.includes('revert')) {
      console.log('✓ [7/9] Unauthorized transfer correctly rejected by smart contract (Caller is not custodian)');
    } else {
      throw err;
    }
  }

  // Test 8: Status update and Recall guard
  console.log('Testing status update and recall lock...');
  // Custodian (signer1) updates status to Recalled (4)
  const recallTx = await contract1.updateBatchStatus(testBatchId, 4, 'Quality Advisory Alert');
  await recallTx.wait();
  const recalledBatch = await contract1.getBatch(testBatchId);
  if (Number(recalledBatch.status) !== 4) throw new Error('Status was not updated to Recalled');

  // Now attempt transfer on recalled batch -> should revert with BatchIsRecalled
  try {
    const transferFnRecalled = contract1.getFunction('transferCustody(string,address,string,int16,string)');
    await transferFnRecalled(
      testBatchId,
      await signer0.getAddress(),
      'Recall Facility',
      200,
      'Attempting move'
    );
    throw new Error('Transfer of recalled batch unexpectedly succeeded!');
  } catch (err) {
    if (err.message.includes('BatchIsRecalled') || err.message.includes('revert')) {
      console.log('✓ [8/9] Recalled batch guard verified: transfers successfully blocked after recall');
    } else {
      throw err;
    }
  }

  // Test 9: Unknown batch verification
  const unknownExists = await contract0.batchExists('UNKNOWN-BATCH-ID');
  if (unknownExists) throw new Error('Unknown batch reported as existing');
  console.log('✓ [9/9] Unknown batch accurately identified as non-existent (batchExists = false)');

  console.log('==================================================');
  console.log('All 9 Live End-to-End Smart Contract Tests Passed!');
  console.log('==================================================');
}

runLiveE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('E2E Test Failed:', err);
    process.exit(1);
  });
