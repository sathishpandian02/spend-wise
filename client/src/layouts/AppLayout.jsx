import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AddExpenseModal from '../components/AddExpenseModal';
import AddIncomeModal from '../components/AddIncomeModal';
import OnboardingModal from '../components/OnboardingModal';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ currentPath, onNavigate, refreshKey, triggerRefresh, children }) {
  const { showOnboarding } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-primary, #060a13)' }}>
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: window.innerWidth > 992 ? 'var(--sidebar-width, 264px)' : 0,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="main-viewport"
      >
        <Navbar
          onOpenExpense={() => setIsExpenseOpen(true)}
          onOpenIncome={() => setIsIncomeOpen(true)}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main style={{
          padding: '24px 20px',
          flex: 1,
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={triggerRefresh}
      />

      <AddIncomeModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        onSuccess={triggerRefresh}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={triggerRefresh}
      />

      <style>{`
        @media (max-width: 992px) {
          .main-viewport {
            margin-left: 0 !important;
          }
        }
        @media (min-width: 993px) and (max-width: 1200px) {
          main {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
