import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Coins,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { savingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/StateFeedbacks';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SavingsGoals({ refreshTrigger }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [goals, setGoals] = useState([]);
  const [totalTarget, setTotalTarget] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create / Edit Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
  });

  // Add Money Modal State
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addMoneyTarget, setAddMoneyTarget] = useState(null);
  const [addedAmount, setAddedAmount] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await savingsService.getAll();
      if (res.data.success) {
        setGoals(res.data.goals || []);
        setTotalTarget(res.data.total_target || 0);
        setTotalSaved(res.data.total_saved || 0);
        setOverallProgress(res.data.overall_progress || 0);
      }
    } catch (err) {
      console.error('Error fetching savings goals:', err);
      setError('Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals, refreshTrigger]);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setGoalForm({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: '',
    });
    setIsGoalModalOpen(true);
  };

  const handleOpenEdit = (g) => {
    setEditingGoal(g);
    setGoalForm({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date ? g.target_date.split('T')[0] : '',
    });
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.target_amount) {
      addToast('Please provide a goal name and target amount', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      if (editingGoal) {
        await savingsService.update(editingGoal.id, goalForm);
        addToast('Savings goal updated', 'success');
      } else {
        await savingsService.create(goalForm);
        addToast('New savings goal created!', 'success');
      }

      setIsGoalModalOpen(false);
      fetchGoals();
    } catch (err) {
      console.error('Error saving goal:', err);
      addToast('Failed to save goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    const addNum = parseFloat(addedAmount);
    if (isNaN(addNum) || addNum <= 0) {
      addToast('Please enter a valid amount', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await savingsService.update(addMoneyTarget.id, { add_amount: addNum });

      const newTotal = addMoneyTarget.current_amount + addNum;
      if (newTotal >= addMoneyTarget.target_amount) {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {}
        addToast(`🎉 Congratulations! You achieved your "${addMoneyTarget.name}" goal!`, 'success', 6000);
      } else {
        addToast(`Added ${formatCurrency(addNum, user?.currency)} to "${addMoneyTarget.name}"!`, 'success');
      }

      setIsAddMoneyOpen(false);
      setAddedAmount('');
      setAddMoneyTarget(null);
      fetchGoals();
    } catch (err) {
      console.error('Error adding money:', err);
      addToast('Failed to add money', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await savingsService.delete(deleteTarget.id);
      addToast('Savings goal deleted', 'success');
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      addToast('Failed to delete goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PiggyBank size={28} color="var(--primary)" />
            Savings Goals
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
            Set targets, track progress, and celebrate milestones.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> New Savings Goal
        </button>
      </div>

      {/* Aggregate Overview Card */}
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
              Total Saved Towards Goals
            </span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-text)', marginTop: '4px' }}>
              {formatCurrency(totalSaved, user?.currency)}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cumulative Target</span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {formatCurrency(totalTarget, user?.currency)}{' '}
              <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                ({overallProgress}%)
              </span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', background: 'var(--bg-surface-hover)', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, overallProgress)}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
              borderRadius: '6px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Goals List */}
      {loading ? (
        <LoadingSpinner message="Loading savings goals..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchGoals} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No Savings Goals Created Yet"
          message="Set a savings target for an Emergency Fund, New Gadget, Vacation, or Major Milestone."
          actionText="Create Your First Goal"
          onAction={handleOpenCreate}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {goals.map((g) => (
            <div
              key={g.id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</h4>
                    {g.isCompleted && <span className="badge badge-safe">Completed 🎉</span>}
                  </div>
                  {g.target_date && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> Target: {formatDate(g.target_date)}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleOpenEdit(g)}
                    title="Edit Goal"
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget(g);
                      setIsDeleteOpen(true);
                    }}
                    title="Delete Goal"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress and Numbers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Saved: <strong style={{ color: 'var(--success-text)' }}>{formatCurrency(g.current_amount, user?.currency)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Target: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(g.target_amount, user?.currency)}</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '7px', background: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, g.progress)}%`,
                      background: g.isCompleted
                        ? 'var(--success)'
                        : 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span>{g.progress}% achieved</span>
                  <span>Remaining: {formatCurrency(g.remaining, user?.currency)}</span>
                </div>
              </div>

              {/* Quick Add Money Action */}
              <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => {
                    setAddMoneyTarget(g);
                    setAddedAmount('');
                    setIsAddMoneyOpen(true);
                  }}
                >
                  <Coins size={15} color="var(--primary)" />
                  Add Money to Goal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
        maxWidth="460px"
      >
        <form onSubmit={handleSaveGoal}>
          <div className="form-group">
            <label className="form-label">Goal Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Emergency Fund, New Laptop, Vacation"
              value={goalForm.name}
              onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Amount (₹) *</label>
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
                value={goalForm.target_amount}
                onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Current Saved Amount (₹)</label>
            <input
              type="number"
              step="50"
              className="form-input"
              placeholder="0.00"
              value={goalForm.current_amount}
              onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={goalForm.target_date}
              onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsGoalModalOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Money Modal */}
      <Modal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        title={`Add Funds to ${addMoneyTarget?.name || 'Goal'}`}
        maxWidth="400px"
      >
        <form onSubmit={handleAddMoney}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Currently Saved: <strong>{formatCurrency(addMoneyTarget?.current_amount || 0, user?.currency)}</strong> of {formatCurrency(addMoneyTarget?.target_amount || 0, user?.currency)}
          </p>

          <div className="form-group">
            <label className="form-label">Deposit Amount (₹) *</label>
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
                placeholder="e.g. 2000"
                value={addedAmount}
                onChange={(e) => setAddedAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddMoneyOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Depositing...' : 'Add Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteGoal}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete the "${deleteTarget?.name}" goal?`}
        confirmText="Delete Goal"
        loading={submitting}
      />
    </div>
  );
}
