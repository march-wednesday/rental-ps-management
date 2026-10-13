// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - STAT CARD COMPONENT
// ==============================================================================

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  glowColor?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  glowColor = 'purple',
  onClick,
}) => {
  const glowStyles = {
    purple: 'hover:border-purple-500/40 hover:shadow-purple-950/20',
    blue: 'hover:border-blue-500/40 hover:shadow-blue-950/20',
    emerald: 'hover:border-emerald-500/40 hover:shadow-emerald-950/20',
    amber: 'hover:border-amber-500/40 hover:shadow-amber-950/20',
    rose: 'hover:border-rose-500/40 hover:shadow-rose-950/20',
  };

  const iconBgStyles = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl border border-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${glowStyles[glowColor]} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border ${iconBgStyles[glowColor]}`}>{icon}</div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center text-xs">
          <span
            className={`font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
