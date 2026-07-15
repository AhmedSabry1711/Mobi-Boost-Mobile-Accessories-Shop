const Customer = require('../models/Customer');

// 1️⃣ جلب قائمة المفضلة الكاملة (آيديات المنتجات) للعميل الحالي
exports.getWishlist = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId).select('wishlist');
    if (!customer) return res.status(404).json({ message: '⚠️ الحساب غير موجود' });
    res.json(customer.wishlist.map(id => id.toString()));
  } catch (error) {
    next(error);
  }
};

// 2️⃣ إضافة/إزالة منتج من المفضلة (Toggle) - أبسط شكل للفرونت إند
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const customer = await Customer.findById(req.userId);
    if (!customer) return res.status(404).json({ message: '⚠️ الحساب غير موجود' });

    const idx = customer.wishlist.findIndex(id => id.toString() === productId);
    let added;
    if (idx === -1) {
      customer.wishlist.push(productId);
      added = true;
    } else {
      customer.wishlist.splice(idx, 1);
      added = false;
    }

    await customer.save();
    res.json({
      message: added ? '❤️ تمت الإضافة للمفضلة' : '💔 تمت الإزالة من المفضلة',
      added,
      wishlist: customer.wishlist.map(id => id.toString())
    });
  } catch (error) {
    next(error);
  }
};
