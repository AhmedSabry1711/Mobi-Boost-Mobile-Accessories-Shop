const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

// كل مسارات العميل هنا محتاجة تسجيل دخول
router.get('/wishlist', protect, customerController.getWishlist);
router.post('/wishlist/:productId', protect, customerController.toggleWishlist);

module.exports = router;
