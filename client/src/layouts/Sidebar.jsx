import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CalendarRange,
  PieChart,
  PiggyBank,
  Receipt,
  FileText,
  User,
  LogOut,
  Wallet,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function Sidebar({ currentPath, onNavigate, isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth();

  const navSections = [
    {
      label: 'Overview',
      items: [
        { id: '/', label: 'Dashboard', icon: LayoutDashboard },
        { id: '/transactions', label: 'Transactions', icon: Receipt },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { id: '/weekly', label: 'Weekly Analysis', icon: CalendarDays },
        { id: '/monthly', label: 'Monthly Overview', icon: Calendar },
        { id: '/yearly', label: 'Yearly Overview', icon: CalendarRange },
      ],
    },
    {
      label: 'Finance',
      items: [
        { id: '/budgets', label: 'Budgets', icon: PieChart },
        { id: '/savings', label: 'Savings Goals', icon: PiggyBank },
        { id: '/reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      label: 'Account',
      items: [
        { id: '/profile', label: 'Profile & Settings', icon: User },
      ],
    },
  ];

  const handleItemClick = (path) => {
    onNavigate(path);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const getUserInitial = () => {
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-modal-backdrop)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 90,
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      <aside
        className="app-sidebar"
        style={{
          width: 'var(--sidebar-width, 264px)',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, border-color 0.25s ease',
          transform: isMobileOpen || (typeof window !== 'undefined' && window.innerWidth > 992) ? 'translateX(0)' : 'translateX(-100%)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '20px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Wallet size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Spend<span className="gradient-text">Wise</span>
              </h2>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em', marginTop: '2px' }}>
                FINANCE COMMAND CENTER
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              style={{
                background: 'var(--bg-surface-hover)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 16px' }} />

        {/* Navigation Sections */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: '8px' }}>
              <p
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  padding: '8px 14px 6px',
                  letterSpacing: '0.08em',
                }}
              >
                {section.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 14px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                        border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '3px',
                            height: '18px',
                            borderRadius: '0 3px 3px 0',
                            background: 'var(--primary)',
                          }}
                        />
                      )}
                      <Icon
                        size={17}
                        color={isActive ? 'var(--primary)' : 'var(--text-secondary)'}
                        style={{ transition: 'color 0.15s', flexShrink: 0 }}
                      />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <ChevronRight size={14} color="var(--primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card at Bottom */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}
        >
          {/* Income indicator */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Monthly Income</span>
            <span style={{ color: 'var(--success-text)', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
              {formatCurrency(user?.monthly_income || 0, user?.currency)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                {getUserInitial()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.username || 'User'}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Welcome'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: 'var(--danger)',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
