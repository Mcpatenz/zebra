import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  dotOnly?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  dotOnly = false,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { dot: 'bg-emerald-600', text: 'text-emerald-800' };
      case 'warning':
        return { dot: 'bg-amber-500', text: 'text-amber-800' };
      case 'danger':
        return { dot: 'bg-rose-600', text: 'text-rose-800' };
      case 'info':
        return { dot: 'bg-blue-600', text: 'text-blue-800' };
      default:
        return { dot: 'bg-slate-400', text: 'text-slate-700' };
    }
  };

  const { dot, text } = getColors();

  if (dotOnly) {
    return <span className={`inline-block w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text} tracking-tight`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
