const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    match: [/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط']
  },
  username: {
    type: String,
    required: [true, 'اسم المستخدم مطلوب'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة']
  },
  jobTitle: {
    type: String,
    required: [true, 'المسمى الوظيفي مطلوب']
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    match: [/^0\d{10}$/, 'رقم الهاتف يجب أن يكون مكوناً من 11 رقم ويبدأ بـ 0']
  },
  role: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

// تشفير الباسورد تلقائياً
adminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Admin', adminSchema);