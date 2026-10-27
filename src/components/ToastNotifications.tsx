import React, { useEffect } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastNotificationsProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const ToastNotifications: React.FC<ToastNotificationsProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? XCircle : Info;
  const colors = toast.kind === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100'
    : toast.kind === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/90 dark:text-rose-100'
      : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/90 dark:text-blue-100';

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex justify-center sm:inset-x-auto sm:right-6 sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))]">
      <div role="status" className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${colors}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <span className="flex-1 leading-relaxed">{toast.message}</span>
        <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
