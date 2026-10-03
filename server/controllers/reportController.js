const db = require('../config/db');
const { getWeekRange, getMonthRange, calculatePercentageChange } = require('../utils/calculator');

// GET /api/reports/weekly
async function getWeeklyReport(req, res, next) {
  try {
    const user = req.user;
    const now = new Date();
    const currWeek = getWeekRange(now, 0);
    const prevWeek = getWeekRange(now, -1);

    const baseWeekly = Math.round((user.monthly_income / 30) * 7);

    // Current week data
    const incRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [user.id, currWeek.start, currWeek.end]
    );
    const totalIncome = baseWeekly + (parseFloat(incRes[0]?.total) || 0);

    const expRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [user.id, currWeek.start, currWeek.end]
    );
    const totalExpenses = parseFloat(expRes[0]?.total) || 0;
    const savings = totalIncome - totalExpenses;
    const status = totalIncome >= totalExpenses ? 'Surplus' : 'Deficit';

    // Previous week data
    const prevIncRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [user.id, prevWeek.start, prevWeek.end]
    );
    const prevIncome = baseWeekly + (parseFloat(prevIncRes[0]?.total) || 0);

    const prevExpRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [user.id, prevWeek.start, prevWeek.end]
    );
    const prevExpenses = parseFloat(prevExpRes[0]?.total) || 0;
    const prevSavings = prevIncome - prevExpenses;

    // Category breakdown
    const categoryRows = await db.query(
      `SELECT c.name, COALESCE(SUM(e.amount), 0) AS total, COUNT(e.id) AS count
       FROM categories c
       JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name
       ORDER BY total DESC`,
      [user.id, currWeek.start, currWeek.end]
    );

    // Top individual expenses
    const topExpenses = await db.query(
      `SELECT e.description, e.amount, e.payment_method, e.expense_date, c.name AS category_name
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       ORDER BY e.amount DESC
       LIMIT 5`,
      [user.id, currWeek.start, currWeek.end]
    );

    res.json({
      success: true,
      report_type: 'Weekly Financial Statement',
      generated_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      period: {
        label: 'Current Week',
        start_date: currWeek.start,
        end_date: currWeek.end,
      },
      financial_overview: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        savings,
        status,
        net_surplus_deficit: Math.abs(savings),
      },
      comparison: {
        previous_period_label: 'Previous Week',
        previous_expenses: prevExpenses,
        previous_savings: prevSavings,
        expense_change_amount: totalExpenses - prevExpenses,
        expense_change_pct: calculatePercentageChange(totalExpenses, prevExpenses),
        savings_change_pct: calculatePercentageChange(savings, prevSavings),
      },
      category_breakdown: categoryRows,
      top_expenses: topExpenses,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/monthly
async function getMonthlyReport(req, res, next) {
  try {
    const user = req.user;
    const now = new Date();
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
    const year = parseInt(req.query.year || now.getFullYear(), 10);

    const currRange = getMonthRange(year, month);
    let prevM = month - 1;
    let prevY = year;
    if (prevM === 0) {
      prevM = 12;
      prevY -= 1;
    }
    const prevRange = getMonthRange(prevY, prevM);

    const baseMonthly = parseFloat(user.monthly_income) || 0;

    // Current Month Income
    const incRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [user.id, currRange.start, currRange.end]
    );
    const totalIncome = baseMonthly + (parseFloat(incRes[0]?.total) || 0);

    // Current Month Expenses
    const expRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [user.id, currRange.start, currRange.end]
    );
    const totalExpenses = parseFloat(expRes[0]?.total) || 0;
    const savings = totalIncome - totalExpenses;
    const status = totalIncome >= totalExpenses ? 'Surplus' : 'Deficit';

    // Previous Month
    const prevIncRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [user.id, prevRange.start, prevRange.end]
    );
    const prevIncome = baseMonthly + (parseFloat(prevIncRes[0]?.total) || 0);

    const prevExpRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [user.id, prevRange.start, prevRange.end]
    );
    const prevExpenses = parseFloat(prevExpRes[0]?.total) || 0;
    const prevSavings = prevIncome - prevExpenses;

    // Category breakdown
    const categoryRows = await db.query(
      `SELECT c.name, c.color, COALESCE(SUM(e.amount), 0) AS total, COUNT(e.id) AS count
       FROM categories c
       JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name, c.color
       ORDER BY total DESC`,
      [user.id, currRange.start, currRange.end]
    );

    // Budget Status
    const budgetRows = await db.query(
      `SELECT b.amount, c.name AS category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
      [user.id, month, year]
    );

    // Top 5 Expenses
    const topExpenses = await db.query(
      `SELECT e.description, e.amount, e.payment_method, e.expense_date, c.name AS category_name
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       ORDER BY e.amount DESC
       LIMIT 5`,
      [user.id, currRange.start, currRange.end]
    );

    res.json({
      success: true,
      report_type: 'Monthly Financial Audit Report',
      generated_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      period: {
        label: `${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' })} ${year}`,
        month,
        year,
        start_date: currRange.start,
        end_date: currRange.end,
      },
      financial_overview: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        savings,
        status,
        net_surplus_deficit: Math.abs(savings),
        daily_average: Math.round((totalExpenses / currRange.daysInMonth) * 10) / 10,
      },
      comparison: {
        previous_period_label: `${new Date(prevY, prevM - 1, 1).toLocaleString('en-US', { month: 'long' })} ${prevY}`,
        previous_income: prevIncome,
        previous_expenses: prevExpenses,
        previous_savings: prevSavings,
        expense_difference: totalExpenses - prevExpenses,
        expense_change_pct: calculatePercentageChange(totalExpenses, prevExpenses),
        savings_difference: savings - prevSavings,
        savings_change_pct: calculatePercentageChange(savings, prevSavings),
      },
      category_breakdown: categoryRows,
      budgets: budgetRows,
      top_expenses: topExpenses,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/yearly
