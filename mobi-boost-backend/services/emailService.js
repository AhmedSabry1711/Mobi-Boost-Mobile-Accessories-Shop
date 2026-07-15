const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// إشعار للأدمن فور وصول أوردر جديد
const sendOrderNotification = async (order, customer) => {
  const itemsList = order.items
    .map(i => `- ${i.nameSnapshot} (${i.chosenColor}) × ${i.quantity} = ${i.salePriceAtPurchase * i.quantity} ج.م`)
    .join('\n');

  const mailBody = `
📦 أوردر جديد رقم: ${order.orderNumber}

👤 اسم العميل: ${customer.name}
📞 الهاتف: ${customer.phone}
📍 العنوان: ${customer.address}
✉️ الإيميل: ${customer.email}

🛒 المنتجات المطلوبة:
${itemsList}

💰 الإجمالي النهائي: ${order.financials.grandTotal} ج.م
🚚 حالة الطلب: ${order.orderStatus}
  `.trim();

  await transporter.sendMail({
    from: `"MoBi Boost" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🎉 أوردر جديد #${order.orderNumber}`,
    text: mailBody
  });
};

// تأكيد فوري للعميل نفسه إن طلبه اتسجل بنجاح
// ملحوظة: واتساب تلقائي للعميل مش متاح مجاناً (خدمة CallMeBot المستخدمة للأدمن بتحتاج كل رقم يوافق يدوياً بنفسه مقدماً،
// فمينفعش تتفعل تلقائياً لأي عميل جديد يسجل). الإيميل هو البديل العملي والمجاني لتأكيد الطلب للعميل.
const sendCustomerConfirmation = async (order, customer) => {
  const itemsList = order.items
    .map(i => `- ${i.nameSnapshot} (${i.chosenColor}) × ${i.quantity}`)
    .join('\n');

  const mailBody = `
مرحباً ${customer.name} 👋

تم تأكيد طلبك بنجاح وجاري تجهيزه الآن!

رقم الطلب: ${order.orderNumber}

🛒 المنتجات:
${itemsList}

💰 الإجمالي: ${order.financials.grandTotal} ج.م
📍 عنوان الشحن: ${customer.address}

هتوصلك رسالة تانية فور شحن الطلب.
شكراً لثقتك في MoBi Boost 💙
  `.trim();

  await transporter.sendMail({
    from: `"MoBi Boost" <${process.env.ADMIN_EMAIL}>`,
    to: customer.email,
    subject: `تم تأكيد طلبك #${order.orderNumber} 🎉`,
    text: mailBody
  });
};

module.exports = { sendOrderNotification, sendCustomerConfirmation };
