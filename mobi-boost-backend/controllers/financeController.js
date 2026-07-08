const FinancialLog = require('../models/FinancialLog');

exports.getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const log = await FinancialLog.findOne({ dateString: today });

    res.json(log || {
      dateString: today,
      totalOrdersCount: 0,
      grossRevenue: 0,
      totalItemCosts: 0,
      totalShippingRevenue: 0,
      finalNetProfit: 0
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllLogs = async (req, res, next) => {
  try {
    const logs = await FinancialLog.find().sort({ dateString: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};