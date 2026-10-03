import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Wallet, Lock, User, ArrowRight, Loader2, Sparkles, Eye, EyeOff, Sun, Moon, Play } from 'lucide-react';

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getErrorMessage = (err) => {
    if (!err.response || err.code === 'ERR_NETWORK') {
      return 'Unable to connect to server. Please try again.';
    }
    if (err.response.status === 401) {
      return 'Invalid User ID or Password';
    }
    return err.response.data?.message || 'An error occurred. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both User ID and Password');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(username.trim(), password);
      addToast('Welcome back to SpendWise!', 'success');
      onNavigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsername('demo_user');
    setPassword('Demo@123');
    setErrorMsg('');
  };

  const handleQuickDemoLogin = async () => {
    try {
      setDemoLoading(true);
      setErrorMsg('');
      setUsername('demo_user');
      setPassword('Demo@123');
      await login('demo_user', 'Demo@123');
      addToast('Logged in successfully as Demo User!', 'success');
      onNavigate('/');
    } catch (err) {
      console.error('Quick demo login error:', err);
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setDemoLoading(false);
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
          maxWidth: '440px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Wallet size={28} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Spend<span className="gradient-text">Wise</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
            Track smarter. Spend better. Save more.
          </p>
        </div>

        {/* Login Card */}
        <div
          className="glass-panel"
          style={{
            padding: '32px 28px',
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Demo Account Banner */}
          <div
            style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--border-glow)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Demo Account: </span>
                  <code style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>demo_user</code>
                  {' / '}
                  <code style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Demo@123</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                id="demo-fill-btn"
                onClick={handleDemoFill}
                className="btn btn-xs btn-secondary"
                style={{
                  flex: 1,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  borderColor: 'var(--border-glow)',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                Fill
              </button>
              <button
                type="button"
                id="demo-quick-login-btn"
                onClick={handleQuickDemoLogin}
                className="btn btn-xs btn-primary"
                disabled={loading || demoLoading}
                style={{
                  flex: 1,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {demoLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Logging in...
                  </>
                ) : (
                  <>
                    <Play size={13} /> Login as Demo
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              id="login-error-message"
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
            {/* User ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Username / User ID</label>
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
                  id="login-username"
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
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
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px',
                fontSize: '0.82rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                />
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: '0.95rem', fontWeight: 700 }}
              disabled={loading || demoLoading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Login to SpendWise <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Create Account link */}
          <div style={{ textAlign: 'center', marginTop: '22px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Don't have an account?{' '}
              <button
                id="create-account-link"
                onClick={() => onNavigate('/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
