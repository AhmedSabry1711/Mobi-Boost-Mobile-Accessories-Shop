const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// حساب مبدئي للسلة (عام - مش محتاج تسجيل دخول، يستخدم لعرض الأسعار والخصومات قبل الشراء)
router.post('/calculate', orderController.calculateCart);

router.post('/', protect, orderController.createOrder);
router.get('/mine', protect, orderController.getMyOrders);
router.get('/', protect, adminOnly, orderController.getAllOrders);
router.patch('/:orderNumber/status', protect, adminOnly, orderController.updateOrderStatus);

module.exports = router;
