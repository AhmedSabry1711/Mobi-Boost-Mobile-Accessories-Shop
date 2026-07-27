const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');
const generateOrderId = require('../utils/generateOrderId');
const { updateDailyFinance } = require('../services/financeService');
const { sendOrderNotification, sendCustomerConfirmation } = require('../services/emailService');
const { calculateOrderTotals } = require('../services/promotionService');

const ALLOWED_STATUSES = ['preparing', 'shipping', 'delivered'];

const resolveAndValidateItems = async (items) => {
  const resolvedItems = [];

  for (const item of items) {
    const dbProduct = await Product.findById(item.productId);
    if (!dbProduct) {
      throw { status: 404, message: `⚠️ أحد المنتجات في طلبك لم يعد متاحاً` };
    }
    if (dbProduct.stock < item.quantity) {
      throw { status: 400, message: `⚠️ الكمية المتاحة من "${dbProduct.nameAr}" غير كافية (متبقي ${dbProduct.stock} فقط)` };
    }

    let matchedVariant = null;
    if (item.chosenDevice) {
      const device = dbProduct.devices.find(d => d.deviceName === item.chosenDevice);
      matchedVariant = device ? device.variants.find(v => v.color === item.chosenColor) : null;
    } else {
      matchedVariant = dbProduct.variants.find(v => v.color === item.chosenColor);
    }

    if (matchedVariant && typeof matchedVariant.stock === 'number' && matchedVariant.stock < item.quantity) {
      throw { status: 400, message: `⚠️ لون "${item.chosenColor}" من "${dbProduct.nameAr}" نفذت كميته (متبقي ${matchedVariant.stock} فقط)` };
    }

    resolvedItems.push({
      product: dbProduct,
      matchedVariant,
      quantity: item.quantity,
      chosenColor: item.chosenColor,
      chosenDevice: item.chosenDevice || null,
      unitPrice: dbProduct.price
    });
  }

  return resolvedItems;
};

const toPublicTotals = (totals) => ({
  subTotal: totals.subTotal,
  discountAmount: totals.discountAmount,
  shippingFees: totals.shippingFees,
  grandTotal: totals.grandTotal,
  appliedPromotions: totals.appliedPromotions,
  couponError: totals.couponError || null
});

exports.calculateCart = async (req, res, next) => {
  try {
    const { items, couponCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '⚠️ السلة فارغة' });
    }

    const resolvedItems = await resolveAndValidateItems(items);
    const totals = await calculateOrderTotals(resolvedItems, couponCode || null);
    res.json(toPublicTotals(totals));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { items, paymentMethod = 'COD', couponCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '⚠️ السلة فارغة، لا يمكن تنفيذ الطلب' });
    }

    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ message: '⚠️ الحساب غير موجود، برجاء تسجيل الدخول من جديد' });
    }

    let resolvedItems;
    try {
      resolvedItems = await resolveAndValidateItems(items);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }

    const totals = await calculateOrderTotals(resolvedItems, couponCode || null);

    if (couponCode && totals.couponError) {
      return res.status(400).json({ message: `⚠️ ${totals.couponError}` });
    }

    let totalCostOfItems = 0;
    const processedItems = [];

    for (const item of resolvedItems) {
      const { product: dbProduct, matchedVariant, quantity } = item;

      totalCostOfItems += (dbProduct.costPrice || 0) * quantity;

      processedItems.push({
        product: dbProduct._id,
        nameSnapshot: dbProduct.nameAr,
        chosenColor: item.chosenColor,
        chosenDevice: item.chosenDevice,
        quantity,
        costPriceAtPurchase: dbProduct.costPrice || 0,
        salePriceAtPurchase: dbProduct.price
      });

      dbProduct.stock = Math.max(0, dbProduct.stock - quantity);
      if (matchedVariant && typeof matchedVariant.stock === 'number') {
        matchedVariant.stock = Math.max(0, matchedVariant.stock - quantity);
      }
      dbProduct.salesCount = (dbProduct.salesCount || 0) + quantity;
      await dbProduct.save();
    }

    const netProfit = totals.grandTotal - totalCostOfItems - totals.shippingFees;
    const orderNumber = generateOrderId();

    const newOrder = new Order({
      orderNumber,
      customer: customer._id,
      shippingDetails: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address
      },
      items: processedItems,
      financials: {
        subTotal: totals.subTotal,
        shippingFees: totals.shippingFees,
        discountAmount: totals.discountAmount,
        grandTotal: totals.grandTotal,
        totalCostOfItems,
        netProfit
      },
      appliedPromotions: totals.appliedPromotions,
      paymentMethod,
      orderStatus: 'preparing',
      statusTimeline: [{ status: 'preparing', note: 'تم استلام الطلب بنجاح وجاري تجهيزه.' }]
    });

    await newOrder.save();

    if (totals.appliedCouponDoc) {
      await Coupon.findByIdAndUpdate(totals.appliedCouponDoc._id, { $inc: { usedCount: 1 } });
    }

    await updateDailyFinance(totals.grandTotal, totalCostOfItems, totals.shippingFees, netProfit);

    sendOrderNotification(newOrder, customer).catch(err =>
      console.error('❌ فشل إرسال إشعار الإيميل للأدمن:', err.message)
    );
    sendCustomerConfirmation(newOrder, customer).catch(err =>
      console.error('❌ فشل إرسال تأكيد الإيميل للعميل:', err.message)
    );

    res.status(201).json({
      message: '🎉 تم تأكيد طلبك بنجاح وجاري تجهيزه!',
      orderNumber: newOrder.orderNumber,
      grandTotal: newOrder.financials.grandTotal,
      status: newOrder.orderStatus
    });

  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email phone address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, note } = req.body;

    if (!ALLOWED_STATUSES.includes(orderStatus)) {
      return res.status(400).json({ message: `⚠️ حالة الطلب غير صحيحة. القيم المسموحة: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: '⚠️ الأوردر غير موجود!' });

    order.orderStatus = orderStatus;
    order.statusTimeline.push({ status: orderStatus, note: note || `تم تحديث حالة الطلب إلى ${orderStatus}` });

    await order.save();
    res.json({ message: '📊 تم تحديث حالة الأوردر بنجاح', order });
  } catch (error) {
    next(error);
  }
};
