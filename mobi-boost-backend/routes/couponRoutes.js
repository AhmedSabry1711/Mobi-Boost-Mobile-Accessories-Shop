const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', protect, adminOnly, couponController.getAllCoupons);
router.post('/', protect, adminOnly, couponController.addCoupon);
router.patch('/:id', protect, adminOnly, couponController.updateCoupon);
router.delete('/:id', protect, adminOnly, couponController.deleteCoupon);

module.exports = router;
