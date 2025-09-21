'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useToast, ToastContainer } from '@/components/ui/toast';

interface ToastContextType {
  success: (_title: string, _message?: string, _duration?: number) => void;
  error: (_title: string, _message?: string, _duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, success, error, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
