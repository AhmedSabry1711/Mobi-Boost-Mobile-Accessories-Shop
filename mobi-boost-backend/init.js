const fs = require('fs');
const path = require('path');

// 1. قائمة الفولدرات المراد إنشاؤها
const folders = [
  'config',
  'models',
  'controllers',
  'routes',
  'middlewares',
  'services',
  'utils'
];

// 2. قائمة الملفات ومساراتها
const files = [
  'config/db.js',
  'models/Product.js',
  'models/Customer.js',
  'models/Order.js',
  'models/FinancialLog.js',
  'controllers/authController.js',
  'controllers/productController.js',
  'controllers/orderController.js',
  'controllers/financeController.js',
  'routes/authRoutes.js',
  'routes/productRoutes.js',
  'routes/orderRoutes.js',
  'routes/financeRoutes.js',
  'middlewares/authMiddleware.js',
  'middlewares/errorHandler.js',
  'services/emailService.js',
  'services/financeService.js',
  'utils/generateOrderId.js',
  '.env',
  '.gitignore',
  'server.js'
];

console.log('📁 جاري إنشاء هيكل مشروع MoBi Boost...');

// إنشاء الفولدرات
folders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ تم إنشاء الفولدر: ${folder}`);
  }
});

// إنشاء الملفات فاضية
files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
    console.log(`📄 تم إنشاء الملف: ${file}`);
  }
});

console.log('🚀 عظمة! الهيكل بالكامل جاهز الآن للشغل.');