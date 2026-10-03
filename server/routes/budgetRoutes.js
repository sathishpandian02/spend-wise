const express = require('express');
const router = express.Router();
const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(createOrUpdateBudget);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