async function getYearlyReport(req, res, next) {
  try {
    const user = req.user;
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear(), 10);
    const prevYear = year - 1;

    const baseMonthly = parseFloat(user.monthly_income) || 0;
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const prevStart = `${prevYear}-01-01`;
    const prevEnd = `${prevYear}-12-31`;

    // Year Income
    const incRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [user.id, yearStart, yearEnd]
    );
    const totalIncome = (baseMonthly * 12) + (parseFloat(incRes[0]?.total) || 0);

    // Year Expenses
    const expRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [user.id, yearStart, yearEnd]
    );
    const totalExpenses = parseFloat(expRes[0]?.total) || 0;
    const savings = totalIncome - totalExpenses;
    const status = totalIncome >= totalExpenses ? 'Surplus' : 'Deficit';

    // Prev Year Expenses & Income
    const prevIncRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [user.id, prevStart, prevEnd]
    );
    const prevIncome = (baseMonthly * 12) + (parseFloat(prevIncRes[0]?.total) || 0);

    const prevExpRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [user.id, prevStart, prevEnd]
    );
    const prevExpenses = parseFloat(prevExpRes[0]?.total) || 0;
    const prevSavings = prevIncome - prevExpenses;

    // Category breakdown
    const categoryRows = await db.query(
      `SELECT c.name, c.color, COALESCE(SUM(e.amount), 0) AS total, COUNT(e.id) AS count
       FROM categories c
       JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name, c.color
       ORDER BY total DESC`,
      [user.id, yearStart, yearEnd]
    );

    // Top 8 expenses
    const topExpenses = await db.query(
      `SELECT e.description, e.amount, e.payment_method, e.expense_date, c.name AS category_name
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       ORDER BY e.amount DESC
       LIMIT 8`,
      [user.id, yearStart, yearEnd]
    );

    res.json({
      success: true,
      report_type: 'Annual Financial Summary Report',
      generated_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      period: {
        label: `Year ${year}`,
        year,
        start_date: yearStart,
        end_date: yearEnd,
      },
      financial_overview: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        savings,
        status,
        monthly_average_expense: Math.round((totalExpenses / 12) * 10) / 10,
        monthly_average_income: Math.round((totalIncome / 12) * 10) / 10,
      },
      comparison: {
        previous_period_label: `Year ${prevYear}`,
        previous_income: prevIncome,
        previous_expenses: prevExpenses,
        previous_savings: prevSavings,
        expense_difference: totalExpenses - prevExpenses,
        expense_change_pct: calculatePercentageChange(totalExpenses, prevExpenses),
        savings_difference: savings - prevSavings,
        savings_change_pct: calculatePercentageChange(savings, prevSavings),
      },
      category_breakdown: categoryRows,
      top_expenses: topExpenses,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
};
