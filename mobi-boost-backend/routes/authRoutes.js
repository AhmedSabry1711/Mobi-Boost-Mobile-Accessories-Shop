const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 👥 مسارات العميل (Customers)
router.post('/register', authController.register);
router.post('/login', authController.login);

// 🛡️ مسارات المسؤول (Admins) - دي اللي الصفحة الجديدة بتكلمها
router.post('/create-admin', authController.createAdmin); // لإنشاء أدمن جديد
router.post('/admin-login', authController.adminLogin);   // لتسجيل دخول الأدمن

module.exports = router;