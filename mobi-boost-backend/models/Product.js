const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: [true, 'اسم اللون مطلوب'], trim: true },
  img: { type: String, required: [true, 'صورة اللون مطلوبة'] },
  stock: { type: Number, default: 0, min: 0 }
}, { _id: false });

const DeviceVariantSchema = new mongoose.Schema({
  deviceName: { type: String, required: [true, 'اسم الجهاز مطلوب'], trim: true },
  variants: {
    type: [VariantSchema],
    validate: [arr => Array.isArray(arr) && arr.length > 0, 'كل جهاز لازم يكون له لون واحد على الأقل مع صورته']
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  sku: { type: String, unique: true, trim: true },
  category: { type: String, required: [true, 'القسم مطلوب'], index: true },
  nameAr: { type: String, required: [true, 'اسم المنتج بالعربية مطلوب'], trim: true },
  nameEn: { type: String, trim: true },
  descAr: { type: String, default: '' },
  descEn: { type: String, default: '' },

  price: { type: Number, required: [true, 'السعر الحالي مطلوب'], min: 0 },
  oldPrice: { type: Number, default: 0 },
  discount: { type: String, default: '0%' },

  costPrice: { type: Number, default: 0, min: 0 },

  stock: { type: Number, required: [true, 'الكمية المتاحة مطلوبة'], default: 0, min: 0 },

  variants: {
    type: [VariantSchema],
    default: []
  },

  devices: {
    type: [DeviceVariantSchema],
    default: []
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.pre('validate', function () {
  if (!this.sku) {
    const prefix = (this.category || 'GEN').toUpperCase().slice(0, 4);
    this.sku = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }
  if (!this.nameEn) this.nameEn = this.nameAr;
});

module.exports = mongoose.model('Product', ProductSchema);