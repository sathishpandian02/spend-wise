import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Award,
} from 'lucide-react';
import { analyticsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner, ErrorBanner } from '../components/StateFeedbacks';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function YearlyAnalysis({ refreshTrigger }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const years = [2024, 2025, 2026, 2027];

  const fetchYearlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getYearly({ year: selectedYear });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching yearly analytics:', err);
      setError('Failed to fetch yearly overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear, refreshTrigger]);

  if (loading && !data) {
    return <LoadingSpinner message="Calculating annual balance sheets and monthly distributions..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchYearlyData} />;
  }

  const summary = data?.summary || {};
  const months = data?.months || [];
  const comp = data?.comparison || {};

  const chartTextColor = isDark ? '#a3a3a3' : '#64748b';
  const chartGridColor = isDark ? '#262626' : '#e2e8f0';
  const chartTooltipBg = isDark ? '#151515' : '#172033';
  const chartTooltipBorder = isDark ? '#383838' : '#e2e8f0';

  const barChartData = {
    labels: months.map((m) => m.month_name.slice(0, 3)),
    datasets: [
      {
        label: 'Income',
        data: months.map((m) => m.income),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: months.map((m) => m.expenses),
        backgroundColor: '#ef4444',
        borderRadius: 6,
      },
      {
        label: 'Savings',
        data: months.map((m) => m.savings),
        backgroundColor: '#06b6d4',
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: chartTextColor, font: { family: 'Inter', size: 12 } },
      },
      tooltip: {
        backgroundColor: chartTooltipBg,
        borderColor: chartTooltipBorder,
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw, user?.currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartGridColor },
        ticks: { color: chartTextColor, font: { family: 'Inter', size: 12 } },
      },
      y: {
        grid: { color: chartGridColor },
        ticks: {
          color: chartTextColor,
          font: { family: 'Inter', size: 12 },
          callback: (v) => `₹${v}`,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Year Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarRange size={28} color="var(--primary)" />
            Yearly Financial Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
            12-month performance and multi-year comparative audits.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Year:</span>
          <select
            className="form-select"
            style={{ width: '120px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Annual Income
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-text)', marginTop: '4px' }}>
            {formatCurrency(summary.total_yearly_income, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Avg: {formatCurrency(summary.average_monthly_income, user?.currency)}/mo
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Annual Expenses
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-text)', marginTop: '4px' }}>
            {formatCurrency(summary.total_yearly_expenses, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Avg: {formatCurrency(summary.average_monthly_expense, user?.currency)}/mo
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Annual Savings
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {formatCurrency(summary.total_yearly_savings, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Net annual retained
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Highest Outflow Month
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {summary.highest_spending_month}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Lowest: {summary.lowest_spending_month}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Highest Expense Category
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
            {summary.highest_expense_category}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Yearly largest category
          </p>
        </div>
      </div>

      {/* 12-Month Bar Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          12-Month Income vs Expense vs Savings Chart ({selectedYear})
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Month-by-month comparative analysis of personal inflows, outflows, and surplus accumulations.
        </p>
        <div style={{ height: '340px', width: '100%' }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Year-to-Year Comparison Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Year-to-Year Comparison ({selectedYear} vs {comp.compare_year})
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Annual variance calculated against historical database records.
            </p>
          </div>
          <span className="badge badge-safe">Multi-Year Audit</span>
        </div>

        {!comp.has_previous_data ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', padding: '16px 0' }}>
            Not enough previous data for comparison with year {comp.compare_year}.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Expense comparison */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Annual Outflow Variance</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: comp.expense_difference <= 0 ? 'var(--success-text)' : 'var(--danger-text)', marginTop: '4px' }}>
                {comp.expense_difference <= 0 ? '-' : '+'}₹{Math.abs(comp.expense_difference).toLocaleString('en-IN')}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '6px' }}>
                  ({comp.expense_pct_change}%)
                </span>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {comp.expense_difference <= 0
                  ? `You spent ${Math.abs(comp.expense_pct_change)}% less in ${selectedYear} than in ${comp.compare_year}.`
                  : `Spending increased by ${comp.expense_pct_change}% in ${selectedYear} compared to ${comp.compare_year}.`}
              </p>
            </div>

            {/* Savings comparison */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Annual Savings Variance</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: comp.savings_difference >= 0 ? 'var(--success-text)' : 'var(--danger-text)', marginTop: '4px' }}>
                {comp.savings_difference >= 0 ? '+' : '-'}₹{Math.abs(comp.savings_difference).toLocaleString('en-IN')}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '6px' }}>
                  ({comp.savings_pct_change}%)
                </span>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {comp.savings_difference >= 0
                  ? `Annual savings grew by ${comp.savings_pct_change}% over ${comp.compare_year}.`
                  : `Annual savings dropped by ${Math.abs(comp.savings_pct_change)}% over ${comp.compare_year}.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
