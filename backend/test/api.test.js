const { app } = require('../src/index');
const assert = require('assert');
const http = require('http');

async function runTests() {
  console.log('--------------------------------------------------');
  console.log('Running MediChain Backend API Integration Tests...');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test server running on ${baseUrl}`);

  try {
    // Test 1: GET /api/health
    console.log('\n[Test 1] Testing GET /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200');
    const healthJson = await healthRes.json();
    assert.ok(healthJson.service.includes('MediChain'), 'Service name should match');
    assert.ok(healthJson.database, 'Should include database status');
    assert.ok(healthJson.blockchain, 'Should include blockchain status');
    console.log('✓ Health endpoint test passed (DB & Blockchain status reported)');

    // Test 2: GET /api/batches
    console.log('\n[Test 2] Testing GET /api/batches...');
    const batchesRes = await fetch(`${baseUrl}/api/batches`);
    assert.strictEqual(batchesRes.status, 200, 'Batches list should return 200');
    const batchesJson = await batchesRes.json();
    assert.strictEqual(batchesJson.success, true, 'Batches query should succeed');
    assert.ok(Array.isArray(batchesJson.data), 'Data should be an array');
    console.log(`✓ Batches list test passed (${batchesJson.data.length} metadata records retrieved)`);

    // Test 3: GET /api/batches/:batchId (existing sample)
    console.log('\n[Test 3] Testing GET /api/batches/MC-2024-8849...');
    const batchRes = await fetch(`${baseUrl}/api/batches/MC-2024-8849`);
    assert.strictEqual(batchRes.status, 200, 'Existing batch should return 200');
    const batchJson = await batchRes.json();
    assert.strictEqual(batchJson.batchId, 'MC-2024-8849', 'Batch ID should match');
    assert.ok(batchJson.onChain, 'Should have onChain object');
    assert.ok(batchJson.offChainMetadata, 'Should have offChainMetadata object');
    console.log('✓ Batch details test passed (Separates on-chain proof from off-chain metadata)');

    // Test 4: POST /api/batches/:batchId/metadata (save supplementary off-chain metadata)
    console.log('\n[Test 4] Testing POST /api/batches/MC-2024-8849/metadata...');
    const postRes = await fetch(`${baseUrl}/api/batches/MC-2024-8849/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageType: 'Tamper-evident cold box packaging',
        storageInstructions: '2°C to 8°C continuous refrigeration',
        regulatoryFdaCode: 'FDA-NDC-0069-5318',
      }),
    });
    assert.strictEqual(postRes.status, 200, 'Metadata update should return 200');
    const postJson = await postRes.json();
    assert.strictEqual(postJson.success, true, 'Metadata update should succeed');
    assert.strictEqual(
      postJson.data.packageType,
      'Tamper-evident cold box packaging',
      'Should save packageType'
    );
    console.log('✓ Metadata update test passed');

    // Test 5: GET /api/batches/:batchId (unknown batch)
    console.log('\n[Test 5] Testing GET /api/batches/UNKNOWN-BATCH-ID...');
    const unknownRes = await fetch(`${baseUrl}/api/batches/UNKNOWN-BATCH-ID`);
    assert.strictEqual(unknownRes.status, 404, 'Unknown batch should return 404');
    const unknownJson = await unknownRes.json();
    assert.strictEqual(unknownJson.success, false, 'Should report success: false');
    console.log('✓ Unknown batch rejection test passed (Returns 404 without fabrication)');

    // Test 6: 404 for undefined routes
    console.log('\n[Test 6] Testing undefined route GET /api/nonexistent...');
    const nonExistRes = await fetch(`${baseUrl}/api/nonexistent`);
    assert.strictEqual(nonExistRes.status, 404, 'Undefined route should return 404');
    console.log('✓ Undefined route 404 test passed');

    console.log('\n--------------------------------------------------');
    console.log('All 6 Backend API tests passed successfully!');
    console.log('--------------------------------------------------');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
