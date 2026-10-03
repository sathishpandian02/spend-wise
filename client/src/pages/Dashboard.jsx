import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Plus,
  ArrowDownLeft,
  Sparkles,
  Info,
  DollarSign,
  BarChart3,
  Target,
  ChevronRight,
} from 'lucide-react';
import { analyticsService, budgetService, savingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate, getGreeting } from '../utils/formatters';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/StateFeedbacks';
import CategoryIcon from '../components/CategoryIcon';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Animated number counter
function AnimatedNumber({ value, currency, prefix = '', suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    const duration = 600;
    const startTime = Date.now();
    const startVal = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = startVal + (num - startVal) * eased;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}{formatCurrency(Math.round(displayValue), currency)}{suffix}
    </span>
  );
}

export default function Dashboard({ onNavigate, refreshTrigger }) {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [data, setData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { filter };
      if (filter === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const [dashRes, weekRes, budgetRes, savingsRes] = await Promise.all([
        analyticsService.getDashboard(params),
        analyticsService.getWeekly(),
        budgetService.getAll(),
        savingsService.getAll(),
      ]);

      if (dashRes.data.success) setData(dashRes.data);
      if (weekRes.data.success) setWeeklyData(weekRes.data);
      if (budgetRes.data.success) setBudgets(budgetRes.data.budgets || []);
      if (savingsRes.data.success) setSavingsGoals(savingsRes.data.goals || []);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, customStart, customEnd]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  if (loading && !data) {
    return <LoadingSpinner message="Calculating your real-time financial overview..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchDashboardData} />;
  }

  const summary = data?.summary || {
    base_monthly_income: 0,
    total_income: 0,
    total_expenses: 0,
    remaining: 0,
    savings: 0,
    status: 'Surplus',
    net_difference: 0,
  };

  const isSurplus = summary.status === 'Surplus';
  const displayName = user?.username || 'User';

  // Current date info
  const now = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  // Chart theme colors
  const chartTextColor = isDark ? '#a3a3a3' : '#64748b';
  const chartGridColor = isDark ? '#262626' : '#e2e8f0';
  const chartTooltipBg = isDark ? '#151515' : '#172033';
  const chartTooltipBorder = isDark ? '#383838' : '#e2e8f0';
  const doughnutBorder = isDark ? '#0f0f0f' : '#ffffff';

  // Doughnut Chart
  const categories = data?.categories || [];
  const doughnutData = {
    labels: categories.map((c) => c.name),
    datasets: [
      {
        data: categories.map((c) => c.amount),
        backgroundColor: categories.map((c) => c.color || '#10b981'),
        borderColor: doughnutBorder,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: chartTextColor,
          font: { family: 'Inter', size: 11, weight: '500' },
          boxWidth: 10,
          boxHeight: 10,
          padding: 10,
          usePointStyle: true,
          pointStyle: 'rectRounded',
        },
      },
      tooltip: {
        backgroundColor: chartTooltipBg,
        borderColor: chartTooltipBorder,
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const val = context.raw || 0;
            return ` ${label}: ${formatCurrency(val, user?.currency)}`;
          },
        },
      },
    },
    cutout: '72%',
  };

  // Line Chart
  const weeklyLabels = weeklyData?.daily_chart?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentWeekSpending = weeklyData?.daily_chart?.current_week_spending || [0, 0, 0, 0, 0, 0, 0];
  const prevWeekSpending = weeklyData?.daily_chart?.previous_week_spending || [0, 0, 0, 0, 0, 0, 0];

  const lineChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: 'This Week',
        data: currentWeekSpending,
        borderColor: '#10b981',
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: isDark ? '#0f0f0f' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: 'Last Week',
        data: prevWeekSpending,
        borderColor: isDark ? '#525252' : '#cbd5e1',
        backgroundColor: 'transparent',
        borderDash: [5, 4],
        tension: 0.4,
        pointBackgroundColor: isDark ? '#737373' : '#94a3b8',
        pointBorderColor: isDark ? '#0f0f0f' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        borderWidth: 1.5,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: chartTextColor,
          font: { family: 'Inter', size: 11, weight: '500' },
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: chartTooltipBg,
        borderColor: chartTooltipBorder,
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw, user?.currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartGridColor, drawBorder: false },
        ticks: { color: chartTextColor, font: { family: 'Inter', size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: chartGridColor, drawBorder: false },
        ticks: {
          color: chartTextColor,
          font: { family: 'Inter', size: 11 },
          callback: (v) => `₹${v}`,
        },
        border: { display: false },
      },
    },
  };

  // Metric card configs
  const metricCards = [
    {
      label: 'Total Balance / Inflow',
      value: summary.total_income,
      sub: `Base: ${formatCurrency(summary.proportional_base_income || 0, user?.currency)}`,
      icon: Wallet,
      color: '#10b981',
      bg: 'var(--primary-light)',
    },
    {
      label: 'Total Expenses',
      value: summary.total_expenses,
      sub: `${summary.transaction_count || 0} transactions recorded`,
      icon: CreditCard,
      color: '#ef4444',
      bg: 'var(--danger-light)',
    },
    {
      label: 'Savings',
      value: summary.savings,
      sub: 'Income − Outflow',
      icon: PiggyBank,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ===== HERO HEADER ===== */}
      <div
        className="animate-fade-in glass-panel"
        style={{
          padding: '24px 28px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 15, 15, 0.95) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, rgba(240, 253, 244, 0.6) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '4px' }}>
              Financial Overview
            </p>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {getGreeting()},{' '}
              <span className="gradient-text">{displayName}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {currentMonth} {currentYear} • Your money, clearly organized.
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'year', label: 'Year' },
              { id: 'custom', label: 'Custom' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filter === item.id ? 'var(--primary)' : 'transparent',
                  color: filter === item.id ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: filter === item.id ? 600 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-body)',
                  boxShadow: filter === item.id ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Filter */}
        {filter === 'custom' && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>From</span>
              <input type="date" className="form-input" style={{ width: '150px', padding: '5px 10px', fontSize: '0.8rem' }} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>To</span>
              <input type="date" className="form-input" style={{ width: '150px', padding: '5px 10px', fontSize: '0.8rem' }} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={fetchDashboardData}>Apply</button>
          </div>
        )}
      </div>

      {/* ===== METRIC CARDS ===== */}
      <div
        className="stagger-children"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="glass-panel-interactive"
              style={{
                padding: '20px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: card.bg,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                <AnimatedNumber value={card.value} currency={user?.currency} />
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{card.sub}</p>
            </div>
          );
        })}

        {/* Dynamic Surplus / Deficit Card */}
        <div
          className="glass-panel-interactive"
          style={{
            padding: '20px 22px',
            borderColor: isSurplus ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            background: isSurplus
              ? (isDark ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, #0f0f0f 100%)' : 'linear-gradient(135deg, #ffffff 0%, rgba(240, 253, 244, 0.7) 100%)')
              : (isDark ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, #0f0f0f 100%)' : 'linear-gradient(135deg, #ffffff 0%, rgba(254, 242, 242, 0.7) 100%)'),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isSurplus ? 'Surplus' : 'Deficit'}
            </span>
            <span className={isSurplus ? 'badge badge-surplus' : 'badge badge-deficit'}>
              {isSurplus ? '● Surplus' : '● Deficit'}
            </span>
          </div>
          <h3
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: isSurplus ? 'var(--success-text)' : 'var(--danger-text)',
              marginBottom: '4px',
            }}
          >
            {isSurplus ? '+' : '-'}{' '}
            <AnimatedNumber value={summary.net_difference} currency={user?.currency} />
          </h3>
          <p style={{ fontSize: '0.72rem', color: isSurplus ? 'var(--success-text)' : 'var(--danger-text)' }}>
            {isSurplus ? 'Net financial surplus this period' : 'Net financial deficit this period'}
          </p>
        </div>
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Weekly Spending Trend */}
        <div className="glass-panel animate-fade-in" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="var(--primary)" />
                Weekly Spending Trend
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Current week vs previous week
              </p>
            </div>
            <button onClick={() => onNavigate('/weekly')} className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)' }}>
              Details <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-panel animate-fade-in" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#06b6d4" />
                Category Breakdown
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Expense distribution
              </p>
            </div>
            <button onClick={() => onNavigate('/budgets')} className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)' }}>
              Budgets <ChevronRight size={13} />
            </button>
          </div>
          {categories.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <Target size={28} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No expenses in this period.</p>
            </div>
          ) : (
            <div style={{ height: '240px', width: '100%', position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          )}
        </div>
      </div>

      {/* ===== WEEKLY & BUDGET ROW ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Weekly Comparison */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--primary)" />
              Weekly Comparison
            </h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {weeklyData?.current_week?.range || 'This Week'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>This Week</span>
              <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(weeklyData?.current_week?.expenses || 0, user?.currency)}
              </p>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Last Week</span>
              <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '3px', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(weeklyData?.previous_week?.expenses || 0, user?.currency)}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--border-glow)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {weeklyData?.comparison?.expense_statement || 'Start tracking to see weekly comparisons.'}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Budget Progress
            </h4>
            <button onClick={() => onNavigate('/budgets')} className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)' }}>
              View All
            </button>
          </div>

          {budgets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '8px' }}>
              <PieChart size={24} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No budgets set yet.</p>
              <button onClick={() => onNavigate('/budgets')} className="btn btn-primary btn-xs" style={{ marginTop: '4px' }}>
                <Plus size={13} /> Create Budget
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {budgets.slice(0, 3).map((b) => (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.category_name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem' }}>
                      {formatCurrency(b.spent, user?.currency)} / {formatCurrency(b.amount, user?.currency)}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
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
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{b.percentage}% used</span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: b.status === 'Exceeded' ? 'var(--danger-text)' : b.status === 'Warning' ? 'var(--warning-text)' : 'var(--success-text)',
                      fontWeight: 600,
                    }}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== TRANSACTIONS & SAVINGS ROW ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Recent Transactions */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Transactions
            </h4>
            <button onClick={() => onNavigate('/transactions')} className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)' }}>
              View All <ChevronRight size={13} />
            </button>
          </div>

          {(!data?.recent_transactions || data.recent_transactions.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '8px' }}>
              <Receipt size={24} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No recent transactions.</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', textAlign: 'center', maxWidth: '260px' }}>
                Start tracking your spending to see financial insights here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.recent_transactions.map((tx, idx) => {
                const isInc = tx.type === 'income';
                return (
                  <div
                    key={`${tx.type}-${tx.id}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          background: isInc ? 'var(--success-light)' : `${tx.category_color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon
                          name={tx.category_name}
                          icon={tx.category_icon}
                          size={16}
                          color={isInc ? '#10b981' : tx.category_color}
                        />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.description}
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                          {formatDate(tx.date)} • {tx.payment_method}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: isInc ? 'var(--success-text)' : 'var(--danger-text)',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {isInc ? '+' : '-'} {formatCurrency(tx.amount, user?.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Savings Goals */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Savings Goals
            </h4>
            <button onClick={() => onNavigate('/savings')} className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)' }}>
              Manage <ChevronRight size={13} />
            </button>
          </div>

          {savingsGoals.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '8px' }}>
              <PiggyBank size={24} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No savings goals yet.</p>
              <button onClick={() => onNavigate('/savings')} className="btn btn-primary btn-xs" style={{ marginTop: '4px' }}>
                <Plus size={13} /> Create Goal
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savingsGoals.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {g.progress}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, g.progress)}%`,
                        background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>{formatCurrency(g.current_amount, user?.currency)} saved</span>
                    <span>Target: {formatCurrency(g.target_amount, user?.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FINANCIAL INSIGHTS ===== */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary)" />
          Financial Insights
        </h4>

        {(!data?.insights || data.insights.length === 0) ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Add more transactions to unlock personalized financial insights.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {data.insights.map((ins, i) => {
              let borderColor = 'var(--border-color)';
              let icon = <Info size={16} color="var(--primary)" />;
              if (ins.type === 'danger') {
                borderColor = 'rgba(239, 68, 68, 0.3)';
                icon = <AlertTriangle size={16} color="var(--danger)" />;
              } else if (ins.type === 'success') {
                borderColor = 'rgba(16, 185, 129, 0.3)';
                icon = <CheckCircle2 size={16} color="var(--primary)" />;
              } else if (ins.type === 'warning') {
                borderColor = 'rgba(245, 158, 11, 0.3)';
                icon = <AlertTriangle size={16} color="var(--warning)" />;
              }

              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {icon}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ins.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Responsive layout styles */}
      <style>{`
        @media (max-width: 880px) {
          div[style*="minmax(400px"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="minmax(340px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="minmax(360px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
