const express = require('express');
const router = express.Router();
const {
  getBatches,
  getBatchById,
  upsertBatchMetadata,
} = require('../controllers/batchController');

// GET /api/batches - List searchable batches with hybrid metadata
router.get('/', getBatches);

// GET /api/batches/:batchId - Retrieve batch with smart contract verification separation
router.get('/:batchId', getBatchById);

// POST /api/batches/:batchId/metadata - Update supporting off-chain metadata in MongoDB
router.post('/:batchId/metadata', upsertBatchMetadata);

module.exports = router;
