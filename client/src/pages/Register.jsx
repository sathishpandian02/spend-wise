import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Wallet, Lock, User, ArrowRight, Loader2, Eye, EyeOff, UserPlus, Sun, Moon } from 'lucide-react';

export default function Register({ onNavigate }) {
  const { register } = useAuth();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    monthly_income: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.username || !formData.password || !formData.confirmPassword) {
      setErrorMsg('Please complete all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        monthly_income: parseFloat(formData.monthly_income) || 0,
      });

      addToast('Registration successful! Welcome to SpendWise.', 'success');
      onNavigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* Top right theme toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? 'Switch to Bright Light Mode' : 'Switch to Pure Black Dark Mode'}
        >
          {isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#10b981" />}
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            }}
          >
            <UserPlus size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
            Begin tracking smarter and saving more today.
          </p>
        </div>

        {/* Register Card */}
        <div
          className="glass-panel"
          style={{
            padding: '28px 24px',
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {errorMsg && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--danger-text)',
                fontSize: '0.82rem',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>

            {/* User ID */}
            <div className="form-group">
              <label className="form-label">Unique Username *</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Must be unique. You will use this to log in.
              </p>
            </div>

            {/* Base Monthly Income */}
            <div className="form-group">
              <label className="form-label">Monthly Income (₹)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="e.g. 25000"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Can be updated anytime in Profile settings.
              </p>
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Min 6 chars"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Repeat"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            {/* Show password toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: '13px', height: '13px' }}
              />
              Show passwords
            </label>

            {/* Register Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: '0.95rem', fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Existing account link */}
          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
