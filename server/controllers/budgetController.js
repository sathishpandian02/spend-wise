const db = require('../config/db');

// Status threshold logic
function getBudgetStatus(percentage) {
  if (percentage >= 100) return 'Exceeded';
  if (percentage >= 90) return 'Critical';
  if (percentage >= 70) return 'Warning';
  return 'Safe';
}

// GET /api/budgets - Fetch budgets for user for specific month & year with real-time usage calculation
async function getBudgets(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
    const year = parseInt(req.query.year || now.getFullYear(), 10);

    // Month formatting (e.g. '2026-10-01' to '2026-10-31')
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const startDate = `${year}-${monthStr}-01`;
    // Last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${lastDay < 10 ? '0' + lastDay : lastDay}`;

    // Get all defined budgets for this month/year
    const budgets = await db.query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?
       ORDER BY (b.category_id IS NULL) DESC, c.name ASC`,
      [userId, month, year]
    );

    // Calculate real-time actual spending from expenses
    const categorySpending = await db.query(
      `SELECT category_id, COALESCE(SUM(amount), 0) AS total_spent
       FROM expenses
       WHERE user_id = ? AND expense_date >= ? AND expense_date <= ?
       GROUP BY category_id`,
      [userId, startDate, endDate]
    );

    const spendMap = {};
    let totalMonthlySpent = 0;
    categorySpending.forEach((row) => {
      const spent = parseFloat(row.total_spent) || 0;
      spendMap[row.category_id] = spent;
      totalMonthlySpent += spent;
    });

    const enrichedBudgets = budgets.map((b) => {
      const budgetAmount = parseFloat(b.amount) || 0;
      const spent = b.category_id ? (spendMap[b.category_id] || 0) : totalMonthlySpent;
      const remaining = Math.max(0, budgetAmount - spent);
      const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100 * 10) / 10 : 0;
      const status = getBudgetStatus(percentage);

      return {
        id: b.id,
        user_id: b.user_id,
        category_id: b.category_id,
        category_name: b.category_name || 'Overall Monthly Budget',
        category_icon: b.category_icon || 'PiggyBank',
        category_color: b.category_color || '#6366f1',
        month: b.month,
        year: b.year,
        amount: budgetAmount,
        spent,
        remaining,
        percentage,
        status,
      };
    });

    // Also get overall month summary
    const overallBudget = enrichedBudgets.find((b) => b.category_id === null);

    res.json({
      success: true,
      month,
      year,
      budgets: enrichedBudgets,
      total_budget: overallBudget ? overallBudget.amount : enrichedBudgets.reduce((acc, b) => acc + (b.category_id ? b.amount : 0), 0),
      total_spent: totalMonthlySpent,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/budgets - Set or update budget for overall month or category
async function createOrUpdateBudget(req, res, next) {
  try {
    const userId = req.user.id;
    const { category_id, month, year, amount } = req.body;

    if (!month || !year || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month, year, and budget amount',
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget amount must be a non-negative number',
      });
    }

    const catId = category_id ? parseInt(category_id, 10) : null;

    // Check if budget exists for this user, category, month, and year
    let checkSql = 'SELECT id FROM budgets WHERE user_id = ? AND month = ? AND year = ? AND ';
    let checkParams = [userId, parseInt(month, 10), parseInt(year, 10)];
    if (catId === null) {
      checkSql += 'category_id IS NULL';
    } else {
      checkSql += 'category_id = ?';
      checkParams.push(catId);
    }

    const existing = await db.query(checkSql, checkParams);

    if (existing && existing.length > 0) {
      // Update
      await db.query(
        'UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?',
        [numAmount, existing[0].id, userId]
      );

      return res.json({
        success: true,
        message: 'Budget updated successfully',
        id: existing[0].id,
      });
    } else {
      // Insert
      const result = await db.query(
        'INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)',
        [userId, catId, parseInt(month, 10), parseInt(year, 10), numAmount]
      );

      return res.status(201).json({
        success: true,
        message: 'Budget set successfully',
        id: result.insertId,
      });
    }
  } catch (error) {
    next(error);
  }
}

// DELETE /api/budgets/:id
async function deleteBudget(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query('SELECT id FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget record not found or unauthorized',
      });
    }

    await db.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Budget removed successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
};
