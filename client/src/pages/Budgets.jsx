import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Wallet,
  Coins,
} from 'lucide-react';
import { budgetService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/StateFeedbacks';
import CategoryIcon from '../components/CategoryIcon';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Budgets({ refreshTrigger }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('');
  const [modalAmount, setModalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [bRes, cRes] = await Promise.all([
        budgetService.getAll({ month, year }),
        categoryService.getAll(),
      ]);

      if (bRes.data.success) {
        setBudgets(bRes.data.budgets || []);
        setTotalBudget(bRes.data.total_budget || 0);
        setTotalSpent(bRes.data.total_spent || 0);
      }
      if (cRes.data.success) {
        setCategories(cRes.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budget configuration.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshTrigger]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const num = parseFloat(modalAmount);
    if (isNaN(num) || num <= 0) {
      addToast('Please enter a valid positive budget amount', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await budgetService.createOrUpdate({
        category_id: modalCategory ? parseInt(modalCategory, 10) : null,
        month,
        year,
        amount: num,
      });

      addToast('Budget saved successfully!', 'success');
      setIsModalOpen(false);
      setModalAmount('');
      setModalCategory('');
      fetchBudgets();
    } catch (err) {
      console.error('Error saving budget:', err);
      addToast('Failed to save budget', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await budgetService.delete(deleteTarget.id);
      addToast('Budget removed', 'success');
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
      addToast('Failed to delete budget', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Exceeded':
        return <span className="badge badge-exceeded">Exceeded (100%+)</span>;
      case 'Critical':
        return <span className="badge badge-critical">Critical (90-99%)</span>;
      case 'Warning':
        return <span className="badge badge-warning">Warning (70-89%)</span>;
      case 'Safe':
      default:
        return <span className="badge badge-safe">Safe (&lt;70%)</span>;
    }
  };

  const overallBudget = budgets.find((b) => b.category_id === null);
  const categoryBudgets = budgets.filter((b) => b.category_id !== null);
  const overallSpentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100 * 10) / 10 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={28} color="var(--primary)" />
            Budget Management System
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
            Set monthly and category spending limits with real-time health alerts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '90px' }}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={() => {
              setModalCategory('');
              setModalAmount('');
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} /> Set Budget
          </button>
        </div>
      </div>

      {/* Monthly Overview Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Overall Monthly Budget
            </span>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formatCurrency(totalBudget, user?.currency)}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Outflow This Month</span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: overallSpentPct >= 100 ? 'var(--danger-text)' : 'var(--text-primary)', marginTop: '2px' }}>
              {formatCurrency(totalSpent, user?.currency)}{' '}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                ({overallSpentPct}%)
              </span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', background: 'var(--bg-surface-hover)', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, overallSpentPct)}%`,
              background:
                overallSpentPct >= 100
                  ? 'var(--danger)'
                  : overallSpentPct >= 90
                  ? '#f97316'
                  : overallSpentPct >= 70
                  ? 'var(--warning)'
                  : 'var(--primary)',
              borderRadius: '6px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Remaining: <strong style={{ color: 'var(--success-text)' }}>{formatCurrency(Math.max(0, totalBudget - totalSpent), user?.currency)}</strong>
          </span>
          {overallBudget && (
            <button
              onClick={() => {
                setModalCategory('');
                setModalAmount(overallBudget.amount);
                setIsModalOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.825rem' }}
            >
              Adjust Overall Limit
            </button>
          )}
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Category Spending Budgets
        </h4>

        {loading ? (
          <LoadingSpinner message="Calculating real-time budget usage..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchBudgets} />
        ) : categoryBudgets.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No Category Budgets Configured"
            message="Allocate spending caps for Food, Transport, Shopping, Bills, etc. to get automatic threshold alerts."
            actionText="Create Category Budget"
            onAction={() => {
              setModalCategory(categories[0]?.id || '');
              setModalAmount('');
              setIsModalOpen(true);
            }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {categoryBudgets.map((b) => (
              <div
                key={b.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: `${b.category_color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CategoryIcon name={b.category_name} icon={b.category_icon} size={20} color={b.category_color} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {b.category_name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Budget: {formatCurrency(b.amount, user?.currency)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setModalCategory(b.category_id);
                        setModalAmount(b.amount);
                        setIsModalOpen(true);
                      }}
                      title="Edit Budget"
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget(b);
                        setIsDeleteOpen(true);
                      }}
                      title="Delete Budget"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Spent: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(b.spent, user?.currency)}</strong>
                    </span>
                    <span style={{ fontWeight: 700, color: b.percentage >= 100 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                      {b.percentage}%
                    </span>
                  </div>
                  <div style={{ height: '7px', background: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, b.percentage)}%`,
                        background:
                          b.status === 'Exceeded'
                            ? 'var(--danger)'
                            : b.status === 'Critical'
                            ? '#f97316'
                            : b.status === 'Warning'
                            ? 'var(--warning)'
                            : 'var(--primary)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Remaining: <strong style={{ color: b.remaining > 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>{formatCurrency(b.remaining, user?.currency)}</strong>
                  </span>
                  {getStatusBadge(b.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Budget Limit"
        maxWidth="460px"
      >
        <form onSubmit={handleSaveBudget}>
          <div className="form-group">
            <label className="form-label">Scope</label>
            <select
              className="form-select"
              value={modalCategory}
              onChange={(e) => setModalCategory(e.target.value)}
            >
              <option value="">Overall Monthly Budget</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} Category
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Budget Limit (₹) *</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}
              >
                ₹
              </span>
              <input
                type="number"
                step="50"
                required
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '1.15rem', fontWeight: 600 }}
                placeholder="0.00"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteBudget}
        title="Remove Budget"
        message={`Are you sure you want to remove the budget for "${deleteTarget?.category_name}"?`}
        confirmText="Remove"
        loading={deleteLoading}
      />
    </div>
  );
}
