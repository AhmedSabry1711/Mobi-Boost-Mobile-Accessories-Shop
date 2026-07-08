const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  shippingDetails: {
    name: String,
    phone: String,
    address: String
  },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nameSnapshot: String,
    chosenColor: String,
    quantity: { type: Number, required: true, min: 1 },
    costPriceAtPurchase: { type: Number, default: 0 },
    salePriceAtPurchase: { type: Number, required: true }
  }],

  financials: {
    subTotal: { type: Number, required: true },
    shippingFees: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    totalCostOfItems: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 }
  },

  paymentMethod: { type: String, enum: ['COD', 'Card'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },

  // أكواد إنجليزية ثابتة بدل النصوص العربية - يمنع أي مشكلة تطابق نصوص عربي مستقبلاً
  orderStatus: {
    type: String,
    enum: ['preparing', 'shipping', 'delivered'],
    default: 'preparing'
  },

  statusTimeline: [{
    status: String,
    updatedAt: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);