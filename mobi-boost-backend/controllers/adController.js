const Ad = require('../models/Ad');

const toClientShape = (a) => ({
  id: a._id.toString(),
  title: a.title,
  image: a.image,
  productId: a.productId ? a.productId.toString() : null
});

exports.getAds = async (req, res, next) => {
  try {
    const ads = await Ad.find().sort({ createdAt: 1 });
    res.json(ads.map(toClientShape));
  } catch (error) {
    next(error);
  }
};

exports.addAd = async (req, res, next) => {
  try {
    const { title, image, productId } = req.body;
    if (!title || !image) {
      return res.status(400).json({ message: '⚠️ العنوان والصورة/الـ GIF مطلوبين' });
    }
    const ad = await Ad.create({ title, image, productId: productId || null });
    res.status(201).json({ message: '🎬 تم إضافة الإعلان بنجاح', ad: toClientShape(ad) });
  } catch (error) {
    next(error);
  }
};

exports.deleteAd = async (req, res, next) => {
  try {
    const deleted = await Ad.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '⚠️ الإعلان غير موجود' });
    res.json({ message: '🗑️ تم حذف الإعلان بنجاح' });
  } catch (error) {
    next(error);
  }
};