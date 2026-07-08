const Product = require('../models/Product');

const toClientShape = (p) => ({
  id: p._id.toString(),
  category: p.category,
  nameAr: p.nameAr,
  nameEn: p.nameEn,
  descAr: p.descAr,
  descEn: p.descEn,
  price: p.price,
  oldPrice: p.oldPrice,
  discount: p.discount,
  stock: p.stock,
  variants: (p.variants || []).map(v => ({ color: v.color, img: v.img })),
  devices: (p.devices || []).map(d => ({
    deviceName: d.deviceName,
    variants: d.variants.map(v => ({ color: v.color, img: v.img }))
  }))
});

exports.addProduct = async (req, res, next) => {
  try {
    const { category, nameAr, nameEn, descAr, descEn, price, oldPrice, discount, stock, variants, devices, costPrice } = req.body;

    const hasVariants = Array.isArray(variants) && variants.length > 0;
    const hasDevices = Array.isArray(devices) && devices.length > 0;

    if (!nameAr || price === undefined || stock === undefined || (!hasVariants && !hasDevices)) {
      return res.status(400).json({ message: '⚠️ برجاء إرسال كل الحقول المطلوبة (الاسم، السعر، الكمية، ولون واحد على الأقل أو جهاز واحد على الأقل)' });
    }

    const product = new Product({
      category, nameAr, nameEn, descAr, descEn,
      price, oldPrice: oldPrice || 0, discount: discount || '0%',
      stock, costPrice: costPrice || 0,
      variants: hasVariants ? variants : [],
      devices: hasDevices ? devices : []
    });

    await product.save();
    res.status(201).json({ message: '📦 تم إضافة المنتج بنجاح', product: toClientShape(product) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products.map(toClientShape));
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { category, nameAr, nameEn, descAr, descEn, price, oldPrice, discount, stock, variants, devices, costPrice } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: '⚠️ المنتج غير موجود' });

    if (category !== undefined) product.category = category;
    if (nameAr !== undefined) product.nameAr = nameAr;
    if (nameEn !== undefined) product.nameEn = nameEn;
    if (descAr !== undefined) product.descAr = descAr;
    if (descEn !== undefined) product.descEn = descEn;
    if (price !== undefined) product.price = price;
    if (oldPrice !== undefined) product.oldPrice = oldPrice;
    if (discount !== undefined) product.discount = discount;
    if (stock !== undefined) product.stock = stock;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (Array.isArray(variants)) product.variants = variants;
    if (Array.isArray(devices)) product.devices = devices;

    await product.save();
    res.json({ message: '✏️ تم تحديث المنتج بنجاح', product: toClientShape(product) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: '⚠️ المنتج غير موجود' });
    res.json({ message: '🗑️ تم حذف المنتج بنجاح' });
  } catch (error) {
    next(error);
  }
};