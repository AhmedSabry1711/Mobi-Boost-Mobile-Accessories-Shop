// إرسال إشعار واتساب فوري عند وصول أوردر جديد باستخدام خدمة CallMeBot المجانية
const sendWhatsAppNotification = async (order, customer) => {
  const phone = process.env.WHATSAPP_PHONE;       // رقمك بالكود الدولي بدون + مثال: 201023538775
  const apiKey = process.env.CALLMEBOT_API_KEY;   // الكود اللي هتاخده من CallMeBot

  if (!phone || !apiKey) {
    console.log('⚠️ إشعار الواتساب متعطل: WHATSAPP_PHONE أو CALLMEBOT_API_KEY مش موجودين في .env');
    return;
  }

  const itemsList = order.items.map(i => `- ${i.nameSnapshot} (${i.chosenColor}) × ${i.quantity}`).join('\n');

  const message = `📦 أوردر جديد رقم: ${order.orderNumber}
👤 العميل: ${customer.name}
📞 الهاتف: ${customer.phone}
📍 العنوان: ${customer.address}

🛒 المنتجات:
${itemsList}

💰 الإجمالي: ${order.financials.grandTotal} ج.م`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`فشل إرسال واتساب: ${res.status}`);
  }
};

module.exports = { sendWhatsAppNotification };