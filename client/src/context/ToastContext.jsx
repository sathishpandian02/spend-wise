import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container floating at top-right */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => {
          let bg = 'rgba(17, 24, 39, 0.95)';
          let border = 'rgba(255, 255, 255, 0.1)';
          let icon = <Info size={20} color="#3b82f6" />;

          if (toast.type === 'success') {
            border = 'rgba(16, 185, 129, 0.4)';
            icon = <CheckCircle2 size={20} color="#10b981" />;
          } else if (toast.type === 'error') {
            border = 'rgba(239, 68, 68, 0.4)';
            icon = <XCircle size={20} color="#ef4444" />;
          } else if (toast.type === 'warning') {
            border = 'rgba(245, 158, 11, 0.4)';
            icon = <AlertTriangle size={20} color="#f59e0b" />;
          }

          return (
            <div
              key={toast.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                background: bg,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {icon}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
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
