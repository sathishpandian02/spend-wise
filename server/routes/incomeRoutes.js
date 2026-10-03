const express = require('express');
const router = express.Router();
const {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // all income routes protected

router.route('/')
  .get(getIncomes)
  .post(createIncome);

router.route('/:id')
  .put(updateIncome)
  .delete(deleteIncome);

module.exports = router;
