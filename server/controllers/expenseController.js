const db = require('../config/db');

// GET /api/expenses - Fetch expenses with category details and rich filters
async function getExpenses(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      categoryId,
      paymentMethod,
      search,
      sortBy = 'expense_date',
      order = 'DESC',
      limit,
      offset,
    } = req.query;

    let sql = `
      SELECT e.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [userId];

    if (startDate) {
      sql += ' AND e.expense_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND e.expense_date <= ?';
      params.push(endDate);
    }
    if (categoryId) {
      sql += ' AND e.category_id = ?';
      params.push(categoryId);
    }
    if (paymentMethod) {
      sql += ' AND e.payment_method = ?';
      params.push(paymentMethod);
    }
    if (search) {
      sql += ' AND (e.description LIKE ? OR e.notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Safe sorting
    const validSortCols = ['expense_date', 'amount', 'created_at', 'description'];
    const sortCol = validSortCols.includes(sortBy) ? `e.${sortBy}` : 'e.expense_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortCol} ${sortOrder}, e.id DESC`;

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(offset, 10));
      }
    }

    const rows = await db.query(sql, params);

    // Get count and sum for filtered query
    let countSql = `
      SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0) as total_amount
      FROM expenses e
      WHERE e.user_id = ?
    `;
    const countParams = [userId];
    if (startDate) {
      countSql += ' AND e.expense_date >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ' AND e.expense_date <= ?';
      countParams.push(endDate);
    }
    if (categoryId) {
      countSql += ' AND e.category_id = ?';
      countParams.push(categoryId);
    }
    if (paymentMethod) {
      countSql += ' AND e.payment_method = ?';
      countParams.push(paymentMethod);
    }
    if (search) {
      countSql += ' AND (e.description LIKE ? OR e.notes LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const statsResult = await db.query(countSql, countParams);

    res.json({
      success: true,
      expenses: rows,
      total_amount: parseFloat(statsResult[0]?.total_amount) || 0,
      count: statsResult[0]?.total_count || 0,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/expenses - Add new expense
async function createExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const { amount, description, category_id, expense_date, payment_method, notes } = req.body;

    if (!amount || !description || !category_id || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount, description, category, and date',
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Verify category exists
    const catCheck = await db.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!catCheck || catCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected',
      });
    }

    const result = await db.query(
      `INSERT INTO expenses (user_id, category_id, description, amount, payment_method, expense_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        category_id,
        description.trim(),
        numAmount,
        payment_method ? payment_method.trim() : 'UPI',
        expense_date,
        notes ? notes.trim() : null,
      ]
    );

    const inserted = await db.query(
      `SELECT e.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: inserted[0],
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/expenses/:id - Update existing expense (scoped to user)
async function updateExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, description, category_id, expense_date, payment_method, notes } = req.body;

    const existing = await db.query(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found or unauthorized',
      });
    }

    const numAmount = amount !== undefined ? parseFloat(amount) : existing[0].amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    await db.query(
      `UPDATE expenses 
       SET category_id = ?, description = ?, amount = ?, payment_method = ?, expense_date = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        category_id || existing[0].category_id,
        description ? description.trim() : existing[0].description,
        numAmount,
        payment_method ? payment_method.trim() : existing[0].payment_method,
        expense_date || existing[0].expense_date,
        notes !== undefined ? notes : existing[0].notes,
        id,
        userId,
      ]
    );

    const updated = await db.query(
      `SELECT e.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/expenses/:id - Delete expense (scoped to user)
async function deleteExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found or unauthorized',
      });
    }

    await db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Expense record deleted successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
