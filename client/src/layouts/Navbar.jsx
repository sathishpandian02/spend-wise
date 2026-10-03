import React, { useState } from 'react';
import { Menu, Plus, ArrowDownLeft, Bell, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getGreeting } from '../utils/formatters';

export default function Navbar({ onOpenExpense, onOpenIncome, setIsMobileOpen }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'SpendWise Active', text: 'Your financial data is synced and up-to-date.', type: 'info' },
  ];

  const getUserInitial = () => {
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  const displayName = user?.username || 'User';

  return (
    <header
      className="app-navbar"
      style={{
        height: 'var(--navbar-height, 64px)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-navbar)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 40,
        gap: '16px',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Left: Mobile hamburger & welcome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="btn btn-ghost btn-icon show-mobile-only"
          style={{ padding: '8px', display: 'none', flexShrink: 0 }}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Show on mobile */}
        <style>{`
          @media (max-width: 992px) {
            .show-mobile-only { display: flex !important; }
          }
        `}</style>

        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {getGreeting()},{' '}
            <span className="gradient-text" style={{ fontWeight: 800 }}>
              {displayName}
            </span>
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
            Financial Command Center
          </p>
        </div>
      </div>

      {/* Right: Theme Toggle, Quick Actions & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? 'Switch to Bright Light Mode' : 'Switch to Pure Black Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun size={15} color="#fbbf24" />
              <span className="hide-mobile" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Light</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#10b981" />
              <span className="hide-mobile" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Dark</span>
            </>
          )}
        </button>

        {/* Quick Income Button */}
        <button
          className="btn btn-success btn-sm"
          onClick={onOpenIncome}
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <ArrowDownLeft size={14} />
          <span className="hide-mobile">Income</span>
        </button>

        {/* Quick Expense Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenExpense}
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <Plus size={14} />
          <span className="hide-mobile">Expense</span>
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '7px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
              }}
            />
          </button>

          {showNotifications && (
            <div
              className="glass-panel animate-fade-in"
              style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                width: '280px',
                padding: '14px',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h5>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={13} />
                </button>
              </div>

              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '6px',
                  }}
                >
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
          }}
        >
          {getUserInitial()}
        </div>
      </div>
    </header>
  );
}
