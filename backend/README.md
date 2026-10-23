# MediChain Backend API Service

Express & MongoDB microservice providing supplementary off-chain metadata storage, search indexing, and blockchain event caching for the MediChain pharmaceutical authenticity ecosystem.

---

## 🏛️ Architectural Role & Source of Truth

> **Crucial Rule**: The Ethereum smart contract (`MediChain.sol`) is the single authoritative source of truth for batch registration, custody transfers, legal custodian ownership, and lifecycle status.
>
> MongoDB is used exclusively for **supplementary off-chain metadata** (e.g. package type, lab assay report links, storage guidelines, and analytical caching). MongoDB records cannot override on-chain custody or certify an unknown batch as authentic.

---

## ⚙️ Environment Variables

Create `.env` by copying `.env.example`:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Express HTTP server port |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for Vite web application |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/medichain` | MongoDB connection string |
| `RPC_URL` | `http://127.0.0.1:8545` | Ethereum JSON-RPC provider (Local Hardhat Node) |
| `MEDICHAIN_CONTRACT_ADDRESS` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Deployed MediChain smart contract address |

---

## 🚀 Startup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Integration Tests
```bash
npm test
```
Executes automated API integration tests verifying:
- `GET /api/health` status reporting
- `GET /api/batches` search and metadata retrieval
- `GET /api/batches/:batchId` hybrid on-chain / off-chain separation
- `POST /api/batches/:batchId/metadata` supplementary metadata storage
- `404` handling for unknown batches and non-existent endpoints

### 3. Start Development Server
```bash
npm run dev
# Or production mode:
npm start
```
The server will start at `http://localhost:5000`.

---

## 🔌 API Route Reference

### `GET /api/health`
Checks health of the Express service, MongoDB connection, and Hardhat node RPC.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "MediChain Indexer & Metadata API",
  "version": "1.0.0",
  "timestamp": "2026-10-17T17:48:00.000Z",
  "database": {
    "connected": true,
    "state": "connected",
    "uri": "mongodb://127.0.0.1:27017/medichain"
  },
  "blockchain": {
    "connected": true,
    "rpcUrl": "http://127.0.0.1:8545",
    "chainId": 31337,
    "latestBlockNumber": 1
  }
}
```

### `GET /api/batches`
Search and list metadata records.
- **Query Parameters**:
  - `search` (optional): Filter by batch ID, brand name, or generic name.
  - `limit` (optional): Max records to return.
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "batchId": "MC-2024-8849",
      "brandName": "Paxlovid",
      "genericName": "Nirmatrelvir & Ritonavir",
      "packageType": "Child-resistant blister co-packs",
      "onChainStatus": {
        "verifiedOnChain": true,
        "source": "Ethereum Ledger"
      }
    }
  ]
}
```

### `GET /api/batches/:batchId`
Retrieves detailed batch record with distinct separation between verified on-chain smart contract data and off-chain descriptive metadata.
- **Response `200 OK`**:
```json
{
  "success": true,
  "batchId": "MC-2024-8849",
  "onChain": {
    "verifiedOnChain": true,
    "sourceOfTruth": "MediChain.sol Ethereum Smart Contract",
    "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "batchId": "MC-2024-8849",
    "medicineName": "Paxlovid",
    "manufacturer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "currentCustodian": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "quantity": 12500,
    "status": "Registered",
    "custodyHistory": [...]
  },
  "offChainMetadata": {
    "storageInstructions": "Store at 20°C to 25°C",
    "packageType": "Child-resistant blister co-packs"
  },
  "sourceOfTruth": "Ethereum Smart Contract (MediChain.sol)"
}
```
- **Response `404 Not Found`**:
```json
{
  "success": false,
  "error": "Batch 'UNKNOWN-ID' not found on blockchain or off-chain metadata registry",
  "batchId": "UNKNOWN-ID"
}
```

### `POST /api/batches/:batchId/metadata`
Saves or updates supporting off-chain metadata in MongoDB.
- **Request Body**:
```json
{
  "packageType": "Cold-chain thermal insulated shipper",
  "storageInstructions": "2°C to 8°C continuous refrigeration",
  "labAssayReportUrl": "https://ipfs.io/ipfs/Qm...",
  "notes": "Passed batch dissolution test."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Supplementary off-chain metadata saved for batch MC-2024-8849",
  "data": { ... },
  "disclaimer": "Off-chain metadata does not alter smart contract ownership or transfer state."
}
```

---

## 🛡️ Graceful Degraded Operation
If MongoDB or the standalone Hardhat node is offline:
- **MongoDB Offline**: The repository automatically activates an in-memory repository fallback. All API endpoints remain fully functional without crashing, and `GET /api/health` accurately reports `database.state: "disconnected_fallback_active"`.
- **Hardhat Node Offline**: The blockchain service safely flags `onChain.verifiedOnChain: false`, handles RPC timeouts without unhandled rejections, and reports `blockchain.connected: false`.
