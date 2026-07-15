const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

// جلب مراجعات منتج معين - عام لأي زائر
router.get('/:productId', reviewController.getProductReviews);

// إضافة أو تعديل مراجعة - لازم تسجيل دخول
router.post('/:productId', protect, reviewController.addOrUpdateReview);

// حذف مراجعة
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;
