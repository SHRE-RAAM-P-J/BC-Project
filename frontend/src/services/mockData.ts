import { MedicineBatch, BlockchainBlock, SystemMetrics, CustodyTransfer, BatchStatus } from '../types';

export const INITIAL_BATCHES: MedicineBatch[] = [
  {
    id: "MC-2024-8849",
    name: "Paxlovid",
    genericName: "Nirmatrelvir 150mg & Ritonavir 100mg",
    ndc: "0069-5318-30",
    dosage: "300mg / 100mg Daily Co-pack",
    quantity: 12500,
    unit: "Cartons",
    manufacturingDate: "2024-06-15",
    expiryDate: "2026-06-15",
    manufacturerName: "Pfizer Global Supply",
    manufacturerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    currentHolderName: "Cardinal Health Logistics Hub #4",
    currentHolderAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    status: "In Transit",
    storageCondition: "Controlled Room Temp (20°C to 25°C)",
    idealTempMin: 20.0,
    idealTempMax: 25.0,
    ipfsMetadataHash: "QmZtmD2qt8STmzHpT2gV297349141940989fgh43",
    txHash: "0x8f2d5e3c7a1b0d9e8f6a4c2b1e0d8c7a6b5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c",
    blockNumber: 19482701,
    isDemoRecord: true,
    transfers: [
      {
        id: "tx-1",
        fromName: "Pfizer Biotech Campus",
        fromAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        toName: "Pfizer Central Distribution Hub",
        toAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        timestamp: "2024-06-18 10:30 UTC",
        location: "Kalamazoo, MI, USA",
        temperatureCelsius: 21.4,
        humidityPercent: 44,
        txHash: "0x4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
        blockNumber: 19482701,
        gasUsed: "142,500 Gwei",
        notes: "Initial batch release inspection passed. Serial seals verified.",
        isColdChainCompliant: true,
        signatureValid: true
      },
      {
        id: "tx-2",
        fromName: "Pfizer Central Distribution Hub",
        fromAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        toName: "Cardinal Health Logistics Hub #4",
        toAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        timestamp: "2024-06-20 14:15 UTC",
        location: "Dublin, OH, USA",
        temperatureCelsius: 22.1,
        humidityPercent: 46,
        txHash: "0x8f2d5e3c7a1b0d9e8f6a4c2b1e0d8c7a6b5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c",
        blockNumber: 19483100,
        gasUsed: "128,420 Gwei",
        notes: "Cross-dock transfer via refrigerated trailer #TR-9941. Telemetry logged.",
        isColdChainCompliant: true,
        signatureValid: true
      }
    ]
  },
  {
    id: "MC-2024-4102",
    name: "Comirnaty mRNA Vaccine",
    genericName: "Tozinameran COVID-19 Vaccine",
    ndc: "59267-1000-01",
    dosage: "30mcg / 0.3mL Suspension",
    quantity: 48000,
    unit: "Vials",
    manufacturingDate: "2024-05-10",
    expiryDate: "2025-05-10",
    manufacturerName: "BioNTech Manufacturing GmbH",
    manufacturerAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    currentHolderName: "Apex Cold-Chain Depot",
    currentHolderAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
    status: "Delivered",
    storageCondition: "Ultra-Cold Freezer (-80°C to -60°C)",
    idealTempMin: -80.0,
    idealTempMax: -60.0,
    ipfsMetadataHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    blockNumber: 19478100,
    isDemoRecord: true,
    transfers: [
      {
        id: "tx-3",
        fromName: "BioNTech Facility Mainz",
        fromAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        toName: "Lufthansa Cargo Cold Center",
        toAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        timestamp: "2024-05-12 08:00 UTC",
        location: "Frankfurt, Germany",
        temperatureCelsius: -74.2,
        txHash: "0x9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b",
        blockNumber: 19478100,
        gasUsed: "155,000 Gwei",
        notes: "Dry ice insulated thermal shipper verified with calibrated datalogger.",
        isColdChainCompliant: true,
        signatureValid: true
      },
      {
        id: "tx-4",
        fromName: "Lufthansa Cargo Cold Center",
        fromAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        toName: "Apex Cold-Chain Depot",
        toAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        timestamp: "2024-05-14 16:30 UTC",
        location: "Chicago, IL, USA",
        temperatureCelsius: -72.8,
        txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
        blockNumber: 19479420,
        gasUsed: "134,800 Gwei",
        notes: "Received and transferred into deep sub-zero vault unit #7.",
        isColdChainCompliant: true,
        signatureValid: true
      }
    ]
  },
  {
    id: "MC-2024-1934",
    name: "Humira",
    genericName: "Adalimumab 40mg/0.4mL Pen",
    ndc: "0074-4339-02",
    dosage: "40mg / 0.4mL Autoinjector",
    quantity: 8500,
    unit: "Packs (2 Pens)",
    manufacturingDate: "2024-07-01",
    expiryDate: "2026-01-01",
    manufacturerName: "AbbVie Biopharmaceuticals",
    manufacturerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    currentHolderName: "McKesson Specialty Distribution",
    currentHolderAddress: "0x976EA74026E72CD555437430579175C34F90f7a5",
    status: "In Transit",
    storageCondition: "Refrigerated (2°C to 8°C)",
    idealTempMin: 2.0,
    idealTempMax: 8.0,
    ipfsMetadataHash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbduknMHgCr38hlsm",
    txHash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
    blockNumber: 19485200,
    isDemoRecord: true,
    transfers: [
      {
        id: "tx-5",
        fromName: "AbbVie Facility Sligo",
        fromAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        toName: "McKesson Specialty Distribution",
        toAddress: "0x976EA74026E72CD555437430579175C34F90f7a5",
        timestamp: "2024-07-05 11:20 UTC",
        location: "Irving, TX, USA",
        temperatureCelsius: 4.8,
        humidityPercent: 52,
        txHash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
        blockNumber: 19485200,
        gasUsed: "139,120 Gwei",
        notes: "Sensors continuous recording: min 4.1°C, max 5.2°C. Well within safe envelope.",
        isColdChainCompliant: true,
        signatureValid: true
      }
    ]
  },
  {
    id: "MC-2024-7721",
    name: "Keytruda",
    genericName: "Pembrolizumab 100mg/4mL",
    ndc: "0006-3026-02",
    dosage: "25mg/mL Intravenous Solution",
    quantity: 3200,
    unit: "Vials",
    manufacturingDate: "2024-04-18",
    expiryDate: "2026-04-18",
    manufacturerName: "Merck & Co. Inc.",
    manufacturerAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    currentHolderName: "Memorial Sloan Oncology Pharmacy",
    currentHolderAddress: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    status: "Delivered",
    storageCondition: "Refrigerated (2°C to 8°C) - Protect from Light",
    idealTempMin: 2.0,
    idealTempMax: 8.0,
    ipfsMetadataHash: "QmVm84zVq1fH432x778A9cK8v3xS8e72Yd9qQ127394851",
    txHash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    blockNumber: 19481120,
    isDemoRecord: true,
    transfers: [
      {
        id: "tx-6",
        fromName: "Merck Biotech Plant",
        fromAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        toName: "AmerisourceBergen Central",
        toAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        timestamp: "2024-04-22 09:10 UTC",
        location: "Kenilworth, NJ, USA",
        temperatureCelsius: 4.2,
        txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        blockNumber: 19480010,
        gasUsed: "148,200 Gwei",
        notes: "Batch authenticated with Merck cryptographic root certificate.",
        isColdChainCompliant: true,
        signatureValid: true
      },
      {
        id: "tx-7",
        fromName: "AmerisourceBergen Central",
        fromAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        toName: "Memorial Sloan Oncology Pharmacy",
        toAddress: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        timestamp: "2024-04-26 13:40 UTC",
        location: "New York, NY, USA",
        temperatureCelsius: 5.1,
        txHash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
        blockNumber: 19481120,
        gasUsed: "131,900 Gwei",
        notes: "Delivered to hospital oncology cleanroom. Pharmacist digital signature verified.",
        isColdChainCompliant: true,
        signatureValid: true
      }
    ]
  },
  {
    id: "MC-2023-3382",
    name: "Veklury (Remdesivir)",
    genericName: "Remdesivir for Injection 100mg",
    ndc: "61958-2901-01",
    dosage: "100mg Lyophilized Powder",
    quantity: 15000,
    unit: "Vials",
    manufacturingDate: "2023-11-10",
    expiryDate: "2025-11-10",
    manufacturerName: "Gilead Sciences Inc.",
    manufacturerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    currentHolderName: "Quarantine Warehouse Sector B",
    currentHolderAddress: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    status: "Recalled",
    storageCondition: "Below 30°C",
    idealTempMin: 15.0,
    idealTempMax: 30.0,
    ipfsMetadataHash: "QmRecaLL49281729481948210948928419824810248",
    txHash: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    blockNumber: 19460290,
    isDemoRecord: true,
    transfers: [
      {
        id: "tx-8",
        fromName: "Gilead Facility Foster City",
        fromAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        toName: "Quarantine Warehouse Sector B",
        toAddress: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        timestamp: "2023-11-20 15:00 UTC",
        location: "Foster City, CA, USA",
        temperatureCelsius: 38.5,
        txHash: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
        blockNumber: 19460290,
        gasUsed: "162,100 Gwei",
        notes: "RECALL ISSUED: Thermal logging telemetry excursion (38.5°C) during freight loading.",
        isColdChainCompliant: false,
        signatureValid: true
      }
    ]
  },
  {
    id: "MC-2024-9051",
    name: "Ozempic",
    genericName: "Semaglutide Injection 2mg/1.5mL",
    ndc: "0169-4130-13",
    dosage: "0.5mg or 1mg Dose Pen",
    quantity: 6400,
    unit: "Pens",
    manufacturingDate: "2024-06-01",
    expiryDate: "2026-06-01",
    manufacturerName: "Novo Nordisk A/S",
    manufacturerAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    currentHolderName: "Walgreens Pharmacy #482",
    currentHolderAddress: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    status: "Dispensed",
    storageCondition: "Refrigerated (2°C to 8°C)",
    idealTempMin: 2.0,
    idealTempMax: 8.0,
    ipfsMetadataHash: "QmOzemp1c0284910294819482109482019482910481",
    txHash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
    blockNumber: 19484910,
    isDemoRecord: true,
    transfers: [
      {
        id: "tx-9",
        fromName: "Novo Nordisk Kalundborg",
        fromAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        toName: "Walgreens Pharmacy #482",
        toAddress: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        timestamp: "2024-06-12 14:20 UTC",
        location: "Seattle, WA, USA",
        temperatureCelsius: 4.5,
        txHash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
        blockNumber: 19484910,
        gasUsed: "141,000 Gwei",
        notes: "Dispensed to verified prescription patient. Custody complete.",
        isColdChainCompliant: true,
        signatureValid: true
      }
    ]
  }
];

