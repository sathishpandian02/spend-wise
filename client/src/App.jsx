import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WeeklyAnalysis from './pages/WeeklyAnalysis';
import MonthlyAnalysis from './pages/MonthlyAnalysis';
import YearlyAnalysis from './pages/YearlyAnalysis';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import SavingsGoals from './pages/SavingsGoals';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import { LoadingSpinner } from './components/StateFeedbacks';

function MainRouter() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <LoadingSpinner message="Authenticating session with SpendWise server..." />
      </div>
    );
  }

  // If NOT authenticated
  if (!isAuthenticated) {
    if (currentPath === '/register') {
      return <Register onNavigate={navigate} />;
    }
    return <Login onNavigate={navigate} />;
  }

  // If authenticated and on auth pages, redirect to dashboard
  if (currentPath === '/login' || currentPath === '/register') {
    window.history.replaceState({}, '', '/');
  }

  // Route resolver for authenticated user
  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/transactions':
        return <Transactions refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/weekly':
        return <WeeklyAnalysis refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/monthly':
        return <MonthlyAnalysis refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/yearly':
        return <YearlyAnalysis refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/budgets':
        return <Budgets refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/savings':
        return <SavingsGoals refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/reports':
        return <Reports refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/profile':
        return <Profile refreshTrigger={refreshKey} onNavigate={navigate} />;
      case '/':
      default:
        return <Dashboard refreshTrigger={refreshKey} onNavigate={navigate} />;
    }
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={navigate}
      refreshKey={refreshKey}
      triggerRefresh={triggerRefresh}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainRouter />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

