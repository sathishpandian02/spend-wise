const db = require('../config/db');

// GET /api/categories
async function getCategories(req, res, next) {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
};
