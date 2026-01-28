'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { Toast, ToastContainer } from '@/components/ui/Toast';

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const shownAlerts = useRef<Set<string>>(new Set());

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Deduplicate budget alerts in same session
    const alertKey = `${toast.type}-${toast.message}`;
    if (shownAlerts.current.has(alertKey)) {
      return;
    }
    shownAlerts.current.add(alertKey);

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
