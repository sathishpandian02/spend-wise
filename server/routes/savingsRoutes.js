const express = require('express');
const router = express.Router();
const {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} = require('../controllers/savingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSavingsGoals)
  .post(createSavingsGoal);

router.route('/:id')
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

module.exports = router;