export const INITIAL_BLOCKS: BlockchainBlock[] = [
  {
    blockNumber: 19485200,
    hash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
    parentHash: "0x8f2d5e3c7a1b0d9e8f6a4c2b1e0d8c7a6b5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c",
    timestamp: "2024-07-05 11:20:12 UTC",
    transactionsCount: 3,
    miner: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    gasUsed: "421,340",
    gasLimit: "30,000,000"
  },
  {
    blockNumber: 19484910,
    hash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
    parentHash: "0x8f2d5e3c7a1b0d9e8f6a4c2b1e0d8c7a6b5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c",
    timestamp: "2024-06-12 14:20:45 UTC",
    transactionsCount: 2,
    miner: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    gasUsed: "312,890",
    gasLimit: "30,000,000"
  },
  {
    blockNumber: 19483100,
    hash: "0x8f2d5e3c7a1b0d9e8f6a4c2b1e0d8c7a6b5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c",
    parentHash: "0x4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    timestamp: "2024-06-20 14:15:02 UTC",
    transactionsCount: 4,
    miner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    gasUsed: "591,240",
    gasLimit: "30,000,000"
  },
  {
    blockNumber: 19482701,
    hash: "0x4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    parentHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    timestamp: "2024-06-18 10:30:54 UTC",
    transactionsCount: 1,
    miner: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    gasUsed: "142,500",
    gasLimit: "30,000,000"
  }
];

