const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config({ quiet: true }); // إيقاف رسائل الـ tips التسويقية اللي بتطبعها مكتبة dotenv في الكونسول
connectDB();

const app = express();

// في بيئة الإنتاج حدد CORS_ORIGIN في .env برابط الفرونت إند المنشور (مثال: https://mobiboost.com)
// لو مش محدد بيسمح للكل، مفيد أثناء التطوير المحلي بس
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

console.log('🔄 [1] جاري فحص ملف الـ Auth...');
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

console.log('🔄 [2] جاري فحص ملف الـ Products...');
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

console.log('🔄 [3] جاري فحص ملف الـ Orders...');
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

console.log('🔄 [4] جاري فحص ملف الـ Finance...');
const financeRoutes = require('./routes/financeRoutes');
app.use('/api/analytics', financeRoutes);

console.log('🔄 [5] جاري فحص ملف الـ Ads...');
const adRoutes = require('./routes/adRoutes');
app.use('/api/ads', adRoutes);

console.log('🔄 [6] جاري فحص ملف الـ Reviews...');
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

console.log('🔄 [7] جاري فحص ملف الـ Customer (Wishlist)...');
const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customer', customerRoutes);

console.log('🔄 [8] جاري فحص ملف الـ Promotions...');
const promotionRoutes = require('./routes/promotionRoutes');
app.use('/api/promotions', promotionRoutes);

console.log('🔄 [9] جاري فحص ملف الـ Shipping...');
const shippingRoutes = require('./routes/shippingRoutes');
app.use('/api/shipping', shippingRoutes);

console.log('🔄 [10] جاري فحص ملف الـ Coupons...');
const couponRoutes = require('./routes/couponRoutes');
app.use('/api/coupons', couponRoutes);

app.get('/', (req, res) => {
  res.send('🚀 MoBi Boost Backend Server is Running Smoothly!');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server is fired up and running on port: ${PORT}`);
});