const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const generateOrderId = require('../utils/generateOrderId');
const { updateDailyFinance } = require('../services/financeService');
const { sendOrderNotification } = require('../services/emailService');
const { sendWhatsAppNotification } = require('../services/whatsappService');

const ALLOWED_STATUSES = ['preparing', 'shipping', 'delivered'];

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingFees = 0, discountAmount = 0, paymentMethod = 'COD' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '⚠️ السلة فارغة، لا يمكن تنفيذ الطلب' });
    }

    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ message: '⚠️ الحساب غير موجود، برجاء تسجيل الدخول من جديد' });
    }

    let totalCostOfItems = 0;
    let subTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({ message: `⚠️ أحد المنتجات في طلبك لم يعد متاحاً` });
      }
      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({ message: `⚠️ الكمية المتاحة من "${dbProduct.nameAr}" غير كافية (متبقي ${dbProduct.stock} فقط)` });
      }

      const itemCost = (dbProduct.costPrice || 0) * item.quantity;
      const itemSale = dbProduct.price * item.quantity;

      totalCostOfItems += itemCost;
      subTotal += itemSale;

      processedItems.push({
        product: dbProduct._id,
        nameSnapshot: dbProduct.nameAr,
        chosenColor: item.chosenColor,
        quantity: item.quantity,
        costPriceAtPurchase: dbProduct.costPrice || 0,
        salePriceAtPurchase: dbProduct.price
      });

      dbProduct.stock = Math.max(0, dbProduct.stock - item.quantity);
      const variant = dbProduct.variants.find(v => v.color === item.chosenColor);
      if (variant && typeof variant.stock === 'number') {
        variant.stock = Math.max(0, variant.stock - item.quantity);
      }
      await dbProduct.save();
    }

    const grandTotal = subTotal + shippingFees - discountAmount;
    const netProfit = grandTotal - totalCostOfItems - shippingFees;
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
      financials: { subTotal, shippingFees, discountAmount, grandTotal, totalCostOfItems, netProfit },
      paymentMethod,
      orderStatus: 'preparing',
      statusTimeline: [{ status: 'preparing', note: 'تم استلام الطلب بنجاح وجاري تجهيزه.' }]
    });

    await newOrder.save();
    await updateDailyFinance(grandTotal, totalCostOfItems, shippingFees, netProfit);

    sendOrderNotification(newOrder, customer).catch(err =>
      console.error('❌ فشل إرسال إشعار الإيميل:', err.message)
    );
    sendWhatsAppNotification(newOrder, customer).catch(err =>
      console.error('❌ فشل إرسال إشعار الواتساب:', err.message)
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