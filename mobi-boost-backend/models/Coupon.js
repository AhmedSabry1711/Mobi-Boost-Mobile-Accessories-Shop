const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'كود الخصم مطلوب'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountPercentage: { type: Number, required: [true, 'نسبة الخصم مطلوبة'], min: 1, max: 100 },
  minAmount: { type: Number, default: 0, min: 0 },
  maxUses: { type: Number, default: 0, min: 0 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);
