export type BatchStatus = 
  | 'Registered' 
  | 'In Transit' 
  | 'Delivered' 
  | 'Dispensed' 
  | 'Recalled' 
  | 'Compromised';

export type ParticipantRole = 
  | 'Manufacturer' 
  | 'Distributor' 
  | 'Wholesaler' 
  | 'Pharmacy' 
  | 'Hospital';

export interface Participant {
  id: string;
  name: string;
  address: string;
  role: ParticipantRole;
  location: string;
  verified: boolean;
}

export interface CustodyTransfer {
  id: string;
  fromName: string;
  fromAddress: string;
  toName: string;
  toAddress: string;
  timestamp: string;
  location: string;
  temperatureCelsius: number;
  humidityPercent?: number;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  notes: string;
  isColdChainCompliant: boolean;
  signatureValid: boolean;
}

export interface MedicineBatch {
  id: string; // e.g., "MC-2024-8849"
  name: string;
  genericName: string;
  ndc: string; // National Drug Code
  dosage: string;
  quantity: number;
  unit: string;
  manufacturingDate: string;
  expiryDate: string;
  manufacturerName: string;
  manufacturerAddress: string;
  currentHolderName: string;
  currentHolderAddress: string;
  status: BatchStatus;
  storageCondition: string; // e.g., "2°C - 8°C (Cold Chain)"
  idealTempMin: number;
  idealTempMax: number;
  ipfsMetadataHash: string;
  txHash: string;
  blockNumber: number;
  transfers: CustodyTransfer[];
  isDemoRecord: boolean;
}

export interface BlockchainBlock {
  blockNumber: number;
  hash: string;
  parentHash: string;
  timestamp: string;
  transactionsCount: number;
  miner: string;
  gasUsed: string;
  gasLimit: string;
}

export interface SystemMetrics {
  totalBatches: number;
  activeInTransit: number;
  verifiedAuthenticityRate: number; // percentage, e.g. 99.8
  coldChainIncidents: number;
  totalTransfers: number;
  averageBlockTime: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
