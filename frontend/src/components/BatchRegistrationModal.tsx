import React, { useState } from 'react';
import { MedicineBatch } from '../types';
import { blockchainService } from '../services/blockchain';
import { apiService } from '../services/api';
import { useToast } from './Toast';
import { X, Plus, AlertCircle, Info, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shortenAddress } from '../lib/utils';

interface BatchRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: (batch: MedicineBatch) => void;
}

export const BatchRegistrationModal: React.FC<BatchRegistrationModalProps> = ({
  isOpen,
  onClose,
  onBatchCreated,
}) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txReceipt, setTxReceipt] = useState<{
    txHash: string;
    blockNumber: number;
    contractAddress: string;
    gasUsed: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    id: `MC-2024-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    genericName: '',
    ndc: '',
    dosage: '',
    quantity: '10000',
    unit: 'Cartons',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 63072000000).toISOString().split('T')[0],
    manufacturerName: 'Pfizer Global Supply',
    storageCondition: 'Controlled Room Temp (20°C to 25°C)',
    idealTempMin: '20.0',
    idealTempMax: '25.0',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeAccount = blockchainService.getActiveAccount();

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.id.trim()) err.id = 'Batch Lot ID is required';
    if (!formData.name.trim()) err.name = 'Brand medicine name is required';
    if (!formData.genericName.trim()) err.genericName = 'Active formula is required';
    if (!formData.quantity || Number(formData.quantity) <= 0) err.quantity = 'Quantity must be greater than zero';
    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      err.expiryDate = 'Expiry date must be after manufacturing date';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setTxReceipt(null);

    try {
      // 1. Submit on-chain transaction to the smart contract
      const receipt = await blockchainService.registerBatch({
        batchId: formData.id.trim(),
        medicineName: formData.name.trim(),
        quantity: Number(formData.quantity),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
      });

      setTxReceipt(receipt);

      // 2. Persist supporting off-chain metadata to the backend API
      try {
        await apiService.saveBatchMetadata(formData.id.trim(), {
          brandName: formData.name.trim(),
          genericName: formData.genericName.trim(),
          dosage: formData.dosage.trim(),
          packageType: formData.unit,
          storageInstructions: formData.storageCondition,
          regulatoryFdaCode: formData.ndc.trim(),
        });
      } catch (metaErr) {
        console.warn('Backend metadata sync warning (offline):', metaErr);
      }

      addToast(
        'success',
        'Batch Registered on Blockchain',
        `Batch ${formData.id} mined into Block #${receipt.blockNumber} (Tx: ${shortenAddress(receipt.txHash, 6)})`
      );

      // 3. Query updated batch state
      const createdBatch = await blockchainService.getOnChainBatch(formData.id.trim());
      if (createdBatch) {
        onBatchCreated(createdBatch);
      }

      setIsSubmitting(false);
      setTimeout(() => {
        onClose();
        setTxReceipt(null);
      }, 1800);
    } catch (err: any) {
      console.error('Registration failed:', err);
      let errorMsg = err.message || 'Transaction reverted';
      if (errorMsg.includes('could not detect network') || errorMsg.includes('Failed to fetch') || errorMsg.includes('timed out')) {
        errorMsg = 'Cannot connect to Ethereum local node at http://127.0.0.1:8545. Please make sure "npm run node" is running in Terminal 1.';
      } else if (errorMsg.includes('BatchAlreadyExists')) {
        errorMsg = `Batch ID "${formData.id}" is already registered on the blockchain. Please choose a unique lot number.`;
      }
      setSubmitError(errorMsg);
      addToast('error', 'Registration Failed', errorMsg);
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
            className="relative w-full max-w-2xl bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Register Medicine Batch</h3>
                  <p className="text-xs text-slate-400">
                    Mints tamper-evident genesis batch to <span className="font-mono text-brand-300">MediChain.sol</span>
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

            {/* Active Signer Indicator */}
            <div className="mx-6 mt-4 p-3 rounded-lg bg-navy-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Signing Identity:</span>
                <span className="font-semibold text-slate-200">{activeAccount.name}</span>
              </div>
              <span className="font-mono text-[11px] text-brand-300">
                {shortenAddress(activeAccount.address, 4)}
              </span>
            </div>

            {/* Success Receipt Banner */}
            {txReceipt && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Transaction Confirmed On-Chain!</span>
                </div>
                <div className="font-mono text-[11px] pt-1 space-y-0.5">
                  <p>Tx Hash: {shortenAddress(txReceipt.txHash, 8)}</p>
                  <p>Mined in Block: #{txReceipt.blockNumber} (Gas: {txReceipt.gasUsed})</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {submitError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Batch Identifier (Lot #) *
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm font-mono text-brand-300 focus:outline-none focus:border-brand-500"
                    placeholder="e.g. MC-2024-8849"
                  />
                  {errors.id && <p className="text-xs text-rose-400 mt-1">{errors.id}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Brand Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Paxlovid, Humira"
                  />
                  {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Active Formula / Generic Name *
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Nirmatrelvir / Ritonavir"
                  />
                  {errors.genericName && <p className="text-xs text-rose-400 mt-1">{errors.genericName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    National Drug Code (NDC)
                  </label>
                  <input
                    type="text"
                    value={formData.ndc}
                    onChange={(e) => setFormData({ ...formData, ndc: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. 0069-5318-30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Batch Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                    {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Packaging Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="Cartons">Cartons</option>
                      <option value="Vials">Vials</option>
                      <option value="Packs">Packs</option>
                      <option value="Ampoules">Ampoules</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dosage & Strength
                  </label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                    placeholder="e.g. 300mg / 100mg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Manufacturing Date *
                  </label>
                  <input
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                  {errors.expiryDate && <p className="text-xs text-rose-400 mt-1">{errors.expiryDate}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-lg transition-all shadow-md shadow-brand-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Broadcasting Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Sign & Register On-Chain</span>
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
