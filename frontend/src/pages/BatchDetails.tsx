import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Boxes, 
  ArrowRightLeft, 
  ShieldCheck, 
  QrCode, 
  FileText, 
  Thermometer, 
  Layers, 
  Copy, 
  Check, 
  Info,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Edit3,
  ExternalLink,
  Tag
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { TransferModal } from '../components/TransferModal';
import { blockchainService, STATUS_MAP, REVERSE_STATUS_MAP } from '../services/blockchain';
import { apiService } from '../services/api';
import { batchService } from '../services/mockData';
import { MedicineBatch, BatchStatus } from '../types';
import { shortenAddress, formatDate } from '../lib/utils';
import { useToast } from '../components/Toast';

export const BatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [batch, setBatch] = useState<MedicineBatch | null>(null);
  const [offChainMeta, setOffChainMeta] = useState<any | null>(null);
  const [isLiveChain, setIsLiveChain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status update state
  const [newStatusIndex, setNewStatusIndex] = useState<number>(2); // Default to Delivered (2)
  const [statusReason, setStatusReason] = useState<string>('Destination receiving dock verification completed.');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadBatchData = async () => {
    if (!id) return;
    setIsLoading(true);
    const cleanId = id.trim();

    try {
      const conn = await blockchainService.validateConnection();
      if (conn.connected && conn.contractDeployed) {
        const onChain = await blockchainService.getOnChainBatch(cleanId);
        if (onChain) {
          setBatch(onChain);
          setIsLiveChain(true);

          try {
            const metaRes = await apiService.getBatchById(cleanId);
            if (metaRes && metaRes.offChainMetadata) {
              setOffChainMeta(metaRes.offChainMetadata);
            }
          } catch {
            // off-chain metadata is supplementary
          }

          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching on-chain batch details:', err);
    }

    // Fallback to demo dataset
    const fallback = batchService.getBatchById(cleanId);
    setBatch(fallback || null);
    setIsLiveChain(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBatchData();
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast('info', 'Copied to Clipboard', `${label} copied.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;
    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const receipt = await blockchainService.updateBatchStatus({
        batchId: batch.id,
        newStatus: Number(newStatusIndex),
        reason: statusReason.trim() || 'Status updated by authorized custodian',
      });

      addToast(
        'success',
        'Batch Status Updated On-Chain',
        `Batch status changed to ${STATUS_MAP[newStatusIndex]} in Block #${receipt.blockNumber}`
      );

      setIsUpdatingStatus(false);
      setIsStatusModalOpen(false);
      await loadBatchData();
    } catch (err: any) {
      console.error('Failed to update status on-chain:', err);
      let msg = err.message || 'Status update failed';
      if (msg.includes('UnauthorizedCustodian')) {
        msg = 'Unauthorized: Only the current legal custodian or contract owner can update this status.';
      }
      setStatusError(msg);
      addToast('error', 'Status Update Failed', msg);
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-slate-400">Querying on-chain batch ledger...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="p-3 bg-slate-800/60 rounded-full inline-block text-slate-400">
          <Boxes className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-white">Batch Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The requested medicine batch identifier "{id}" does not exist in the active ledger records.
        </p>
        <button
          onClick={() => navigate('/batches')}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Batches Registry</span>
        </button>
      </div>
    );
  }

  const verificationUrl = `${window.location.origin}/verify?batchId=${batch.id}`;
  const isRecalled = batch.status === 'Recalled';
  const isCompromised = batch.status === 'Compromised';

  return (
    <div className="space-y-6">
      {/* Back button and page breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/batches')}
            className="p-2 bg-navy-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                {batch.id}
              </h1>
              <StatusBadge status={batch.status} />
              {isLiveChain ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                  Live Contract State
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold font-mono">
                  Historical Demo Record
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {batch.name} • {batch.genericName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadBatchData}
            className="p-2 text-slate-400 hover:text-white bg-navy-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            title="Refresh from chain"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-navy-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-brand-400" />
            <span>Generate QR</span>
          </button>

          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-navy-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>Update Status</span>
          </button>

          <button
            onClick={() => setIsTransferOpen(true)}
            disabled={isRecalled}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-navy-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4 text-sky-400" />
            <span>Transfer Custody</span>
          </button>

          <button
            onClick={() => navigate(`/verify?batchId=${batch.id}`)}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-all shadow-md shadow-brand-600/20 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Public Verify</span>
          </button>
        </div>
      </div>

      {/* Recalled or Compromised Advisory Banner */}
      {(isRecalled || isCompromised) && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 flex items-start gap-3 text-xs leading-relaxed">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white text-sm block mb-0.5">
              {isRecalled ? 'Notice of Active Regulatory Recall' : 'Notice of Cold-Chain Integrity Alert'}
            </span>
            {isRecalled
              ? `Lot ${batch.id} has been cryptographically flagged as RECALLED by the authorized custodian or health agency. Custody handovers are locked by contract rules.`
              : `Lot ${batch.id} has logged a temperature excursion breach. The container requires physical inspection before further distribution.`}
          </div>
        </div>
      )}

      {/* Main Grid: Left Specs & Right Custody Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Batch Metadata & Blockchain Hashes */}
        <div className="space-y-6">
          {/* Card: Drug Identity */}
          <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <FileText className="w-4 h-4 text-brand-400" />
              <span>Pharmaceutical Formulation</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Brand Name:</span>
                <span className="font-semibold text-white text-right">{batch.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Active Generic:</span>
                <span className="font-medium text-slate-200 text-right">{batch.genericName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Total Lot Volume:</span>
                <span className="font-mono text-white">
                  {batch.quantity.toLocaleString()} {batch.unit}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Lifecycle Status:</span>
                <StatusBadge status={batch.status} />
              </div>
            </div>
          </div>

          {/* Card: Supplementary Off-Chain Metadata (MongoDB) */}
          {offChainMeta && (
            <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  <span>Off-Chain Supplementary Specs</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  MongoDB Metadata
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {offChainMeta.packageType && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400">Package Spec:</span>
                    <span className="text-slate-200 text-right">{offChainMeta.packageType}</span>
                  </div>
                )}
                {offChainMeta.storageInstructions && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400">Handling Spec:</span>
                    <span className="text-slate-200 text-right max-w-[180px]">{offChainMeta.storageInstructions}</span>
                  </div>
                )}
                {offChainMeta.regulatoryFdaCode && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400">FDA / NDC Code:</span>
                    <span className="font-mono text-brand-300">{offChainMeta.regulatoryFdaCode}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 italic">
                  Note: Off-chain metadata is supplementary; smart contract is the sole authority for ownership and state.
                </p>
              </div>
            </div>
          )}

          {/* Card: Storage Protocol */}
          <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Thermometer className="w-4 h-4 text-emerald-400" />
              <span>Storage Protocol & Lifespan</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Permitted Envelope:</span>
                <span className="font-mono text-brand-300">
                  {batch.idealTempMin}°C to {batch.idealTempMax}°C
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Manufactured:</span>
                <span className="font-mono text-slate-300">{formatDate(batch.manufacturingDate)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Expiry Date:</span>
                <span className="font-mono text-amber-300">{formatDate(batch.expiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Card: Blockchain Proofs & Addresses */}
          <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>On-Chain Ownership Proofs</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Registering Manufacturer:</span>
                <div className="flex items-center justify-between p-2 rounded bg-navy-950 font-mono text-[11px] text-slate-300 border border-slate-800">
                  <span className="truncate mr-2">{batch.manufacturerAddress}</span>
                  <button
                    onClick={() => copyToClipboard(batch.manufacturerAddress, 'Manufacturer')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'Manufacturer' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Current Legal Custodian:</span>
                <div className="flex items-center justify-between p-2 rounded bg-navy-950 font-mono text-[11px] text-slate-300 border border-slate-800">
                  <span className="truncate mr-2">{batch.currentHolderAddress}</span>
                  <button
                    onClick={() => copyToClipboard(batch.currentHolderAddress, 'Custodian')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'Custodian' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400">Genesis Block:</span>
                <span className="font-mono text-slate-200">#{batch.blockNumber}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Genesis Tx Hash:</span>
                <span className="font-mono text-brand-300 text-[11px]">
                  {shortenAddress(batch.txHash, 6)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Smart Contract:</span>
                <span className="font-mono text-brand-300 text-[11px]">
                  {shortenAddress(blockchainService.getContractAddress(), 6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custody Chain Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-400" />
                  <span>Tamper-Evident Custody Trail</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological transition proofs signed by authorized pharma participants
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 self-start sm:self-auto">
                {batch.transfers.length} Recorded Steps
              </span>
            </div>

            <Timeline transfers={batch.transfers} />
          </div>
        </div>
      </div>

      {/* QR Code Presentation Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsQrModalOpen(false)}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm bg-navy-900 border border-slate-700 rounded-2xl p-6 shadow-2xl z-10 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Serialized Batch QR Code</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block shadow-inner mx-auto">
              <QRCodeSVG
                value={verificationUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-brand-400">{batch.id}</p>
              <p className="text-xs text-slate-400 mt-1">{batch.name} • Public Verification QR</p>
            </div>

            <div className="p-2.5 rounded bg-navy-950 text-left border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Verification Target:</span>
              <p className="font-mono text-brand-300 truncate">{verificationUrl}</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  copyToClipboard(verificationUrl, 'Verification URL');
                  setIsQrModalOpen(false);
                }}
                className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  setIsQrModalOpen(false);
                  navigate(`/verify?batchId=${batch.id}`);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              >
                Open Verify Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsStatusModalOpen(false)}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-navy-900 border border-slate-700 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Update On-Chain Batch Status</h3>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {statusError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                {statusError}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select New Status</label>
                <select
                  value={newStatusIndex}
                  onChange={(e) => setNewStatusIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                >
                  <option value={1}>In Transit</option>
                  <option value={2}>Delivered</option>
                  <option value={3}>Dispensed</option>
                  <option value={4}>Recalled (Emergency Advisory)</option>
                  <option value={5}>Compromised (Excursion / Seal alert)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason / Handover Remarks</label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Provide audit reason for on-chain status transition..."
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-2.5 rounded bg-navy-950/60 border border-slate-800 text-[11px] text-slate-400">
                <p>Authorized signer: Legal custodian ({shortenAddress(batch.currentHolderAddress, 4)}) or contract owner.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  {isUpdatingStatus ? 'Broadcasting...' : 'Broadcast Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custody Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        batch={batch}
        onClose={() => setIsTransferOpen(false)}
        onTransferSuccess={() => {
          loadBatchData();
        }}
      />
    </div>
  );
};
