# MediChain — Blockchain-Based Medicine Authenticity & Supply-Chain Verification

[![MediChain Platform](https://img.shields.io/badge/MediChain-v1.0.0--alpha-10b981.svg)](https://github.com)
[![Ethereum](https://img.shields.io/badge/Blockchain-Ethereum%20%2F%20Hardhat-627EEA.svg)](https://hardhat.org)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg)](https://react.dev)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20MongoDB-339933.svg)](https://nodejs.org)

## 📌 Project Overview
**MediChain** is a production-grade, pharmaceutical provenance and batch tracking platform engineered for high-integrity medicine verification. Built as a university semester engineering capstone, it combines immutable smart contract state logs with performant off-chain search and rich analytical dashboards.

> **Crucial Reality Check**: MediChain leverages cryptographic signatures and distributed ledgers to provide tamper-proof custody trails and batch authenticity proofs. However, blockchain custody records prove mathematical integrity and chain-of-custody compliance; physical genuine-status verification relies on cryptographically tied tamper-evident serialization, secure scanning, and authorized laboratory assays.

---

## 🏛️ Monorepo Architecture
```text
BC/
├── frontend/             # React 18 + Vite + Tailwind CSS + Lucide + Recharts
│   ├── src/
│   │   ├── components/   # Modular UI primitives (KPI cards, badges, modals, timeline)
│   │   ├── pages/        # Dashboard, Batches, Batch Details, Explorer, QR Verification
│   │   ├── services/     # Modular mock/live data boundary services
│   │   ├── types/        # TypeScript interfaces for batches, transfers, events
│   │   └── lib/          # Utilities, formatters, blockchain helper stubs
├── backend/              # Express + Node.js + Mongoose (Off-chain metadata & caching)
│   ├── src/              # Routes, controllers, and MongoDB models
│   └── README.md         # Setup and API documentation
├── blockchain/           # Hardhat + Solidity Smart Contracts
│   ├── contracts/        # MediChain.sol (ERC-batch custody contract)
│   ├── scripts/          # Deploy and seed automation
│   └── README.md         # Compilation, local node, and deployment guide
└── README.md             # This document
```

---

## 🚀 Complete End-to-End Startup Order

To run the live full-stack application with real smart contract transactions, open separate terminal windows in the following exact sequence:

### Terminal 1: Start Persistent Local Ethereum Blockchain Node
```bash
# Starts local Hardhat JSON-RPC node on http://127.0.0.1:8545 (Chain ID: 31337)
npm --prefix blockchain run node
```

### Terminal 2: Deploy Smart Contract & Export Artifacts
```bash
# Deploys MediChain.sol to localhost (31337) and exports ABI & Address to frontend/contracts
npm --prefix blockchain run deploy:local
```

### Terminal 3: Launch Express Backend API (Metadata & Indexer)
```bash
# Starts Express server on http://localhost:5000 (MongoDB or graceful In-Memory fallback)
npm --prefix backend run dev
```

### Terminal 4: Launch Vite Frontend Application
```bash
# Launches Vite development server on http://localhost:5173
npm --prefix frontend run dev
```

---

## 🧪 Verification & Test Commands

Run the comprehensive test suites across contracts, backend, and frontend build:

```bash
# 1. Run Smart Contract Test Suite (20 unit & integration tests)
npm --prefix blockchain test

# 2. Run Backend API Test Suite (6 endpoint & integration tests)
npm --prefix backend test

# 3. Run Frontend Type-Check & Production Build
npm --prefix frontend run build
```

---

## 🛡️ Key Features
- **Executive Command Center**: High-level supply metrics, cold-chain telemetry breaches, active transit statuses, and recent ledger transfers.
- **Batch Master Registry**: Complete batch tracking with real-time status badges, search by NDC / Batch #, manufacturer filter, and modal-based registration.
- **Deep Custody Inspection**: Serialized timeline showing cryptographic block numbers, gas fees, timestamps, temperature checkpoints, and participant signatures.
- **Blockchain Explorer**: Live-look block visualizer, transaction hashes, smart contract gas audits, and validator nodes.
- **Public Patient / Clinician QR Verification**: Instant verification interface supporting direct batch ID entry or camera QR scanning with tamper-evident indicator.
