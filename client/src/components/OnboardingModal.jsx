import React, { useState } from 'react';
import Modal from './Modal';
import { profileService, savingsService, budgetService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnboardingModal({ isOpen, onClose }) {
  const { user, updateUser, setShowOnboarding } = useAuth();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    monthly_income: user?.monthly_income || '',
    monthly_budget: user?.monthly_budget || '',
    savings_goal: '',
    savings_target: user?.savings_target || '',
    currency: 'INR',
  });

  const handleSave = async (e) => {
    e.preventDefault();

    const incomeNum = parseFloat(formData.monthly_income) || 0;
    const budgetNum = parseFloat(formData.monthly_budget) || (incomeNum > 0 ? incomeNum * 0.8 : 0);
    const savingsTargetNum = parseFloat(formData.savings_target) || (incomeNum > 0 ? incomeNum * 0.2 : 0);

    try {
      setSubmitting(true);

      // 1. Update user profile & settings
      await profileService.update({
        monthly_income: incomeNum,
        monthly_budget: budgetNum,
        savings_target: savingsTargetNum,
        currency: formData.currency,
      });

      // 2. Set monthly budget if specified
      if (budgetNum > 0) {
        const now = new Date();
        await budgetService.createOrUpdate({
          category_id: null,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          amount: budgetNum,
        });
      }

      // 3. Create initial savings goal if specified
      if (formData.savings_goal && savingsTargetNum > 0) {
        await savingsService.create({
          name: formData.savings_goal,
          target_amount: savingsTargetNum,
          current_amount: 0,
        });
      }

      updateUser({
        monthly_income: incomeNum,
        monthly_budget: budgetNum,
        savings_target: savingsTargetNum,
        currency: formData.currency,
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      addToast('Profile setup complete! Welcome to SpendWise.', 'success');
      setShowOnboarding(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving onboarding info:', err);
      addToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setShowOnboarding(false)} title="Welcome to SpendWise! 👋" maxWidth="560px">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--primary)',
          }}
        >
          <Sparkles size={26} />
        </div>
        <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Personalize Your Financial Dashboard
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Let's tailor your budget, surplus calculation, and savings projections.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Monthly Income */}
        <div className="form-group">
          <label className="form-label">What is your Monthly Income? *</label>
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
              step="100"
              required
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '1.15rem', fontWeight: 600 }}
              placeholder="e.g. 25000"
              value={formData.monthly_income}
              onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        {/* Monthly Budget & Savings Goal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Monthly Budget (Optional)</label>
            <input
              type="number"
              step="100"
              className="form-input"
              placeholder="e.g. 20000"
              value={formData.monthly_budget}
              onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Savings Target (Optional)</label>
            <input
              type="number"
              step="100"
              className="form-input"
              placeholder="e.g. 5000"
              value={formData.savings_target}
              onChange={(e) => setFormData({ ...formData, savings_target: e.target.value })}
            />
          </div>
        </div>

        {/* Savings Goal Name */}
        <div className="form-group">
          <label className="form-label">Primary Savings Goal (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Emergency Fund, New Laptop, Vacation"
            value={formData.savings_goal}
            onChange={(e) => setFormData({ ...formData, savings_goal: e.target.value })}
          />
        </div>

        {/* Currency */}
        <div className="form-group">
          <label className="form-label">Preferred Currency</label>
          <select
            className="form-select"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="INR">₹ INR (Indian Rupee)</option>
            <option value="USD">$ USD (US Dollar)</option>
            <option value="EUR">€ EUR (Euro)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowOnboarding(false)}
            disabled={submitting}
          >
            Skip for now
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Setting up...
              </>
            ) : (
              <>
                Continue to Dashboard <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
