const Coupon = require('../models/Coupon');

const toClientShape = (c) => ({
  id: c._id.toString(),
  code: c.code,
  discountPercentage: c.discountPercentage,
  minAmount: c.minAmount,
  maxUses: c.maxUses,
  usedCount: c.usedCount,
  expiresAt: c.expiresAt,
  isActive: c.isActive
});

exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons.map(toClientShape));
  } catch (error) {
    next(error);
  }
};

exports.addCoupon = async (req, res, next) => {
  try {
    const { code, discountPercentage, minAmount, maxUses, expiresAt } = req.body;

    if (!code || !discountPercentage) {
      return res.status(400).json({ message: '⚠️ كود الخصم ونسبة الخصم مطلوبين' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountPercentage,
      minAmount: minAmount || 0,
      maxUses: maxUses || 0,
      expiresAt: expiresAt || null
    });

    res.status(201).json({ message: '🏷️ تم إضافة الكود بنجاح', coupon: toClientShape(coupon) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '⚠️ الكود ده مستخدم بالفعل، اختار كود تاني' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: '⚠️ الكود غير موجود' });

    const fields = ['discountPercentage', 'minAmount', 'maxUses', 'expiresAt', 'isActive'];
    fields.forEach(f => { if (req.body[f] !== undefined) coupon[f] = req.body[f]; });

    await coupon.save();
    res.json({ message: '✏️ تم تحديث الكود بنجاح', coupon: toClientShape(coupon) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '⚠️ الكود غير موجود' });
    res.json({ message: '🗑️ تم حذف الكود بنجاح' });
  } catch (error) {
    next(error);
  }
};

exports.validateCouponForAmount = async (code, subtotalAfterOtherDiscounts) => {
  if (!code) return { coupon: null, error: null };

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) return { coupon: null, error: 'كود الخصم غير موجود' };
  if (!coupon.isActive) return { coupon: null, error: 'كود الخصم ده متوقف حالياً' };
  if (coupon.expiresAt && new Date() > coupon.expiresAt) return { coupon: null, error: 'انتهت صلاحية كود الخصم ده' };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { coupon: null, error: 'كود الخصم ده وصل للحد الأقصى من الاستخدام' };
  if (coupon.minAmount > 0 && subtotalAfterOtherDiscounts < coupon.minAmount) {
    return { coupon: null, error: `الكود ده يتطلب حد أدنى ${coupon.minAmount} ج.م` };
  }

  return { coupon, error: null };
};
