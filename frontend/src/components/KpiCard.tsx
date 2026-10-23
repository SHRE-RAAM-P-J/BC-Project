import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  subtext,
  icon: Icon,
  iconColor = 'text-brand-400',
}) => {
  return (
    <div className="relative group p-5 rounded-xl bg-navy-900/80 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 shadow-sm hover:shadow-brand-500/5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('p-2 rounded-lg bg-navy-800/60 border border-slate-700/50', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              changeType === 'positive' && 'text-emerald-400 bg-emerald-950/60',
              changeType === 'negative' && 'text-rose-400 bg-rose-950/60',
              changeType === 'neutral' && 'text-slate-400 bg-slate-800/60'
            )}
          >
            {change}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-400 truncate">
          {subtext}
        </p>
      )}

      {/* Subtle hover gradient indicator line */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
