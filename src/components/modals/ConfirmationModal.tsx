import React from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {isLoading
            ? <LoaderCircle className="h-6 w-6 animate-spin" />
            : <AlertTriangle className="h-6 w-6" />}
        </div>
        <h2 id="confirmation-title" className="text-center text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {message}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {!isLoading && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onConfirm()}
            className="rounded-lg bg-[#0F2C59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b2348] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
