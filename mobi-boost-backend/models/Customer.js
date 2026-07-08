const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    // ريجكس لمنع الأرقام والرموز (يسمح بالحروف العربية والإنجليزية والمسافات فقط)
    match: [/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط بدون أرقام أو رموز']
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true, // يمنع تكرار الإيميل
    trim: true,
    lowercase: true,
    // ريجكس يجبر المستخدم على إدخال إيميل ينتهي بـ @gmail.com
    match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'يجب استخدام بريد إلكتروني ينتهي بـ @gmail.com']
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة']
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    // ريجكس يجبر الهاتف يكون 11 رقم ويبدأ بـ 0 (شبكات مصر 010, 011, 012, 015)
    match: [/^0\d{10}$/, 'رقم الهاتف يجب أن يكون مكوناً من 11 رقم ويبدأ بـ 0']
  },
  address: {
    type: String,
    required: [true, 'العنوان مطلوب']
  },
  // إضافة عمود الأوردرات السابقة
  previousOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order' // هنا بنربطه بموديل الأوردرات مستقبلاً
  }]
}, { timestamps: true });

// تشفير الباسورد قبل الحفظ
customerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Customer', customerSchema);