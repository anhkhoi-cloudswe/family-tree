import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          pointerEvents: 'none',
          maxWidth: '380px',
          width: 'calc(100vw - 2.5rem)',
        }}
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.1rem',
                borderRadius: '12px',
                background: isSuccess ? '#ecfdf5' : isError ? '#fff1f2' : '#ffffff',
                border: `1.5px solid ${isSuccess ? '#a7f3d0' : isError ? '#fecdd3' : '#e2e8f0'}`,
                color: isSuccess ? '#065f46' : isError ? '#9f1239' : '#0f172a',
                boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)',
                fontSize: '0.9rem',
                fontWeight: 600,
                lineHeight: 1.4,
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {isSuccess && <CheckCircle2 size={19} color="#059669" />}
                {isError && <AlertCircle size={19} color="#e11d48" />}
                {!isSuccess && !isError && <Info size={19} color="#2563eb" />}
              </div>
              <div style={{ flex: 1 }}>{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
