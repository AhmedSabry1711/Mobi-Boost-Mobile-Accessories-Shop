const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// جلب كل المنتجات
router.get('/', productController.getProducts);

// إضافة منتج جديد (الأدمن بس)
router.post('/', protect, adminOnly, productController.addProduct);

// تعديل منتج موجود (الأدمن بس)
router.patch('/:id', protect, adminOnly, productController.updateProduct);

// حذف منتج (الأدمن بس)
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;