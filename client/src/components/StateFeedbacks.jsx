import React from 'react';
import { Loader2, AlertCircle, Inbox, Plus } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading financial data...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        color: 'var(--text-secondary)',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2
          size={24}
          color="var(--primary)"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'No Data Found', message, actionText, onAction }) {
  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
          color: 'var(--primary)',
        }}
      >
        <Icon size={26} />
      </div>
      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h4>
      {message && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: 1.5, marginBottom: actionText ? '20px' : '0' }}>
          {message}
        </p>
      )}
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          <Plus size={15} />
          {actionText}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message = 'An unexpected error occurred', onRetry }) {
  return (
    <div
      style={{
        background: 'var(--danger-light)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-text)', fontSize: '0.875rem' }}>
        <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
