const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/today', protect, adminOnly, financeController.getTodaySummary);
router.get('/history', protect, adminOnly, financeController.getAllLogs);
router.get('/dashboard', protect, adminOnly, financeController.getDashboardStats);

module.exports = router;
