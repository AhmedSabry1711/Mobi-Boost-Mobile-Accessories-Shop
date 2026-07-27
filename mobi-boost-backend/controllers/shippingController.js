const ShippingSetting = require('../models/ShippingSetting');

// جلب رسوم الشحن الحالية (عام - الموقع محتاجها في السلة)
exports.getShippingFee = async (req, res, next) => {
  try {
    let setting = await ShippingSetting.findOne();
    if (!setting) setting = await ShippingSetting.create({ defaultFee: 0 });
    res.json({ defaultFee: setting.defaultFee });
  } catch (error) {
    next(error);
  }
};

// تحديث رسوم الشحن (أدمن فقط)
exports.updateShippingFee = async (req, res, next) => {
  try {
    const { defaultFee } = req.body;
    if (defaultFee === undefined || defaultFee < 0) {
      return res.status(400).json({ message: '⚠️ قيمة رسوم الشحن غير صحيحة' });
    }

    let setting = await ShippingSetting.findOne();
    if (!setting) {
      setting = await ShippingSetting.create({ defaultFee });
    } else {
      setting.defaultFee = defaultFee;
      await setting.save();
    }

    res.json({ message: '🚚 تم تحديث رسوم الشحن بنجاح', defaultFee: setting.defaultFee });
  } catch (error) {
    next(error);
  }
};
