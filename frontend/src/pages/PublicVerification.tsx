import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Thermometer, 
  Building2, 
  AlertOctagon,
  Info,
  ArrowRight,
  ExternalLink,
  WifiOff,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { blockchainService } from '../services/blockchain';
import { apiService } from '../services/api';
import { batchService } from '../services/mockData';
import { MedicineBatch } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { shortenAddress, formatDate } from '../lib/utils';
import { useToast } from '../components/Toast';

type VerificationState = 
  | 'idle'
  | 'loading'
  | 'verified_on_chain'
  | 'unregistered_on_chain'
  | 'network_offline_error'
  | 'demo_snapshot';

export const PublicVerification: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [inputBatchId, setInputBatchId] = useState('');
  const [activeTab, setActiveTab] = useState<'id' | 'qr'>('id');
  const [qrPayloadInput, setQrPayloadInput] = useState('');
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const [verifiedBatch, setVerifiedBatch] = useState<MedicineBatch | null>(null);
  const [offChainMeta, setOffChainMeta] = useState<any | null>(null);
  const [lastQueriedId, setLastQueriedId] = useState('');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const performLookup = async (id: string, isDemoRequested = false) => {
    const cleanId = id.trim();
    if (!cleanId) return;

    setLastQueriedId(cleanId);
    setVerificationState('loading');
    setVerifiedBatch(null);
    setOffChainMeta(null);

    // If explicit demo snapshot was requested
    if (isDemoRequested) {
      const demoRecord = batchService.getBatchById(cleanId);
      if (demoRecord) {
        setVerifiedBatch(demoRecord);
        setVerificationState('demo_snapshot');
        return;
      }
    }

    try {
      // 1. Check live node connection
      const conn = await blockchainService.validateConnection();

      if (!conn.connected || !conn.contractDeployed) {
        // Node is offline or contract is not deployed
        setVerificationState('network_offline_error');
        return;
      }

      // 2. Query live smart contract
      const onChain = await blockchainService.getOnChainBatch(cleanId);
      if (onChain) {
        setVerifiedBatch(onChain);
        setVerificationState('verified_on_chain');

        // Supplement with off-chain metadata if backend is reachable
        try {
          const metaRes = await apiService.getBatchById(cleanId);
          if (metaRes && metaRes.offChainMetadata) {
            setOffChainMeta(metaRes.offChainMetadata);
          }
        } catch {
          // off-chain metadata is supplementary, contract is source of truth
        }
      } else {
        // Connected to chain, but batch doesn't exist on-chain
        setVerifiedBatch(null);
        setVerificationState('unregistered_on_chain');
      }
    } catch (err: any) {
      console.warn('Blockchain verification query failed:', err);
      setVerificationState('network_offline_error');
    }
  };

  useEffect(() => {
    const queryId = searchParams.get('batchId');
    if (queryId) {
      setInputBatchId(queryId);
      performLookup(queryId);
    } else {
      // Default to known seed lot on initial view
      setInputBatchId('MC-2024-8849');
      performLookup('MC-2024-8849');
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBatchId.trim()) return;
    setSearchParams({ batchId: inputBatchId.trim() });
    performLookup(inputBatchId.trim());
  };

  const handleQrPayloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = qrPayloadInput.trim();
    if (!payload) return;

    // Extract batchId if payload is a URL
    let extractedId = payload;
    try {
      const url = new URL(payload);
      const paramId = url.searchParams.get('batchId');
      if (paramId) extractedId = paramId;
    } catch {
      // Not a URL, use raw string
    }

    setInputBatchId(extractedId);
    setActiveTab('id');
    setSearchParams({ batchId: extractedId });
    performLookup(extractedId);
  };

  const handleSimulatedScan = (sampleId: string) => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setInputBatchId(sampleId);
      setSearchParams({ batchId: sampleId });
      performLookup(sampleId);
      setIsSimulatingScan(false);
      setActiveTab('id');
    }, 500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    addToast('info', 'Copied to Clipboard', `${label} copied.`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const isRecalled = verifiedBatch?.status === 'Recalled';
  const isCompromised = verifiedBatch?.status === 'Compromised';
  const stablePublicUrl = verifiedBatch ? `${window.location.origin}/verify?batchId=${verifiedBatch.id}` : '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title & Purpose */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span>Patient & Clinician Verification Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">
          Verify Medicine Authenticity
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Scan the serialized QR code on your prescription package or enter the batch lot number to inspect cryptographic custody and cold-chain compliance.
        </p>
      </div>

      {/* Lookup Controls Card */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 pb-4 mb-5 gap-3">
          <button
            onClick={() => setActiveTab('id')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'id'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Enter Batch ID</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'qr'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>QR Scanner & Payload</span>
          </button>
        </div>

        {activeTab === 'id' ? (
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputBatchId}
                onChange={(e) => setInputBatchId(e.target.value)}
                placeholder="Enter Lot Number (e.g. MC-2024-8849, MC-2024-4102)..."
                className="w-full pl-4 pr-32 py-3 bg-navy-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={verificationState === 'loading'}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {verificationState === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400">Quick Test Samples:</span>
              <button
                type="button"
                onClick={() => {
                  setInputBatchId('MC-2024-8849');
                  setSearchParams({ batchId: 'MC-2024-8849' });
                  performLookup('MC-2024-8849');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-300 font-mono transition-colors"
              >
                MC-2024-8849 (Paxlovid Seed)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputBatchId('UNKNOWN-LOT-9999');
                  setSearchParams({ batchId: 'UNKNOWN-LOT-9999' });
                  performLookup('UNKNOWN-LOT-9999');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono transition-colors"
              >
                UNKNOWN-LOT-9999 (Unregistered)
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 text-center">
            {/* Viewfinder animation */}
            <div className="relative max-w-sm mx-auto h-56 rounded-xl border-2 border-dashed border-brand-500/40 bg-navy-950 flex flex-col items-center justify-center p-6 overflow-hidden">
              <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-brand-400 rounded-lg pointer-events-none opacity-80" />
              <div className="absolute inset-x-8 h-0.5 bg-brand-400 animate-pulse top-1/2 shadow-lg shadow-brand-400" />

              <Camera className="w-10 h-10 text-brand-400/70 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-white">QR Code Scanner Active</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Point packaging QR code or enter decoded QR verification URL below
              </p>

              {isSimulatingScan && (
                <div className="absolute inset-0 bg-navy-950/90 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-brand-300">Decoding QR Payload...</span>
                </div>
              )}
            </div>

            {/* QR Raw URL or Payload Input */}
            <form onSubmit={handleQrPayloadSubmit} className="max-w-md mx-auto flex gap-2">
              <input
                type="text"
                value={qrPayloadInput}
                onChange={(e) => setQrPayloadInput(e.target.value)}
                placeholder="Paste QR URL (e.g. http://.../verify?batchId=MC-2024-8849)..."
                className="flex-1 px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Scan Payload
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <span className="text-xs text-slate-400">Simulate Camera Scan:</span>
              <button
                onClick={() => handleSimulatedScan('MC-2024-8849')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-mono transition-colors"
              >
                Scan Seed Lot QR (Paxlovid)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {verificationState === 'loading' && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            Querying smart contract at {shortenAddress(blockchainService.getContractAddress(), 6)} on Chain ID 31337...
          </p>
        </div>
      )}

      {/* State 1: Verified On-Chain */}
      {verificationState === 'verified_on_chain' && verifiedBatch && (
        <div className="space-y-6">
          {/* Data Source Transparency Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Authoritative verification confirmed directly on Ethereum Smart Contract (<span className="font-mono text-emerald-200">MediChain.sol</span> at {shortenAddress(blockchainService.getContractAddress(), 6)})
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-semibold self-start sm:self-auto">
              Live EVM State
            </span>
          </div>

          <div className="rounded-2xl bg-navy-900 border border-slate-800 overflow-hidden shadow-xl">
            {/* Verdict Header Banner */}
            <div
              className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isRecalled || isCompromised
                  ? 'bg-rose-950/70 border-rose-800/80'
                  : 'bg-emerald-950/70 border-emerald-800/80'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl border ${
                    isRecalled || isCompromised
                      ? 'bg-rose-900/60 border-rose-700 text-rose-300'
                      : 'bg-emerald-900/60 border-emerald-700 text-emerald-300'
                  }`}
                >
                  {isRecalled || isCompromised ? (
                    <AlertOctagon className="w-8 h-8" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold">
                      {isRecalled
                        ? 'Product Recall Warning'
                        : isCompromised
                        ? 'Cold Chain Breach Alert'
                        : 'Cryptographically Verified Lot'}
                    </span>
                    <StatusBadge status={verifiedBatch.status} />
                  </div>
                  <h2 className="text-xl font-bold text-white font-mono mt-0.5">
                    {verifiedBatch.name} ({verifiedBatch.id})
                  </h2>
                  <p className="text-xs opacity-90 mt-0.5">
                    Manufactured: {formatDate(verifiedBatch.manufacturingDate)} • Expiry: {formatDate(verifiedBatch.expiryDate)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/batches/${verifiedBatch.id}`)}
                className="px-4 py-2 bg-navy-900/80 hover:bg-navy-950 border border-slate-700 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Full Custody Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Verification Details Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left: Origin & Manufacturer */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Genesis Manufacturer Proof
                </h4>

                <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Origin Manufacturer:</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {verifiedBatch.manufacturerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Signing Address:</span>
                    <span className="font-mono text-brand-300">
                      {shortenAddress(verifiedBatch.manufacturerAddress, 6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Manufacturing Date:</span>
                    <span className="font-mono text-slate-200">
                      {formatDate(verifiedBatch.manufacturingDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expiry Date:</span>
                    <span className="font-mono text-amber-300 font-medium">
                      {formatDate(verifiedBatch.expiryDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Lot Volume:</span>
                    <span className="font-mono text-white">
                      {verifiedBatch.quantity.toLocaleString()} {verifiedBatch.unit}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-2">
                  <span className="text-slate-400 block text-[11px]">Current Custody Holder:</span>
                  <p className="font-semibold text-white">{verifiedBatch.currentHolderName}</p>
                  <p className="font-mono text-slate-400 text-[11px]">
                    {shortenAddress(verifiedBatch.currentHolderAddress, 6)}
                  </p>
                </div>
              </div>

              {/* Right: Telemetry & Integrity Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Ledger Integrity Checks
                </h4>

                <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Contract Address:</span>
                    <span className="text-brand-300 font-mono text-[11px]">
                      {shortenAddress(blockchainService.getContractAddress(), 6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Genesis Block:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      #{verifiedBatch.blockNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cold Chain Compliance:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isCompromised || isRecalled ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isCompromised ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Excursion Logged
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Within Temperature Envelope
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Custody Transitions:</span>
                    <span className="font-mono text-slate-200">
                      {verifiedBatch.transfers.length} verified handovers
                    </span>
                  </div>
                </div>

                {/* Stable Public Verification URL & QR presentation */}
                <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shrink-0">
                    <QRCodeSVG
                      value={stablePublicUrl}
                      size={64}
                      level="M"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono font-semibold text-brand-300 block truncate text-xs">
                      Stable Verification URL
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                      {stablePublicUrl}
                    </p>
                    <button
                      onClick={() => copyToClipboard(stablePublicUrl, 'Verification Link')}
                      className="mt-1.5 text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedText === 'Verification Link' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State 2: Connected, but Unregistered on Chain */}
      {verificationState === 'unregistered_on_chain' && (
        <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-800/70 text-center space-y-4">
          <div className="p-3 bg-rose-900/40 rounded-full inline-block text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Unregistered Medicine Batch</h3>
            <p className="text-xs text-rose-200 max-w-lg mx-auto leading-relaxed">
              Batch identifier <span className="font-mono font-bold text-white">"{lastQueriedId}"</span> does not exist on the configured blockchain ledger (<span className="font-mono text-rose-300">Chain ID 31337</span>).
            </p>
            <p className="text-xs text-rose-300/80 max-w-md mx-auto">
              No genuine genesis minting transaction was found for this lot ID. Do not dispense or administer this medicine until verified with the manufacturer.
            </p>
          </div>
        </div>
      )}

      {/* State 3: RPC Disconnected / Unable to Verify */}
      {verificationState === 'network_offline_error' && (
        <div className="p-8 rounded-2xl bg-amber-950/40 border border-amber-800/70 text-center space-y-4">
          <div className="p-3 bg-amber-900/40 rounded-full inline-block text-amber-400">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Unable to Verify — Blockchain Node Offline</h3>
            <p className="text-xs text-amber-200 max-w-lg mx-auto leading-relaxed">
              The verification portal could not establish a connection with the Ethereum RPC node at <span className="font-mono text-white">http://127.0.0.1:8545</span>.
            </p>
            <div className="p-3 rounded-xl bg-navy-950/80 border border-amber-800/50 max-w-md mx-auto text-left text-xs space-y-1.5">
              <span className="text-amber-300 font-semibold block">Important Distinction:</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                This network connection error does <strong>NOT</strong> indicate product fraud, tampering, or an authentic result. It simply means the decentralized ledger cannot be contacted right now.
              </p>
              <div className="pt-1.5 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <p className="text-amber-300 font-sans font-medium mb-1">To start the local Ethereum network:</p>
                <div className="bg-black/50 p-2 rounded text-brand-300">
                  Terminal 1: npm --prefix blockchain run node<br />
                  Terminal 2: npm --prefix blockchain run deploy:local
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => performLookup(lastQueriedId || inputBatchId)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Verification</span>
            </button>
            <button
              onClick={() => performLookup('MC-2024-8849', true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              View Sample Demo Record (Paxlovid)
            </button>
          </div>
        </div>
      )}

      {/* State 4: Demo Record Snapshot */}
      {verificationState === 'demo_snapshot' && verifiedBatch && (
        <div className="space-y-6">
          <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Historical Demo View: Displaying pre-loaded simulation record for testing. Not queried from active node.
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-900 text-amber-200 font-semibold">
              Demo Simulation
            </span>
          </div>

          {/* Render demo record card */}
          <div className="rounded-2xl bg-navy-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-navy-950/70 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  Sample Demonstration Lot
                </span>
                <h2 className="text-xl font-bold text-white font-mono">{verifiedBatch.name} ({verifiedBatch.id})</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manufactured: {formatDate(verifiedBatch.manufacturingDate)} • Expiry: {formatDate(verifiedBatch.expiryDate)}
                </p>
              </div>
              <StatusBadge status={verifiedBatch.status} />
            </div>

            <div className="p-6 text-xs text-slate-300 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Manufacturer:</span>
                <span className="font-semibold text-white">{verifiedBatch.manufacturerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Custodian:</span>
                <span className="font-semibold text-white">{verifiedBatch.currentHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="font-mono">{verifiedBatch.quantity.toLocaleString()} {verifiedBatch.unit}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Engineering & Medical Reality Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200 block mb-0.5">
            Crucial Medical Safety Reality:
          </span>
          Blockchain cryptographic records mathematically verify registered manufacturer signatures and recorded custodian custody transitions. Blockchain records alone cannot detect physical vial tampering, liquid substitution, or temperature breach occurring outside recorded logging points. Clinicians and patients must always inspect packaging break-away seals, 2D datamatrix serialization, and holographic indicators before use.
        </div>
      </div>
    </div>
  );
};
