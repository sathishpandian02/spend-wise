const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const userRows = await db.query(
      'SELECT id, name, username, monthly_income, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const settingsRows = await db.query(
      'SELECT currency, theme, notifications_enabled, monthly_budget, savings_target FROM settings WHERE user_id = ?',
      [userId]
    );
    const settings = settingsRows[0] || {};

    // Get count of transactions & active savings goals
    const expCount = await db.query('SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', [userId]);
    const incCount = await db.query('SELECT COUNT(*) as count FROM income WHERE user_id = ?', [userId]);
    const goalCount = await db.query('SELECT COUNT(*) as count FROM savings_goals WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      profile: {
        id: userRows[0].id,
        name: userRows[0].name,
        username: userRows[0].username,
        monthly_income: parseFloat(userRows[0].monthly_income) || 0,
        created_at: userRows[0].created_at,
        currency: settings.currency || 'INR',
        theme: settings.theme || 'dark',
        notifications_enabled: !!settings.notifications_enabled,
        monthly_budget: parseFloat(settings.monthly_budget) || 0,
        savings_target: parseFloat(settings.savings_target) || 0,
        total_expenses_recorded: parseInt(expCount[0]?.count, 10) || 0,
        total_incomes_recorded: parseInt(incCount[0]?.count, 10) || 0,
        active_goals_count: parseInt(goalCount[0]?.count, 10) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/profile
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, monthly_income, currentPassword, newPassword, currency, monthly_budget, savings_target, theme } = req.body;

    const userRows = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = userRows[0];

    // If changing password, verify old password
    let updatedHashedPassword = user.password;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password',
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      const salt = await bcrypt.genSalt(10);
      updatedHashedPassword = await bcrypt.hash(newPassword, salt);
    }

    const updatedName = name ? name.trim() : user.name;
    const updatedIncome = monthly_income !== undefined ? parseFloat(monthly_income) : user.monthly_income;

    await db.query(
      `UPDATE users 
       SET name = ?, monthly_income = ?, password = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updatedName, updatedIncome, updatedHashedPassword, userId]
    );

    // Update settings if provided
    if (currency || monthly_budget !== undefined || savings_target !== undefined || theme !== undefined) {
      const currentSettings = await db.query('SELECT * FROM settings WHERE user_id = ?', [userId]);
      const cur = currency || currentSettings[0]?.currency || 'INR';
      const thm = theme || currentSettings[0]?.theme || 'dark';
      const mBudget = monthly_budget !== undefined ? parseFloat(monthly_budget) : (currentSettings[0]?.monthly_budget || 0);
      const sTarget = savings_target !== undefined ? parseFloat(savings_target) : (currentSettings[0]?.savings_target || 0);

      if (currentSettings && currentSettings.length > 0) {
        await db.query(
          'UPDATE settings SET currency = ?, theme = ?, monthly_budget = ?, savings_target = ? WHERE user_id = ?',
          [cur, thm, mBudget, sTarget, userId]
        );
      } else {
        await db.query(
          'INSERT INTO settings (user_id, currency, theme, monthly_budget, savings_target) VALUES (?, ?, ?, ?, ?)',
          [userId, cur, thm, mBudget, sTarget]
        );
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userId,
        name: updatedName,
        username: user.username,
        monthly_income: updatedIncome,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
