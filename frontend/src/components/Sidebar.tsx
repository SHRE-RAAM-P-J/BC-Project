import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Cpu, 
  QrCode, 
  ShieldCheck, 
  Activity, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const navItems = [
    {
      label: 'Command Center',
      path: '/',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      label: 'Medicine Batches',
      path: '/batches',
      icon: Boxes,
      badge: null,
    },
    {
      label: 'Blockchain Explorer',
      path: '/explorer',
      icon: Cpu,
      badge: 'EVM',
    },
    {
      label: 'Public Verification',
      path: '/verify',
      icon: QrCode,
      badge: 'Patient',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and Brand Title */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-navy-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-mono">MediChain</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-sans">
              Pharma Provenance Ledger
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          <div>
            <span className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              System Console
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors',
                              isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                            )}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider',
                              isActive
                                ? 'bg-brand-400/20 text-brand-300'
                                : 'bg-slate-800 text-slate-400'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Academic Project Metadata */}
          <div className="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Activity className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              <span>Capstone Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dual-layer integrity model: Ethereum smart contract state logs for ownership & MongoDB for analytical metadata.
            </p>
          </div>
        </div>

        {/* Node & Network Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Network State</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Hardhat Local #31337
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Sync Latency:</span>
            <span className="text-slate-300">0.4 ms</span>
          </div>
        </div>
      </aside>
    </>
  );
};
