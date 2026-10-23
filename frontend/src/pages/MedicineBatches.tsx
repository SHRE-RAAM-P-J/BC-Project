import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  ArrowRightLeft, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { BatchRegistrationModal } from '../components/BatchRegistrationModal';
import { TransferModal } from '../components/TransferModal';
import { blockchainService } from '../services/blockchain';
import { batchService } from '../services/mockData';
import { MedicineBatch } from '../types';
import { shortenAddress, formatDate } from '../lib/utils';

export const MedicineBatches: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveChain, setIsLiveChain] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('All');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<MedicineBatch | null>(null);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const conn = await blockchainService.validateConnection();
      if (conn.connected && conn.contractDeployed) {
        const onChainBatches = await blockchainService.getAllOnChainBatches();
        if (onChainBatches.length > 0) {
          setBatches(onChainBatches);
          setIsLiveChain(true);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load on-chain batches:', err);
    }

    // Fallback to demo seed batches with clear label
    setBatches(batchService.getBatches());
    setIsLiveChain(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const manufacturers = useMemo(() => {
    const list = Array.from(new Set(batches.map((b) => b.manufacturerName)));
    return ['All', ...list];
  }, [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.ndc && b.ndc.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesMfg = manufacturerFilter === 'All' || b.manufacturerName === manufacturerFilter;

      return matchesSearch && matchesStatus && matchesMfg;
    });
  }, [batches, searchQuery, statusFilter, manufacturerFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Medicine Batches
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold font-mono">
              {filteredBatches.length} Total Lots
            </span>
            {isLiveChain ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                Live Solidity Ledger
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                Demo Snapshot
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident batch master registry and chain-of-custody tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBatches}
            className="p-2 text-slate-400 hover:text-white bg-navy-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            title="Refresh batches from chain"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-all shadow-md shadow-brand-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Batch</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Lot #, Medicine, or NDC..."
            className="w-full pl-9 pr-4 py-2 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Dispensed">Dispensed</option>
              <option value="Recalled">Recalled</option>
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Manufacturer:</span>
            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 max-w-[160px] truncate"
            >
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          title="No Matching Batches Found"
          description="Try broadening your search term or resetting the status and manufacturer filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('All');
            setManufacturerFilter('All');
          }}
        />
      ) : (
        <div className="rounded-xl bg-navy-900/80 border border-slate-800/80 overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Medicine & Formula</th>
                  <th className="py-3 px-4">NDC Code</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Current Custodian</th>
                  <th className="py-3 px-4">Lifecycle State</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/batches/${batch.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-300">
                      {batch.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-brand-300 transition-colors">
                        {batch.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {batch.genericName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {batch.ndc || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-white">
                        {batch.quantity.toLocaleString()}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">{batch.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200 truncate max-w-[160px]">
                        {batch.currentHolderName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {shortenAddress(batch.currentHolderAddress, 4)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatDate(batch.expiryDate)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setTransferTarget(batch)}
                          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-950/60 rounded-md transition-colors"
                          title="Transfer Custody"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/verify?batchId=${batch.id}`)}
                          className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-emerald-950/60 rounded-md transition-colors"
                          title="Verify Batch"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/batches/${batch.id}`)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <BatchRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onBatchCreated={() => {
          loadBatches();
        }}
      />

      <TransferModal
        isOpen={Boolean(transferTarget)}
        batch={transferTarget}
        onClose={() => setTransferTarget(null)}
        onTransferSuccess={() => {
          loadBatches();
        }}
      />
    </div>
  );
};
