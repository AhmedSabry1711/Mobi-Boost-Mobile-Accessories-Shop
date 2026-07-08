const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

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

module.exports = { sendOrderNotification };