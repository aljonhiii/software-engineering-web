import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'kiosk' | 'account' | 'boolean';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'kiosk',
  size = 'sm',
}) => {
  const norm = String(status || '').toLowerCase();

  let badgeClasses = 'bg-neutral-100 text-neutral-700 border-neutral-200';
  let dotClasses = 'bg-neutral-400';
  let label = status || 'Unknown';

  if (type === 'kiosk') {
    if (norm === 'online') {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotClasses = 'bg-emerald-500';
      label = 'Online';
    } else if (norm === 'busy') {
      badgeClasses = 'bg-sky-50 text-sky-800 border-sky-200';
      dotClasses = 'bg-sky-500';
      label = 'In Use';
    } else if (norm === 'maintenance') {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClasses = 'bg-amber-500';
      label = 'Maintenance';
    } else if (norm === 'error') {
      badgeClasses = 'bg-rose-50 text-rose-800 border-rose-200';
      dotClasses = 'bg-rose-500';
      label = 'Error';
    } else {
      badgeClasses = 'bg-neutral-100 text-neutral-600 border-neutral-200';
      dotClasses = 'bg-neutral-400';
      label = 'Offline';
    }
  } else if (type === 'account') {
    if (norm === 'active') {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotClasses = 'bg-emerald-500';
      label = 'Active';
    } else if (norm === 'invited') {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClasses = 'bg-amber-500';
      label = 'Invited';
    } else {
      badgeClasses = 'bg-neutral-100 text-neutral-600 border-neutral-200';
      dotClasses = 'bg-neutral-400';
      label = 'Deactivated';
    }
  }

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs font-medium'
      : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${badgeClasses} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses}`} />
      {label}
    </span>
  );
};
