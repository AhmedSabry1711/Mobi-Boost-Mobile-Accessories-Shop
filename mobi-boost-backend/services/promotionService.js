const Promotion = require('../models/Promotion');
const ShippingSetting = require('../models/ShippingSetting');
const { validateCouponForAmount } = require('../controllers/couponController');

// يرجع رسوم الشحن الافتراضية المحفوظة (أو 0 لو الأدمن لسه محددهاش)
const getDefaultShippingFee = async () => {
  const setting = await ShippingSetting.findOne();
  return setting ? setting.defaultFee : 0;
};

const matchesScope = (promo, product) => {
  if (promo.scope === 'all') return true;
  return promo.scope === 'category' && promo.categoryTarget === product.category;
};

// الدالة الأساسية: بتاخد عناصر السلة (منتجات حقيقية من الداتا بيز) وترجع كل الحسابات
// resolvedItems: [{ product: <Product doc>, quantity, chosenColor, chosenDevice, unitPrice }]
const calculateOrderTotals = async (resolvedItems, couponCode = null) => {
  const activePromotions = await Promotion.find({ isActive: true });
  const defaultShippingFee = await getDefaultShippingFee();

  let subTotal = 0;
  let itemsDiscount = 0;
  const appliedPromotions = [];

  // 1️⃣ subtotal الأساسي + تطبيق buy_x_get_y_free لكل سطر منتج لوحده
  const buyXGetYPromos = activePromotions.filter(p => p.type === 'buy_x_get_y_free');

  for (const item of resolvedItems) {
    const lineTotal = item.unitPrice * item.quantity;
    subTotal += lineTotal;

    const matchingPromo = buyXGetYPromos.find(p => matchesScope(p, item.product));
    if (matchingPromo) {
      const setSize = matchingPromo.buyQty + matchingPromo.freeQty;
      const freeUnits = Math.floor(item.quantity / setSize) * matchingPromo.freeQty;
      if (freeUnits > 0) {
        const discount = freeUnits * item.unitPrice;
        itemsDiscount += discount;
        appliedPromotions.push({
          title: matchingPromo.title,
          type: matchingPromo.type,
          discountAmount: Math.round(discount * 100) / 100,
          productNote: item.product.nameAr
        });
      }
    }
  }

  const afterItemsDiscount = subTotal - itemsDiscount;

  // 2️⃣ خصم عام (نسبة أو مبلغ ثابت) - نختار العرض اللي بيدي أعلى خصم لو فيه أكتر من واحد مستحق
  const generalDiscountPromos = activePromotions.filter(p => p.type === 'percentage_off' || p.type === 'fixed_off');
  const totalQty = resolvedItems.reduce((sum, i) => sum + i.quantity, 0);

  let bestGeneralDiscount = 0;
  let bestGeneralPromo = null;

  for (const promo of generalDiscountPromos) {
    // لازم كل عناصر السلة (أو على الأقل جزء منها) يطابق النطاق المحدد للعرض
    const scopedSubtotal = promo.scope === 'all'
      ? afterItemsDiscount
      : resolvedItems.filter(i => matchesScope(promo, i.product)).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const qtyOk = promo.minQty === 0 || totalQty >= promo.minQty;
    const amountOk = promo.minAmount === 0 || afterItemsDiscount >= promo.minAmount;
    if (scopedSubtotal <= 0 || !qtyOk || !amountOk) continue;

    const discount = promo.type === 'percentage_off'
      ? scopedSubtotal * (promo.discountValue / 100)
      : Math.min(promo.discountValue, scopedSubtotal);

    if (discount > bestGeneralDiscount) {
      bestGeneralDiscount = discount;
      bestGeneralPromo = promo;
    }
  }

  if (bestGeneralPromo) {
    appliedPromotions.push({
      title: bestGeneralPromo.title,
      type: bestGeneralPromo.type,
      discountAmount: Math.round(bestGeneralDiscount * 100) / 100
    });
  }

  const discountAmount = Math.round((itemsDiscount + bestGeneralDiscount) * 100) / 100;

  // 3️⃣ الشحن المجاني - لو فيه عرض مستحق، نصفر رسوم الشحن
  const freeShippingPromos = activePromotions.filter(p => p.type === 'free_shipping');
  let shippingFees = defaultShippingFee;

  for (const promo of freeShippingPromos) {
    const scopedQty = promo.scope === 'all'
      ? totalQty
      : resolvedItems.filter(i => matchesScope(promo, i.product)).reduce((sum, i) => sum + i.quantity, 0);
    const scopedAmount = promo.scope === 'all'
      ? afterItemsDiscount
      : resolvedItems.filter(i => matchesScope(promo, i.product)).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const qtyOk = promo.minQty > 0 && scopedQty >= promo.minQty;
    const amountOk = promo.minAmount > 0 && scopedAmount >= promo.minAmount;

    if (qtyOk || amountOk) {
      shippingFees = 0;
      appliedPromotions.push({ title: promo.title, type: promo.type, discountAmount: defaultShippingFee });
      break;
    }
  }

  // 4️⃣ كود الخصم (Coupon) - بيتطبق فوق خصومات العروض التلقائية، لازم العميل يكتبه بنفسه
  let couponDiscount = 0;
  let couponError = null;
  let appliedCoupon = null;
  const subtotalAfterAutoDiscounts = subTotal - discountAmount;

  if (couponCode) {
    const { coupon, error } = await validateCouponForAmount(couponCode, subtotalAfterAutoDiscounts);
    if (error) {
      couponError = error;
    } else if (coupon) {
      couponDiscount = Math.round(subtotalAfterAutoDiscounts * (coupon.discountPercentage / 100) * 100) / 100;
      appliedCoupon = coupon;
      appliedPromotions.push({ title: `كود الخصم: ${coupon.code}`, type: 'coupon', discountAmount: couponDiscount });
    }
  }

  const totalDiscountAmount = Math.round((discountAmount + couponDiscount) * 100) / 100;
  const grandTotal = Math.max(0, subTotal - totalDiscountAmount + shippingFees);

  return {
    subTotal: Math.round(subTotal * 100) / 100,
    discountAmount: totalDiscountAmount,
    shippingFees,
    grandTotal: Math.round(grandTotal * 100) / 100,
    appliedPromotions,
    couponError,
    appliedCouponDoc: appliedCoupon
  };
};

module.exports = { calculateOrderTotals, getDefaultShippingFee, matchesScope };
