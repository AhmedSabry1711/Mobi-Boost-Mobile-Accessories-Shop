const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const generateOrderId = require('../utils/generateOrderId');
const { updateDailyFinance } = require('../services/financeService');
const { sendOrderNotification, sendCustomerConfirmation } = require('../services/emailService');

const ALLOWED_STATUSES = ['preparing', 'shipping', 'delivered'];

// 📦 1. إنشاء أوردر جديد + خصم المخزون + حساب الأرباح + تحديث إحصائيات المبيعات
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

      // تحديد اللون/الفاريانت المختار بالظبط (سواء كان لون عام أو لون تابع لجهاز معين) والتحقق من مخزونه لوحده
      let matchedVariant = null;
      if (item.chosenDevice) {
        const device = dbProduct.devices.find(d => d.deviceName === item.chosenDevice);
        matchedVariant = device ? device.variants.find(v => v.color === item.chosenColor) : null;
      } else {
        matchedVariant = dbProduct.variants.find(v => v.color === item.chosenColor);
      }

      if (matchedVariant && typeof matchedVariant.stock === 'number' && matchedVariant.stock < item.quantity) {
        return res.status(400).json({ message: `⚠️ لون "${item.chosenColor}" من "${dbProduct.nameAr}" نفذت كميته (متبقي ${matchedVariant.stock} فقط)` });
      }

      const itemCost = (dbProduct.costPrice || 0) * item.quantity;
      const itemSale = dbProduct.price * item.quantity;

      totalCostOfItems += itemCost;
      subTotal += itemSale;

      processedItems.push({
        product: dbProduct._id,
        nameSnapshot: dbProduct.nameAr,
        chosenColor: item.chosenColor,
        chosenDevice: item.chosenDevice || null,
        quantity: item.quantity,
        costPriceAtPurchase: dbProduct.costPrice || 0,
        salePriceAtPurchase: dbProduct.price
      });

      dbProduct.stock = Math.max(0, dbProduct.stock - item.quantity);
      if (matchedVariant && typeof matchedVariant.stock === 'number') {
        matchedVariant.stock = Math.max(0, matchedVariant.stock - item.quantity);
      }
      // تحديث عداد المبيعات - يستخدم في تحليلات "الأكثر مبيعاً" بلوحة الأدمن
      dbProduct.salesCount = (dbProduct.salesCount || 0) + item.quantity;
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

// 📜 2. جلب أوردرات العميل الحالي فقط (هيستوري مرتب بالأحدث أولاً)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// 👑 3. جلب جميع الأوردرات (للأدمن فقط)
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

// 🔄 4. تحديث حالة الأوردر (للأدمن) - preparing / shipping / delivered
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
