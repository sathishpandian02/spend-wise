const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'spendwise_super_secret_jwt_key_2026_finance_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, username, password, confirmPassword, monthly_income } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Name, User ID, and Password',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if User ID already exists (case-insensitive)
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User ID already exists. Please choose another ID.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const incomeVal = parseFloat(monthly_income) || 0.00;

    // Insert user
    const insertResult = await db.query(
      'INSERT INTO users (name, username, password, monthly_income) VALUES (?, ?, ?, ?)',
      [name.trim(), username.trim(), hashedPassword, incomeVal]
    );

    const userId = insertResult.insertId;

    // Create default settings for user
    await db.query(
      'INSERT INTO settings (user_id, currency, theme, notifications_enabled, monthly_budget, savings_target) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'INR', 'dark', 1, incomeVal * 0.8, incomeVal * 0.2]
    );

    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        name: name.trim(),
        username: username.trim(),
        monthly_income: incomeVal,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide User ID and Password',
      });
    }

    const rows = await db.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid User ID or Password',
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid User ID or Password',
      });
    }

    const token = generateToken(user.id);

    // Fetch user settings
    const settingsRows = await db.query(
      'SELECT currency, theme, monthly_budget, savings_target FROM settings WHERE user_id = ?',
      [user.id]
    );
    const settings = settingsRows[0] || { currency: 'INR', theme: 'dark' };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        monthly_income: parseFloat(user.monthly_income) || 0,
        created_at: user.created_at,
        currency: settings.currency || 'INR',
        monthly_budget: parseFloat(settings.monthly_budget) || 0,
        savings_target: parseFloat(settings.savings_target) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const userRows = await db.query(
      'SELECT id, name, username, monthly_income, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRows[0];
    const settingsRows = await db.query(
      'SELECT currency, theme, notifications_enabled, monthly_budget, savings_target FROM settings WHERE user_id = ?',
      [user.id]
    );
    const settings = settingsRows[0] || { currency: 'INR', theme: 'dark', monthly_budget: 0, savings_target: 0 };

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        monthly_income: parseFloat(user.monthly_income) || 0,
        created_at: user.created_at,
        currency: settings.currency,
        theme: settings.theme,
        notifications_enabled: !!settings.notifications_enabled,
        monthly_budget: parseFloat(settings.monthly_budget) || 0,
        savings_target: parseFloat(settings.savings_target) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

module.exports = {
  register,
  login,
  getMe,
  logout,
};
