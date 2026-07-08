const FinancialLog = require('../models/FinancialLog');

const updateDailyFinance = async (grossRevenue, totalItemCosts, totalShippingRevenue, netProfit) => {
  try {
    // جلب تاريخ اليوم بصيغة YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // تحديث السجل اليومي أو إنشاؤه لو مش موجود (Upsert)
    await FinancialLog.findOneAndUpdate(
      { dateString: today },
      {
        $inc: {
          totalOrdersCount: 1,
          grossRevenue: grossRevenue,
          totalItemCosts: totalItemCosts,
          totalShippingRevenue: totalShippingRevenue,
          finalNetProfit: netProfit
        }
      },
      { upsert: true, new: true }
    );
    console.log(`📊 Financial log updated successfully for date: ${today}`);
  } catch (error) {
    console.error('❌ Failed to update financial log:', error.message);
  }
};

module.exports = { updateDailyFinance };