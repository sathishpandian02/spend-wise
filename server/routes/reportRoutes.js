const express = require('express');
const router = express.Router();
const {
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);

module.exports = router;
