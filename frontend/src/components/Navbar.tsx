import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { shortenAddress } from '../lib/utils';
import { useToast } from './Toast';
import { blockchainService, HARDHAT_DEV_ACCOUNTS } from '../services/blockchain';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [chainStatus, setChainStatus] = useState<{
    connected: boolean;
    chainId: number | null;
    latestBlock: number | null;
    contractDeployed: boolean;
    contractAddress: string;
    error: string | null;
  } | null>(null);

  const checkChain = async () => {
    const status = await blockchainService.validateConnection();
    setChainStatus(status);
  };

  useEffect(() => {
    checkChain();
    const interval = setInterval(checkChain, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeAccount = HARDHAT_DEV_ACCOUNTS[activeAccountIndex] || HARDHAT_DEV_ACCOUNTS[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/verify?batchId=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectAccount = (idx: number) => {
    setActiveAccountIndex(idx);
    blockchainService.setActiveAccountIndex(idx);
    setIsWalletModalOpen(false);
    addToast(
      'info',
      'Signer Switched',
      `Active signing wallet set to: ${HARDHAT_DEV_ACCOUNTS[idx].name}`
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-navy-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Quick Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Batch ID (e.g. MC-2024-8849) or NDC..."
              className="w-full pl-9 pr-4 py-1.5 bg-navy-950/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
            />
          </form>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Network Status Pill */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              chainStatus?.connected && chainStatus?.contractDeployed
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                chainStatus?.connected && chainStatus?.contractDeployed
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span>
              {chainStatus?.connected && chainStatus?.contractDeployed
                ? `EVM Localnet #${chainStatus.latestBlock || 0}`
                : 'Node Offline (Demo Mode)'}
            </span>
          </button>

          {/* Wallet Address & Signer Switcher */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950/80 hover:bg-slate-800/80 border border-slate-700/70 transition-all group"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-mono text-slate-300 font-medium">
                {shortenAddress(activeAccount.address, 4)}
              </span>
              <span className="text-[9px] text-brand-400 uppercase tracking-wider font-semibold">
                {activeAccount.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors ml-0.5" />
          </button>
        </div>
      </header>

      {/* Wallet & Connection Diagnostics Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsWalletModalOpen(false)}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-navy-900 border border-slate-700 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-400" />
                <h3 className="text-sm font-semibold text-white">Blockchain & Signer Console</h3>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Network Diagnostic Card */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hardhat Node Status:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    chainStatus?.connected ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {chainStatus?.connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected (Chain 31337)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> Offline / Standalone
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">MediChain Contract:</span>
                <span className="font-mono text-[11px] text-brand-300">
                  {shortenAddress(blockchainService.getContractAddress(), 6)}
                </span>
              </div>

              {chainStatus && !chainStatus.connected && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-amber-300 font-semibold block mb-0.5">To connect persistent node:</span>
                  <code className="text-brand-300 block bg-black/40 p-1.5 rounded font-mono">
                    Terminal 1: npm run node<br />
                    Terminal 2: npm run deploy:local
                  </code>
                </div>
              )}
            </div>

            {/* Signer Switcher */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider text-[10px]">
                Switch Active Signer Role
              </span>
              <div className="space-y-1.5">
                {HARDHAT_DEV_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={acc.address}
                    onClick={() => handleSelectAccount(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      activeAccountIndex === idx
                        ? 'bg-brand-500/15 border-brand-500/40 text-brand-200'
                        : 'bg-navy-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">{acc.name}</p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {shortenAddress(acc.address, 6)}
                      </p>
                    </div>
                    {activeAccountIndex === idx && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-500 text-white rounded">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
