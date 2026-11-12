import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const btnColors =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-neutral-950 hover:bg-neutral-800 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-neutral-950">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-xs font-medium transition disabled:opacity-50 ${btnColors}`}
          >
            {loading ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
