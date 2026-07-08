const mongoose = require('mongoose');

const FinancialLogSchema = new mongoose.Schema({
  dateString: { type: String, required: true, unique: true }, // بصيغة YYYY-MM-DD
  totalOrdersCount: { type: Number, default: 0 },
  grossRevenue: { type: Number, default: 0 },     // إجمالي المبيعات بالشحن
  totalItemCosts: { type: Number, default: 0 },    // تكلفة البضاعة المباعة
  totalShippingRevenue: { type: Number, default: 0 }, 
  otherExpenses: [{                               // أي مصاريف تانية (إعلانات مثلاً)
    description: String,
    amount: Number
  }],
  finalNetProfit: { type: Number, default: 0 }     // صافي الربح النهائي لليوم
}, { timestamps: true });

module.exports = mongoose.model('FinancialLog', FinancialLogSchema);