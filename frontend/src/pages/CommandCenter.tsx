import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  Thermometer, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { BatchRegistrationModal } from '../components/BatchRegistrationModal';
import { TransferModal } from '../components/TransferModal';
import { blockchainService } from '../services/blockchain';
import { batchService } from '../services/mockData';
import { MedicineBatch, SystemMetrics } from '../types';
import { shortenAddress } from '../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const THROUGHPUT_DATA = [
  { month: 'May', registered: 18, transferred: 29 },
  { month: 'Jun', registered: 24, transferred: 42 },
  { month: 'Jul', registered: 31, transferred: 58 },
  { month: 'Aug', registered: 28, transferred: 49 },
  { month: 'Sep', registered: 39, transferred: 64 },
  { month: 'Oct', registered: 45, transferred: 78 },
];

const COLD_CHAIN_TELEMETRY = [
  { time: '00:00', ideal: 4.0, sensor: 4.1 },
  { time: '04:00', ideal: 4.0, sensor: 4.3 },
  { time: '08:00', ideal: 4.0, sensor: 4.8 },
  { time: '12:00', ideal: 4.0, sensor: 5.2 },
  { time: '16:00', ideal: 4.0, sensor: 4.6 },
  { time: '20:00', ideal: 4.0, sensor: 4.2 },
];

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [isLiveChain, setIsLiveChain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics>(batchService.getMetrics());
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<MedicineBatch | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const conn = await blockchainService.validateConnection();
      if (conn.connected && conn.contractDeployed) {
        const onChainBatches = await blockchainService.getAllOnChainBatches();
        if (onChainBatches.length > 0) {
          setBatches(onChainBatches);
          setIsLiveChain(true);

          const totalBatches = onChainBatches.length;
          const activeInTransit = onChainBatches.filter((b) => b.status === 'In Transit').length;
          const recalled = onChainBatches.filter(
            (b) => b.status === 'Recalled' || b.status === 'Compromised'
          ).length;
          const totalTransfers = onChainBatches.reduce(
            (acc, curr) => acc + curr.transfers.length,
            0
          );

          setMetrics({
            totalBatches,
            activeInTransit,
            verifiedAuthenticityRate:
              totalBatches > 0 ? Number((((totalBatches - recalled) / totalBatches) * 100).toFixed(1)) : 100,
            coldChainIncidents: recalled,
            totalTransfers,
            averageBlockTime: '12.2s',
          });

          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error loading on-chain metrics:', err);
    }

    // Fallback to demo snapshot
    const mockBatches = batchService.getBatches();
    setBatches(mockBatches);
    setMetrics(batchService.getMetrics());
    setIsLiveChain(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const recentTransfers = batches
    .flatMap((b) => b.transfers.map((t) => ({ ...t, batchId: b.id, batchName: b.name })))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Command Center
            </h1>
            {isLiveChain ? (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                Live EVM Ledger
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold font-mono">
                Historical Demo View
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pharmaceutical authenticity metrics, cold-chain telemetry & ledger sync
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white bg-navy-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            title="Refresh metrics from chain"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/verify')}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-navy-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Public Verify</span>
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monitored Batches"
          value={metrics.totalBatches}
          change="+14% this mo"
          changeType="positive"
          subtext="Cryptographically sealed lots"
          icon={Boxes}
          iconColor="text-brand-400"
        />
        <KpiCard
          title="Active In-Transit"
          value={metrics.activeInTransit}
          change="3 in transit"
          changeType="neutral"
          subtext="En route between verified nodes"
          icon={Truck}
          iconColor="text-sky-400"
        />
        <KpiCard
          title="Ledger Custody Proof"
          value={`${metrics.verifiedAuthenticityRate}%`}
          change="Compliant"
          changeType="positive"
          subtext="Zero signature mismatch"
          icon={ShieldCheck}
          iconColor="text-emerald-400"
        />
        <KpiCard
          title="Cold-Chain Alerts"
          value={metrics.coldChainIncidents}
          change="1 Quarantined"
          changeType="negative"
          subtext="Thermal excursions tracked"
          icon={AlertTriangle}
          iconColor="text-amber-400"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custody Volume Bar & Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Custody Throughput</h3>
              <p className="text-xs text-slate-400">Genesis batch minting vs transit handover transactions</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-brand-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" /> Transferred
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Registered
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={THROUGHPUT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="transferredGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="registeredGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="transferred"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#transferredGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="registered"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#registeredGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cold-Chain Telemetry Radar / Mini Trend */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 shadow-sm backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Cold-Chain Profile</h3>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-brand-400">
                <Thermometer className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Biologic cold storage sample telemetry curve (2°C - 8°C safety envelope)
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={COLD_CHAIN_TELEMETRY} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 10]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Line type="monotone" dataKey="sensor" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ideal" stroke="#64748b" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs flex items-center justify-between">
            <span className="text-slate-400">Mean Excursion Rate:</span>
            <span className="font-mono font-medium text-emerald-400">0.02% / transit</span>
          </div>
        </div>
      </div>

      {/* Recent Ledger Transfers Table */}
      <div className="rounded-xl bg-navy-900/80 border border-slate-800/80 overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Latest Custody Transitions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified handovers recorded with cryptographic ECDSA signatures
            </p>
          </div>
          <button
            onClick={() => navigate('/batches')}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>View All Batches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/60 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Batch ID / Drug</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">To</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Temp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentTransfers.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-brand-300">{tx.batchId}</div>
                    <div className="text-[11px] text-slate-400">{tx.batchName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white truncate max-w-[140px]">{tx.fromName}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {shortenAddress(tx.fromAddress, 4)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white truncate max-w-[140px]">{tx.toName}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {shortenAddress(tx.toAddress, 4)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 truncate max-w-[120px]">
                    {tx.location}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        tx.isColdChainCompliant
                          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                          : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                      }`}
                    >
                      <Thermometer className="w-3 h-3" />
                      {tx.temperatureCelsius}°C
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/batches/${tx.batchId}`)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BatchRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onBatchCreated={() => {
          loadData();
        }}
      />

      <TransferModal
        isOpen={Boolean(transferTarget)}
        batch={transferTarget}
        onClose={() => setTransferTarget(null)}
        onTransferSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
