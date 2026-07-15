const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', trim: true, maxlength: 500 }
}, { timestamps: true });

// عميل واحد يقدر يقيم نفس المنتج مرة واحدة بس - لو قيّم تاني بيتعدل التقييم القديم
ReviewSchema.index({ product: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
