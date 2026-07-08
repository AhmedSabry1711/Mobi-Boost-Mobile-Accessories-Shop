const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'عنوان الإعلان مطلوب'], trim: true },
  image: { type: String, required: [true, 'رابط صورة/GIF الإعلان مطلوب'] },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Ad', AdSchema);