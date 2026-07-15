const FinancialLog = require('../models/FinancialLog');
const Product = require('../models/Product');
const Order = require('../models/Order');

// 📊 ملخص أرباح ومبيعات اليوم الحالي فقط
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

// 📈 كل السجلات اليومية (تاريخ كامل للمبيعات والأرباح، مرتب بالأحدث أولاً)
exports.getAllLogs = async (req, res, next) => {
  try {
    const logs = await FinancialLog.find().sort({ dateString: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// 📊 لوحة تحليلات مبسطة للأدمن: إجمالي آخر 7 أيام + أكثر المنتجات مبيعاً + إحصائيات عامة
exports.getDashboardStats = async (req, res, next) => {
  try {
    // آخر 7 أيام من السجل المالي اليومي
    const last7Logs = await FinancialLog.find().sort({ dateString: -1 }).limit(7);
    const weekTotals = last7Logs.reduce((acc, log) => ({
      revenue: acc.revenue + (log.grossRevenue || 0),
      profit: acc.profit + (log.finalNetProfit || 0),
      orders: acc.orders + (log.totalOrdersCount || 0)
    }), { revenue: 0, profit: 0, orders: 0 });

    // أكثر 5 منتجات مبيعاً على الإطلاق
    const topProducts = await Product.find({ salesCount: { $gt: 0 } })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('nameAr price salesCount stock');

    // إجمالي عدد الطلبات حسب الحالة (كل الأوقات)
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);
    const statusMap = { preparing: 0, shipping: 0, delivered: 0 };
    statusCounts.forEach(s => { if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count; });

    const totalOrdersAllTime = await Order.countDocuments();
    const totalCustomers = await require('../models/Customer').countDocuments();

    res.json({
      last7Days: last7Logs.reverse().map(l => ({ date: l.dateString, revenue: l.grossRevenue, profit: l.finalNetProfit, orders: l.totalOrdersCount })),
      weekTotals,
      topProducts: topProducts.map(p => ({ id: p._id.toString(), nameAr: p.nameAr, price: p.price, salesCount: p.salesCount, stock: p.stock })),
      statusCounts: statusMap,
      totalOrdersAllTime,
      totalCustomers
    });
  } catch (error) {
    next(error);
  }
};
