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
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Receipt,
  PiggyBank,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Info,
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

export default function WeeklyAnalysis({ refreshTrigger }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getWeekly();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching weekly analytics:', err);
      setError('Failed to fetch weekly comparison data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [refreshTrigger]);

  if (loading) {
    return <LoadingSpinner message="Calculating weekly performance and comparison metrics..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchWeeklyData} />;
  }

  const curr = data?.current_week || {};
  const prev = data?.previous_week || {};
  const comp = data?.comparison || {};
  const chart = data?.daily_chart || { labels: [], current_week_spending: [], previous_week_spending: [] };

  const chartTextColor = isDark ? '#a3a3a3' : '#64748b';
  const chartGridColor = isDark ? '#262626' : '#e2e8f0';
  const chartTooltipBg = isDark ? '#151515' : '#172033';
  const chartTooltipBorder = isDark ? '#383838' : '#e2e8f0';

  const barChartData = {
    labels: chart.labels,
    datasets: [
      {
        label: 'Current Week Daily Outflow',
        data: chart.current_week_spending,
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
      {
        label: 'Previous Week Daily Outflow',
        data: chart.previous_week_spending,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(100, 116, 139, 0.25)',
        borderRadius: 8,
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
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarDays size={28} color="var(--primary)" />
          Weekly Financial Analysis
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
          Evaluate this week's outflow pace against last week's recorded metrics.
        </p>
      </div>

      {/* Comparison Statement Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Spending Statement */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderLeft: `4px solid ${comp.expense_difference <= 0 ? 'var(--success)' : 'var(--danger)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {comp.expense_difference <= 0 ? (
              <ArrowDownRight size={20} color="var(--success)" />
            ) : (
              <ArrowUpRight size={20} color="var(--danger)" />
            )}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Spending Velocity
            </h4>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
            {comp.expense_statement}
          </p>
          {comp.has_previous_data && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {comp.expense_difference <= 0 ? 'Less outflow than last week' : 'Higher outflow than last week'} (₹{Math.abs(comp.expense_difference).toLocaleString('en-IN')})
            </p>
          )}
        </div>

        {/* Savings Statement */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderLeft: `4px solid ${comp.savings_difference >= 0 ? 'var(--success)' : 'var(--warning)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <PiggyBank size={20} color="var(--primary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Savings Progress
            </h4>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
            {comp.savings_statement}
          </p>
          {comp.has_previous_data && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Net difference: {comp.savings_difference >= 0 ? '+' : '-'}₹{Math.abs(comp.savings_difference).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Current Week Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-safe">Active Week</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                Current Week
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{curr.range}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Weekly Income:</span>
              <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>{formatCurrency(curr.income, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Outflow:</span>
              <span style={{ fontWeight: 700, color: 'var(--danger-text)' }}>{formatCurrency(curr.expenses, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Net Savings:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(curr.savings, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Average Daily Spending:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(curr.average_daily_spending, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Transactions:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{curr.transactions} entries</span>
            </div>
          </div>
        </div>

        {/* Previous Week Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="badge" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}>Past Period</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                Previous Week
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{prev.range}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Weekly Income:</span>
              <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>{formatCurrency(prev.income, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Outflow:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{formatCurrency(prev.expenses, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Net Savings:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(prev.savings, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Average Daily Spending:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(prev.average_daily_spending, user?.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Transactions:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prev.transactions} entries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mon-Sun Daily Spending Bar Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Daily Spending Comparison (Monday - Sunday)
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Side-by-side comparison of daily outflow between this week and last week.
        </p>
        <div style={{ height: '320px', width: '100%' }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
}
