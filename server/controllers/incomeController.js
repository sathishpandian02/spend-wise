const db = require('../config/db');

// GET /api/income - Fetch all incomes for logged-in user with optional filters
async function getIncomes(req, res, next) {
  try {
    const userId = req.user.id;
    const { startDate, endDate, source, search, limit, offset } = req.query;

    let sql = 'SELECT * FROM income WHERE user_id = ?';
    const params = [userId];

    if (startDate) {
      sql += ' AND income_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND income_date <= ?';
      params.push(endDate);
    }
    if (source) {
      sql += ' AND source = ?';
      params.push(source);
    }
    if (search) {
      sql += ' AND (source LIKE ? OR notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY income_date DESC, id DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(offset, 10));
      }
    }

    const rows = await db.query(sql, params);

    // Also get total count & sum
    const sumResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total_additional_income, COUNT(*) as count FROM income WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      incomes: rows,
      total_additional_income: parseFloat(sumResult[0]?.total_additional_income) || 0,
      count: sumResult[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/income - Add new income entry
async function createIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { source, amount, income_date, notes } = req.body;

    if (!source || !amount || !income_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide source, amount, and income date',
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const result = await db.query(
      'INSERT INTO income (user_id, source, amount, income_date, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, source.trim(), numAmount, income_date, notes ? notes.trim() : null]
    );

    const inserted = await db.query('SELECT * FROM income WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      income: inserted[0],
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/income/:id - Edit income entry (scoped to user)
async function updateIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { source, amount, income_date, notes } = req.body;

    // Check ownership
    const existing = await db.query(
      'SELECT * FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found or unauthorized',
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
      `UPDATE income 
       SET source = ?, amount = ?, income_date = ?, notes = ? 
       WHERE id = ? AND user_id = ?`,
      [
        source ? source.trim() : existing[0].source,
        numAmount,
        income_date || existing[0].income_date,
        notes !== undefined ? notes : existing[0].notes,
        id,
        userId,
      ]
    );

    const updated = await db.query('SELECT * FROM income WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Income updated successfully',
      income: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/income/:id - Delete income entry (scoped to user)
async function deleteIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query(
      'SELECT id FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found or unauthorized',
      });
    }

    await db.query('DELETE FROM income WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Income record deleted successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
};
