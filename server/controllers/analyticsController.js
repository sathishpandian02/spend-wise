const db = require('../config/db');
const { formatDate, getWeekRange, getMonthRange, calculatePercentageChange } = require('../utils/calculator');

// Helper to determine date range based on filter
function resolveDateRange(filter, customStart, customEnd) {
  const now = new Date();
  let start, end;

  switch (filter) {
    case 'week': {
      const wr = getWeekRange(now, 0);
      start = wr.start;
      end = wr.end;
      break;
    }
    case 'last_month': {
      let m = now.getMonth(); // previous month (0-11)
      let y = now.getFullYear();
      if (m === 0) {
        m = 12;
        y -= 1;
      }
      const mr = getMonthRange(y, m);
      start = mr.start;
      end = mr.end;
      break;
    }
    case 'year': {
      const y = now.getFullYear();
      start = `${y}-01-01`;
      end = `${y}-12-31`;
      break;
    }
    case 'custom': {
      start = customStart || formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      end = customEnd || formatDate(now);
      break;
    }
    case 'month':
    default: {
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const mr = getMonthRange(y, m);
      start = mr.start;
      end = mr.end;
      break;
    }
  }

  return { start, end };
}

// GET /api/analytics/dashboard
async function getDashboardAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const { filter = 'month', startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(filter, startDate, endDate);

    // Fetch user base monthly income
    const userRows = await db.query('SELECT monthly_income, name, username FROM users WHERE id = ?', [userId]);
    const baseMonthly = parseFloat(userRows[0]?.monthly_income) || 0;

    // Calculate proportional base income depending on filter
    let baseIncomeInPeriod = baseMonthly;
    if (filter === 'week') {
      baseIncomeInPeriod = Math.round((baseMonthly / 30) * 7);
    } else if (filter === 'year') {
      baseIncomeInPeriod = baseMonthly * 12;
    } else if (filter === 'custom') {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
      baseIncomeInPeriod = Math.round((baseMonthly / 30) * days);
    }

    // Additional income in date range
    const incomeResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_additional
       FROM income
       WHERE user_id = ? AND income_date >= ? AND income_date <= ?`,
      [userId, start, end]
    );
    const additionalIncome = parseFloat(incomeResult[0]?.total_additional) || 0;
    const totalIncome = baseIncomeInPeriod + additionalIncome;

    // Total expenses in date range
    const expenseResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expense, COUNT(*) AS count
       FROM expenses
       WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?`,
      [userId, start, end]
    );
    const totalExpenses = parseFloat(expenseResult[0]?.total_expense) || 0;
    const transactionCount = parseInt(expenseResult[0]?.count, 10) || 0;

    const remaining = totalIncome - totalExpenses;
    const savings = remaining; // Savings equals remaining surplus
    const status = totalIncome >= totalExpenses ? 'Surplus' : 'Deficit';
    const netDifference = Math.abs(remaining);

    // Category breakdown
    const categoryRows = await db.query(
      `SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) AS total_amount, COUNT(e.id) AS count
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING total_amount > 0
       ORDER BY total_amount DESC`,
      [userId, start, end]
    );

    const categoriesBreakdown = categoryRows.map((cat) => {
      const amount = parseFloat(cat.total_amount) || 0;
      const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0;
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount,
        percentage,
        count: parseInt(cat.count, 10) || 0,
      };
    });

    // Recent transactions (latest 5 expenses and 5 incomes)
    const recentExpenses = await db.query(
      `SELECT e.id, e.description, e.amount, e.payment_method, e.expense_date AS date, 'expense' AS type,
              c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ?
       ORDER BY e.expense_date DESC, e.id DESC
       LIMIT 5`,
      [userId]
    );

    const recentIncomes = await db.query(
      `SELECT id, source AS description, amount, 'Bank' AS payment_method, income_date AS date, 'income' AS type,
              'Income' AS category_name, 'ArrowDownLeft' AS category_icon, '#10b981' AS category_color
       FROM income
       WHERE user_id = ?
       ORDER BY income_date DESC, id DESC
       LIMIT 5`,
      [userId]
    );

    const combinedRecent = [...recentExpenses, ...recentIncomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    // Dynamic Financial Insights (Rules calculated from actual DB data)
    const insights = [];

    if (totalIncome > 0 && totalExpenses > totalIncome) {
      insights.push({
        type: 'danger',
        title: 'Spending Exceeded Income',
        text: `Your expenses (₹${totalExpenses.toLocaleString('en-IN')}) have exceeded your total income (₹${totalIncome.toLocaleString('en-IN')}) for this period by ₹${netDifference.toLocaleString('en-IN')}. Consider reviewing non-essential purchases.`,
      });
    } else if (totalIncome > 0 && savings > 0) {
      const savingsRate = Math.round((savings / totalIncome) * 100);
      insights.push({
        type: 'success',
        title: `Healthy Surplus (${savingsRate}% Savings Rate)`,
        text: `You have successfully retained ₹${savings.toLocaleString('en-IN')} (${savingsRate}% of total income) as surplus savings in this period. Great job!`,
      });
    }

    if (categoriesBreakdown.length > 0) {
      const topCat = categoriesBreakdown[0];
      insights.push({
        type: 'info',
        title: `Highest Spending in ${topCat.name}`,
        text: `${topCat.name} is your highest spending category at ₹${topCat.amount.toLocaleString('en-IN')} (${topCat.percentage}% of your expenses).`,
      });
    }

    // Check weekend spending
    const expenseList = await db.query(
      `SELECT amount, expense_date FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?`,
      [userId, start, end]
    );

    let weekendTotal = 0;
    expenseList.forEach((e) => {
      const day = new Date(e.expense_date).getDay();
      if (day === 0 || day === 6) { // Saturday or Sunday
        weekendTotal += parseFloat(e.amount);
      }
    });

    if (totalExpenses > 0 && weekendTotal > 0) {
      const weekendPct = Math.round((weekendTotal / totalExpenses) * 100);
      if (weekendPct >= 35) {
        insights.push({
          type: 'warning',
          title: 'High Weekend Outflow',
          text: `Weekend spending accounted for ${weekendPct}% (₹${weekendTotal.toLocaleString('en-IN')}) of total outflow in this period.`,
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Ready for Tracking',
        text: 'Add your regular daily expenses and income to unlock customized financial trends and insights.',
      });
    }

    res.json({
      success: true,
      period: {
        filter,
        start,
        end,
      },
      summary: {
        base_monthly_income: baseMonthly,
        proportional_base_income: baseIncomeInPeriod,
        additional_income: additionalIncome,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        remaining,
        balance: remaining,
        savings,
        status, // 'Surplus' or 'Deficit'
        surplus_or_deficit: status,
        net_difference: netDifference,
        transaction_count: transactionCount,
      },
      categories: categoriesBreakdown,
      recent_transactions: combinedRecent,
      insights,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/weekly
async function getWeeklyAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Current week (Mon-Sun)
    const currWeek = getWeekRange(now, 0);
    // Previous week (Mon-Sun)
    const prevWeek = getWeekRange(now, -1);

    // User monthly income for weekly base calculation
    const userRows = await db.query('SELECT monthly_income FROM users WHERE id = ?', [userId]);
    const monthlyIncome = parseFloat(userRows[0]?.monthly_income) || 0;
    const weeklyBase = Math.round((monthlyIncome / 30) * 7);

    // Current week additional income
    const currIncomeRows = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [userId, currWeek.start, currWeek.end]
    );
    const currIncome = weeklyBase + (parseFloat(currIncomeRows[0]?.total) || 0);

    // Previous week additional income
    const prevIncomeRows = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [userId, prevWeek.start, prevWeek.end]
    );
    const prevIncome = weeklyBase + (parseFloat(prevIncomeRows[0]?.total) || 0);

    // Current week expenses & count
    const currExpenseRows = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, currWeek.start, currWeek.end]
    );
    const currExpenses = parseFloat(currExpenseRows[0]?.total) || 0;
    const currCount = parseInt(currExpenseRows[0]?.count, 10) || 0;
    const currSavings = currIncome - currExpenses;
    const currAvgDaily = Math.round((currExpenses / 7) * 10) / 10;

    // Previous week expenses & count
    const prevExpenseRows = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, prevWeek.start, prevWeek.end]
    );
    const prevExpenses = parseFloat(prevExpenseRows[0]?.total) || 0;
    const prevCount = parseInt(prevExpenseRows[0]?.count, 10) || 0;
    const prevSavings = prevIncome - prevExpenses;
    const prevAvgDaily = Math.round((prevExpenses / 7) * 10) / 10;

    // Calculate changes & statements
    const hasPreviousData = prevExpenses > 0 || prevCount > 0;
    let expenseDiff = 0;
    let expenseChangePct = 0;
    let savingsDiff = 0;
    let savingsChangePct = 0;
    let expenseStatement = 'Not enough previous data for comparison.';
    let savingsStatement = 'Not enough previous data for comparison.';

    if (hasPreviousData) {
      expenseDiff = currExpenses - prevExpenses;
      expenseChangePct = calculatePercentageChange(currExpenses, prevExpenses);
      if (expenseDiff < 0) {
        expenseStatement = `You spent ${Math.abs(expenseChangePct)}% (₹${Math.abs(expenseDiff).toLocaleString('en-IN')}) less than last week.`;
      } else if (expenseDiff > 0) {
        expenseStatement = `You spent ${expenseChangePct}% (₹${expenseDiff.toLocaleString('en-IN')}) more than last week.`;
      } else {
        expenseStatement = 'Your spending is identical to last week.';
      }

      savingsDiff = currSavings - prevSavings;
      savingsChangePct = calculatePercentageChange(currSavings, prevSavings);
      if (savingsDiff > 0) {
        savingsStatement = `You saved ${Math.abs(savingsChangePct)}% (₹${savingsDiff.toLocaleString('en-IN')}) more than last week.`;
      } else if (savingsDiff < 0) {
        savingsStatement = `You saved ${Math.abs(savingsChangePct)}% (₹${Math.abs(savingsDiff).toLocaleString('en-IN')}) less than last week.`;
      } else {
        savingsStatement = 'Your savings match last week.';
      }
    }

    // Daily breakdown for Monday through Sunday for current and previous weeks
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currDaily = [0, 0, 0, 0, 0, 0, 0];
    const prevDaily = [0, 0, 0, 0, 0, 0, 0];

    const currExpensesList = await db.query(
      'SELECT amount, expense_date FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, currWeek.start, currWeek.end]
    );
    currExpensesList.forEach((e) => {
      const dayIndex = (new Date(e.expense_date).getDay() + 6) % 7; // Mon=0, Sun=6
      currDaily[dayIndex] += parseFloat(e.amount);
    });

    const prevExpensesList = await db.query(
      'SELECT amount, expense_date FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, prevWeek.start, prevWeek.end]
    );
    prevExpensesList.forEach((e) => {
      const dayIndex = (new Date(e.expense_date).getDay() + 6) % 7;
      prevDaily[dayIndex] += parseFloat(e.amount);
    });

    res.json({
      success: true,
      current_week: {
        range: `${currWeek.start} to ${currWeek.end}`,
        income: currIncome,
        expenses: currExpenses,
        savings: currSavings,
        transactions: currCount,
        average_daily_spending: currAvgDaily,
      },
      previous_week: {
        range: `${prevWeek.start} to ${prevWeek.end}`,
        income: prevIncome,
        expenses: prevExpenses,
        savings: prevSavings,
        transactions: prevCount,
        average_daily_spending: prevAvgDaily,
      },
      comparison: {
        has_previous_data: hasPreviousData,
        expense_difference: expenseDiff,
        expense_change_pct: expenseChangePct,
        savings_difference: savingsDiff,
        savings_change_pct: savingsChangePct,
        expense_statement: expenseStatement,
        savings_statement: savingsStatement,
      },
      daily_chart: {
        labels: days,
        current_week_spending: currDaily,
        previous_week_spending: prevDaily,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/monthly
async function getMonthlyAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
    const year = parseInt(req.query.year || now.getFullYear(), 10);

    const currRange = getMonthRange(year, month);

    // Calculate previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevRange = getMonthRange(prevYear, prevMonth);

    // Base user monthly income
    const userRows = await db.query('SELECT monthly_income FROM users WHERE id = ?', [userId]);
    const baseMonthly = parseFloat(userRows[0]?.monthly_income) || 0;

    // Current month additional income
    const currIncRows = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [userId, currRange.start, currRange.end]
    );
    const currTotalIncome = baseMonthly + (parseFloat(currIncRows[0]?.total) || 0);

    // Previous month additional income
    const prevIncRows = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [userId, prevRange.start, prevRange.end]
    );
    const prevTotalIncome = baseMonthly + (parseFloat(prevIncRows[0]?.total) || 0);

    // Current month expenses
    const currExpRows = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count,
              COALESCE(MAX(amount), 0) AS highest_expense
       FROM expenses
       WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?`,
      [userId, currRange.start, currRange.end]
    );
    const currTotalExpenses = parseFloat(currExpRows[0]?.total) || 0;
    const currCount = parseInt(currExpRows[0]?.count, 10) || 0;
    const highestExpense = parseFloat(currExpRows[0]?.highest_expense) || 0;
    const currSavings = currTotalIncome - currTotalExpenses;
    const surplusOrDeficit = currTotalIncome >= currTotalExpenses ? 'Surplus' : 'Deficit';
    const avgDailyExpense = Math.round((currTotalExpenses / currRange.daysInMonth) * 10) / 10;

    // Most used category
    const mostUsedCatRow = await db.query(
      `SELECT c.name, COUNT(e.id) AS count, COALESCE(SUM(e.amount), 0) AS total
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name
       ORDER BY total DESC, count DESC
       LIMIT 1`,
      [userId, currRange.start, currRange.end]
    );
    const mostUsedCategory = mostUsedCatRow[0]?.name || 'None';

    // Previous month expenses
    const prevExpRows = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM expenses
       WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?`,
      [userId, prevRange.start, prevRange.end]
    );
    const prevTotalExpenses = parseFloat(prevExpRows[0]?.total) || 0;
    const prevCount = parseInt(prevExpRows[0]?.count, 10) || 0;
    const prevSavings = prevTotalIncome - prevTotalExpenses;

    const hasPreviousData = prevTotalExpenses > 0 || prevCount > 0;
    let expenseDiff = 0;
    let expensePctChange = 0;
    let savingsDiff = 0;
    let savingsPctChange = 0;
    let incomeDiff = 0;
    let incomePctChange = 0;
    let statement = 'Not enough previous data for comparison.';

    if (hasPreviousData) {
      expenseDiff = currTotalExpenses - prevTotalExpenses;
      expensePctChange = calculatePercentageChange(currTotalExpenses, prevTotalExpenses);

      savingsDiff = currSavings - prevSavings;
      savingsPctChange = calculatePercentageChange(currSavings, prevSavings);

      incomeDiff = currTotalIncome - prevTotalIncome;
      incomePctChange = calculatePercentageChange(currTotalIncome, prevTotalIncome);

      if (expenseDiff > 0) {
        statement = `Your spending increased by ${Math.abs(expensePctChange)}% compared with last month.`;
      } else if (expenseDiff < 0) {
        statement = `Your spending decreased by ${Math.abs(expensePctChange)}% compared with last month.`;
      } else {
        statement = 'Your spending remained identical compared with last month.';
      }
    }

    // Daily spending points throughout the month
    const dailyExpenses = await db.query(
      `SELECT expense_date, SUM(amount) AS daily_total
       FROM expenses
       WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?
       GROUP BY expense_date
       ORDER BY expense_date ASC`,
      [userId, currRange.start, currRange.end]
    );

    res.json({
      success: true,
      month,
      year,
      month_name: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' }),
      current_month: {
        total_income: currTotalIncome,
        total_expenses: currTotalExpenses,
        savings: currSavings,
        status: surplusOrDeficit,
        average_daily_expense: avgDailyExpense,
        highest_expense: highestExpense,
        most_used_category: mostUsedCategory,
        transaction_count: currCount,
      },
      previous_month: {
        month: prevMonth,
        year: prevYear,
        month_name: new Date(prevYear, prevMonth - 1, 1).toLocaleString('en-US', { month: 'long' }),
        total_income: prevTotalIncome,
        total_expenses: prevTotalExpenses,
        savings: prevSavings,
      },
      comparison: {
        has_previous_data: hasPreviousData,
        expense_difference: expenseDiff,
        expense_pct_change: expensePctChange,
        savings_difference: savingsDiff,
        savings_pct_change: savingsPctChange,
        income_difference: incomeDiff,
        income_pct_change: incomePctChange,
        statement,
      },
      daily_spending: dailyExpenses,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/yearly
async function getYearlyAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear(), 10);
    const compareYear = req.query.compareYear ? parseInt(req.query.compareYear, 10) : year - 1;

    // User monthly income
    const userRows = await db.query('SELECT monthly_income FROM users WHERE id = ?', [userId]);
    const baseMonthly = parseFloat(userRows[0]?.monthly_income) || 0;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Build 12 months data for selected year
    const monthsData = [];
    let yearlyIncome = 0;
    let yearlyExpenses = 0;

    for (let m = 1; m <= 12; m++) {
      const range = getMonthRange(year, m);

      // Additional income
      const incRes = await db.query(
        'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
        [userId, range.start, range.end]
      );
      const mIncome = baseMonthly + (parseFloat(incRes[0]?.total) || 0);

      // Expenses
      const expRes = await db.query(
        'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
        [userId, range.start, range.end]
      );
      const mExpenses = parseFloat(expRes[0]?.total) || 0;
      const mSavings = mIncome - mExpenses;

      yearlyIncome += mIncome;
      yearlyExpenses += mExpenses;

      monthsData.push({
        month: m,
        month_name: monthNames[m - 1],
        income: mIncome,
        expenses: mExpenses,
        savings: mSavings,
      });
    }

    const yearlySavings = yearlyIncome - yearlyExpenses;
    const avgMonthlyExpense = Math.round((yearlyExpenses / 12) * 10) / 10;
    const avgMonthlyIncome = Math.round((yearlyIncome / 12) * 10) / 10;

    // Highest and lowest spending month
    const sortedBySpend = [...monthsData].sort((a, b) => b.expenses - a.expenses);
    const highestSpendingMonth = sortedBySpend[0]?.expenses > 0 ? sortedBySpend[0].month_name : 'N/A';
    const nonZeroSpend = monthsData.filter((m) => m.expenses > 0);
    const lowestSpendingMonth = nonZeroSpend.length > 0
      ? [...nonZeroSpend].sort((a, b) => a.expenses - b.expenses)[0].month_name
      : 'N/A';

    // Highest expense category of the year
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const topCatRes = await db.query(
      `SELECT c.name, COALESCE(SUM(e.amount), 0) AS total
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name
       ORDER BY total DESC
       LIMIT 1`,
      [userId, yearStart, yearEnd]
    );
    const highestExpenseCategory = topCatRes[0]?.name || 'N/A';

    // Year-to-year comparison with compareYear
    const compareStart = `${compareYear}-01-01`;
    const compareEnd = `${compareYear}-12-31`;

    const compExpRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, compareStart, compareEnd]
    );
    const compareExpenses = parseFloat(compExpRes[0]?.total) || 0;
    const compareCount = parseInt(compExpRes[0]?.count, 10) || 0;

    const compIncRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date <= ?',
      [userId, compareStart, compareEnd]
    );
    const compareIncome = (baseMonthly * 12) + (parseFloat(compIncRes[0]?.total) || 0);
    const compareSavings = compareIncome - compareExpenses;

    const hasCompareData = compareExpenses > 0 || compareCount > 0;
    let expenseDiff = 0;
    let expensePctChange = 0;
    let savingsDiff = 0;
    let savingsPctChange = 0;

    if (hasCompareData) {
      expenseDiff = yearlyExpenses - compareExpenses;
      expensePctChange = calculatePercentageChange(yearlyExpenses, compareExpenses);
      savingsDiff = yearlySavings - compareSavings;
      savingsPctChange = calculatePercentageChange(yearlySavings, compareSavings);
    }

    res.json({
      success: true,
      year,
      summary: {
        total_yearly_income: yearlyIncome,
        total_yearly_expenses: yearlyExpenses,
        total_yearly_savings: yearlySavings,
        average_monthly_expense: avgMonthlyExpense,
        average_monthly_income: avgMonthlyIncome,
        highest_spending_month: highestSpendingMonth,
        lowest_spending_month: lowestSpendingMonth,
        highest_expense_category: highestExpenseCategory,
      },
      months: monthsData,
      comparison: {
        compare_year: compareYear,
        has_previous_data: hasCompareData,
        current_year_expenses: yearlyExpenses,
        previous_year_expenses: compareExpenses,
        expense_difference: expenseDiff,
        expense_pct_change: expensePctChange,
        current_year_savings: yearlySavings,
        previous_year_savings: compareSavings,
        savings_difference: savingsDiff,
        savings_pct_change: savingsPctChange,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/categories
async function getCategoryAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const { startDate, endDate, month, year } = req.query;

    let start, end;
    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      const now = new Date();
      const m = month ? parseInt(month, 10) : now.getMonth() + 1;
      const y = year ? parseInt(year, 10) : now.getFullYear();
      const mr = getMonthRange(y, m);
      start = mr.start;
      end = mr.end;
    }

    const rows = await db.query(
      `SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) AS total_amount, COUNT(e.id) AS count
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ? AND e.expense_date >= ? AND e.expense_date <= ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total_amount DESC`,
      [userId, start, end]
    );

    const totalExpense = rows.reduce((acc, r) => acc + (parseFloat(r.total_amount) || 0), 0);

    const categories = rows.map((r) => {
      const amount = parseFloat(r.total_amount) || 0;
      return {
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100 * 10) / 10 : 0,
        count: parseInt(r.count, 10) || 0,
      };
    });

    const activeCategories = categories.filter((c) => c.amount > 0);
    const topCategory = activeCategories[0] || null;
    const statement = topCategory
      ? `${topCategory.name} is your highest spending category this month.`
      : 'No expense recorded in this period.';

    res.json({
      success: true,
      start_date: start,
      end_date: end,
      total_expense: totalExpense,
      top_category: topCategory,
      statement,
      categories,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/comparison
async function getComparisonAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const { period1_start, period1_end, period2_start, period2_end } = req.query;

    if (!period1_start || !period1_end || !period2_start || !period2_end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide period1_start, period1_end, period2_start, and period2_end',
      });
    }

    const p1Exp = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, period1_start, period1_end]
    );
    const p2Exp = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?',
      [userId, period2_start, period2_end]
    );

    const p1 = parseFloat(p1Exp[0]?.total) || 0;
    const p2 = parseFloat(p2Exp[0]?.total) || 0;
    const diff = p1 - p2;
    const pct = calculatePercentageChange(p1, p2);

    res.json({
      success: true,
      period1: { start: period1_start, end: period1_end, expenses: p1 },
      period2: { start: period2_start, end: period2_end, expenses: p2 },
      difference: diff,
      percentage_change: pct,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getYearlyAnalytics,
  getCategoryAnalytics,
  getComparisonAnalytics,
};
