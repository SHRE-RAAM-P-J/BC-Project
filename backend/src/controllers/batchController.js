const { BatchMetadataRepository } = require('../models/BatchMetadata');
const { BlockchainService } = require('../services/blockchain');
const { getDatabaseStatus } = require('../config/db');

async function getHealth(req, res) {
  const dbStatus = getDatabaseStatus();
  const chainStatus = await BlockchainService.checkStatus();

  const isDegraded = !dbStatus.connected || !chainStatus.connected;

  res.status(200).json({
    status: isDegraded ? 'degraded' : 'healthy',
    service: 'MediChain Indexer & Metadata API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    blockchain: chainStatus,
    notes: {
      sourceOfTruth: 'On-chain Smart Contract (MediChain.sol)',
      metadataStorage: dbStatus.connected ? 'MongoDB' : 'In-Memory Repository Fallback'
    }
  });
}

async function getBatches(req, res, next) {
  try {
    const { search, limit } = req.query;
    const metadataList = await BatchMetadataRepository.findAll({ search });

    // Optionally check if node is available to attach on-chain status
    const onChainIds = await BlockchainService.getOnChainBatchIds();

    const results = metadataList.map((meta) => {
      const doc = meta.toObject ? meta.toObject() : meta;
      const isRegisteredOnChain = onChainIds.includes(doc.batchId);

      return {
        ...doc,
        onChainStatus: {
          verifiedOnChain: isRegisteredOnChain,
          source: isRegisteredOnChain ? 'Ethereum Ledger' : 'Off-Chain Draft / Unsynced',
        },
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      data: limit ? results.slice(0, Number(limit)) : results,
    });
  } catch (err) {
    next(err);
  }
}

async function getBatchById(req, res, next) {
  try {
    const { batchId } = req.params;
    if (!batchId || !batchId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Batch identifier parameter is required',
      });
    }

    const cleanId = batchId.trim().toUpperCase();

    // 1. Fetch off-chain descriptive metadata (from MongoDB or memory fallback)
    const offChainMeta = await BatchMetadataRepository.findByBatchId(cleanId);

    // 2. Query the authoritative source of truth: Smart Contract
    const onChainData = await BlockchainService.getOnChainBatch(cleanId);

    // If neither exists anywhere
    if (!offChainMeta && !onChainData.verifiedOnChain) {
      return res.status(404).json({
        success: false,
        error: `Batch '${cleanId}' not found on blockchain or off-chain metadata registry`,
        batchId: cleanId,
      });
    }

    res.status(200).json({
      success: true,
      batchId: cleanId,
      onChain: onChainData,
      offChainMetadata: offChainMeta || null,
      sourceOfTruth: 'Ethereum Smart Contract (MediChain.sol)',
      auditTimestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function upsertBatchMetadata(req, res, next) {
  try {
    const { batchId } = req.params;
    if (!batchId || !batchId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Batch identifier parameter is required',
      });
    }

    const {
      brandName,
      genericName,
      description,
      storageInstructions,
      packageType,
      labAssayReportUrl,
      regulatoryFdaCode,
      notes,
    } = req.body;

    const saved = await BatchMetadataRepository.upsert(batchId, {
      brandName,
      genericName,
      description,
      storageInstructions,
      packageType,
      labAssayReportUrl,
      regulatoryFdaCode,
      notes,
    });

    res.status(200).json({
      success: true,
      message: `Supplementary off-chain metadata saved for batch ${batchId.toUpperCase()}`,
      data: saved,
      disclaimer: 'Off-chain metadata does not alter smart contract ownership or transfer state.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth,
  getBatches,
  getBatchById,
  upsertBatchMetadata,
};