class BatchService {
  private batches: MedicineBatch[];
  private blocks: BlockchainBlock[];

  constructor() {
    this.batches = [...INITIAL_BATCHES];
    this.blocks = [...INITIAL_BLOCKS];
  }

  public getBatches(): MedicineBatch[] {
    return [...this.batches];
  }

  public getBatchById(id: string): MedicineBatch | undefined {
    return this.batches.find(b => b.id.toLowerCase() === id.trim().toLowerCase());
  }

  public getBlocks(): BlockchainBlock[] {
    return [...this.blocks];
  }

  public getMetrics(): SystemMetrics {
    const totalBatches = this.batches.length;
    const activeInTransit = this.batches.filter(b => b.status === 'In Transit').length;
    const recalled = this.batches.filter(b => b.status === 'Recalled' || b.status === 'Compromised').length;
    const verifiedRate = totalBatches > 0 ? Number(((totalBatches - recalled) / totalBatches * 100).toFixed(1)) : 100;
    const totalTransfers = this.batches.reduce((acc, curr) => acc + curr.transfers.length, 0);

    return {
      totalBatches,
      activeInTransit,
      verifiedAuthenticityRate: verifiedRate,
      coldChainIncidents: recalled,
      totalTransfers,
      averageBlockTime: "12.4s"
    };
  }

