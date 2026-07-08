const generateOrderId = () => {
  const currentYear = new Date().getFullYear(); // هيطلع 2026
  const randomNumber = Math.floor(10000 + Math.random() * 90000); // رقم عشوائي من 5 أرقام
  return `MOB-${currentYear}-${randomNumber}`;
};

module.exports = generateOrderId;