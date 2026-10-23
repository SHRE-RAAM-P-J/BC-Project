const { expect } = require("chai");
require("@nomicfoundation/hardhat-chai-matchers");
const { ethers } = require("hardhat");

describe("MediChain Smart Contract", function () {
  let mediChain;
  let owner, manufacturer, distributor, pharmacy, unauthorized;

  const sampleBatchId = "MC-2024-8849";
  const sampleDrugName = "Paxlovid";
  const sampleQuantity = 12500n;
  const mfgDate = BigInt(Math.floor(Date.now() / 1000) - 86400 * 30); // 30 days ago
  const expDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 365 * 2); // 2 years in future

  beforeEach(async function () {
    [owner, manufacturer, distributor, pharmacy, unauthorized] = await ethers.getSigners();

    const MediChainFactory = await ethers.getContractFactory("MediChain");
    mediChain = await MediChainFactory.deploy();
    await mediChain.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("Should set the deployer as the owner", async function () {
      expect(await mediChain.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero batches", async function () {
      expect(await mediChain.getBatchCount()).to.equal(0n);
      expect(await mediChain.getTotalBatches()).to.equal(0n);
    });
  });

  describe("Batch Registration & Retrieval", function () {
    it("Should successfully register a new batch and emit BatchRegistered event", async function () {
      const tx = await mediChain.connect(manufacturer).registerBatch(
        sampleBatchId,
        sampleDrugName,
        sampleQuantity,
        mfgDate,
        expDate
      );

      await expect(tx)
        .to.emit(mediChain, "BatchRegistered")
        .withArgs(
          sampleBatchId,
          sampleDrugName,
          manufacturer.address,
          sampleQuantity,
          mfgDate,
          expDate,
          (val) => val > 0n
        );

      expect(await mediChain.getBatchCount()).to.equal(1n);
      expect(await mediChain.batchExists(sampleBatchId)).to.be.true;
    });

    it("Should retrieve registered batch with exact matching metadata", async function () {
      await mediChain.connect(manufacturer).registerBatch(
        sampleBatchId,
        sampleDrugName,
        sampleQuantity,
        mfgDate,
        expDate
      );

      const batch = await mediChain.getBatch(sampleBatchId);
      expect(batch.batchId).to.equal(sampleBatchId);
      expect(batch.medicineName).to.equal(sampleDrugName);
      expect(batch.manufacturer).to.equal(manufacturer.address);
      expect(batch.currentCustodian).to.equal(manufacturer.address);
      expect(batch.quantity).to.equal(sampleQuantity);
      expect(batch.manufacturingDate).to.equal(mfgDate);
      expect(batch.expiryDate).to.equal(expDate);
      expect(batch.status).to.equal(0n); // 0 = Registered
      expect(batch.registrationTimestamp).to.be.greaterThan(0n);
    });

    it("Should initialize the custody history with genesis creation event", async function () {
      await mediChain.connect(manufacturer).registerBatch(
        sampleBatchId,
        sampleDrugName,
        sampleQuantity,
        mfgDate,
        expDate
      );

      const history = await mediChain.getBatchHistory(sampleBatchId);
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(ethers.ZeroAddress);
      expect(history[0].to).to.equal(manufacturer.address);
      expect(history[0].temperatureTimesTen).to.equal(200n); // 20.0°C
      expect(history[0].location).to.equal("Genesis Manufacturing Facility");
    });
  });

  describe("Input Validation & Error Rejections", function () {
    it("Should reject duplicate batch registration", async function () {
      await mediChain.connect(manufacturer).registerBatch(
        sampleBatchId,
        sampleDrugName,
        sampleQuantity,
        mfgDate,
        expDate
      );

      await expect(
        mediChain.connect(manufacturer).registerBatch(
          sampleBatchId,
          "Different Drug",
          100n,
          mfgDate,
          expDate
        )
      ).to.be.revertedWithCustomError(mediChain, "BatchAlreadyExists")
        .withArgs(sampleBatchId);
    });

    it("Should reject empty batch ID", async function () {
      await expect(
        mediChain.connect(manufacturer).registerBatch(
          "",
          sampleDrugName,
          sampleQuantity,
          mfgDate,
          expDate
        )
      ).to.be.revertedWithCustomError(mediChain, "EmptyBatchId");
    });

    it("Should reject empty medicine name", async function () {
      await expect(
        mediChain.connect(manufacturer).registerBatch(
          sampleBatchId,
          "",
          sampleQuantity,
          mfgDate,
          expDate
        )
      ).to.be.revertedWithCustomError(mediChain, "EmptyMedicineName");
    });

    it("Should reject zero quantity", async function () {
      await expect(
        mediChain.connect(manufacturer).registerBatch(
          sampleBatchId,
          sampleDrugName,
          0n,
          mfgDate,
          expDate
        )
      ).to.be.revertedWithCustomError(mediChain, "InvalidQuantity");
    });

    it("Should reject expiry date less than or equal to manufacturing date", async function () {
      await expect(
        mediChain.connect(manufacturer).registerBatch(
          sampleBatchId,
          sampleDrugName,
          sampleQuantity,
          expDate,
          mfgDate // expiry before mfg
        )
      ).to.be.revertedWithCustomError(mediChain, "InvalidDates")
        .withArgs(expDate, mfgDate);
    });

    it("Should reject queries for unknown batches", async function () {
      await expect(
        mediChain.getBatch("NON-EXISTENT-ID")
      ).to.be.revertedWithCustomError(mediChain, "BatchNotFound")
        .withArgs("NON-EXISTENT-ID");

      await expect(
        mediChain.getBatchHistory("NON-EXISTENT-ID")
      ).to.be.revertedWithCustomError(mediChain, "BatchNotFound")
        .withArgs("NON-EXISTENT-ID");
    });
  });

  describe("Custody Transfer & Access Control", function () {
    beforeEach(async function () {
      await mediChain.connect(manufacturer).registerBatch(
        sampleBatchId,
        sampleDrugName,
        sampleQuantity,
        mfgDate,
        expDate
      );
    });

    it("Should allow the authorized custodian to transfer custody with telemetry", async function () {
      const location = "Distribution Center Dublin, OH";
      const tempReading = 215; // 21.5°C
      const notes = "Inspection passed, refrigerated container seals intact.";

      const tx = await mediChain.connect(manufacturer)["transferCustody(string,address,string,int16,string)"](
        sampleBatchId,
        distributor.address,
        location,
        tempReading,
        notes
      );

      await expect(tx)
        .to.emit(mediChain, "CustodyTransferred")
        .withArgs(
          sampleBatchId,
          manufacturer.address,
          distributor.address,
          location,
          tempReading,
          (val) => val > 0n
        );

      const batch = await mediChain.getBatch(sampleBatchId);
      expect(batch.currentCustodian).to.equal(distributor.address);
      expect(batch.status).to.equal(1n); // 1 = InTransit
    });

    it("Should allow transfer using the simple overload", async function () {
      await mediChain.connect(manufacturer)["transferCustody(string,address)"](
        sampleBatchId,
        distributor.address
      );

      const batch = await mediChain.getBatch(sampleBatchId);
      expect(batch.currentCustodian).to.equal(distributor.address);
    });

    it("Should reject transfer attempts by unauthorized non-custodian accounts", async function () {
      await expect(
        mediChain.connect(unauthorized)["transferCustody(string,address)"](
          sampleBatchId,
          pharmacy.address
        )
      ).to.be.revertedWithCustomError(mediChain, "UnauthorizedCustodian")
        .withArgs(unauthorized.address, manufacturer.address);
    });

    it("Should reject transfer to zero address", async function () {
      await expect(
        mediChain.connect(manufacturer)["transferCustody(string,address)"](
          sampleBatchId,
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(mediChain, "InvalidRecipient");
    });

    it("Should reject transfer to self", async function () {
      await expect(
        mediChain.connect(manufacturer)["transferCustody(string,address)"](
          sampleBatchId,
          manufacturer.address
        )
      ).to.be.revertedWithCustomError(mediChain, "TransferToSelf");
    });

    it("Should preserve complete chronological history across multiple transfers", async function () {
      // Step 1: Manufacturer -> Distributor
      await mediChain.connect(manufacturer)["transferCustody(string,address,string,int16,string)"](
        sampleBatchId,
        distributor.address,
        "Cardinal Health Hub",
        220, // 22.0°C
        "Handed over to carrier TR-104"
      );

      // Step 2: Distributor -> Pharmacy
      await mediChain.connect(distributor)["transferCustody(string,address,string,int16,string)"](
        sampleBatchId,
        pharmacy.address,
        "Metro General Pharmacy Cleanroom",
        210, // 21.0°C
        "Received and stored in temperature monitored cabinet"
      );

      const history = await mediChain.getBatchHistory(sampleBatchId);
      expect(history.length).to.equal(3);

      // Genesis
      expect(history[0].from).to.equal(ethers.ZeroAddress);
      expect(history[0].to).to.equal(manufacturer.address);

      // Transition 1
      expect(history[1].from).to.equal(manufacturer.address);
      expect(history[1].to).to.equal(distributor.address);
      expect(history[1].location).to.equal("Cardinal Health Hub");
      expect(history[1].temperatureTimesTen).to.equal(220n);

      // Transition 2
      expect(history[2].from).to.equal(distributor.address);
      expect(history[2].to).to.equal(pharmacy.address);
      expect(history[2].location).to.equal("Metro General Pharmacy Cleanroom");
      expect(history[2].temperatureTimesTen).to.equal(210n);

      const currentBatch = await mediChain.getBatch(sampleBatchId);
      expect(currentBatch.currentCustodian).to.equal(pharmacy.address);
    });
  });

  describe("Status Updates & Recall Guards", function () {
    beforeEach(async function () {
      await mediChain.connect(manufacturer).registerBatch(
        sampleBatchId,
        sampleDrugName,
        sampleQuantity,
        mfgDate,
        expDate
      );
    });

    it("Should allow custodian to update batch status", async function () {
      const tx = await mediChain.connect(manufacturer).updateBatchStatus(
        sampleBatchId,
        2n, // 2 = Delivered
        "Confirmed arrival at receiving bay"
      );

      await expect(tx)
        .to.emit(mediChain, "BatchStatusUpdated")
        .withArgs(
          sampleBatchId,
          0n, // previous: Registered
          2n, // new: Delivered
          "Confirmed arrival at receiving bay",
          (val) => val > 0n
        );

      const batch = await mediChain.getBatch(sampleBatchId);
      expect(batch.status).to.equal(2n);
    });

    it("Should prevent custody transfers once a batch is Recalled", async function () {
      // Mark as Recalled (status 4)
      await mediChain.connect(manufacturer).updateBatchStatus(
        sampleBatchId,
        4n, // 4 = Recalled
        "Thermal excursion detected during transport"
      );

      await expect(
        mediChain.connect(manufacturer)["transferCustody(string,address)"](
          sampleBatchId,
          distributor.address
        )
      ).to.be.revertedWithCustomError(mediChain, "BatchIsRecalled")
        .withArgs(sampleBatchId);
    });
  });

  describe("Batch Enumeration", function () {
    it("Should accurately track multiple batch registrations", async function () {
      await mediChain.connect(manufacturer).registerBatch("LOT-1", "Aspirin", 1000n, mfgDate, expDate);
      await mediChain.connect(manufacturer).registerBatch("LOT-2", "Ibuprofen", 2000n, mfgDate, expDate);
      await mediChain.connect(manufacturer).registerBatch("LOT-3", "Amoxicillin", 3000n, mfgDate, expDate);

      expect(await mediChain.getBatchCount()).to.equal(3n);
      expect(await mediChain.getBatchIdAtIndex(0)).to.equal("LOT-1");
      expect(await mediChain.getBatchIdAtIndex(1)).to.equal("LOT-2");
      expect(await mediChain.getBatchIdAtIndex(2)).to.equal("LOT-3");
    });
  });
});
