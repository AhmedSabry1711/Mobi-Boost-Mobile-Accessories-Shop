const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const newCustomer = new Customer({ name, email, password, phone, address });
    await newCustomer.save();

    const token = signToken(newCustomer._id, 'user');

    res.status(201).json({
      message: "تم تسجيل الحساب بنجاح! 🎉",
      token,
      customer: {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address
      }
    });

  } catch (error) {
    if (error.code === 11000 && error.keyValue?.email) {
      return res.status(400).json({
        message: "الاكونت دا موجود بالفعل",
        redirectToLogin: true
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }

    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ message: "خطأ في البريد الإلكتروني أو كلمة المرور" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "خطأ في البريد الإلكتروني أو كلمة المرور" });
    }

    const token = signToken(customer._id, 'user');

    res.status(200).json({
      message: "تم تسجيل الدخول بنجاح 🎉",
      token,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, username, password, jobTitle, phone } = req.body;

    const newAdmin = new Admin({ name, username, password, jobTitle, phone });
    await newAdmin.save();

    res.status(201).json({ message: "تم إنشاء حساب المسؤول بنجاح! 🛡️" });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "اسم المستخدم هذا مأخوذ بالفعل" });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages[0] });
    }
    next(error);
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "خطأ في اسم المستخدم أو كلمة المرور" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "خطأ في اسم المستخدم أو كلمة المرور" });
    }

    const token = signToken(admin._id, admin.role);

    res.status(200).json({
      message: "تم تسجيل دخول المسؤول بنجاح 🛡️",
      token,
      admin: { username: admin.username, role: admin.role, jobTitle: admin.jobTitle }
    });

  } catch (error) {
    next(error);
  }
};