const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'عنوان العرض مطلوب'], trim: true }, // اللي بيظهر للعميل زي "اشتري 2 واحصل على الثالث مجاناً"

  // نوع العرض:
  // buy_x_get_y_free -> اشتري X من نفس المنتج واحصل على Y مجاناً
  // free_shipping     -> توصيل مجاني عند الوصول لعدد قطع أو مبلغ معين
  // percentage_off     -> خصم نسبة مئوية من إجمالي السلة
  // fixed_off          -> خصم مبلغ ثابت من إجمالي السلة
  type: {
    type: String,
    required: true,
    enum: ['buy_x_get_y_free', 'free_shipping', 'percentage_off', 'fixed_off']
  },

  // نطاق تطبيق العرض: على كل المنتجات، أو على قسم معين بس
  scope: { type: String, enum: ['all', 'category'], default: 'all' },
  categoryTarget: { type: String, default: '' }, // مطلوب لو scope = category

  // خاص بـ buy_x_get_y_free
  buyQty: { type: Number, default: 2, min: 1 },
  freeQty: { type: Number, default: 1, min: 1 },

  // شرط التفعيل لـ free_shipping / percentage_off / fixed_off (أي منهم يتحقق يفعّل العرض)
  minQty: { type: Number, default: 0, min: 0 },     // أقل عدد قطع في السلة (0 = بدون شرط عدد)
  minAmount: { type: Number, default: 0, min: 0 },  // أقل قيمة سلة بالجنيه (0 = بدون شرط مبلغ)

  // خاص بـ percentage_off / fixed_off
  discountValue: { type: Number, default: 0, min: 0 },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);
