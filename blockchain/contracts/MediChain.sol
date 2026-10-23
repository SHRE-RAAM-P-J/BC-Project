// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MediChain
 * @author MediChain Capstone Engineering Team
 * @notice High-integrity pharmaceutical provenance and custody verification registry.
 * @dev Records immutable batch creation, serialized chain-of-custody handovers,
 * and environmental telemetry logs. All timestamps are standardized as standard
 * Unix epoch timestamps (seconds since Jan 01 1970 UTC).
 *
 * CRUCIAL DISCLAIMER:
 * This smart contract verifies the cryptographic authenticity of registered records,
 * digital signatures, and custodian handover transitions on the ledger. It does NOT
 * physically guarantee that the chemical contents inside a package are genuine.
 * Physical genuineness requires tamper-evident seals and laboratory assays.
 */
contract MediChain {
    // --- Lifecycle State Enums ---
    enum BatchStatus {
        Registered,   // 0: Batch registered on-chain by manufacturer
        InTransit,    // 1: Currently en route between supply-chain nodes
        Delivered,    // 2: Received at destination clinic/pharmacy/depot
        Dispensed,    // 3: Dispensed to verified patient
        Recalled,     // 4: Recalled due to quality/safety advisory
        Compromised   // 5: Compromised due to telemetry breach / seal alert
    }

    // --- Data Structures ---
    struct CustodyTransfer {
        address from;
        address to;
        uint256 timestamp;            // Unix epoch in seconds
        string location;              // Facility / City / GPS checkpoint
        int16 temperatureTimesTen;   // Telemetry temp (e.g. 21.5°C stored as 215)
        string notes;                 // Handover notes / Bill of Lading / Inspection
    }

    struct MedicineBatch {
        string batchId;               // Unique lot identifier (e.g. "MC-2024-8849")
        string medicineName;          // Commercial / Brand medicine name
        address manufacturer;         // Address of original registering manufacturer
        uint256 manufacturingDate;    // Unix timestamp (seconds)
        uint256 expiryDate;           // Unix timestamp (seconds), must be > manufacturingDate
        uint256 quantity;             // Number of units in batch (> 0)
        address currentCustodian;     // Address currently holding legal custody
        uint256 registrationTimestamp;// Block timestamp when registered
        BatchStatus status;           // Current lifecycle status
    }

    // --- Custom Errors for Gas Optimization & Clear Diagnostics ---
    error BatchAlreadyExists(string batchId);
    error BatchNotFound(string batchId);
    error EmptyBatchId();
    error EmptyMedicineName();
    error InvalidQuantity();
    error InvalidDates(uint256 manufacturingDate, uint256 expiryDate);
    error InvalidRecipient();
    error TransferToSelf();
    error UnauthorizedCustodian(address caller, address currentCustodian);
    error BatchIsRecalled(string batchId);

    // --- State Variables ---
    address public owner;
    
    // batchId => MedicineBatch
    mapping(string => MedicineBatch) private batches;
    
    // batchId => exists
    mapping(string => bool) public batchExists;
    
    // batchId => array of CustodyTransfer events
    mapping(string => CustodyTransfer[]) private batchHistory;
    
    // Array of all registered batch IDs for enumeration
    string[] private registeredBatchIds;

    // --- Events ---
    event BatchRegistered(
        string indexed batchId,
        string medicineName,
        address indexed manufacturer,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to,
        string location,
        int16 temperatureTimesTen,
        uint256 timestamp
    );

    event BatchStatusUpdated(
        string indexed batchId,
        BatchStatus previousStatus,
        BatchStatus newStatus,
        string reason,
        uint256 timestamp
    );

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "MediChain: Caller is not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Registers a new unique medicine batch on the blockchain ledger.
     * @param _batchId Unique batch/lot identifier string.
     * @param _medicineName Commercial name of medicine.
     * @param _quantity Total units manufactured (must be > 0).
     * @param _manufacturingDate Unix timestamp in seconds of manufacturing.
     * @param _expiryDate Unix timestamp in seconds of expiration.
     */
    function registerBatch(
        string memory _batchId,
        string memory _medicineName,
        uint256 _quantity,
        uint256 _manufacturingDate,
        uint256 _expiryDate
    ) public {
        if (bytes(_batchId).length == 0) revert EmptyBatchId();
        if (bytes(_medicineName).length == 0) revert EmptyMedicineName();
        if (_quantity == 0) revert InvalidQuantity();
        if (_expiryDate <= _manufacturingDate) revert InvalidDates(_manufacturingDate, _expiryDate);
        if (batchExists[_batchId]) revert BatchAlreadyExists(_batchId);

        batches[_batchId] = MedicineBatch({
            batchId: _batchId,
            medicineName: _medicineName,
            manufacturer: msg.sender,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            quantity: _quantity,
            currentCustodian: msg.sender,
            registrationTimestamp: block.timestamp,
            status: BatchStatus.Registered
        });

        batchExists[_batchId] = true;
        registeredBatchIds.push(_batchId);

        // Record the genesis creation event in custody history
        batchHistory[_batchId].push(CustodyTransfer({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            location: "Genesis Manufacturing Facility",
            temperatureTimesTen: 200, // 20.0°C baseline
            notes: "Batch manufactured, QA inspected, and cryptographically registered."
        }));

        emit BatchRegistered(
            _batchId,
            _medicineName,
            msg.sender,
            _quantity,
            _manufacturingDate,
            _expiryDate,
            block.timestamp
        );
    }

    /**
     * @notice Transfers custody of a batch to a new participant with environmental telemetry.
     * @dev Only the current custodian can transfer custody.
     * @param _batchId Unique batch identifier.
     * @param _to Non-zero address of the new custodian.
     * @param _location Physical location / facility checkpoint.
     * @param _temperatureTimesTen Sensor reading in Celsius multiplied by 10 (e.g. 45 = 4.5°C).
     * @param _notes Inspection / handover notes.
     */
    function transferCustody(
        string memory _batchId,
        address _to,
        string memory _location,
        int16 _temperatureTimesTen,
        string memory _notes
    ) public {
        if (!batchExists[_batchId]) revert BatchNotFound(_batchId);
        if (_to == address(0)) revert InvalidRecipient();

        MedicineBatch storage batch = batches[_batchId];
        
        if (batch.currentCustodian != msg.sender) {
            revert UnauthorizedCustodian(msg.sender, batch.currentCustodian);
        }
        if (_to == msg.sender) revert TransferToSelf();
        if (batch.status == BatchStatus.Recalled) revert BatchIsRecalled(_batchId);

        address previousCustodian = batch.currentCustodian;
        batch.currentCustodian = _to;
        batch.status = BatchStatus.InTransit;

        batchHistory[_batchId].push(CustodyTransfer({
            from: previousCustodian,
            to: _to,
            timestamp: block.timestamp,
            location: bytes(_location).length > 0 ? _location : "Supply Chain Checkpoint",
            temperatureTimesTen: _temperatureTimesTen,
            notes: _notes
        }));

        emit CustodyTransferred(
            _batchId,
            previousCustodian,
            _to,
            _location,
            _temperatureTimesTen,
            block.timestamp
        );
    }

    /**
     * @notice Convenience overload for simple custody transfer without sensor telemetry.
     */
    function transferCustody(
        string memory _batchId,
        address _to
    ) external {
        transferCustody(_batchId, _to, "Standard Custody Handover", 200, "Custody transferred.");
    }

    /**
     * @notice Updates the status of a batch (e.g. Delivered, Dispensed, Recalled).
     * @dev Only the current custodian or contract owner can update status.
     */
    function updateBatchStatus(
        string memory _batchId,
        BatchStatus _newStatus,
        string memory _reason
    ) external {
        if (!batchExists[_batchId]) revert BatchNotFound(_batchId);

        MedicineBatch storage batch = batches[_batchId];
        if (batch.currentCustodian != msg.sender && msg.sender != owner) {
            revert UnauthorizedCustodian(msg.sender, batch.currentCustodian);
        }

        BatchStatus prevStatus = batch.status;
        batch.status = _newStatus;

        emit BatchStatusUpdated(
            _batchId,
            prevStatus,
            _newStatus,
            _reason,
            block.timestamp
        );
    }

    /**
     * @notice Retrieves the full record of a registered medicine batch.
     * @param _batchId The unique batch identifier.
     */
    function getBatch(string memory _batchId) external view returns (MedicineBatch memory) {
        if (!batchExists[_batchId]) revert BatchNotFound(_batchId);
        return batches[_batchId];
    }

    /**
     * @notice Retrieves the chronological chain-of-custody transfer history for a batch.
     * @param _batchId The unique batch identifier.
     */
    function getBatchHistory(string memory _batchId) external view returns (CustodyTransfer[] memory) {
        if (!batchExists[_batchId]) revert BatchNotFound(_batchId);
        return batchHistory[_batchId];
    }

    /**
     * @notice Returns the total count of registered batches.
     */
    function getBatchCount() external view returns (uint256) {
        return registeredBatchIds.length;
    }

    /**
     * @notice Backwards-compatible alias for getBatchCount.
     */
    function getTotalBatches() external view returns (uint256) {
        return registeredBatchIds.length;
    }

    /**
     * @notice Retrieves batch ID at a specific index for enumeration.
     */
    function getBatchIdAtIndex(uint256 _index) external view returns (string memory) {
        require(_index < registeredBatchIds.length, "Index out of bounds");
        return registeredBatchIds[_index];
    }
}
