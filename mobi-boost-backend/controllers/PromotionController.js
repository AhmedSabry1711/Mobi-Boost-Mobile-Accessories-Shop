const Promotion = require('../models/Promotion');

const toClientShape = (p) => ({
  id: p._id.toString(),
  title: p.title,
  type: p.type,
  scope: p.scope,
  categoryTarget: p.categoryTarget,
  buyQty: p.buyQty,
  freeQty: p.freeQty,
  minQty: p.minQty,
  minAmount: p.minAmount,
  discountValue: p.discountValue,
  isActive: p.isActive
});

// 1️⃣ جلب كل العروض (أدمن فقط - عشان يديره)
exports.getAllPromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.json(promotions.map(toClientShape));
  } catch (error) {
    next(error);
  }
};

// 2️⃣ جلب العروض الفعالة بس (عام - يستخدمها الموقع لعرض البادجات والخصومات)
exports.getActivePromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find({ isActive: true });
    res.json(promotions.map(toClientShape));
  } catch (error) {
    next(error);
  }
};

// 3️⃣ إضافة عرض جديد (أدمن فقط)
exports.addPromotion = async (req, res, next) => {
  try {
    const { title, type, scope, categoryTarget, buyQty, freeQty, minQty, minAmount, discountValue } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: '⚠️ عنوان العرض ونوعه مطلوبين' });
    }
    if (scope === 'category' && !categoryTarget) {
      return res.status(400).json({ message: '⚠️ برجاء تحديد القسم المستهدف بالعرض' });
    }

    const promotion = await Promotion.create({
      title, type,
      scope: scope || 'all',
      categoryTarget: categoryTarget || '',
      buyQty: buyQty || 2,
      freeQty: freeQty || 1,
      minQty: minQty || 0,
      minAmount: minAmount || 0,
      discountValue: discountValue || 0
    });

    res.status(201).json({ message: '🎁 تم إضافة العرض بنجاح', promotion: toClientShape(promotion) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

// 4️⃣ تعديل عرض (أدمن فقط) - بيستخدم برضو لتفعيل/إيقاف العرض بسرعة
exports.updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).json({ message: '⚠️ العرض غير موجود' });

    const fields = ['title', 'type', 'scope', 'categoryTarget', 'buyQty', 'freeQty', 'minQty', 'minAmount', 'discountValue', 'isActive'];
    fields.forEach(f => { if (req.body[f] !== undefined) promotion[f] = req.body[f]; });

    await promotion.save();
    res.json({ message: '✏️ تم تحديث العرض بنجاح', promotion: toClientShape(promotion) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

// 5️⃣ حذف عرض (أدمن فقط)
exports.deletePromotion = async (req, res, next) => {
  try {
    const deleted = await Promotion.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '⚠️ العرض غير موجود' });
    res.json({ message: '🗑️ تم حذف العرض بنجاح' });
  } catch (error) {
    next(error);
  }
};
