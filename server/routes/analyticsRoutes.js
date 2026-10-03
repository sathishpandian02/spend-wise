const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getYearlyAnalytics,
  getCategoryAnalytics,
  getComparisonAnalytics,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/yearly', getYearlyAnalytics);
router.get('/categories', getCategoryAnalytics);
router.get('/comparison', getComparisonAnalytics);

module.exports = router;
