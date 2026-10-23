import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MedicineBatch } from '../types';
import { blockchainService, HARDHAT_DEV_ACCOUNTS } from '../services/blockchain';
import { useToast } from './Toast';
import { X, ArrowRightLeft, Info, Thermometer, ShieldCheck, AlertCircle, CheckCircle2, UserCheck, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shortenAddress } from '../lib/utils';

interface TransferModalProps {
  isOpen: boolean;
  batch: MedicineBatch | null;
  onClose: () => void;
  onTransferSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  batch,
  onClose,
  onTransferSuccess,
}) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txReceipt, setTxReceipt] = useState<{ txHash: string; blockNumber: number; gasUsed: string } | null>(null);

  const [toName, setToName] = useState('Cardinal Health Logistics Hub #4 (Distributor)');
  const [toAddress, setToAddress] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [location, setLocation] = useState('Dublin Distribution Hub, OH, USA');
  const [temperatureCelsius, setTemperatureCelsius] = useState('21.5');
  const [notes, setNotes] = useState('Refrigerated transit container verified. Cold-chain seal intact.');
  const [error, setError] = useState<string | null>(null);
  const [activeSigner, setActiveSigner] = useState(blockchainService.getActiveAccount());

  useEffect(() => {
    if (isOpen) {
      setActiveSigner(blockchainService.getActiveAccount());
      setError(null);
      setTxReceipt(null);
    }
  }, [isOpen]);

  if (!batch) return null;

  const isAuthorizedToTransfer =
    batch.currentHolderAddress.toLowerCase() === activeSigner.address.toLowerCase();
  const isRecalled = batch.status === 'Recalled';

  const handleSwitchToCustodian = () => {
    const matched = blockchainService.setActiveAccountByAddress(batch.currentHolderAddress);
    if (matched) {
      const updated = blockchainService.getActiveAccount();
      setActiveSigner(updated);
      setError(null);
      addToast(
        'info',
        'Signer Switched to Custodian',
        `Active development signing wallet is now: ${updated.name}`
      );
    } else {
      setError(
        `Custodian address ${shortenAddress(batch.currentHolderAddress, 6)} is an external wallet not in local dev accounts.`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxReceipt(null);

    if (isRecalled) {
      setError(`Cannot transfer custody: Batch ${batch.id} has been RECALLED. Recalled lots are locked on-chain.`);
      return;
    }

    if (!toAddress.trim() || !ethers.isAddress(toAddress.trim())) {
      setError('Please provide a valid Ethereum recipient address (0x...)');
      return;
    }

    if (toAddress.trim().toLowerCase() === batch.currentHolderAddress.toLowerCase()) {
      setError('Cannot transfer custody to the current custodian (self-transfer)');
      return;
    }

    const temp = parseFloat(temperatureCelsius);
    if (isNaN(temp)) {
      setError('Please enter a valid numeric temperature reading');
      return;
    }

    if (!location.trim()) {
      setError('Checkpoint location is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute live on-chain custody handover
      const receipt = await blockchainService.transferCustody({
        batchId: batch.id,
        toAddress: toAddress.trim(),
        location: location.trim(),
        temperatureCelsius: temp,
        notes: notes.trim(),
      });

      setTxReceipt(receipt);

      addToast(
        'success',
        'Custody Handover Mined On-Chain',
        `Batch ${batch.id} transferred to ${shortenAddress(toAddress, 6)} in Block #${receipt.blockNumber} (Tx: ${shortenAddress(receipt.txHash, 6)})`
      );

      setIsSubmitting(false);
      onTransferSuccess();

      setTimeout(() => {
        onClose();
        setTxReceipt(null);
      }, 1800);
    } catch (err: any) {
      console.error('Transfer failed:', err);
      let errorMsg = err.message || 'Custody transfer failed';

      if (errorMsg.includes('UnauthorizedCustodian')) {
        errorMsg = `Unauthorized: Active signing wallet (${shortenAddress(activeSigner.address, 4)}) is not the current custodian (${shortenAddress(batch.currentHolderAddress, 4)}). Only the holder can sign this handover.`;
      } else if (errorMsg.includes('BatchIsRecalled')) {
        errorMsg = `Transfer Blocked by Smart Contract: Batch ${batch.id} has been marked as RECALLED. Recalled lots are frozen.`;
      } else if (errorMsg.includes('TransferToSelf')) {
        errorMsg = 'Cannot transfer custody to the current holder (self-transfer prohibited).';
      } else if (errorMsg.includes('could not detect network') || errorMsg.includes('Failed to fetch') || errorMsg.includes('timed out')) {
        errorMsg = 'Cannot connect to Ethereum local node. Make sure "npm run node" is running in Terminal 1.';
      }

      setError(errorMsg);
      addToast('error', 'Transfer Failed', errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Transfer Batch Custody</h3>
                  <p className="text-xs text-slate-400">
                    Signing on-chain handover for lot <span className="text-brand-300 font-mono font-medium">{batch.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recalled Warning Banner */}
            {isRecalled && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">Batch Recalled by Health Authority</span>
                  This medicine lot has been placed under recall. Smart contract rules prohibit custody transfers of recalled inventory.
                </div>
              </div>
            )}

            {/* Active Signer Info Bar */}
            <div className="mx-6 mt-4 p-3 rounded-lg bg-navy-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-400 shrink-0">Signer:</span>
                <span className="font-semibold text-slate-200 truncate">{activeSigner.name}</span>
              </div>
              <span className="font-mono text-[11px] text-brand-300 shrink-0">
                {shortenAddress(activeSigner.address, 4)}
              </span>
            </div>

            {/* Custodian Verification Warning & Quick Switcher */}
            {!isAuthorizedToTransfer && !isRecalled && (
              <div className="mx-6 mt-3 p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/70 text-amber-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold block">Custody Authority Warning</span>
                    Current active wallet ({shortenAddress(activeSigner.address, 4)}) is not the recorded on-chain custodian ({shortenAddress(batch.currentHolderAddress, 4)}).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToCustodian}
                  className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Switch Signer to Authorized Custodian ({shortenAddress(batch.currentHolderAddress, 4)})</span>
                </button>
              </div>
            )}

            {/* Success Receipt Banner */}
            {txReceipt && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Custody Handover Mined On-Chain!</span>
                </div>
                <div className="font-mono text-[11px] pt-1 space-y-0.5">
                  <p>Tx Hash: {shortenAddress(txReceipt.txHash, 8)}</p>
                  <p>Mined in Block: #{txReceipt.blockNumber} (Gas: {txReceipt.gasUsed})</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Current Holder info */}
              <div className="p-3 rounded-lg bg-navy-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400 block text-[11px]">Current Custody Holder:</span>
                <span className="font-semibold text-white">{batch.currentHolderName}</span>
                <span className="font-mono text-slate-400 block text-[11px] truncate">
                  {batch.currentHolderAddress}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Organization *
                </label>
                <select
                  value={toAddress}
                  disabled={isRecalled || isSubmitting}
                  onChange={(e) => {
                    const addr = e.target.value;
                    setToAddress(addr);
                    const matched = HARDHAT_DEV_ACCOUNTS.find((a) => a.address.toLowerCase() === addr.toLowerCase());
                    if (matched) {
                      setToName(matched.name);
                      if (matched.role === 'Distributor') setLocation('Dublin Logistics Center, OH, USA');
                      else if (matched.role === 'Wholesaler') setLocation('McKesson Distribution Hub, TX, USA');
                      else if (matched.role === 'Hospital') setLocation('Memorial Sloan Pharmacy Cleanroom, NY, USA');
                    }
                  }}
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 font-mono text-xs"
                >
                  {HARDHAT_DEV_ACCOUNTS.map((acc) => (
                    <option key={acc.address} value={acc.address}>
                      {acc.name} ({shortenAddress(acc.address, 4)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Ethereum Wallet Address *
                </label>
                <input
                  type="text"
                  value={toAddress}
                  disabled={isRecalled || isSubmitting}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-xs font-mono text-brand-300 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Handover Location Checkpoint *
                </label>
                <input
                  type="text"
                  value={location}
                  disabled={isRecalled || isSubmitting}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                    Checkpoint Temperature (°C) *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Safe range: {batch.idealTempMin}°C to {batch.idealTempMax}°C
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={temperatureCelsius}
                  disabled={isRecalled || isSubmitting}
                  onChange={(e) => setTemperatureCelsius(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Inspection Notes & Lading ID
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  disabled={isRecalled || isSubmitting}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  placeholder="Enter container inspection or handover remarks..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isRecalled}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-md shadow-sky-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing & Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign Custody Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
