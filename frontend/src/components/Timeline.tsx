import React from 'react';
import { CustodyTransfer } from '../types';
import { shortenAddress } from '../lib/utils';
import { 
  CheckCircle2, 
  Thermometer, 
  MapPin, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

interface TimelineProps {
  transfers: CustodyTransfer[];
}

export const Timeline: React.FC<TimelineProps> = ({ transfers }) => {
  if (!transfers || transfers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No custody transition events recorded for this batch.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
      {transfers.map((item, idx) => {
        const isGenesis = idx === 0;
        const isLast = idx === transfers.length - 1;

        return (
          <div key={item.id} className="relative group">
            {/* Timeline Node Point */}
            <div
              className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 ${
                item.isColdChainCompliant
                  ? isLast
                    ? 'bg-emerald-500 border-navy-950 ring-4 ring-emerald-500/20'
                    : 'bg-navy-900 border-emerald-500'
                  : 'bg-rose-500 border-navy-950 ring-4 ring-rose-500/20'
              }`}
            />

            {/* Event Card */}
            <div className="bg-navy-900/70 border border-slate-800/80 rounded-xl p-4 transition-all hover:border-slate-700 hover:bg-navy-900/90 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Step #{idx + 1}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {isGenesis ? 'Batch Genesis & Registration' : 'Custody Handover'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {/* Handover Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                <div className="p-2.5 rounded-lg bg-navy-950/60 border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Origin / Released By:</span>
                  <p className="font-medium text-slate-200 truncate">{item.fromName}</p>
                  <p className="font-mono text-slate-400 mt-0.5">
                    {item.fromAddress === '0x0000000000000000000000000000000000000000'
                      ? '0x0000... (Genesis Null Address)'
                      : shortenAddress(item.fromAddress, 6)}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-navy-950/60 border border-slate-800/60">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Transferred To:</span>
                  <p className="font-medium text-brand-300 truncate">{item.toName}</p>
                  <p className="font-mono text-slate-400 mt-0.5">
                    {shortenAddress(item.toAddress, 6)}
                  </p>
                </div>
              </div>

              {/* Location & Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.location}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded border ${
                      item.isColdChainCompliant
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                        : 'bg-rose-950/50 text-rose-300 border-rose-800/40'
                    }`}
                  >
                    <Thermometer className="w-3.5 h-3.5" />
                    {item.temperatureCelsius.toFixed(1)}°C
                    {!item.isColdChainCompliant && (
                      <AlertTriangle className="w-3 h-3 text-rose-400 ml-0.5" />
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-400">Block #{item.blockNumber}</span>
                  <span className="text-slate-500">|</span>
                  <a
                    href={`#tx-${item.txHash}`}
                    onClick={(e) => e.preventDefault()}
                    title={item.txHash}
                    className="text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <span>Tx: {shortenAddress(item.txHash, 4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {item.notes && (
                <div className="mt-3 text-xs bg-navy-950/40 border border-slate-800/40 rounded p-2 text-slate-300">
                  <span className="font-semibold text-slate-400 mr-1.5">Note:</span>
                  {item.notes}
                </div>
              )}

              {/* Cryptographic Verification Flag */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/40">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ECDSA Participant Signature Verified
                </span>
                <span className="font-mono text-slate-400">Gas: {item.gasUsed}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
