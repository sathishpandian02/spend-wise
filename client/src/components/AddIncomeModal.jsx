import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { incomeService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Check, Loader2 } from 'lucide-react';

export default function AddIncomeModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    source: 'Salary',
    income_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const incomeSources = ['Salary', 'Freelance', 'Business', 'Bonus', 'Investment', 'Other'];

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || '',
        source: initialData.source || 'Salary',
        income_date: initialData.income_date ? initialData.income_date.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        amount: '',
        source: 'Salary',
        income_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.source || !formData.income_date) {
      addToast('Please provide source, amount, and date', 'warning');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addToast('Amount must be greater than zero', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      if (initialData && initialData.id) {
        await incomeService.update(initialData.id, formData);
        addToast('Income entry updated successfully!', 'success');
      } else {
        await incomeService.create(formData);
        addToast('Income credited successfully!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving income:', err);
      addToast(err.response?.data?.message || 'Failed to record income', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Income Entry' : 'Record Additional Income'}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Amount (₹) *</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#10b981',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}
            >
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '1.2rem', fontWeight: 600 }}
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        {/* Source */}
        <div className="form-group">
          <label className="form-label">Income Source *</label>
          <select
            className="form-select"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          >
            {incomeSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Income Date *</label>
          <input
            type="date"
            required
            className="form-input"
            value={formData.income_date}
            onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="e.g. Q3 performance bonus, consulting invoice #104"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : initialData ? (
              <>
                <Check size={16} /> Update Income
              </>
            ) : (
              <>
                <Plus size={16} /> Record Income
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
