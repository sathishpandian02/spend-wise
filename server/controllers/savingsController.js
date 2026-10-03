const db = require('../config/db');

// GET /api/savings-goals - Fetch all savings goals for user with calculated progress
async function getSavingsGoals(req, res, next) {
  try {
    const userId = req.user.id;
    const goals = await db.query(
      'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY target_date ASC, id DESC',
      [userId]
    );

    const calculated = goals.map((g) => {
      const target = parseFloat(g.target_amount) || 0;
      const current = parseFloat(g.current_amount) || 0;
      const remaining = Math.max(0, target - current);
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100 * 10) / 10) : 0;
      const isCompleted = current >= target;

      return {
        id: g.id,
        name: g.name,
        target_amount: target,
        current_amount: current,
        remaining,
        progress,
        isCompleted,
        target_date: g.target_date,
        created_at: g.created_at,
        updated_at: g.updated_at,
      };
    });

    const totalTarget = calculated.reduce((acc, g) => acc + g.target_amount, 0);
    const totalSaved = calculated.reduce((acc, g) => acc + g.current_amount, 0);

    res.json({
      success: true,
      goals: calculated,
      total_target: totalTarget,
      total_saved: totalSaved,
      overall_progress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100 * 10) / 10 : 0,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/savings-goals - Create goal
async function createSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, target_amount, current_amount = 0, target_date } = req.body;

    if (!name || target_amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide goal name and target amount',
      });
    }

    const numTarget = parseFloat(target_amount);
    const numCurrent = parseFloat(current_amount) || 0;

    if (isNaN(numTarget) || numTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be a positive number',
      });
    }

    const result = await db.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name.trim(), numTarget, Math.max(0, numCurrent), target_date || null]
    );

    const inserted = await db.query('SELECT * FROM savings_goals WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      goal: inserted[0],
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/savings-goals/:id - Update goal or add money
async function updateSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, target_amount, current_amount, add_amount, target_date } = req.body;

    const existing = await db.query(
      'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized',
      });
    }

    let finalCurrent = existing[0].current_amount;
    if (add_amount !== undefined) {
      const added = parseFloat(add_amount);
      if (!isNaN(added)) {
        finalCurrent = Math.max(0, parseFloat(finalCurrent) + added);
      }
    } else if (current_amount !== undefined) {
      const parsedCurrent = parseFloat(current_amount);
      if (!isNaN(parsedCurrent)) {
        finalCurrent = Math.max(0, parsedCurrent);
      }
    }

    const numTarget = target_amount !== undefined ? parseFloat(target_amount) : existing[0].target_amount;
    const finalName = name !== undefined ? name.trim() : existing[0].name;
    const finalDate = target_date !== undefined ? target_date : existing[0].target_date;

    await db.query(
      `UPDATE savings_goals
       SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [finalName, numTarget, finalCurrent, finalDate, id, userId]
    );

    const updated = await db.query('SELECT * FROM savings_goals WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Savings goal updated successfully',
      goal: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/savings-goals/:id
async function deleteSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query(
      'SELECT id FROM savings_goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized',
      });
    }

    await db.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Savings goal deleted successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
};
