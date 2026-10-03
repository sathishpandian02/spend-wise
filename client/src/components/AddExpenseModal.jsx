import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { expenseService, categoryService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Check, Loader2 } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: '',
  });

  const paymentMethods = ['UPI', 'Debit Card', 'Credit Card', 'Cash', 'Bank Transfer', 'Other'];

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCats(true);
        const res = await categoryService.getAll();
        if (res.data.success) {
          setCategories(res.data.categories);
          if (!formData.category_id && res.data.categories.length > 0) {
            setFormData((prev) => ({ ...prev, category_id: res.data.categories[0].id }));
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCats(false);
      }
    }

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Set initial form data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || '',
        description: initialData.description || '',
        category_id: initialData.category_id || '',
        expense_date: initialData.expense_date ? initialData.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: initialData.payment_method || 'UPI',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        amount: '',
        description: '',
        category_id: categories[0]?.id || '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'UPI',
        notes: '',
      });
    }
  }, [initialData, isOpen, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description || !formData.category_id || !formData.expense_date) {
      addToast('Please fill in all required fields (Amount, Description, Category, Date)', 'warning');
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
        await expenseService.update(initialData.id, formData);
        addToast('Expense updated successfully!', 'success');
      } else {
        await expenseService.create(formData);
        addToast('Expense recorded successfully!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      addToast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Expense Record' : 'Record New Expense'}
      maxWidth="520px"
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
                color: 'var(--primary)',
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

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Expense Description *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Grocery shopping, Metro card recharge"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Category & Payment Method Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              required
              className="form-select"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              {loadingCats && <option>Loading categories...</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="form-select"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              {paymentMethods.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Expense Date *</label>
          <input
            type="date"
            required
            className="form-input"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Add any extra detail or bill remarks..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : initialData ? (
              <>
                <Check size={16} /> Update Expense
              </>
            ) : (
              <>
                <Plus size={16} /> Add Expense
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
