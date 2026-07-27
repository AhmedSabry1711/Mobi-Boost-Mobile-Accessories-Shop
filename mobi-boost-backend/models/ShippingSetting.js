const mongoose = require('mongoose');

// إعدادات الشحن - مستند واحد فقط بيتحدث (مش قائمة)، الأدمن بيتحكم فيه من لوحة التحكم
const ShippingSettingSchema = new mongoose.Schema({
  defaultFee: { type: Number, default: 0, min: 0 } // رسوم التوصيل الافتراضية بالجنيه المصري
}, { timestamps: true });

module.exports = mongoose.model('ShippingSetting', ShippingSettingSchema);
