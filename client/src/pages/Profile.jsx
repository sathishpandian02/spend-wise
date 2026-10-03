import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Wallet,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import { profileService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner, ErrorBanner } from '../components/StateFeedbacks';

export default function Profile({ refreshTrigger }) {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // General Form
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [currency, setCurrency] = useState('INR');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await profileService.get();
      if (res.data.success) {
        const p = res.data.profile;
        setProfile(p);
        setName(p.name);
        setMonthlyIncome(p.monthly_income);
        setMonthlyBudget(p.monthly_budget);
        setSavingsTarget(p.savings_target);
        setCurrency(p.currency);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [refreshTrigger]);

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    try {
      setSavingGeneral(true);
      const numIncome = parseFloat(monthlyIncome) || 0;
      const numBudget = parseFloat(monthlyBudget) || 0;
      const numTarget = parseFloat(savingsTarget) || 0;

      await profileService.update({
        name,
        monthly_income: numIncome,
        monthly_budget: numBudget,
        savings_target: numTarget,
        currency,
      });

      updateUser({
        name,
        monthly_income: numIncome,
        monthly_budget: numBudget,
        savings_target: numTarget,
        currency,
      });

      addToast('Profile updated successfully!', 'success');
      fetchProfile();
    } catch (err) {
      console.error('Profile update error:', err);
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast('Please enter both current and new password', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    try {
      setSavingPassword(true);
      await profileService.update({
        currentPassword,
        newPassword,
      });

      addToast('Security password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password update error:', err);
      addToast(err.response?.data?.message || 'Current password incorrect', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading && !profile) {
    return <LoadingSpinner message="Loading account security and profile..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchProfile} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={28} color="var(--primary)" />
          Account & Profile Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
          Manage your personal identity, financial parameters, and account security.
        </p>
      </div>

      {/* Account Info Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            User ID (Permanent)
          </span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {profile?.username}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Used for authentication
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Member Since
          </span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatDate(profile?.created_at)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Account registration date
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Expenses Logged
          </span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {profile?.total_expenses_recorded} records
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            In database
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Savings Goals
          </span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {profile?.active_goals_count} goals
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Currently tracked
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {/* General Financial Details Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="var(--primary)" />
            Personal & Financial Baseline
          </h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            Adjust your monthly baseline income and targets.
          </p>

          <form onSubmit={handleUpdateGeneral}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Base Monthly Income (₹)</label>
              <input
                type="number"
                step="100"
                min="0"
                required
                className="form-input"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Used in calculating surplus, remaining money, and monthly trends.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Monthly Budget (₹)</label>
                <input
                  type="number"
                  step="100"
                  className="form-input"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Savings Target (₹)</label>
                <input
                  type="number"
                  step="100"
                  className="form-input"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <select
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              disabled={savingGeneral}
            >
              {savingGeneral ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Profile Settings
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Security Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} color="var(--warning)" />
            Security & Password
          </h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            Ensure your account is protected with a secure password.
          </p>

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ marginTop: '8px', border: '1px solid var(--warning)', color: 'var(--warning)' }}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Shield size={16} /> Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
