# MediChain Blockchain Infrastructure

Solidity smart contracts and Hardhat development suite for high-integrity pharmaceutical custody management, environmental telemetry logging, and authenticity verification.

---

## 🛠️ Stack & Versions
- **Solidity**: `0.8.24` (with `viaIR: true` and 200 optimizer runs)
- **Hardhat**: `2.22.17`
- **Toolbox**: `@nomicfoundation/hardhat-toolbox` `^5.0.0`
- **Chain ID**: `31337` (Hardhat Localnet)

---

## 📜 Contract API Reference (`MediChain.sol`)

### Structs
```solidity
enum BatchStatus { Registered, InTransit, Delivered, Dispensed, Recalled, Compromised }

struct CustodyTransfer {
    address from;
    address to;
    uint256 timestamp;            // Unix epoch in seconds
    string location;              // Facility / Checkpoint
    int16 temperatureTimesTen;   // Telemetry (e.g. 21.5°C = 215)
    string notes;                 // Inspection / handover notes
}

struct MedicineBatch {
    string batchId;               // Unique lot ID (e.g. "MC-2024-8849")
    string medicineName;          // Commercial brand name
    address manufacturer;         // Creator address
    uint256 manufacturingDate;    // Unix timestamp (seconds)
    uint256 expiryDate;           // Unix timestamp (seconds)
    uint256 quantity;             // Total units manufactured (> 0)
    address currentCustodian;     // Current legal custodian
    uint256 registrationTimestamp;// Block timestamp when registered
    BatchStatus status;           // Lifecycle status
}
```

### Functions
- `registerBatch(string _batchId, string _medicineName, uint256 _quantity, uint256 _manufacturingDate, uint256 _expiryDate)`
  Registers a new unique batch and creates the initial genesis custody record.
- `transferCustody(string _batchId, address _to, string _location, int16 _temperatureTimesTen, string _notes)`
  Transfers custody from current custodian to a non-zero recipient and records temperature telemetry.
- `transferCustody(string _batchId, address _to)`
  Convenience overload for standard custody handovers.
- `updateBatchStatus(string _batchId, BatchStatus _newStatus, string _reason)`
  Updates lifecycle state (e.g., `Delivered`, `Recalled`).
- `getBatch(string _batchId) view returns (MedicineBatch)`
  Retrieves complete registered batch metadata.
- `getBatchHistory(string _batchId) view returns (CustodyTransfer[])`
  Retrieves the immutable, chronological chain-of-custody transfer history.
- `getBatchCount() view returns (uint256)`
  Returns total registered batches count.
- `getBatchIdAtIndex(uint256 _index) view returns (string)`
  Retrieves batch ID for enumeration.

### Events
- `event BatchRegistered(string indexed batchId, string medicineName, address indexed manufacturer, uint256 quantity, uint256 manufacturingDate, uint256 expiryDate, uint256 timestamp)`
- `event CustodyTransferred(string indexed batchId, address indexed from, address indexed to, string location, int16 temperatureTimesTen, uint256 timestamp)`
- `event BatchStatusUpdated(string indexed batchId, BatchStatus previousStatus, BatchStatus newStatus, string reason, uint256 timestamp)`

### Custom Errors
- `BatchAlreadyExists(string batchId)`
- `BatchNotFound(string batchId)`
- `EmptyBatchId()`
- `EmptyMedicineName()`
- `InvalidQuantity()`
- `InvalidDates(uint256 manufacturingDate, uint256 expiryDate)`
- `InvalidRecipient()`
- `TransferToSelf()`
- `UnauthorizedCustodian(address caller, address currentCustodian)`
- `BatchIsRecalled(string batchId)`

---

## 🚀 Commands & Development Workflow

### 1. Compile Contracts
```bash
cd blockchain
npm run compile
```

### 2. Run Automated Tests
```bash
npm run test
```
Executes the comprehensive 20-test suite verifying:
- Successful registration and field integrity
- Duplicate and empty input rejection
- Date validation & zero quantity rejection
- Custody transfer & non-custodian rejection
- Preservation of complete history across multi-hop transfers
- Status update and recall custody lock

### 3. Deploy & Export to Frontend
```bash
# Deploy to in-memory Hardhat network and export artifacts:
npm run deploy:hardhat

# Or deploy to persistent standalone local node:
# Terminal 1:
npm run node
# Terminal 2:
npm run deploy:local
```

### 4. Important Notice on Chain Restarts
The standalone Hardhat node (`npm run node`) is an ephemeral in-memory EVM ledger by default. If you stop and restart `npm run node`, the previous blockchain state is cleared. You **must re-run `npm run deploy:local`** after restarting the node to deploy the contract and update the exported addresses.