  public registerBatch(newBatchData: Partial<MedicineBatch>): MedicineBatch {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const mockTxHash = `0x${randomHex}9a4b3c2d1e0f8a7b6c5d4e3f2a1b0c9d8e7f6a5b`;
    const mockBlock = Math.floor(19485201 + Math.random() * 50);

    const fullBatch: MedicineBatch = {
      id: newBatchData.id || `MC-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newBatchData.name || "Untitled Formulation",
      genericName: newBatchData.genericName || "Standard Active Compound",
      ndc: newBatchData.ndc || "0000-0000-00",
      dosage: newBatchData.dosage || "100mg Tablet",
      quantity: Number(newBatchData.quantity) || 5000,
      unit: newBatchData.unit || "Cartons",
      manufacturingDate: newBatchData.manufacturingDate || new Date().toISOString().split('T')[0],
      expiryDate: newBatchData.expiryDate || new Date(Date.now() + 63072000000).toISOString().split('T')[0],
      manufacturerName: newBatchData.manufacturerName || "Authorized Pharma Partner",
      manufacturerAddress: newBatchData.manufacturerAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      currentHolderName: newBatchData.manufacturerName || "Authorized Pharma Partner",
      currentHolderAddress: newBatchData.manufacturerAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      status: "Registered",
      storageCondition: newBatchData.storageCondition || "Controlled Room Temp (20°C to 25°C)",
      idealTempMin: newBatchData.idealTempMin ?? 20.0,
      idealTempMax: newBatchData.idealTempMax ?? 25.0,
      ipfsMetadataHash: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      txHash: mockTxHash,
      blockNumber: mockBlock,
      isDemoRecord: true,
      transfers: [
        {
          id: `tx-init-${Date.now()}`,
          fromName: "Genesis Batch Creation",
          fromAddress: "0x0000000000000000000000000000000000000000",
          toName: newBatchData.manufacturerName || "Authorized Pharma Partner",
          toAddress: newBatchData.manufacturerAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          timestamp: new Date().toUTCString(),
          location: "Global Manufacturing Plant",
          temperatureCelsius: 21.0,
          txHash: mockTxHash,
          blockNumber: mockBlock,
          gasUsed: "148,000 Gwei",
          notes: "Batch registered in local sandbox simulation. Ready for chain broadcast.",
          isColdChainCompliant: true,
          signatureValid: true
        }
      ]
    };

    this.batches.unshift(fullBatch);
    return fullBatch;
  }

  public transferBatch(batchId: string, toName: string, toAddress: string, location: string, tempCelsius: number, notes: string): CustodyTransfer {
    const batch = this.batches.find(b => b.id.toLowerCase() === batchId.toLowerCase());
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const randomHex = Math.random().toString(16).substring(2, 10);
    const mockTxHash = `0x${randomHex}8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c`;
    const mockBlock = Math.floor(19485250 + Math.random() * 50);

    const isTempCompliant = tempCelsius >= batch.idealTempMin && tempCelsius <= batch.idealTempMax;

    const newTransfer: CustodyTransfer = {
      id: `tx-transfer-${Date.now()}`,
      fromName: batch.currentHolderName,
      fromAddress: batch.currentHolderAddress,
      toName,
      toAddress,
      timestamp: new Date().toUTCString(),
      location,
      temperatureCelsius: tempCelsius,
      txHash: mockTxHash,
      blockNumber: mockBlock,
      gasUsed: "135,400 Gwei",
      notes: notes || "Standard custody handover confirmed by sender and recipient keys.",
      isColdChainCompliant: isTempCompliant,
      signatureValid: true
    };

    batch.currentHolderName = toName;
    batch.currentHolderAddress = toAddress;
    batch.status = isTempCompliant ? "In Transit" : "Compromised";
    batch.transfers.push(newTransfer);

    return newTransfer;
  }
}

export const batchService = new BatchService();
