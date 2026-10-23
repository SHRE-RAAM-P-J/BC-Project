const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface BackendHealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  database: {
    connected: boolean;
    state: string;
    error: string | null;
    uri: string;
  };
  blockchain: {
    connected: boolean;
    rpcUrl: string;
    chainId?: number;
    latestBlockNumber?: number;
    contractAddress?: string;
    error?: string;
    note?: string;
  };
}

export interface BackendBatchResponse {
  success: boolean;
  batchId: string;
  onChain: {
    verifiedOnChain: boolean;
    sourceOfTruth?: string;
    contractAddress?: string;
    batchId?: string;
    medicineName?: string;
    manufacturer?: string;
    currentCustodian?: string;
    quantity?: number;
    manufacturingDate?: string;
    expiryDate?: string;
    registrationTimestamp?: string;
    status?: string;
    statusCode?: number;
    custodyHistory?: Array<{
      step: number;
      from: string;
      to: string;
      timestamp: string;
      location: string;
      temperatureCelsius: number;
      notes: string;
      isGenesis: boolean;
    }>;
    error?: string;
  };
  offChainMetadata: {
    batchId: string;
    brandName?: string;
    genericName?: string;
    description?: string;
    storageInstructions?: string;
    packageType?: string;
    labAssayReportUrl?: string;
    regulatoryFdaCode?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  sourceOfTruth: string;
  auditTimestamp: string;
}

export const apiService = {
  async getHealth(): Promise<BackendHealthResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getBatches(search?: string) {
    try {
      const url = new URL(`${API_BASE_URL}/batches`);
      if (search) url.searchParams.set('search', search);
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getBatchById(batchId: string): Promise<BackendBatchResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/batches/${encodeURIComponent(batchId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveBatchMetadata(batchId: string, metadata: Record<string, any>) {
    const res = await fetch(`${API_BASE_URL}/batches/${encodeURIComponent(batchId)}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to save off-chain metadata');
    }
    return await res.json();
  },
};
