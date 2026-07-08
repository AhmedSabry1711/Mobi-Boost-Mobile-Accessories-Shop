const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', adController.getAds);
router.post('/', protect, adminOnly, adController.addAd);
router.delete('/:id', protect, adminOnly, adController.deleteAd);

module.exports = router;