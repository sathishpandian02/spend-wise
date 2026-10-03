import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('spendwise_token') || null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize auth state
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('spendwise_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (res.data.success) {
          setUser(res.data.user);
          // Check if onboarding is needed (e.g. fresh account with 0 monthly income)
          if (res.data.user.monthly_income === 0) {
            setShowOnboarding(true);
          }
        }
      } catch (err) {
        console.error('Session expired or error:', err);
        localStorage.removeItem('spendwise_token');
        localStorage.removeItem('spendwise_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('spendwise_token', receivedToken);
      localStorage.setItem('spendwise_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      if (receivedUser.monthly_income === 0) {
        setShowOnboarding(true);
      }
      return receivedUser;
    }
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('spendwise_token', receivedToken);
      localStorage.setItem('spendwise_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      // New user gets prompt for onboarding
      setShowOnboarding(true);
      return receivedUser;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('spendwise_token');
      localStorage.removeItem('spendwise_user');
      setUser(null);
      setToken(null);
      setShowOnboarding(false);
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('spendwise_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        showOnboarding,
        setShowOnboarding,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
