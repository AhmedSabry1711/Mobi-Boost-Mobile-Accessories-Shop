const Review = require('../models/Review');
const Product = require('../models/Product');

// إعادة حساب متوسط التقييم وعدد المراجعات لمنتج معين وتحديثهم في المنتج نفسه (كاش سريع)
const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const reviewCount = stats.length > 0 ? stats[0].count : 0;

  await Product.findByIdAndUpdate(productId, { avgRating, reviewCount });
  return { avgRating, reviewCount };
};

// 1️⃣ جلب كل مراجعات منتج معين (عام - لأي زائر)
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews.map(r => ({
      id: r._id.toString(),
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt
    })));
  } catch (error) {
    next(error);
  }
};

// 2️⃣ إضافة أو تعديل مراجعة (لازم يكون العميل مسجل دخول)
exports.addOrUpdateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: '⚠️ التقييم لازم يكون رقم من 1 إلى 5' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '⚠️ المنتج غير موجود' });
    }

    // نحتاج اسم العميل من قاعدة البيانات (مش من الفرونت) عشان الأمان
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ message: '⚠️ الحساب غير موجود' });
    }

    const review = await Review.findOneAndUpdate(
      { product: productId, customer: req.userId },
      { rating, comment: comment || '', customerName: customer.name },
      { new: true, upsert: true, runValidators: true }
    );

    const { avgRating, reviewCount } = await recalculateProductRating(productId);

    res.status(201).json({
      message: '⭐ تم حفظ تقييمك بنجاح، شكراً لمشاركتك',
      review: { id: review._id.toString(), customerName: review.customerName, rating: review.rating, comment: review.comment, createdAt: review.createdAt },
      avgRating,
      reviewCount
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

// 3️⃣ حذف مراجعة (العميل صاحبها بس أو الأدمن)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: '⚠️ المراجعة غير موجودة' });

    const isOwner = review.customer.toString() === req.userId;
    const isAdmin = req.userRole === 'admin' || req.userRole === 'manager';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '🚫 غير مصرح لك بحذف هذه المراجعة' });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.json({ message: '🗑️ تم حذف المراجعة' });
  } catch (error) {
    next(error);
  }
};
