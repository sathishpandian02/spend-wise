import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Wallet,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner, ErrorBanner } from '../components/StateFeedbacks';

export default function Reports({ refreshTrigger }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const currentDate = new Date();

  const [reportType, setReportType] = useState('monthly'); // 'weekly', 'monthly', 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let res;
      if (reportType === 'weekly') {
        res = await reportService.getWeekly();
      } else if (reportType === 'yearly') {
        res = await reportService.getYearly({ year: selectedYear });
      } else {
        res = await reportService.getMonthly({ month: selectedMonth, year: selectedYear });
      }

      if (res.data.success) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedMonth, selectedYear, refreshTrigger]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !report) {
    return <LoadingSpinner message="Generating verified financial audit report..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchReport} />;
  }

  const overview = report?.financial_overview || {};
  const comparison = report?.comparison || {};
  const categories = report?.category_breakdown || [];
  const topExpenses = report?.top_expenses || [];
  const isSurplus = overview.status === 'Surplus';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Controls & Configuration Bar (Hidden in Print) */}
      <div className="no-print glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={22} color="var(--primary)" />
              Financial Statement Generator
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Audited statement of personal cash inflows, expenditures, and surplus.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Period Type Selector */}
            <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              {['weekly', 'monthly', 'yearly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: reportType === t ? 'var(--primary)' : 'transparent',
                    color: reportType === t ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Selectors for Month/Year */}
            {reportType === 'monthly' && (
              <select
                className="form-select"
                style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            )}

            {(reportType === 'monthly' || reportType === 'yearly') && (
              <select
                className="form-select"
                style={{ width: '90px', padding: '6px 10px', fontSize: '0.85rem' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {/* Action Buttons */}
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={16} /> Print Report
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable Statement Document */}
      <div
        id="printable-report"
        className="glass-panel printable-document"
        style={{
          padding: '40px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
        }}
      >
        {/* Document Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--border)',
            paddingBottom: '24px',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Spend<span className="gradient-text">Wise</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
              "Track smarter. Spend better. Save more."
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '12px', fontWeight: 700 }}>
              {report?.report_type}
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Account Holder: <span style={{ color: 'var(--text-primary)' }}>{report?.user?.name}</span>
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              User ID: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{report?.user?.username}</span>
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Period: <strong style={{ color: 'var(--text-primary)' }}>{report?.period?.label}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
              Generated: {formatDate(report?.generated_at)}
            </p>
          </div>
        </div>

        {/* Financial Overview 4-Column Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Income
            </span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
              {formatCurrency(overview.total_income, user?.currency)}
            </p>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Outflow
            </span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
              {formatCurrency(overview.total_expenses, user?.currency)}
            </p>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Net Savings
            </span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
              {formatCurrency(overview.savings, user?.currency)}
            </p>
          </div>

          <div style={{ background: isSurplus ? 'var(--badge-success-bg)' : 'var(--badge-danger-bg)', padding: '16px', borderRadius: '12px', border: `1px solid ${isSurplus ? 'var(--badge-success-border)' : 'var(--badge-danger-border)'}` }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Net Result
            </span>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: isSurplus ? 'var(--success)' : 'var(--danger)', marginTop: '4px' }}>
              {isSurplus ? '🟢 Surplus' : '🔴 Deficit'}
            </p>
          </div>
        </div>

        {/* Period Comparison Section */}
        {comparison && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              marginBottom: '32px',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Comparative Variance (vs {comparison.previous_period_label})
            </h4>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Expense Variance: </span>
                <strong style={{ color: comparison.expense_difference <= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {comparison.expense_difference <= 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(comparison.expense_difference || comparison.expense_change_amount || 0), user?.currency)}
                  {' '}({comparison.expense_change_pct || comparison.expense_pct_change || 0}%)
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Savings Variance: </span>
                <strong style={{ color: comparison.savings_difference >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {comparison.savings_difference >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(comparison.savings_difference || 0), user?.currency)}
                  {' '}({comparison.savings_change_pct || comparison.savings_pct_change || 0}%)
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown Table */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Category Outflow Breakdown
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</th>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Transactions</th>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>{c.count}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>
                    {formatCurrency(c.total, user?.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top 5 Expenses */}
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Major Outflow Transactions
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</th>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</th>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Method</th>
                <th style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {topExpenses.map((e, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(e.expense_date)}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{e.description}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{e.category_name}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{e.payment_method}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 700, textAlign: 'right' }}>
                    {formatCurrency(e.amount, user?.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Footer Signature */}
        <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>SpendWise Automated Personal Finance Engine • Database Authenticated</span>
          <span>Confidential Personal Financial Record</span>
        </div>
      </div>
    </div>
  );
}
