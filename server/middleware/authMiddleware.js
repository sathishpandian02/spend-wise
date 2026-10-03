const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token provided',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'spendwise_super_secret_jwt_key_2026_finance_secure'
      );

      const rows = await db.query(
        'SELECT id, name, username, monthly_income, created_at FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists',
        });
      }

      req.user = rows[0];
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, authorization header missing',
    });
  }
}

module.exports = { protect };
