const mongoose = require('mongoose');

const BatchMetadataSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: [true, 'Batch ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    storageInstructions: {
      type: String,
      trim: true,
    },
    packageType: {
      type: String,
      trim: true,
      default: 'Standard Cartons',
    },
    labAssayReportUrl: {
      type: String,
      trim: true,
    },
    regulatoryFdaCode: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fallback in-memory store in case MongoDB is offline
const inMemoryStore = new Map();

// Seed initial off-chain metadata for sample batches
inMemoryStore.set('MC-2024-8849', {
  batchId: 'MC-2024-8849',
  brandName: 'Paxlovid',
  genericName: 'Nirmatrelvir & Ritonavir',
  description: 'Co-packaged oral antiviral tablets for SARS-CoV-2 treatment',
  storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F); excursions permitted between 15°C and 30°C',
  packageType: 'Child-resistant blister co-packs (30 tablets)',
  labAssayReportUrl: 'https://ipfs.io/ipfs/QmZtmD2qt8STmzHpT2gV297349141940989fgh43',
  regulatoryFdaCode: 'EUA-105-REV4',
  createdAt: new Date('2024-06-15T00:00:00Z'),
  updatedAt: new Date('2024-06-18T10:30:00Z'),
});

const BatchMetadataModel = mongoose.model('BatchMetadata', BatchMetadataSchema);

class BatchMetadataRepository {
  static async findByBatchId(batchId) {
    const formattedId = batchId.trim().toUpperCase();
    if (mongoose.connection.readyState === 1) {
      try {
        return await BatchMetadataModel.findOne({ batchId: formattedId });
      } catch (err) {
        console.warn(`[Repo] Mongo query error, falling back to memory: ${err.message}`);
      }
    }
    return inMemoryStore.get(formattedId) || null;
  }

  static async findAll(query = {}) {
    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (query.search) {
          filter.$or = [
            { batchId: { $regex: query.search, $options: 'i' } },
            { brandName: { $regex: query.search, $options: 'i' } },
            { genericName: { $regex: query.search, $options: 'i' } },
          ];
        }
        return await BatchMetadataModel.find(filter).sort({ createdAt: -1 });
      } catch (err) {
        console.warn(`[Repo] Mongo findAll error, falling back to memory: ${err.message}`);
      }
    }

    let results = Array.from(inMemoryStore.values());
    if (query.search) {
      const term = query.search.toLowerCase();
      results = results.filter(
        (b) =>
          b.batchId.toLowerCase().includes(term) ||
          (b.brandName && b.brandName.toLowerCase().includes(term)) ||
          (b.genericName && b.genericName.toLowerCase().includes(term))
      );
    }
    return results;
  }

  static async upsert(batchId, data) {
    const formattedId = batchId.trim().toUpperCase();
    const updatePayload = {
      ...data,
      batchId: formattedId,
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        return await BatchMetadataModel.findOneAndUpdate(
          { batchId: formattedId },
          { $set: updatePayload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.warn(`[Repo] Mongo upsert error, falling back to memory: ${err.message}`);
      }
    }

    const existing = inMemoryStore.get(formattedId) || { createdAt: new Date() };
    const saved = { ...existing, ...updatePayload };
    inMemoryStore.set(formattedId, saved);
    return saved;
  }
}

module.exports = {
  BatchMetadataModel,
  BatchMetadataRepository,
};
