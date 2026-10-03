import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Calendar,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Tag,
} from 'lucide-react';
import { analyticsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner, ErrorBanner } from '../components/StateFeedbacks';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MonthlyAnalysis({ refreshTrigger }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [data, setData] = useState(null);
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

  const years = [2024, 2025, 2026, 2027];

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getMonthly({ month: selectedMonth, year: selectedYear });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching monthly analytics:', err);
      setError('Failed to fetch monthly data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, selectedYear, refreshTrigger]);

  if (loading && !data) {
    return <LoadingSpinner message="Calculating monthly statements..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchMonthlyData} />;
  }

  const curr = data?.current_month || {};
  const prev = data?.previous_month || {};
  const comp = data?.comparison || {};
  const dailySpending = data?.daily_spending || [];

  const chartTextColor = isDark ? '#a3a3a3' : '#64748b';
  const chartGridColor = isDark ? '#262626' : '#e2e8f0';
  const chartTooltipBg = isDark ? '#151515' : '#172033';
  const chartTooltipBorder = isDark ? '#383838' : '#e2e8f0';

  const lineChartData = {
    labels: dailySpending.map((d) => formatDate(d.expense_date)),
    datasets: [
      {
        label: 'Daily Outflow',
        data: dailySpending.map((d) => d.daily_total),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: isDark ? '#0f0f0f' : '#ffffff',
        pointRadius: 4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartTooltipBg,
        borderColor: chartTooltipBorder,
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` Outflow: ${formatCurrency(ctx.raw, user?.currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartGridColor },
        ticks: { color: chartTextColor, font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: chartGridColor },
        ticks: {
          color: chartTextColor,
          font: { family: 'Inter', size: 11 },
          callback: (v) => `₹${v}`,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Month/Year Selectors */}
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
            <Calendar size={28} color="var(--primary)" />
            Monthly Financial Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
            Detailed breakdown of income, outflow, and surplus trends.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: '100px' }}
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

      {/* Comparison Statement Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          borderLeft: `4px solid ${comp.expense_difference <= 0 ? 'var(--success)' : 'var(--warning)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Month-over-Month Comparison
          </h4>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
            {comp.statement}
          </p>
        </div>
        {comp.has_previous_data && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Spending Diff</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: comp.expense_difference <= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                {comp.expense_difference <= 0 ? '-' : '+'}₹{Math.abs(comp.expense_difference).toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Savings Diff</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: comp.savings_difference >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                {comp.savings_difference >= 0 ? '+' : '-'}₹{Math.abs(comp.savings_difference).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Income
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(curr.total_income, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Base + Additional
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Expenses
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(curr.total_expenses, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {curr.transaction_count} recorded expenses
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Surplus / Deficit
          </span>
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: curr.status === 'Surplus' ? 'var(--success-text)' : 'var(--danger-text)',
              marginTop: '4px',
            }}
          >
            {formatCurrency(curr.savings, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: curr.status === 'Surplus' ? 'var(--success-text)' : 'var(--danger-text)', marginTop: '2px' }}>
            {curr.status}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Daily Average
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(curr.average_daily_expense, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Per day spending
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Highest Single Outflow
          </span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCurrency(curr.highest_expense, user?.currency)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Top single payment
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Top Category
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {curr.most_used_category}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Most utilized category
          </p>
        </div>
      </div>

      {/* Daily Outflow Throughout Month Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Daily Outflow Trend ({data?.month_name} {data?.year})
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Chronological daily expense pattern across the month.
        </p>

        {dailySpending.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No daily expenses recorded for {data?.month_name} {data?.year}.
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
