const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', shippingController.getShippingFee);
router.patch('/', protect, adminOnly, shippingController.updateShippingFee);

module.exports = router;
