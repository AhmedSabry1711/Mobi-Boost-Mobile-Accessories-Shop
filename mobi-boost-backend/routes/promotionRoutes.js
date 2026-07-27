const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// عام - العروض الفعالة بس (يستخدمها الموقع للعرض للعميل)
router.get('/active', promotionController.getActivePromotions);

// أدمن فقط
router.get('/', protect, adminOnly, promotionController.getAllPromotions);
router.post('/', protect, adminOnly, promotionController.addPromotion);
router.patch('/:id', protect, adminOnly, promotionController.updatePromotion);
router.delete('/:id', protect, adminOnly, promotionController.deletePromotion);

module.exports = router;
