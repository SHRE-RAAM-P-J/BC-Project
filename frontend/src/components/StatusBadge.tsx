import React from 'react';
import { BatchStatus } from '../types';
import { cn } from '../lib/utils';
import { ShieldCheck, Truck, CheckCircle2, Clock, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  status: BatchStatus;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const getStatusConfig = (status: BatchStatus) => {
    switch (status) {
      case 'Registered':
        return {
          bg: 'bg-emerald-950/60',
          text: 'text-emerald-300',
          border: 'border-emerald-700/50',
          dot: 'bg-emerald-400',
          icon: Clock,
          label: 'Genesis Registered',
        };
      case 'In Transit':
        return {
          bg: 'bg-sky-950/60',
          text: 'text-sky-300',
          border: 'border-sky-700/50',
          dot: 'bg-sky-400 animate-pulse',
          icon: Truck,
          label: 'In Transit',
        };
      case 'Delivered':
        return {
          bg: 'bg-teal-950/60',
          text: 'text-teal-300',
          border: 'border-teal-700/50',
          dot: 'bg-teal-400',
          icon: ShieldCheck,
          label: 'Delivered',
        };
      case 'Dispensed':
        return {
          bg: 'bg-indigo-950/60',
          text: 'text-indigo-300',
          border: 'border-indigo-700/50',
          dot: 'bg-indigo-400',
          icon: CheckCircle2,
          label: 'Dispensed to Patient',
        };
      case 'Recalled':
        return {
          bg: 'bg-rose-950/60',
          text: 'text-rose-300',
          border: 'border-rose-700/50',
          dot: 'bg-rose-400',
          icon: AlertOctagon,
          label: 'Recalled',
        };
      case 'Compromised':
        return {
          bg: 'bg-amber-950/60',
          text: 'text-amber-300',
          border: 'border-amber-700/50',
          dot: 'bg-amber-400',
          icon: AlertTriangle,
          label: 'Temp Excursion Alert',
        };
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-300',
          border: 'border-slate-700',
          dot: 'bg-slate-400',
          icon: Clock,
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm backdrop-blur-sm transition-all',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span>{config.label}</span>
    </span>
  );
};
