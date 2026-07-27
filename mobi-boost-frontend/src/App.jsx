import { useState, useEffect, useCallback } from 'react';
import AdminLogin from './pages/AdminLogin';

// ================= إعدادات الاتصال بالباك إند =================
// بيقرأ رابط الباك إند من متغير البيئة VITE_API_URL (يتحدد وقت النشر)، ولو مش موجود بيستخدم localhost للتطوير المحلي
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'حدث خطأ غير متوقع، حاول مرة أخرى');
  }
  return data;
};

// ================= نظام إشعارات احترافي (Toast) بدل الـ alert() الافتراضي في المتصفح =================
let toastIdCounter = 0;
function useToasts() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

function ToastContainer({ toasts, dismissToast, lang }) {
  if (toasts.length === 0) return null;
  const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
  const colors = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-[#2563EB] border-blue-500'
  };
  return (
    <div className={`fixed top-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm ${lang === 'ar' ? 'right-4 items-end' : 'left-4 items-start'}`}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          className={`${colors[toast.type]} text-white rounded-xl shadow-2xl border px-4 py-3 flex items-start gap-2.5 cursor-pointer w-full animate-toast-in`}
        >
          <span className="text-base shrink-0">{icons[toast.type]}</span>
          <p className="text-sm font-bold leading-snug">{toast.message}</p>
        </div>
      ))}
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(-12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-toast-in { animation: toastIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}

// ================= اللوجو الرسمي (MoBi Boost) - SVG بنفس هوية الـ connector concept =================
function MobiBoostLogo({ variant = 'dark', className = '', showTagline = false }) {
  // variant: 'dark' (نص غامق - للاستخدام فوق خلفية فاتحة) أو 'light' (نص أبيض - فوق خلفية غامقة)
  const textColor = variant === 'light' ? '#FFFFFF' : '#0F172A';
  const accentColor = '#2563EB';

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 340 90" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="42" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="42" fill={textColor} letterSpacing="-1">
          Mo<tspan fill={textColor}>Bi</tspan>
        </text>
        <circle cx="118" cy="18" r="4.5" fill={accentColor} />
        <text x="0" y="82" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="42" fill={textColor} letterSpacing="-1">
          B<tspan fill={accentColor}>o</tspan>ost
        </text>
        {/* خط الـ connector الأزرق اللي بيربط بين الكلمتين - نفس فكرة الشعار الرسمي */}
        <path d="M 55 30 L 90 30 L 90 55 L 68 55 L 68 63" stroke={accentColor} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="55" cy="30" r="4" fill={accentColor} />
        <circle cx="90" cy="30" r="4" fill={accentColor} />
        <circle cx="68" cy="63" r="4" fill={accentColor} />
      </svg>
      {showTagline && (
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5" style={{ color: accentColor }}>
          Upgrade Your Phone Experience
        </span>
      )}
    </div>
  );
}

export default function App() {
  const { toasts, showToast, dismissToast } = useToasts();

  // ================= 1. الحالات الأساسية المقروءة من الـ localStorage =================
  const [page, setPage] = useState(() => localStorage.getItem('mobi_page') || 'home');
  const [lang, setLang] = useState(() => localStorage.getItem('mobi_lang') || 'ar');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('mobi_dark') === 'true');

  // نظام السلة والـ Modals
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('mobi_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null); // { orderNumber, grandTotal } بعد نجاح الطلب
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' أو 'register'

  // لوحة تحكم المسؤول
  const [adminTab, setAdminTab] = useState('dashboard');
  const [adminOrderFilter, setAdminOrderFilter] = useState('preparing');

  // الأقسام
  const categories = [
    { id: 'cases', nameAr: 'جرابات حماية', nameEn: 'Protective Cases' },
    { id: 'chargers', nameAr: 'شواحن ومنصات طاقة', nameEn: 'Chargers & Power' },
    { id: 'screens', nameAr: 'اسكرينات حماية', nameEn: 'Screen Protectors' },
    { id: 'audio', nameAr: 'سماعات وإكسسوارات صوت', nameEn: 'Audio & Headphones' }
  ];
  const [selectedCollection, setSelectedCollection] = useState('cases');

  // حالة تحديد الـ Variant المختار حالياً لكل منتج (اللون) والجهاز المختار (لو المنتج بيدعم أجهزة)
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedDevices, setSelectedDevices] = useState({});

  // صفحة تفاصيل المنتج - آي دي المنتج المعروض حالياً
  const [detailProductId, setDetailProductId] = useState(null);
  const [productMediaTab, setProductMediaTab] = useState('photo'); // 'photo' أو 'video' في صفحة تفاصيل المنتج
  const [detailImageIdx, setDetailImageIdx] = useState(0); // فهرس الصورة النشطة في جاليري صفحة المنتج

  // 🔍 البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ❤️ المفضلة (Wishlist)
  const [wishlist, setWishlist] = useState([]); // مصفوفة آيديات المنتجات

  // ⭐ التقييمات
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // 📊 لوحة تحليلات الأدمن
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // 🎁 العروض والشحن
  const [activePromotions, setActivePromotions] = useState([]); // العروض الفعالة - يستخدمها كل المستخدمين لعرض البادجات
  const [allPromotions, setAllPromotions] = useState([]); // كل العروض - لوحة الأدمن بس
  const [cartTotals, setCartTotals] = useState(null); // { subTotal, discountAmount, shippingFees, grandTotal, appliedPromotions }
  const [cartTotalsLoading, setCartTotalsLoading] = useState(false);
  const [shippingFeeSetting, setShippingFeeSetting] = useState(0);
  // فورم إضافة عرض جديد (أدمن)
  const [promoTitle, setPromoTitle] = useState('');
  const [promoType, setPromoType] = useState('buy_x_get_y_free');
  const [promoScope, setPromoScope] = useState('all');
  const [promoCategoryTarget, setPromoCategoryTarget] = useState('cases');
  const [promoBuyQty, setPromoBuyQty] = useState(2);
  const [promoFreeQty, setPromoFreeQty] = useState(1);
  const [promoMinQty, setPromoMinQty] = useState(0);
  const [promoMinAmount, setPromoMinAmount] = useState(0);
  const [promoDiscountValue, setPromoDiscountValue] = useState(0);
  const [promoSaving, setPromoSaving] = useState(false);
  const [shippingFeeInput, setShippingFeeInput] = useState('0');
  const [shippingSaving, setShippingSaving] = useState(false);

  // 🏷️ كود الخصم (Coupon) - جانب العميل
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);

  // 🏷️ إدارة أكواد الخصم - لوحة الأدمن
  const [allCoupons, setAllCoupons] = useState([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponPercentInput, setCouponPercentInput] = useState('');
  const [couponMinAmountInput, setCouponMinAmountInput] = useState('0');
  const [couponMaxUsesInput, setCouponMaxUsesInput] = useState('0');
  const [couponExpiryInput, setCouponExpiryInput] = useState('');
  const [couponSaving, setCouponSaving] = useState(false);

  // قاعدة بيانات الطلبات - بتتحمل من الباك إند حسب الدور (عميل: طلباته فقط / أدمن: كل الطلبات)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ================= نظام المستخدمين (الجلسة الحالية عن طريق JWT من الباك إند) =================
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('mobi_token') || null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('mobi_admin_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('mobi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // بيانات فورم التسجيل
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  // بيانات فورم تسجيل الدخول
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // قاعدة بيانات المنتجات - بتتحمل من الباك إند الحقيقي
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // ================= إعلانات المتجر (كاروسيل متحرك في الصفحة الرئيسية) - بتتحمل من الباك إند =================
  const [ads, setAds] = useState([]);
  const [adTitle, setAdTitle] = useState('');
  const [adImage, setAdImage] = useState('');
  const [adProductId, setAdProductId] = useState(''); // اختياري - ربط الإعلان بمنتج معين

  // فورم المسؤول لإضافة/تعديل منتج
  const [editingProductId, setEditingProductId] = useState(null); // null = وضع إضافة، وإلا وضع تعديل
  const [productSaving, setProductSaving] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stock, setStock] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [productCategory, setProductCategory] = useState('cases');
  const [variantsForm, setVariantsForm] = useState([{ color: 'أسود', img: '', stock: '', extraImages: '' }]);
  // الأجهزة المتوافقة (اختياري) - كل جهاز له ألوان وصور خاصة بيه، مفيدة للجرابات والاسكرينات
  const [devicesForm, setDevicesForm] = useState([]);

  // ================= 2. تأثيرات المزامنة والتحميل من الباك إند =================
  useEffect(() => { localStorage.setItem('mobi_page', page); }, [page]);
  useEffect(() => { localStorage.setItem('mobi_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('mobi_dark', isDark); }, [isDark]);
  useEffect(() => { localStorage.setItem('mobi_cart', JSON.stringify(cart)); }, [cart]);

  // 🔄 تحميل المنتجات من الباك إند
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await apiFetch('/products');
      setProducts(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل المنتجات من السيرفر:', err.message);
    } finally {
      setProductsLoading(false);
    }
  };
  useEffect(() => { loadProducts(); }, []);

  // 🔄 تحميل الإعلانات من الباك إند
  const loadAds = async () => {
    try {
      const data = await apiFetch('/ads');
      setAds(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل الإعلانات من السيرفر:', err.message);
    }
  };
  useEffect(() => { loadAds(); }, []);

  // 🔄 تحميل قائمة المفضلة للعميل الحالي
  const loadWishlist = async () => {
    if (!authToken) { setWishlist([]); return; }
    try {
      const data = await apiFetch('/customer/wishlist', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setWishlist(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل المفضلة:', err.message);
    }
  };
  useEffect(() => { loadWishlist(); }, [authToken]);

  const toggleWishlist = async (productId) => {
    if (!user || !authToken) {
      showToast(lang === 'ar' ? 'سجل دخولك الأول عشان تقدر تحفظ منتجات في المفضلة' : 'Please login to save items to your wishlist', 'error');
      setIsAuthOpen(true);
      return;
    }
    try {
      const data = await apiFetch(`/customer/wishlist/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setWishlist(data.wishlist);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 🔄 تحميل تقييمات منتج معين
  const loadProductReviews = async (productId) => {
    setReviewsLoading(true);
    try {
      const data = await apiFetch(`/reviews/${productId}`);
      setProductReviews(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل التقييمات:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (productId) => {
    if (!user || !authToken) {
      showToast(lang === 'ar' ? 'سجل دخولك الأول عشان تقدر تقيّم المنتج' : 'Please login to leave a review', 'error');
      setIsAuthOpen(true);
      return;
    }
    if (myRating < 1) {
      showToast(lang === 'ar' ? 'اختار عدد النجوم الأول' : 'Please select a star rating first', 'error');
      return;
    }
    setReviewSubmitting(true);
    try {
      await apiFetch(`/reviews/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ rating: myRating, comment: myComment.trim() })
      });
      showToast(lang === 'ar' ? 'تم حفظ تقييمك، شكراً لمشاركتك ⭐' : 'Your review was saved, thank you! ⭐', 'success');
      setMyRating(0); setMyComment('');
      loadProductReviews(productId);
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // 🔄 تحميل إحصائيات لوحة التحليلات (أدمن فقط)
  const loadDashboardStats = async () => {
    if (!adminToken) return;
    setDashboardLoading(true);
    try {
      const data = await apiFetch('/analytics/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setDashboardStats(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل التحليلات:', err.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  // 🔄 تحميل العروض الفعالة (للجميع) - تستخدم لعرض البادجات وحساب السلة
  const loadActivePromotions = async () => {
    try {
      const data = await apiFetch('/promotions/active');
      setActivePromotions(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل العروض:', err.message);
    }
  };
  useEffect(() => { loadActivePromotions(); }, []);

  // 🔄 تحميل رسوم الشحن الحالية
  const loadShippingFee = async () => {
    try {
      const data = await apiFetch('/shipping');
      setShippingFeeSetting(data.defaultFee);
      setShippingFeeInput(String(data.defaultFee));
    } catch (err) {
      console.error('⚠️ فشل تحميل رسوم الشحن:', err.message);
    }
  };
  useEffect(() => { loadShippingFee(); }, []);

  // 🔄 تحميل كل العروض (أدمن فقط - لوحة الإدارة)
  const loadAllPromotions = async () => {
    if (!adminToken) return;
    try {
      const data = await apiFetch('/promotions', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setAllPromotions(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل كل العروض:', err.message);
    }
  };
  useEffect(() => { if (page === 'admin' && adminTab === 'promotions' && adminToken) loadAllPromotions(); }, [page, adminTab, adminToken]);

  // 🧮 حساب السلة (السبتوتال + الخصومات + الشحن) - بيتحدث تلقائياً كل ما السلة تتغير
  const calculateCartTotals = async (couponToUse) => {
    if (cart.length === 0) { setCartTotals(null); return; }
    setCartTotalsLoading(true);
    try {
      const data = await apiFetch('/orders/calculate', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            chosenColor: item.chosenColor,
            chosenDevice: item.chosenDevice || null
          })),
          couponCode: (couponToUse !== undefined ? couponToUse : appliedCouponCode) || null
        })
      });
      setCartTotals(data);
      if (data.couponError) {
        setCouponError(data.couponError);
        setAppliedCouponCode('');
      }
    } catch (err) {
      console.error('⚠️ فشل حساب السلة:', err.message);
      setCartTotals(null);
    } finally {
      setCartTotalsLoading(false);
    }
  };
  useEffect(() => { calculateCartTotals(); }, [cart]);

  const applyCouponCode = async () => {
    if (!couponInput.trim()) return;
    setCouponApplying(true);
    setCouponError('');
    try {
      const data = await apiFetch('/orders/calculate', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            chosenColor: item.chosenColor,
            chosenDevice: item.chosenDevice || null
          })),
          couponCode: couponInput.trim()
        })
      });
      if (data.couponError) {
        setCouponError(data.couponError);
        setAppliedCouponCode('');
        setCartTotals(data);
      } else {
        setAppliedCouponCode(couponInput.trim());
        setCartTotals(data);
        showToast(lang === 'ar' ? 'تم تطبيق كود الخصم بنجاح 🏷️' : 'Coupon applied successfully 🏷️', 'success');
      }
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCouponCode = () => {
    setAppliedCouponCode('');
    setCouponInput('');
    setCouponError('');
    calculateCartTotals(null);
  };

  const resetPromoForm = () => {
    setPromoTitle(''); setPromoType('buy_x_get_y_free'); setPromoScope('all');
    setPromoCategoryTarget('cases'); setPromoBuyQty(2); setPromoFreeQty(1);
    setPromoMinQty(0); setPromoMinAmount(0); setPromoDiscountValue(0);
  };

  const handleAddPromotion = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim()) return;
    setPromoSaving(true);
    try {
      await apiFetch('/promotions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          title: promoTitle.trim(),
          type: promoType,
          scope: promoScope,
          categoryTarget: promoScope === 'category' ? promoCategoryTarget : '',
          buyQty: Number(promoBuyQty),
          freeQty: Number(promoFreeQty),
          minQty: Number(promoMinQty),
          minAmount: Number(promoMinAmount),
          discountValue: Number(promoDiscountValue)
        })
      });
      showToast(lang === 'ar' ? 'تم إضافة العرض بنجاح 🎁' : 'Promotion added successfully 🎁', 'success');
      resetPromoForm();
      loadAllPromotions();
      loadActivePromotions();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPromoSaving(false);
    }
  };

  const togglePromotionActive = async (promo) => {
    try {
      await apiFetch(`/promotions/${promo.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ isActive: !promo.isActive })
      });
      loadAllPromotions();
      loadActivePromotions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'متأكد إنك عايز تحذف العرض ده؟' : 'Delete this promotion?')) return;
    try {
      await apiFetch(`/promotions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      showToast(lang === 'ar' ? 'تم حذف العرض' : 'Promotion deleted', 'success');
      loadAllPromotions();
      loadActivePromotions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateShippingFee = async (e) => {
    e.preventDefault();
    setShippingSaving(true);
    try {
      await apiFetch('/shipping', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ defaultFee: Number(shippingFeeInput) })
      });
      showToast(lang === 'ar' ? 'تم تحديث رسوم الشحن 🚚' : 'Shipping fee updated 🚚', 'success');
      loadShippingFee();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setShippingSaving(false);
    }
  };

  // بادچ العرض المطبق على منتج معين (لو موجود) - يستخدم في الكروت وصفحة التفاصيل
  const getPromotionBadgeForProduct = (product) => {
    return activePromotions.find(p =>
      p.type === 'buy_x_get_y_free' && (p.scope === 'all' || (p.scope === 'category' && p.categoryTarget === product.category))
    );
  };

  // 🔄 تحميل كل أكواد الخصم (أدمن فقط)
  const loadAllCoupons = async () => {
    if (!adminToken) return;
    try {
      const data = await apiFetch('/coupons', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setAllCoupons(data);
    } catch (err) {
      console.error('⚠️ فشل تحميل أكواد الخصم:', err.message);
    }
  };
  useEffect(() => { if (page === 'admin' && adminTab === 'promotions' && adminToken) loadAllCoupons(); }, [page, adminTab, adminToken]);

  const resetCouponForm = () => {
    setCouponCodeInput(''); setCouponPercentInput('');
    setCouponMinAmountInput('0'); setCouponMaxUsesInput('0'); setCouponExpiryInput('');
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || !couponPercentInput) return;
    setCouponSaving(true);
    try {
      await apiFetch('/coupons', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          discountPercentage: Number(couponPercentInput),
          minAmount: Number(couponMinAmountInput) || 0,
          maxUses: Number(couponMaxUsesInput) || 0,
          expiresAt: couponExpiryInput || null
        })
      });
      showToast(lang === 'ar' ? 'تم إضافة الكود بنجاح 🏷️' : 'Coupon added successfully 🏷️', 'success');
      resetCouponForm();
      loadAllCoupons();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCouponSaving(false);
    }
  };

  const toggleCouponActive = async (coupon) => {
    try {
      await apiFetch(`/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ isActive: !coupon.isActive })
      });
      loadAllCoupons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'متأكد إنك عايز تحذف الكود ده؟' : 'Delete this coupon?')) return;
    try {
      await apiFetch(`/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      showToast(lang === 'ar' ? 'تم حذف الكود' : 'Coupon deleted', 'success');
      loadAllCoupons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // توحيد شكل الأوردر القادم من الباك إند مع الشكل اللي كل الواجهة (JSX) متوقعاه بالفعل
  const normalizeOrder = (o) => ({
    orderId: o.orderNumber,
    status: o.orderStatus,
    date: new Date(o.createdAt).toLocaleString('en-US', { hour12: true }),
    totalAmount: o.financials?.grandTotal ?? 0,
    customer: (o.customer && typeof o.customer === 'object')
      ? { name: o.customer.name, email: o.customer.email, phone: o.customer.phone, address: o.customer.address }
      : { name: user?.name, email: user?.email, phone: user?.phone, address: user?.address },
    items: (o.items || []).map(i => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      price: i.salePriceAtPurchase,
      chosenColor: i.chosenColor
    }))
  });

  // 🔄 تحميل طلبات العميل الحالي (لما يكون مسجل دخول)
  const loadMyOrders = async () => {
    if (!authToken) return;
    setOrdersLoading(true);
    try {
      const data = await apiFetch('/orders/mine', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setOrders(data.map(normalizeOrder));
    } catch (err) {
      console.error('⚠️ فشل تحميل طلباتك:', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };
  useEffect(() => { loadMyOrders(); }, [authToken]);

  // 🔄 تحميل كل الطلبات (لوحة الأدمن)
  const loadAllOrders = async () => {
    if (!adminToken) return;
    setOrdersLoading(true);
    try {
      const data = await apiFetch('/orders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setOrders(data.map(normalizeOrder));
    } catch (err) {
      console.error('⚠️ فشل تحميل الطلبات:', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };
  useEffect(() => { if (page === 'admin' && adminToken) loadAllOrders(); }, [page, adminToken]);

  // تحديث تلقائي لقائمة الطلبات كل 20 ثانية طول ما الأدمن فاتح لوحة التحكم - عشان الطلبات الجديدة تظهر من غير ما يعمل ريفريش يدوي
  useEffect(() => {
    if (page !== 'admin' || !adminToken) return;
    const interval = setInterval(() => { loadAllOrders(); }, 20000);
    return () => clearInterval(interval);
  }, [page, adminToken]);

  // تحميل تقييمات المنتج تلقائياً عند فتح صفحة تفاصيله، وإعادة ضبط جاليري الصور
  useEffect(() => {
    if (page === 'product-detail' && detailProductId) {
      loadProductReviews(detailProductId);
      setDetailImageIdx(0);
      setMyRating(0);
      setMyComment('');
    }
  }, [page, detailProductId]);

  // تحميل التحليلات لما الأدمن يفتح تاب التحليلات
  useEffect(() => {
    if (page === 'admin' && adminTab === 'dashboard' && adminToken) loadDashboardStats();
  }, [page, adminTab, adminToken]);

  // ================= 3. قاموس الترجمة (Localization) =================
  const t = {
    ar: {
      home: "الرئيسية", collections: "الأقسام", products: "كل المنتجات", faqs: "الأسئلة الشائعة", about: "من نحن",
      cart: "السلة", login: "تسجيل الدخول", logout: "خروج", welcome: "مرحباً،",
      heroTitle: "مرحباً بك في MoBi Boost", heroSub: "أقوى تشكيلة إكسسوارات موبايل بأعلى جودة وأفضل سعر في مصر",
      latestProducts: "أحدث المنتجات المتاحة", addToCart: "🛒 إضافة إلى السلة", currency: "ج.م",
      cartTitle: "🛒 سلة المشتريات الخاصة بك", emptyCart: "السلة فارغة حالياً 🛍️", total: "الإجمالي النهائي:",
      checkout: "إتمام وتأكيد الطلب (إرسال الفاتورة) 🧾", close: "إغلاق", createAccount: "إعداد حساب الشحن والتوصيل 👤",
      yourName: "الاسم الكامل", yourEmail: "البريد الإلكتروني", yourPhone: "رقم التليفون (مهم جداً للتوصيل)", yourAddress: "عنوان الشحن بالتفصيل (المحافظة/المدينة/الشارع)",
      registerBtn: "حفظ الحساب والدخول للمتجر", adminTitle: "📦 لوحة التحكم السرية للمسؤول",
      password: "كلمة المرور", browseProducts: "تصفح المنتجات",
      soldOut: "نفذت الكمية 🚫", itemsLeft: "متبقي", myOrdersTitle: "📱 طلباتك السابقة",
      noOrdersYet: "لا يوجد لديك أي طلبات سابقة بعد.", subtotal: "المجموع الفرعي", remove: "حذف",
      description: "الوصف", currentStock: "الكمية المتاحة بالمخزن", productsListTitle: "📋 المنتجات الحالية بالمتجر",
    },
    en: {
      home: "Home", collections: "Collections", products: "All Products", faqs: "FAQs", about: "About Us",
      cart: "Cart", login: "Login", logout: "Logout", welcome: "Welcome,",
      heroTitle: "Welcome to MoBi Boost", heroSub: "The strongest selection of mobile accessories in Egypt",
      latestProducts: "Latest Available Products", addToCart: "🛒 Add to Cart", currency: "EGP",
      cartTitle: "🛒 Your Shopping Cart", emptyCart: "Your cart is empty 🛍️", total: "Grand Total:",
      checkout: "Confirm & Place Order 🧾", close: "Close", createAccount: "Create Shipping Account 👤",
      yourName: "Full Name", yourEmail: "Email Address", yourPhone: "Phone Number", yourAddress: "Detailed Shipping Address",
      registerBtn: "Register & Login", adminTitle: "📦 Secret Admin Control Panel",
      password: "Password", browseProducts: "Browse Products",
      soldOut: "SOLD OUT 🚫", itemsLeft: "left", myOrdersTitle: "📱 Your Order History",
      noOrdersYet: "You have no previous orders yet.", subtotal: "Subtotal", remove: "Remove",
      description: "Description", currentStock: "Available Stock", productsListTitle: "📋 Current Store Products",
    }
  }[lang];

  // ================= 4. دالات النظام والـ Backend =================

  // إنشاء حساب جديد فعلياً في قاعدة البيانات عن طريق الباك إند
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerName.trim() || !registerEmail.trim() || !registerPhone.trim() || !registerAddress.trim() || !registerPassword.trim()) {
      setRegisterError(lang === 'ar' ? '⚠️ من فضلك املأ جميع الحقول المطلوبة' : '⚠️ Please fill in all required fields');
      return;
    }

    setAuthSubmitting(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim().toLowerCase(),
          password: registerPassword,
          phone: registerPhone.trim(),
          address: registerAddress.trim()
        })
      });

      localStorage.setItem('mobi_token', data.token);
      localStorage.setItem('mobi_user', JSON.stringify(data.customer));
      setAuthToken(data.token);
      setUser(data.customer);

      setRegisterName(''); setRegisterEmail(''); setRegisterPhone('');
      setRegisterAddress(''); setRegisterPassword('');
      setIsAuthOpen(false);
      showToast(lang === 'ar' ? `أهلاً بيك يا ${data.customer.name}! 🎉` : `Welcome, ${data.customer.name}! 🎉`, 'success');
    } catch (err) {
      setRegisterError(`⚠️ ${err.message}`);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // تسجيل الدخول بحساب حقيقي عن طريق الباك إند (بالإيميل + كلمة المرور)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    setAuthSubmitting(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword
        })
      });

      localStorage.setItem('mobi_token', data.token);
      localStorage.setItem('mobi_user', JSON.stringify(data.customer));
      setAuthToken(data.token);
      setUser(data.customer);

      setLoginEmail(''); setLoginPassword('');
      setIsAuthOpen(false);
      showToast(lang === 'ar' ? `أهلاً بعودتك يا ${data.customer.name}! 👋` : `Welcome back, ${data.customer.name}! 👋`, 'success');
    } catch (err) {
      setLoginError(`⚠️ ${err.message}`);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setCart([]);
    setOrders([]);
    localStorage.removeItem('mobi_token');
    localStorage.removeItem('mobi_user');
  };

  // تسجيل خروج الأدمن من لوحة التحكم
  const handleAdminLogout = () => {
    setAdminToken(null);
    setOrders([]);
    localStorage.removeItem('mobi_admin_token');
    setPage('home');
  };

  // بتتنده من صفحة تسجيل دخول الأدمن (pages/AdminLogin.jsx) بعد نجاح الدخول
  const handleAdminLoginSuccess = (token) => {
    localStorage.setItem('mobi_admin_token', token);
    setAdminToken(token);
    setPage('admin');
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ orderStatus: nextStatus })
      });
      showToast(lang === 'ar' ? '✅ تم تحديث حالة الطلب بنجاح' : '✅ Order status updated', 'success');
      loadAllOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // يرجع قائمة الألوان الفعلية للمنتج - لو المنتج له أجهزة متوافقة، بيرجع ألوان الجهاز المختار، وإلا الألوان العامة للمنتج
  const getActiveVariants = (product, deviceIdx) => {
    if (product.devices && product.devices.length > 0) {
      const idx = deviceIdx !== undefined ? deviceIdx : 0;
      return product.devices[idx] ? product.devices[idx].variants : [];
    }
    return product.variants || [];
  };

  // كارت المنتج المبسط - صورة واسم وسعر بس، كل التفاصيل والألوان والأجهزة موجودة في صفحة المنتج نفسها
  // هيكل عرض مؤقت (Skeleton) أثناء تحميل المنتجات - تجربة أفضل من نص "جاري التحميل" الجامد
  // شريط تتبع الطلب المرئي - يوضح للعميل بالظبط في أي مرحلة طلبه دلوقتي
  const renderOrderProgress = (status) => {
    const steps = [
      { labelAr: 'تم الاستلام', labelEn: 'Received' },
      { labelAr: 'قيد التجهيز', labelEn: 'Preparing' },
      { labelAr: 'في الطريق', labelEn: 'Shipping' },
      { labelAr: 'تم التسليم', labelEn: 'Delivered' },
    ];
    // كل حالة باك إند بتوافق آخر خطوة متحققة (0-indexed) في الشريط المرئي
    const currentIdx = { preparing: 1, shipping: 2, delivered: 3 }[status] ?? 0;

    return (
      <div className="flex items-center w-full mt-3">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${isDone ? 'bg-[#2563EB] text-white' : isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400'} ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/40' : ''}`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className={`text-[9px] font-bold whitespace-nowrap ${isDone ? 'text-[#2563EB]' : 'text-gray-400'}`}>{lang === 'ar' ? step.labelAr : step.labelEn}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded transition-colors ${idx < currentIdx ? 'bg-[#2563EB]' : isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderProductSkeleton = (key) => (
    <div key={key} className={`rounded-2xl border overflow-hidden animate-pulse ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <div className={`aspect-square ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="p-3 sm:p-4 space-y-2">
        <div className={`h-3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} w-3/4`} />
        <div className={`h-4 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} w-1/2`} />
      </div>
    </div>
  );

  const renderProductCard = (prod) => {
    const isSoldOut = (prod.stock ?? 0) <= 0;
    const coverImg = prod.variants?.[0]?.img || prod.devices?.[0]?.variants?.[0]?.img;
    const goToDetail = () => { setDetailProductId(prod.id); setProductMediaTab('photo'); setPage('product-detail'); };
    const hasDiscount = prod.oldPrice && prod.oldPrice > prod.price;
    const isWishlisted = wishlist.includes(prod.id);
    const promoBadge = getPromotionBadgeForProduct(prod);

    return (
      <div
        key={prod.id}
        onClick={goToDetail}
        className={`rounded-2xl border overflow-hidden cursor-pointer group active:scale-[0.97] ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:shadow-xl hover:border-gray-200'} ${isSoldOut ? 'opacity-70' : ''} transition-all duration-300`}
      >
        {/* حاوية صورة موحدة المقاس (مربعة) لكل المنتجات - خلفية محايدة تضمن ظهور المنتج كامل باحترافية */}
        <div className={`aspect-square overflow-hidden relative ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <img src={coverImg} alt={prod.nameAr} loading="lazy" className={`w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 ${isSoldOut ? 'grayscale' : ''}`} />
          {isSoldOut ? (
            <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center">
              <span className="bg-[#0F172A] text-white font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow-lg">{t.soldOut}</span>
            </div>
          ) : hasDiscount && (
            <span className="absolute top-2 right-2 bg-[#2563EB] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow">-{Math.round((1 - prod.price / prod.oldPrice) * 100)}%</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }}
            className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow transition-all active:scale-90 ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:text-red-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          {promoBadge && !isSoldOut && (
            <span className="absolute bottom-2 right-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow text-center truncate">🎁 {promoBadge.title}</span>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h4 className="font-bold text-xs sm:text-sm mb-1 truncate text-[#0F172A] dark:text-white group-hover:text-[#2563EB] transition-colors">{lang === 'ar' ? prod.nameAr : prod.nameEn}</h4>
          {prod.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#F59E0B" className="w-3 h-3">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.454 1.405 1.02L10 15.591l4.069 2.485c.713.435 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-bold text-gray-500">{prod.avgRating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400">({prod.reviewCount})</span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-lg font-black text-[#2563EB]">{prod.price} {t.currency}</span>
            {hasDiscount ? <span className="text-[10px] text-gray-400 line-through">{prod.oldPrice} {t.currency}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  const addToCart = (product) => {
    if (!user) {
      showToast(lang === 'ar'
        ? 'عذراً، يجب إنشاء حساب أو تسجيل الدخول أولاً لتتمكن من إضافة المنتجات إلى السلة!'
        : 'Sorry, you must create an account or log in first to add products to the cart!',
        'error'
      );
      setIsAuthOpen(true);
      return;
    }

    const availableStock = product.stock ?? 0;
    if (availableStock <= 0) {
      showToast(lang === 'ar' ? 'عذراً، هذا المنتج نفذت كميته من المخزن حالياً.' : 'Sorry, this product is currently sold out.', 'error');
      return;
    }

    const hasDevices = product.devices && product.devices.length > 0;
    const deviceIdx = selectedDevices[product.id] !== undefined ? selectedDevices[product.id] : 0;
    const chosenDevice = hasDevices ? product.devices[deviceIdx]?.deviceName : null;
    const activeVariants = getActiveVariants(product, deviceIdx);

    const currentIdx = selectedVariants[product.id] !== undefined ? selectedVariants[product.id] : 0;
    const chosenVariant = activeVariants[currentIdx] || activeVariants[0] || null;
    const chosenColor = chosenVariant ? chosenVariant.color : "افتراضي";
    const chosenImage = chosenVariant ? chosenVariant.img : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500";

    const cartItemId = `${product.id}-${chosenDevice || 'nodevice'}-${chosenColor}`;
    const existingItem = cart.find(item => item.cartItemId === cartItemId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    // لو اللون ده له مخزون خاص متتبع، لازم نتأكد إنه هو نفسه متوفر (مش بس المخزون الكلي للمنتج)
    const variantStock = (chosenVariant && typeof chosenVariant.stock === 'number') ? chosenVariant.stock : availableStock;
    if (variantStock <= 0) {
      showToast(lang === 'ar' ? `عذراً، اللون "${chosenColor}" نفذ من المخزن حالياً، جرب لون تاني.` : `Sorry, "${chosenColor}" is currently sold out, try another color.`, 'error');
      return;
    }

    if (currentQtyInCart + 1 > Math.min(availableStock, variantStock)) {
      showToast(lang === 'ar'
        ? `الكمية المتاحة من هذا اللون محدودة (متبقي ${variantStock} فقط).`
        : `Limited stock available for this color (only ${variantStock} left).`, 'error');
      return;
    }

    if (existingItem) {
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartItemId, chosenColor, chosenImage, chosenDevice, quantity: 1 }]);
    }

    showToast(lang === 'ar' ? `تمت إضافة "${lang === 'ar' ? product.nameAr : product.nameEn}" إلى السلة 🛒` : `"${product.nameEn}" added to cart 🛒`, 'success');
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  const handleCheckout = async () => {
    if (!user || !authToken) {
      showToast(lang === 'ar' ? 'يجب تسجيل بياناتك وعنوانك أولاً لتأكيد شحن الأوردر!' : 'Please login first!', 'error');
      setIsCartOpen(false);
      setIsAuthOpen(true);
      return;
    }

    setCheckoutLoading(true);
    try {
      const data = await apiFetch('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            chosenColor: item.chosenColor,
            chosenDevice: item.chosenDevice || null
          })),
          paymentMethod: 'COD',
          couponCode: appliedCouponCode || null
        })
      });

      setOrderConfirmation({ orderNumber: data.orderNumber, grandTotal: data.grandTotal });
      setCart([]);
      setCartTotals(null);
      setAppliedCouponCode('');
      setCouponInput('');
      setCouponError('');
      setIsCartOpen(false);

      // تحديث المنتجات (الكمية المتاحة اتغيرت) وطلبات العميل
      loadProducts();
      loadMyOrders();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const updateQuantity = (cartItemId, amount) => {
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const productRef = products.find(p => p.id === item.id);
        const maxStock = productRef ? productRef.stock : 999;
        const newQty = item.quantity + amount;
        if (newQty > maxStock) return item;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // ---- إدارة صفوف الألوان/الصور الديناميكية في فورم إضافة منتج ----
  const addVariantRow = () => setVariantsForm([...variantsForm, { color: '', img: '', stock: '', extraImages: '' }]);
  const removeVariantRow = (idx) => {
    if (variantsForm.length === 1) return;
    setVariantsForm(variantsForm.filter((_, i) => i !== idx));
  };
  const updateVariantRow = (idx, field, value) => {
    setVariantsForm(variantsForm.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  // ---- إدارة الأجهزة المتوافقة (اختياري) - كل جهاز له صفوف ألوان/صور خاصة بيه ----
  const addDeviceRow = () => setDevicesForm([...devicesForm, { deviceName: '', variants: [{ color: '', img: '', stock: '' }] }]);
  const removeDeviceRow = (deviceIdx) => setDevicesForm(devicesForm.filter((_, i) => i !== deviceIdx));
  const updateDeviceName = (deviceIdx, value) => {
    setDevicesForm(devicesForm.map((d, i) => i === deviceIdx ? { ...d, deviceName: value } : d));
  };
  const addDeviceVariantRow = (deviceIdx) => {
    setDevicesForm(devicesForm.map((d, i) => i === deviceIdx ? { ...d, variants: [...d.variants, { color: '', img: '', stock: '' }] } : d));
  };
  const removeDeviceVariantRow = (deviceIdx, variantIdx) => {
    setDevicesForm(devicesForm.map((d, i) => {
      if (i !== deviceIdx) return d;
      if (d.variants.length === 1) return d;
      return { ...d, variants: d.variants.filter((_, vi) => vi !== variantIdx) };
    }));
  };
  const updateDeviceVariant = (deviceIdx, variantIdx, field, value) => {
    setDevicesForm(devicesForm.map((d, i) => {
      if (i !== deviceIdx) return d;
      return { ...d, variants: d.variants.map((v, vi) => vi === variantIdx ? { ...v, [field]: value } : v) };
    }));
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNameAr(''); setNameEn(''); setDescAr(''); setDescEn('');
    setPrice(''); setOldPrice(''); setDiscount(''); setStock(''); setVideoUrl('');
    setProductCategory('cases');
    setVariantsForm([{ color: 'أسود', img: '' }]);
    setDevicesForm([]);
  };

  // تجهيز الفورم بالبيانات الحالية للمنتج المطلوب تعديله
  const startEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductCategory(product.category);
    setNameAr(product.nameAr);
    setNameEn(product.nameEn === product.nameAr ? '' : product.nameEn);
    setDescAr(product.descAr || '');
    setDescEn(product.descEn || '');
    setPrice(product.price);
    setOldPrice(product.oldPrice || '');
    setDiscount((product.discount || '').replace('%', ''));
    setStock(product.stock);
    setVideoUrl(product.videoUrl || '');
    setVariantsForm(product.variants && product.variants.length > 0
      ? product.variants.map(v => ({ color: v.color, img: v.img, stock: v.stock ?? '', extraImages: (v.images || []).join(', ') }))
      : [{ color: 'أسود', img: '', stock: '', extraImages: '' }]);
    setDevicesForm(product.devices ? product.devices.map(d => ({ deviceName: d.deviceName, variants: d.variants.map(v => ({ ...v })) })) : []);
    setAdminTab('products');
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(lang === 'ar' ? `متأكد إنك عايز تحذف "${productName}" نهائياً؟` : `Delete "${productName}" permanently?`)) return;
    try {
      await apiFetch(`/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (editingProductId === productId) resetProductForm();
      showToast(lang === 'ar' ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully', 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!nameAr || !price || stock === '') return;
    setProductSaving(true);

    const cleanedVariants = variantsForm
      .filter(v => v.color.trim())
      .map(v => ({
        color: v.color.trim(),
        img: v.img.trim() || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
        stock: v.stock === '' || v.stock === undefined ? 0 : Number(v.stock),
        images: (v.extraImages || '').split(',').map(s => s.trim()).filter(Boolean)
      }));

    // الأجهزة المتوافقة (اختياري) - كل جهاز لازم اسم ولون واحد على الأقل عشان يتحسب
    const cleanedDevices = devicesForm
      .filter(d => d.deviceName.trim())
      .map(d => ({
        deviceName: d.deviceName.trim(),
        variants: d.variants
          .filter(v => v.color.trim())
          .map(v => ({
            color: v.color.trim(),
            img: v.img.trim() || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
            stock: v.stock === '' || v.stock === undefined ? 0 : Number(v.stock)
          }))
      }))
      .filter(d => d.variants.length > 0);

    // لو المنتج له أجهزة متوافقة، الألوان بتبقى تابعة لكل جهاز بدل قائمة ألوان عامة
    const finalVariants = cleanedDevices.length > 0
      ? []
      : (cleanedVariants.length > 0 ? cleanedVariants : [{ color: 'افتراضي', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', stock: Number(stock) }]);

    const payload = {
      category: productCategory,
      nameAr,
      nameEn: nameEn || nameAr,
      descAr,
      descEn: descEn || descAr,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : 0,
      discount: discount ? discount + "%" : "0%",
      stock: Number(stock),
      videoUrl: videoUrl.trim(),
      variants: finalVariants,
      devices: cleanedDevices
    };

    try {
      if (editingProductId) {
        await apiFetch(`/products/${editingProductId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify(payload)
        });
        showToast(lang === 'ar' ? 'تم تحديث المنتج بنجاح ✏️' : 'Product updated successfully ✏️', 'success');
      } else {
        await apiFetch('/products', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify(payload)
        });
        showToast(lang === 'ar' ? 'تم إضافة المنتج بنجاح 📦' : 'Product added successfully 📦', 'success');
      }

      resetProductForm();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProductSaving(false);
    }
  };

  const handleAddAd = async (e) => {
    e.preventDefault();
    if (!adTitle.trim() || !adImage.trim()) return;
    try {
      await apiFetch('/ads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ title: adTitle.trim(), image: adImage.trim(), productId: adProductId || null })
      });
      setAdTitle(''); setAdImage(''); setAdProductId('');
      showToast(lang === 'ar' ? 'تم إضافة الإعلان بنجاح 🎬' : 'Ad added successfully 🎬', 'success');
      loadAds();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const removeAd = async (id) => {
    try {
      await apiFetch(`/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      showToast(lang === 'ar' ? 'تم حذف الإعلان' : 'Ad removed', 'success');
      loadAds();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // حماية إضافية: لو مستخدم عادي مسجل دخول، امنعه من الدخول لصفحات الأدمن حتى لو وصل لها بأي طريقة
  useEffect(() => {
    if (user && (page === 'admin' || page === 'admin-login')) {
      setPage('home');
    }
  }, [user, page]);

  // لو حد فتح صفحة الأدمن من غير توكن أدمن صالح (مثلاً بعد تسجيل خروج أو صلاحية التوكن انتهت)
  useEffect(() => {
    if (page === 'admin' && !adminToken) {
      setPage('admin-login');
    }
  }, [page, adminToken]);

  // صفحة المفضلة محتاجة تسجيل دخول
  useEffect(() => {
    if (page === 'wishlist' && !user) {
      setPage('home');
      setIsAuthOpen(true);
    }
  }, [page, user]);

  const myOrders = user ? orders : [];

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ================= Nav Bar ================= */}
      {(page === 'admin' || page === 'admin-login') ? (
        // ناف بار مخصص للأدمن - نظيف ومحترف، من غير أي عناصر خاصة بالعميل (تسجيل دخول/سلة)
        <nav className="bg-[#0F172A] text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <MobiBoostLogo variant="light" className="h-7" />
              <span className="hidden sm:inline text-[10px] bg-white/10 text-blue-200 font-bold px-2.5 py-1 rounded-full tracking-wide">ADMIN PANEL</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-white/5 hover:bg-white/10 text-xs font-bold py-1.5 px-2 rounded-lg border border-white/10 transition-colors">{lang === 'ar' ? '🇺🇸 EN' : '🇪🇬 عـربي'}</button>
              <button onClick={() => setIsDark(!isDark)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm border border-white/10 transition-colors">{isDark ? '☀️' : '🌙'}</button>
              {page === 'admin' && adminToken && (
                <button onClick={handleAdminLogout} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  خروج
                </button>
              )}
            </div>
          </div>
        </nav>
      ) : (
        // ناف بار المتجر العادي للعملاء - تصميم فاخر بخلفية فاتحة نظيفة (أسلوب البراندات العالمية)
        <nav className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDark ? 'bg-slate-950/95 border-gray-800' : 'bg-white/95 border-gray-100'}`}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
              <button onClick={() => setPage('home')} className="shrink-0">
                <MobiBoostLogo variant={isDark ? 'light' : 'dark'} className="h-8" />
              </button>
              <div className="flex items-center gap-1 font-bold text-xs md:text-sm whitespace-nowrap">
                <button onClick={() => setPage('home')} className={`px-3 py-2 rounded-lg transition-colors ${page === 'home' ? 'text-[#2563EB]' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-[#0F172A]'}`}>{t.home}</button>
                <button onClick={() => setPage('collections')} className={`px-3 py-2 rounded-lg transition-colors ${page === 'collections' ? 'text-[#2563EB]' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-[#0F172A]'}`}>{t.collections}</button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-lg text-sm border transition-colors ${isSearchOpen ? 'bg-[#2563EB] text-white border-[#2563EB]' : isDark ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} title={lang === 'ar' ? 'بحث' : 'Search'}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className={`text-xs font-bold py-1.5 px-2.5 rounded-lg border transition-colors ${isDark ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>{lang === 'ar' ? '🇺🇸 EN' : '🇪🇬 عـربي'}</button>
              <button onClick={() => setIsDark(!isDark)} className={`p-1.5 rounded-lg text-sm border transition-colors ${isDark ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>{isDark ? '☀️' : '🌙'}</button>

              {user ? (
                <div className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-semibold border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-[11px] font-black text-white">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className={`max-w-[100px] truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.name}</span>
                  <button
                    onClick={handleLogout}
                    title={t.logout}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthTab('login'); setLoginError(''); setRegisterError(''); setIsAuthOpen(true); }} className="bg-[#0F172A] hover:bg-[#1e293b] text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-all active:scale-95">{t.login}</button>
              )}

              {user && (
                <button onClick={() => setPage('wishlist')} className={`relative p-2 rounded-lg text-sm border transition-colors ${page === 'wishlist' ? 'bg-red-50 border-red-200 text-red-500' : isDark ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`} title={lang === 'ar' ? 'المفضلة' : 'Wishlist'}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={wishlist.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black">{wishlist.length}</span>
                  )}
                </button>
              )}

              <button onClick={() => { if (!user) { setAuthTab('login'); setIsAuthOpen(true); } else { setIsCartOpen(true); } }} className="relative bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.876-4.906 2.283-7.5H5.106M14.25 21a.75.75 0 100-1.5.75.75 0 000 1.5zm-8 0a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                </svg>
                <span key={cart.reduce((c, i) => c + i.quantity, 0)} className="bg-white text-[#2563EB] text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black animate-toast-in">{cart.reduce((c, i) => c + i.quantity, 0)}</span>
              </button>
            </div>
          </div>

          {/* شريط البحث المنسدل */}
          {isSearchOpen && (
            <div className={`border-t px-4 py-3 ${isDark ? 'border-gray-800 bg-slate-950' : 'border-gray-100 bg-white'}`}>
              <div className="max-w-6xl mx-auto relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-3' : 'left-3'} text-gray-400`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ar' ? 'دور على منتج، ماركة، أو قسم...' : 'Search for a product, brand, or category...'}
                  className={`w-full border rounded-xl py-2.5 text-sm outline-none focus:border-[#2563EB] transition-colors ${lang === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'} ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600`}>×</button>
                )}
              </div>
            </div>
          )}
        </nav>
      )}

      {/* ================= Container الموحد ================= */}
      <main key={page} className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 animate-page-fade">
        <style>{`
          @keyframes pageFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          .animate-page-fade { animation: pageFadeIn 0.3s ease-out; }
        `}</style>


        {/* 1. صفحة المتجر الرئيسية */}
        {page === 'home' && (() => {
          const trimmedQuery = searchQuery.trim();
          if (trimmedQuery) {
            const q = trimmedQuery.toLowerCase();
            const searchResults = products.filter(p =>
              p.nameAr.toLowerCase().includes(q) ||
              (p.nameEn || '').toLowerCase().includes(q) ||
              (p.descAr || '').toLowerCase().includes(q) ||
              (p.descEn || '').toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q)
            );

            return (
              <div>
                <div className="mb-6">
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#2563EB]">{lang === 'ar' ? 'نتائج البحث' : 'Search Results'}</span>
                  <h3 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white mt-1">"{trimmedQuery}"</h3>
                  <p className="text-sm text-gray-400 mt-1">{searchResults.length} {lang === 'ar' ? 'نتيجة' : 'results'}</p>
                </div>

                {searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <p className="text-gray-400 mb-4">{lang === 'ar' ? `مفيش نتائج لـ "${trimmedQuery}"، جرب كلمة تانية.` : `No results for "${trimmedQuery}", try another search.`}</p>
                    <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="bg-[#0F172A] text-white font-bold px-5 py-2.5 rounded-lg text-sm">{lang === 'ar' ? 'تصفح كل المنتجات' : 'Browse All Products'}</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {searchResults.map(prod => renderProductCard(prod))}
                  </div>
                )}
              </div>
            );
          }

          return (
          <div>
            <div className="text-center mb-8 py-10 bg-gradient-to-br from-[#0F172A] via-[#1e3a8a] to-[#2563EB] rounded-2xl text-white shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <h2 className="text-2xl md:text-4xl font-black mb-2 relative">{t.heroTitle}</h2>
              <p className="text-xs md:text-sm text-blue-100 px-4 relative">{t.heroSub}</p>
              <p className="text-[10px] md:text-xs text-blue-300 font-bold tracking-widest mt-3 uppercase relative">Upgrade Your Phone Experience</p>
            </div>

            {/* ===== شريط الإعلانات المتحرك (Marquee) ===== */}
            {ads.length > 0 && (
              <div className="relative w-full overflow-hidden mb-10 rounded-2xl group" dir="ltr">
                <style>{`
                  @keyframes mobiMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                  .mobi-marquee-track { animation: mobiMarquee 30s linear infinite; }
                  .mobi-marquee-track:hover { animation-play-state: paused; }
                `}</style>

                <div className="flex gap-4 w-max mobi-marquee-track" dir="ltr">
                  {[...ads, ...ads].map((ad, idx) => (
                    <div
                      key={`${ad.id}-${idx}`}
                      onClick={() => { if (ad.productId) { setDetailProductId(ad.productId); setProductMediaTab('photo'); setPage('product-detail'); } }}
                      className={`relative w-72 md:w-96 h-40 md:h-52 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-black/5 ${ad.productId ? 'cursor-pointer' : ''}`}
                    >
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent flex items-end p-4">
                        <h3 className="text-white text-xs md:text-sm font-black drop-shadow">{ad.title}</h3>
                      </div>
                      {ad.productId && (
                        <span className="absolute top-2 left-2 bg-white/90 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">🛍️ اضغط للتفاصيل</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#2563EB]">{lang === 'ar' ? 'وصل حديثاً' : 'New Arrivals'}</span>
              <h3 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white mt-1">{t.latestProducts}</h3>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => renderProductSkeleton(`skeleton-${i}`))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">{lang === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'No products available yet'}</p>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(prod => renderProductCard(prod))}
            </div>
            )}

            {/* ===== تصفح حسب الأقسام - كل قسم وعدد منتجاته، بالدوس عليه بينقلك لمنتجات القسم فقط ===== */}
            <div className="mt-14">
              <div className="mb-6">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#2563EB]">{lang === 'ar' ? 'تسوق حسب الفئة' : 'Shop By Category'}</span>
                <h3 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white mt-1">{t.collections}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => {
                  const catProducts = products.filter(p => p.category === cat.id);
                  const coverImg = catProducts[0]?.variants?.[0]?.img;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCollection(cat.id); setPage('collections'); }}
                      className={`relative h-36 md:h-44 rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl text-right group transition-all duration-300 active:scale-[0.97] ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
                    >
                      {coverImg ? (
                        <img src={coverImg} alt={cat.nameAr} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/10 to-transparent flex flex-col justify-end p-4">
                        <span className="text-white font-black text-sm md:text-base">{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white/70 text-[10px] font-medium">{catProducts.length} {lang === 'ar' ? 'منتج' : 'items'}</span>
                          <span className="text-[#2563EB] text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {lang === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d={lang === 'ar' ? "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" : "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"} />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* طلبات العميل الحالي فقط - هيستوري منظم ومرتب بالأحدث أولاً */}
            {user && (
              <div className={`mt-12 p-6 rounded-2xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-xs'}`}>
                <h3 className="text-md font-black border-b pb-3 mb-4 flex items-center gap-2">{t.myOrdersTitle}</h3>
                {myOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="text-4xl block mb-3">📦</span>
                    <p className="text-gray-400 text-sm mb-4">{t.noOrdersYet}</p>
                    <button onClick={() => setPage('collections')} className="bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-lg text-xs">{t.browseProducts}</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myOrders.map(order => (
                      <div key={order.orderId} className={`p-4 rounded-xl border text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                          <div>
                            <span className="font-bold text-[#2563EB]">#{order.orderId}</span>
                            <p className="text-gray-400 mt-1">{order.items.map(i => `${i.name} (${i.chosenColor || 'افتراضي'})`).join(', ')}</p>
                            <p className="text-gray-400 mt-1">{order.date}</p>
                          </div>
                          <span className="font-black text-sm shrink-0">{order.totalAmount} {t.currency}</span>
                        </div>
                        {order.status !== 'delivered' ? (
                          renderOrderProgress(order.status)
                        ) : (
                          <div className="flex items-center gap-1.5 mt-3 text-emerald-600 font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {lang === 'ar' ? 'تم التسليم بنجاح' : 'Delivered Successfully'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}

        {/* 2. صفحة تصفح الأقسام */}
        {page === 'collections' && (() => {
          const collectionProducts = products.filter(p => p.category === selectedCollection);
          return (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] dark:text-white mb-1">{lang === 'ar' ? 'استكشف تشكيلاتنا' : 'Explore Our Collections'}</h2>
              <p className="text-sm text-gray-400">{lang === 'ar' ? 'اختر التصنيف اللي يناسب احتياجك' : 'Choose the category that fits your needs'}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCollection(cat.id)} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${selectedCollection === cat.id ? 'bg-[#0F172A] text-white shadow-md' : isDark ? 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {collectionProducts.length === 0 ? (
                <p className="col-span-full text-center text-gray-400 py-12">{lang === 'ar' ? 'لا توجد منتجات في هذا القسم حالياً' : 'No products in this category yet'}</p>
              ) : (
                collectionProducts.map(prod => renderProductCard(prod))
              )}
            </div>
          </div>
          );
        })()}

        {/* صفحة تفاصيل المنتج - تظهر عند الضغط على أي منتج أو إعلان مرتبط بمنتج */}
        {page === 'product-detail' && (() => {
          const prod = products.find(p => p.id === detailProductId);

          if (!prod) {
            return (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">{lang === 'ar' ? 'هذا المنتج غير متاح حالياً.' : 'This product is no longer available.'}</p>
                <button onClick={() => setPage('home')} className="bg-[#0F172A] text-white font-bold px-5 py-2.5 rounded-lg text-sm">{lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</button>
              </div>
            );
          }

          const hasDevices = prod.devices && prod.devices.length > 0;
          const deviceIdx = selectedDevices[prod.id] !== undefined ? selectedDevices[prod.id] : 0;
          const activeVariants = getActiveVariants(prod, deviceIdx);
          const currentIdx = selectedVariants[prod.id] !== undefined ? selectedVariants[prod.id] : 0;
          const activeVariant = activeVariants[currentIdx] || activeVariants[0] || null;
          // جاليري الصور - الصورة الرئيسية للون + أي صور إضافية أضافها الأدمن
          const galleryImages = activeVariant ? [activeVariant.img, ...(activeVariant.images || [])].filter(Boolean) : [];
          const displayImg = galleryImages[detailImageIdx] || galleryImages[0] || prod.image;
          const isSoldOut = (prod.stock ?? 0) <= 0;
          const hasVideo = !!prod.videoUrl;
          const activeMedia = productMediaTab === 'video' && hasVideo ? 'video' : 'photo';
          const isWishlisted = wishlist.includes(prod.id);

          // تحويل روابط يوتيوب/فيميو العادية لصيغة embed تلقائياً عشان تشتغل جوه الصفحة
          const getEmbedUrl = (url) => {
            if (!url) return null;
            const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/);
            if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
            const vm = url.match(/vimeo\.com\/(\d+)/);
            if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
            return null; // مش يوتيوب/فيميو - هيتعامل معاه كفيديو MP4 مباشر
          };
          const embedUrl = hasVideo ? getEmbedUrl(prod.videoUrl) : null;

          // مخزون اللون/الفاريانت المختار حالياً بالتحديد (لو متتبع لوحده)
          const variantStockValue = (activeVariant && typeof activeVariant.stock === 'number') ? activeVariant.stock : prod.stock;
          const isVariantSoldOut = isSoldOut || variantStockValue <= 0;

          // منتجات ذات صلة - من نفس القسم، من غير المنتج الحالي، بحد أقصى 4
          const relatedProducts = products.filter(p => p.category === prod.category && p.id !== prod.id).slice(0, 4);

          return (
            <div>
              <button onClick={() => setPage('home')} className={`flex items-center gap-1.5 text-sm font-bold mb-6 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#0F172A]'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d={lang === 'ar' ? "M12.75 19.5L19.5 12.75l-6.75-6.75M19.5 12.75H4.5" : "M11.25 4.5L4.5 11.25l6.75 6.75M4.5 11.25h15"} />
                </svg>
                {lang === 'ar' ? 'العودة للمنتجات' : 'Back to products'}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  {/* حاوية الميديا الرئيسية - مقاس موحد مربع مع خلفية محايدة لضمان اتساق العرض */}
                  <div className={`aspect-square rounded-2xl overflow-hidden relative ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
                    {activeMedia === 'video' ? (
                      embedUrl ? (
                        <iframe src={embedUrl} title={prod.nameAr} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                      ) : (
                        <video src={prod.videoUrl} controls poster={displayImg} className="w-full h-full object-contain bg-black" />
                      )
                    ) : (
                      <img src={displayImg} alt={prod.nameAr} className={`w-full h-full object-contain p-6 ${isSoldOut ? 'grayscale' : ''}`} />
                    )}
                    {isSoldOut && activeMedia === 'photo' && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center">
                        <span className="bg-[#0F172A] text-white font-black text-base px-5 py-2 rounded-lg shadow-lg">{t.soldOut}</span>
                      </div>
                    )}
                    <button
                      onClick={() => toggleWishlist(prod.id)}
                      className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:text-red-500'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                  </div>

                  {/* شريط الصور المصغرة (جاليري) - يظهر بس لو فيه أكتر من صورة للون المختار */}
                  {activeMedia === 'photo' && galleryImages.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDetailImageIdx(idx)}
                          className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${detailImageIdx === idx ? 'border-[#2563EB]' : isDark ? 'border-gray-800' : 'border-gray-200'} ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-contain p-1" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* تابات التبديل بين الصورة والفيديو - يظهر بس لو فيه فيديو مضاف للمنتج */}
                  {hasVideo && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setProductMediaTab('photo')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeMedia === 'photo' ? 'bg-[#0F172A] text-white' : isDark ? 'bg-gray-900 text-gray-400 border border-gray-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {lang === 'ar' ? 'الصور' : 'Photos'}
                      </button>
                      <button
                        onClick={() => setProductMediaTab('video')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeMedia === 'video' ? 'bg-[#2563EB] text-white' : isDark ? 'bg-gray-900 text-gray-400 border border-gray-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        {lang === 'ar' ? 'فيديو المنتج' : 'Product Video'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#2563EB]">{prod.category}</span>
                  <h2 className="text-2xl md:text-3xl font-black mt-2 mb-2 text-[#0F172A] dark:text-white">{lang === 'ar' ? prod.nameAr : prod.nameEn}</h2>
                  {prod.reviewCount > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={star <= Math.round(prod.avgRating) ? '#F59E0B' : '#E5E7EB'} className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.454 1.405 1.02L10 15.591l4.069 2.485c.713.435 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-500">{prod.avgRating.toFixed(1)} ({prod.reviewCount} {lang === 'ar' ? 'تقييم' : 'reviews'})</span>
                    </div>
                  )}
                  {(prod.descAr || prod.descEn) && (
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">{lang === 'ar' ? prod.descAr : prod.descEn}</p>
                  )}
                  {getPromotionBadgeForProduct(prod) && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold text-sm px-4 py-2.5 rounded-xl mb-5">
                      <span className="text-lg">🎁</span>
                      <span>{getPromotionBadgeForProduct(prod).title}</span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-3xl font-black text-[#2563EB]">{prod.price} {t.currency}</span>
                    {prod.oldPrice ? <span className="text-base text-gray-400 line-through">{prod.oldPrice} {t.currency}</span> : null}
                    {prod.discount && prod.discount !== '0%' && (
                      <span className="text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-full">-{prod.discount}</span>
                    )}
                  </div>

                  {hasDevices && (
                    <div className="mb-5">
                      <label className="text-sm font-bold block mb-2 text-[#0F172A] dark:text-white">📱 {lang === 'ar' ? 'الأجهزة المتاحة لهذا المنتج' : 'Available Devices'}</label>
                      <div className="flex gap-2 flex-wrap">
                        {prod.devices.map((d, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setSelectedDevices({ ...selectedDevices, [prod.id]: idx }); setSelectedVariants({ ...selectedVariants, [prod.id]: 0 }); setDetailImageIdx(0); }}
                            className={`text-sm px-3.5 py-2 rounded-lg border font-bold transition-all ${deviceIdx === idx ? 'bg-[#0F172A] text-white border-[#0F172A]' : isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}
                          >
                            {d.deviceName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeVariants.length > 0 && (
                    <div className="mb-6">
                      <label className="text-sm font-bold block mb-2 text-[#0F172A] dark:text-white">{lang === 'ar' ? 'الألوان المتاحة' : 'Available Colors'}</label>
                      <div className="flex gap-2 flex-wrap">
                        {activeVariants.map((v, idx) => {
                          const variantSoldOut = typeof v.stock === 'number' && v.stock <= 0;
                          return (
                            <button
                              key={idx}
                              onClick={() => { if (!variantSoldOut) { setSelectedVariants({ ...selectedVariants, [prod.id]: idx }); setDetailImageIdx(0); } }}
                              disabled={variantSoldOut}
                              className={`text-sm px-3.5 py-2 rounded-lg border font-bold transition-all ${
                                variantSoldOut
                                  ? 'opacity-50 cursor-not-allowed line-through bg-gray-100 text-gray-400 border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                                  : currentIdx === idx ? 'bg-[#2563EB] text-white border-[#2563EB]' : isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-300'
                              }`}
                            >
                              {v.color}{variantSoldOut && <span className="text-[10px] mr-1">({lang === 'ar' ? 'خلص' : 'Out'})</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    {isVariantSoldOut ? (
                      <span className="text-red-600 font-bold text-sm">{t.soldOut}</span>
                    ) : variantStockValue <= 5 ? (
                      <span className="text-amber-600 font-bold text-sm">{t.itemsLeft}: {variantStockValue}</span>
                    ) : (
                      <span className="text-emerald-600 font-bold text-sm">{lang === 'ar' ? 'متوفر بالمخزن' : 'In Stock'} ✓</span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    disabled={isVariantSoldOut}
                    className={`w-full font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] ${isVariantSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'}`}
                  >
                    {isVariantSoldOut ? t.soldOut : t.addToCart}
                  </button>

                  {/* شارات ثقة - لمسة احترافية تعكس هوية البراند */}
                  <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563EB" className="w-5 h-5 mx-auto mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                      <p className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}</p>
                    </div>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563EB" className="w-5 h-5 mx-auto mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      <p className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{lang === 'ar' ? 'منتجات أصلية' : 'Genuine Products'}</p>
                    </div>
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563EB" className="w-5 h-5 mx-auto mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      <p className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== قسم التقييمات والمراجعات ===== */}
              <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-black text-[#0F172A] dark:text-white mb-6">{lang === 'ar' ? 'تقييمات العملاء' : 'Customer Reviews'}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className={`p-5 rounded-2xl border h-fit ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                    {user ? (
                      <>
                        <p className="text-sm font-bold mb-3">{lang === 'ar' ? 'قيّم هذا المنتج' : 'Rate this product'}</p>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setMyRating(star)} className="transition-transform active:scale-90">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={star <= myRating ? '#F59E0B' : '#E5E7EB'} className="w-7 h-7">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.454 1.405 1.02L10 15.591l4.069 2.485c.713.435 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows="3"
                          value={myComment}
                          onChange={(e) => setMyComment(e.target.value)}
                          placeholder={lang === 'ar' ? 'شاركنا رأيك في المنتج (اختياري)...' : 'Share your thoughts (optional)...'}
                          className={`w-full border rounded-xl p-3 text-xs outline-none focus:border-[#2563EB] resize-none mb-3 ${isDark ? 'bg-slate-950 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                        />
                        <button
                          onClick={() => submitReview(prod.id)}
                          disabled={reviewSubmitting}
                          className={`w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] ${reviewSubmitting ? 'opacity-60 cursor-wait' : ''}`}
                        >
                          {reviewSubmitting ? '⏳ ...' : (lang === 'ar' ? 'نشر التقييم' : 'Submit Review')}
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-400 mb-3">{lang === 'ar' ? 'سجل دخولك عشان تقدر تقيّم المنتج' : 'Login to rate this product'}</p>
                        <button onClick={() => { setAuthTab('login'); setIsAuthOpen(true); }} className="bg-[#0F172A] text-white font-bold px-4 py-2 rounded-lg text-xs">{t.login}</button>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    {reviewsLoading ? (
                      <p className="text-xs text-gray-400">{lang === 'ar' ? 'جاري تحميل التقييمات...' : 'Loading reviews...'}</p>
                    ) : productReviews.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="text-3xl block mb-2">💬</span>
                        <p className="text-xs text-gray-400">{lang === 'ar' ? 'مفيش تقييمات لسه، كن أول من يقيّم هذا المنتج!' : 'No reviews yet — be the first to review this product!'}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productReviews.map(r => (
                          <div key={r.id} className={`pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[11px] font-black">{r.customerName.charAt(0).toUpperCase()}</span>
                                <span className="text-xs font-bold">{r.customerName}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                            </div>
                            <div className="flex gap-0.5 mb-1.5 mr-9">
                              {[1, 2, 3, 4, 5].map(star => (
                                <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={star <= r.rating ? '#F59E0B' : '#E5E7EB'} className="w-3 h-3">
                                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.454 1.405 1.02L10 15.591l4.069 2.485c.713.435 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                                </svg>
                              ))}
                            </div>
                            {r.comment && <p className="text-xs text-gray-500 mr-9 leading-relaxed">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== منتجات ذات صلة ===== */}
              {relatedProducts.length > 0 && (
                <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800">
                  <div className="mb-6">
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#2563EB]">{lang === 'ar' ? 'قد يعجبك أيضاً' : 'You Might Also Like'}</span>
                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white mt-1">{lang === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {relatedProducts.map(rp => renderProductCard(rp))}
                  </div>
                </div>
              )}

              {/* شريط الشراء الثابت أسفل الشاشة - للموبايل بس، عشان زرار الشراء يفضل ظاهر مهما نزل العميل تحت */}
              <div className={`md:hidden fixed bottom-0 inset-x-0 z-30 border-t p-3 flex items-center gap-3 ${isDark ? 'bg-slate-950/95 border-gray-800' : 'bg-white/95 border-gray-100'} backdrop-blur-md`}>
                <div className="shrink-0">
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'السعر' : 'Price'}</p>
                  <p className="text-base font-black text-[#2563EB]">{prod.price} {t.currency}</p>
                </div>
                <button
                  onClick={() => addToCart(prod)}
                  disabled={isVariantSoldOut}
                  className={`flex-1 font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] ${isVariantSoldOut ? 'bg-gray-300 text-gray-500' : 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/25'}`}
                >
                  {isVariantSoldOut ? t.soldOut : t.addToCart}
                </button>
              </div>
              {/* مساحة فاضية أسفل الصفحة على الموبايل عشان الشريط الثابت متغطيش آخر المحتوى */}
              <div className="md:hidden h-20" />
            </div>
          );
        })()}

        {/* صفحة المفضلة (Wishlist) */}
        {page === 'wishlist' && (() => {
          const wishlistProducts = products.filter(p => wishlist.includes(p.id));
          return (
            <div>
              <div className="mb-6">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#2563EB]">{lang === 'ar' ? 'المحفوظات' : 'Saved Items'}</span>
                <h2 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white mt-1">{lang === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'}</h2>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="text-center py-16">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <p className="text-gray-400 mb-4">{lang === 'ar' ? 'لسه مفيش منتجات في المفضلة، احفظ اللي يعجبك عشان ترجعله بسهولة.' : 'No saved items yet — save products you love to find them easily later.'}</p>
                  <button onClick={() => setPage('collections')} className="bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-lg text-sm">{t.browseProducts}</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wishlistProducts.map(prod => renderProductCard(prod))}
                </div>
              )}
            </div>
          );
        })()}

        {/* 3. استدعاء صفحة تسجيل دخول الأدمن */}
        {page === 'admin-login' && (
          <AdminLogin setPage={setPage} isDark={isDark} onLoginSuccess={handleAdminLoginSuccess} />
        )}

        {/* 4. لوحة الإدارة والتحكم السرية بالكامل */}
        {page === 'admin' && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b pb-4 flex-wrap gap-3">
              <h2 className="text-xl font-black text-blue-500">📦 {t.adminTitle}</h2>
              <div className="flex gap-2 text-xs font-bold flex-wrap items-center">
                <button onClick={() => setAdminTab('dashboard')} className={`px-4 py-2 rounded-lg ${adminTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800'}`}>📊 التحليلات</button>
                <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-lg ${adminTab === 'orders' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'}`}>📥 الطلبات الواردة ({orders.filter(o => o.status === 'preparing').length})</button>
                <button onClick={() => setAdminTab('products')} className={`px-4 py-2 rounded-lg ${adminTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>✨ إضافة المنتجات</button>
                <button onClick={() => setAdminTab('ads')} className={`px-4 py-2 rounded-lg ${adminTab === 'ads' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>🎬 الإعلانات</button>
                <button onClick={() => setAdminTab('promotions')} className={`px-4 py-2 rounded-lg ${adminTab === 'promotions' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-800'}`}>🎁 العروض والشحن</button>
                {adminTab === 'orders' && (
                  <button onClick={loadAllOrders} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300" title="تحديث الطلبات">
                    🔄 {ordersLoading ? 'جاري التحديث...' : 'تحديث'}
                  </button>
                )}
              </div>
            </div>

            {adminTab === 'dashboard' && (
              dashboardLoading ? (
                <p className="text-center text-gray-400 py-12 text-sm">⏳ جاري تحميل التحليلات...</p>
              ) : !dashboardStats ? (
                <p className="text-center text-gray-400 py-12 text-sm">لا توجد بيانات كافية بعد.</p>
              ) : (
                <div className="space-y-6">
                  {/* بطاقات إجمالي آخر 7 أيام */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <p className="text-2xl font-black text-[#2563EB]">{dashboardStats.weekTotals.revenue.toLocaleString()}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-1">إجمالي مبيعات آخر 7 أيام (ج.م)</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <p className="text-2xl font-black text-emerald-500">{dashboardStats.weekTotals.profit.toLocaleString()}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-1">صافي الربح آخر 7 أيام (ج.م)</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <p className="text-2xl font-black text-amber-500">{dashboardStats.totalOrdersAllTime}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-1">إجمالي الطلبات (كل الأوقات)</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <p className="text-2xl font-black text-purple-500">{dashboardStats.totalCustomers}</p>
                      <p className="text-[11px] font-bold text-gray-400 mt-1">إجمالي العملاء المسجلين</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* رسم بياني بسيط بالأعمدة لآخر 7 أيام (CSS بحت، من غير مكتبات) */}
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <h3 className="font-black text-sm mb-4">📈 مبيعات آخر 7 أيام</h3>
                      {dashboardStats.last7Days.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">لا توجد بيانات كافية بعد</p>
                      ) : (
                        <div className="flex items-end justify-between gap-2 h-40">
                          {dashboardStats.last7Days.map((day, idx) => {
                            const maxRevenue = Math.max(...dashboardStats.last7Days.map(d => d.revenue), 1);
                            const heightPct = Math.max(4, (day.revenue / maxRevenue) * 100);
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group">
                                <span className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{day.revenue} ج.م</span>
                                <div className="w-full bg-[#2563EB] rounded-t-md transition-all hover:bg-blue-700" style={{ height: `${heightPct}%` }} />
                                <span className="text-[9px] text-gray-400 font-bold">{new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'short' })}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* توزيع حالات الطلبات */}
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <h3 className="font-black text-sm mb-4">📦 حالات الطلبات (كل الأوقات)</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'preparing', label: 'قيد التحضير', color: 'bg-amber-500' },
                          { key: 'shipping', label: 'في الطريق', color: 'bg-blue-500' },
                          { key: 'delivered', label: 'تم التسليم', color: 'bg-emerald-500' },
                        ].map(s => {
                          const count = dashboardStats.statusCounts[s.key] || 0;
                          const total = dashboardStats.totalOrdersAllTime || 1;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={s.key}>
                              <div className="flex justify-between text-xs font-bold mb-1">
                                <span>{s.label}</span>
                                <span>{count} ({pct}%)</span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* أكثر المنتجات مبيعاً */}
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-black text-sm mb-4">🏆 الأكثر مبيعاً</h3>
                    {dashboardStats.topProducts.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">لسه مفيش مبيعات كفاية لعرض الترتيب</p>
                    ) : (
                      <div className="space-y-2">
                        {dashboardStats.topProducts.map((p, idx) => (
                          <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${idx === 0 ? 'bg-amber-400 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span>
                            <span className="text-xs font-bold flex-grow truncate">{p.nameAr}</span>
                            <span className="text-xs font-black text-[#2563EB] shrink-0">{p.salesCount} {lang === 'ar' ? 'مبيع' : 'sold'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {adminTab === 'orders' && (() => {
              const pendingOrders = orders.filter(o => o.status === 'preparing');
              const shippingOrders = orders.filter(o => o.status === 'shipping');
              const deliveredOrders = orders.filter(o => o.status === 'delivered');
              const filteredOrders = adminOrderFilter === 'all' ? orders : orders.filter(o => o.status === adminOrderFilter);

              const statCards = [
                { key: 'preparing', label: 'قيد التحضير', count: pendingOrders.length, activeClass: 'bg-amber-500 text-white border-amber-500 shadow-md' },
                { key: 'shipping', label: 'في الطريق', count: shippingOrders.length, activeClass: 'bg-blue-500 text-white border-blue-500 shadow-md' },
                { key: 'delivered', label: 'مكتملة', count: deliveredOrders.length, activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-md' },
                { key: 'all', label: 'إجمالي الطلبات', count: orders.length, activeClass: 'bg-gray-700 text-white border-gray-700 shadow-md' },
              ];

              return (
                <div className="space-y-6">
                  {/* لوحة إحصائيات سريعة لحالة كل الطلبات */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {statCards.map(card => (
                      <button
                        key={card.key}
                        onClick={() => setAdminOrderFilter(card.key)}
                        className={`p-4 rounded-xl border text-right transition-all ${adminOrderFilter === card.key
                          ? card.activeClass
                          : isDark ? 'bg-gray-900 border-gray-800 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
                      >
                        <p className="text-2xl font-black">{card.count}</p>
                        <p className="text-[11px] font-bold mt-1">{card.label}</p>
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <p className="text-center text-gray-400 py-12 text-sm">لا توجد طلبات في هذه الحالة حالياً 📥</p>
                  ) : (
                    filteredOrders.map(order => (
                    <div key={order.orderId} className={`p-5 rounded-xl border shadow-xs ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                      <div className="flex flex-wrap justify-between items-center border-b pb-3 mb-4 gap-2">
                        <div>
                          <span className="bg-blue-600 text-white font-mono text-xs px-2.5 py-1 rounded-md font-bold">رقم الطلب: {order.orderId}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-500">{order.status}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                        <div className="space-y-2 md:border-l md:pl-4 border-gray-300 dark:border-gray-700">
                          <h4 className="font-black text-sm text-amber-500 mb-2">👤 بيانات العميل والشحن:</h4>
                          <p><span className="font-bold text-gray-400">الاسم:</span> {order.customer.name}</p>
                          <p><span className="font-bold text-gray-400">البريد الإلكتروني:</span> {order.customer.email}</p>
                          <p><span className="font-bold text-gray-400">الهاتف:</span> {order.customer.phone}</p>
                          <p><span className="font-bold text-gray-400">العنوان:</span> {order.customer.address}</p>
                        </div>

                        <div className="md:col-span-2 flex flex-col justify-between">
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-500/5 p-2 rounded-lg">
                                <p className="font-bold">{item.name} <span className="text-amber-500">({item.chosenColor})</span></p>
                                <span className="font-bold">{item.quantity} قطع × {item.price} ج.م</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center border-t pt-3 mt-4 border-gray-200 dark:border-gray-800">
                            {order.status === "preparing" && (
                              <button onClick={() => updateOrderStatus(order.orderId, "shipping")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95">🚚 شحن الطلب الآن</button>
                            )}
                            {order.status === "shipping" && (
                              <button onClick={() => updateOrderStatus(order.orderId, "delivered")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95">✅ تم التوصيل بنجاح</button>
                            )}
                            <span className="font-black text-emerald-500 text-sm">{order.totalAmount} ج.م</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              );
            })()}

            {adminTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-fit">
                  <h3 className={`font-black text-sm mb-4 ${editingProductId ? 'text-amber-500' : 'text-blue-500'}`}>
                    {editingProductId ? '✏️ تعديل بيانات المنتج' : '➕ إضافة منتج جديد'}
                  </h3>
                  <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs font-medium">
                    <div>
                      <label className="block font-bold mb-1">القسم المستهدف *</label>
                      <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nameAr}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1">اسم المنتج بالعربية *</label>
                        <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">اسم المنتج بالإنجليزية</label>
                        <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">{t.description} بالعربية</label>
                      <textarea rows="2" value={descAr} onChange={(e) => setDescAr(e.target.value)} placeholder="وصف مختصر يوضح مميزات المنتج..." className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">{t.description} بالإنجليزية</label>
                      <textarea rows="2" value={descEn} onChange={(e) => setDescEn(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 resize-none"></textarea>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1">السعر الحالي *</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">السعر قبل الخصم</label>
                        <input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">نسبة الخصم %</label>
                        <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">{t.currentStock} *</label>
                      <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="مثال: 30" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                      <p className="text-[10px] text-gray-400 mt-1">تقل هذه الكمية تلقائياً مع كل عملية بيع، وعند وصولها للصفر يظهر المنتج بعلامة "SOLD OUT" ويتوقف الشراء منه.</p>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">🎬 فيديو إعلاني للمنتج (اختياري)</label>
                      <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="رابط يوتيوب / فيميو أو رابط MP4 مباشر" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                      <p className="text-[10px] text-gray-400 mt-1">هيظهر تاب "فيديو المنتج" في صفحة تفاصيل المنتج تلقائياً بمجرد إضافة رابط هنا.</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block font-bold">الألوان والصور المتاحة {devicesForm.length === 0 && '*'}</label>
                        <button type="button" onClick={addVariantRow} className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg">+ إضافة لون آخر</button>
                      </div>
                      {devicesForm.length > 0 && (
                        <p className="text-[10px] text-amber-500 mb-2">⚠️ لما تضيف أجهزة متوافقة تحت، الألوان دي هتتجاهل والعميل هيشوف ألوان كل جهاز لوحده.</p>
                      )}
                      <p className="text-[10px] text-gray-400 mb-2">💡 استخدم صور بنفس النسبة (مربعة يفضّل) عشان تظهر متناسقة زي بعض في المتجر.</p>
                      <div className="space-y-2">
                        {variantsForm.map((v, idx) => (
                          <div key={idx} className={`p-2 rounded-lg ${isDark ? 'bg-gray-950/40' : 'bg-gray-50/60'}`}>
                            <div className="flex gap-2 items-center mb-1.5">
                              <div className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center ${isDark ? 'bg-slate-950 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                                {v.img ? (
                                  <img src={v.img} alt="" className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                                  </svg>
                                )}
                              </div>
                              <input type="text" placeholder="اسم اللون" value={v.color} onChange={(e) => updateVariantRow(idx, 'color', e.target.value)} className="w-1/4 border rounded-lg p-2 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                              <input type="text" placeholder="رابط الصورة الرئيسية (URL)" value={v.img} onChange={(e) => updateVariantRow(idx, 'img', e.target.value)} className="flex-grow border rounded-lg p-2 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                              <input type="number" min="0" placeholder="الكمية" value={v.stock} onChange={(e) => updateVariantRow(idx, 'stock', e.target.value)} className="w-20 border rounded-lg p-2 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                              <button type="button" onClick={() => removeVariantRow(idx)} disabled={variantsForm.length === 1} className="text-red-500 font-black px-2 disabled:opacity-30">×</button>
                            </div>
                            <input
                              type="text"
                              placeholder="🖼️ صور إضافية لنفس اللون (اختياري) - افصل بينهم بفاصلة (,)"
                              value={v.extraImages}
                              onChange={(e) => updateVariantRow(idx, 'extraImages', e.target.value)}
                              className="w-full border rounded-lg p-1.5 text-[11px] bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block font-bold">📱 الأجهزة المتوافقة (اختياري)</label>
                        <button type="button" onClick={addDeviceRow} className="text-[11px] bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-lg">+ إضافة جهاز</button>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-2">مفيد للجرابات والاسكرينات - حدد اسم كل جهاز (مثال: iPhone 13 Pro) وألوانه وصوره الخاصة، والعميل هيختار جهازه الأول قبل اللون.</p>

                      <div className="space-y-3">
                        {devicesForm.map((device, deviceIdx) => (
                          <div key={deviceIdx} className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/10 space-y-2">
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="اسم الجهاز (مثال: iPhone 13 Pro)"
                                value={device.deviceName}
                                onChange={(e) => updateDeviceName(deviceIdx, e.target.value)}
                                className="flex-grow border rounded-lg p-2 bg-white dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 font-bold"
                              />
                              <button type="button" onClick={() => removeDeviceRow(deviceIdx)} className="text-red-500 font-black px-2">🗑️</button>
                            </div>

                            <div className="space-y-1.5 pr-2">
                              {device.variants.map((v, variantIdx) => (
                                <div key={variantIdx} className="flex gap-2 items-center">
                                  <div className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center ${isDark ? 'bg-slate-950 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                                    {v.img ? (
                                      <img src={v.img} alt="" className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-gray-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                                      </svg>
                                    )}
                                  </div>
                                  <input type="text" placeholder="اسم اللون" value={v.color} onChange={(e) => updateDeviceVariant(deviceIdx, variantIdx, 'color', e.target.value)} className="w-1/4 border rounded-lg p-1.5 bg-white dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 text-[11px]" />
                                  <input type="text" placeholder="رابط صورة اللون (URL)" value={v.img} onChange={(e) => updateDeviceVariant(deviceIdx, variantIdx, 'img', e.target.value)} className="flex-grow border rounded-lg p-1.5 bg-white dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 text-[11px]" />
                                  <input type="number" min="0" placeholder="الكمية" value={v.stock} onChange={(e) => updateDeviceVariant(deviceIdx, variantIdx, 'stock', e.target.value)} className="w-16 border rounded-lg p-1.5 bg-white dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 text-[11px]" />
                                  <button type="button" onClick={() => removeDeviceVariantRow(deviceIdx, variantIdx)} disabled={device.variants.length === 1} className="text-red-400 font-black px-1 disabled:opacity-30 text-xs">×</button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addDeviceVariantRow(deviceIdx)} className="text-[10px] text-purple-600 font-bold">+ لون تاني لنفس الجهاز</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" disabled={productSaving} className={`flex-grow text-white font-bold py-3 rounded-lg mt-2 text-xs transition-opacity ${editingProductId ? 'bg-amber-500' : 'bg-emerald-600'} ${productSaving ? 'opacity-60 cursor-wait' : ''}`}>
                        {productSaving ? '⏳ جاري الحفظ...' : (editingProductId ? '💾 حفظ التعديلات' : '➕ نشر وصناعة المنتج بالمتجر')}
                      </button>
                      {editingProductId && (
                        <button type="button" onClick={resetProductForm} className="px-4 rounded-lg mt-2 text-xs font-bold bg-gray-200 text-gray-700">
                          إلغاء
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="p-5 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-fit">
                  <h3 className="font-black text-sm mb-4">{t.productsListTitle}</h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {products.map(p => {
                      const isSoldOut = (p.stock ?? 0) <= 0;
                      return (
                        <div key={p.id} className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-xs ${editingProductId === p.id ? 'border-amber-400 ring-1 ring-amber-400' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={p.variants?.[0]?.img} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold truncate max-w-[140px]">{p.nameAr}</p>
                              <p className="text-gray-400">{p.price} ج.م</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isSoldOut ? (
                              <span className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded-lg">{t.soldOut}</span>
                            ) : (
                              <span className={`font-bold px-2 py-1 rounded-lg ${p.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{t.itemsLeft}: {p.stock}</span>
                            )}
                            <button onClick={() => startEditProduct(p)} title="تعديل" className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id, p.nameAr)} title="حذف" className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'ads' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-fit">
                  <h3 className="font-black text-sm mb-4 text-purple-500">🎬 إضافة إعلان جديد للكاروسيل</h3>
                  <form onSubmit={handleAddAd} className="space-y-4 text-xs font-medium">
                    <div>
                      <label className="block font-bold mb-1">عنوان الإعلان *</label>
                      <input type="text" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="مثال: عروض نهاية الأسبوع 🔥" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">رابط الصورة / الـ GIF *</label>
                      <input type="text" value={adImage} onChange={(e) => setAdImage(e.target.value)} placeholder="https://..." className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                      <p className="text-[10px] text-gray-400 mt-1">تقدر تحط رابط صورة عادية أو رابط GIF متحرك، هيظهر تلقائياً في كاروسيل الإعلانات أعلى الصفحة الرئيسية.</p>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">ربط الإعلان بمنتج (اختياري)</label>
                      <select value={adProductId} onChange={(e) => setAdProductId(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                        <option value="">بدون ربط - إعلان عادي فقط</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">لو اخترت منتج، الدوس على الإعلان في الصفحة الرئيسية هيودي العميل مباشرة لصفحة تفاصيل المنتج ده.</p>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg mt-2 text-xs">➕ إضافة الإعلان للكاروسيل</button>
                  </form>
                </div>

                <div className="p-5 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-fit">
                  <h3 className="font-black text-sm mb-4">📺 الإعلانات الحالية بالكاروسيل ({ads.length})</h3>
                  {ads.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-8">لا يوجد إعلانات مضافة حالياً.</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {ads.map(ad => (
                        <div key={ad.id} className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={ad.image} className="w-14 h-10 rounded-lg object-cover shrink-0" />
                            <p className="font-bold truncate max-w-[160px]">{ad.title}</p>
                          </div>
                          <button onClick={() => removeAd(ad.id)} className="text-red-500 font-black px-2 shrink-0">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === 'promotions' && (
              <div className="space-y-6">
                {/* إعدادات رسوم الشحن */}
                <div className={`p-5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <h3 className="font-black text-sm mb-4 text-blue-500">🚚 رسوم الشحن الافتراضية</h3>
                  <form onSubmit={handleUpdateShippingFee} className="flex items-end gap-3">
                    <div className="flex-grow max-w-xs">
                      <label className="block font-bold mb-1 text-xs">رسوم التوصيل (ج.م)</label>
                      <input type="number" min="0" value={shippingFeeInput} onChange={(e) => setShippingFeeInput(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 text-sm" />
                    </div>
                    <button type="submit" disabled={shippingSaving} className={`bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all active:scale-95 ${shippingSaving ? 'opacity-60' : ''}`}>
                      {shippingSaving ? '⏳...' : 'حفظ'}
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-400 mt-2">الرقم ده بيتضاف تلقائياً على أي أوردر، إلا لو العميل مستحق عرض "توصيل مجاني" فبيتصفّر تلقائياً.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* فورم إضافة عرض جديد */}
                  <div className={`p-5 rounded-xl border h-fit ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-black text-sm mb-4 text-pink-500">🎁 إضافة عرض جديد</h3>
                    <form onSubmit={handleAddPromotion} className="space-y-4 text-xs font-medium">
                      <div>
                        <label className="block font-bold mb-1">عنوان العرض (يظهر للعميل) *</label>
                        <input type="text" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="مثال: اشتري 2 واحصل على الثالث مجاناً" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">نوع العرض *</label>
                        <select value={promoType} onChange={(e) => setPromoType(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                          <option value="buy_x_get_y_free">اشتري X واحصل على Y مجاناً</option>
                          <option value="free_shipping">توصيل مجاني</option>
                          <option value="percentage_off">خصم نسبة %</option>
                          <option value="fixed_off">خصم مبلغ ثابت</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">نطاق التطبيق *</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setPromoScope('all')} className={`flex-1 py-2 rounded-lg font-bold ${promoScope === 'all' ? 'bg-pink-600 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>كل المنتجات</button>
                          <button type="button" onClick={() => setPromoScope('category')} className={`flex-1 py-2 rounded-lg font-bold ${promoScope === 'category' ? 'bg-pink-600 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>قسم معين</button>
                        </div>
                      </div>

                      {promoScope === 'category' && (
                        <div>
                          <label className="block font-bold mb-1">القسم المستهدف</label>
                          <select value={promoCategoryTarget} onChange={(e) => setPromoCategoryTarget(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nameAr}</option>)}
                          </select>
                        </div>
                      )}

                      {promoType === 'buy_x_get_y_free' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold mb-1">اشتري (عدد)</label>
                            <input type="number" min="1" value={promoBuyQty} onChange={(e) => setPromoBuyQty(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">احصل مجاناً (عدد)</label>
                            <input type="number" min="1" value={promoFreeQty} onChange={(e) => setPromoFreeQty(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                          </div>
                          <p className="col-span-2 text-[10px] text-gray-400">مثال: اشتري 2 (buyQty) واحصل على 1 (freeQty) مجاناً = اشتري 2 خد التالت ببلاش، وبتتكرر تلقائياً كل ما العميل يزود الكمية.</p>
                        </div>
                      )}

                      {(promoType === 'free_shipping' || promoType === 'percentage_off' || promoType === 'fixed_off') && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold mb-1">أقل عدد قطع (اختياري)</label>
                            <input type="number" min="0" value={promoMinQty} onChange={(e) => setPromoMinQty(e.target.value)} placeholder="0 = بدون شرط" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">أقل قيمة سلة (ج.م، اختياري)</label>
                            <input type="number" min="0" value={promoMinAmount} onChange={(e) => setPromoMinAmount(e.target.value)} placeholder="0 = بدون شرط" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                          </div>
                          <p className="col-span-2 text-[10px] text-gray-400">حدد شرط واحد على الأقل (عدد قطع أو قيمة سلة) عشان العرض يتفعل.</p>
                        </div>
                      )}

                      {(promoType === 'percentage_off' || promoType === 'fixed_off') && (
                        <div>
                          <label className="block font-bold mb-1">{promoType === 'percentage_off' ? 'نسبة الخصم %' : 'قيمة الخصم (ج.م)'}</label>
                          <input type="number" min="0" value={promoDiscountValue} onChange={(e) => setPromoDiscountValue(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                        </div>
                      )}

                      <button type="submit" disabled={promoSaving} className={`w-full bg-pink-600 text-white font-bold py-3 rounded-lg text-xs transition-all active:scale-[0.98] ${promoSaving ? 'opacity-60' : ''}`}>
                        {promoSaving ? '⏳ جاري الإضافة...' : '🎁 إضافة العرض'}
                      </button>
                    </form>
                  </div>

                  {/* قائمة العروض الحالية */}
                  <div className={`p-5 rounded-xl border h-fit ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-black text-sm mb-4">📋 العروض الحالية ({allPromotions.length})</h3>
                    {allPromotions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">لا توجد عروض مضافة بعد</p>
                    ) : (
                      <div className="space-y-2">
                        {allPromotions.map(promo => {
                          const typeLabels = { buy_x_get_y_free: 'اشتري وخد ببلاش', free_shipping: 'توصيل مجاني', percentage_off: 'خصم نسبة', fixed_off: 'خصم ثابت' };
                          return (
                            <div key={promo.id} className={`p-3 rounded-lg border text-xs ${promo.isActive ? (isDark ? 'bg-slate-950 border-emerald-900/40' : 'bg-emerald-50/50 border-emerald-100') : isDark ? 'bg-slate-950/50 border-gray-800 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-bold truncate">{promo.title}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{typeLabels[promo.type]} • {promo.scope === 'all' ? 'كل المنتجات' : `قسم: ${promo.categoryTarget}`}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button onClick={() => togglePromotionActive(promo)} className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${promo.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                    {promo.isActive ? 'فعّال' : 'متوقف'}
                                  </button>
                                  <button onClick={() => deletePromotion(promo.id)} className="text-red-500 font-black px-1.5">×</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ===== أكواد الخصم (Coupons) - كود يكتبه العميل بنفسه في السلة ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`p-5 rounded-xl border h-fit ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-black text-sm mb-4 text-amber-500">🏷️ إضافة كود خصم جديد</h3>
                    <form onSubmit={handleAddCoupon} className="space-y-4 text-xs font-medium">
                      <div>
                        <label className="block font-bold mb-1">الكود (اللي العميل هيكتبه) *</label>
                        <input type="text" value={couponCodeInput} onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())} placeholder="مثال: WELCOME10" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 font-mono tracking-wider" required />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">نسبة الخصم % *</label>
                        <input type="number" min="1" max="100" value={couponPercentInput} onChange={(e) => setCouponPercentInput(e.target.value)} placeholder="مثال: 10" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold mb-1">أقل قيمة سلة (اختياري)</label>
                          <input type="number" min="0" value={couponMinAmountInput} onChange={(e) => setCouponMinAmountInput(e.target.value)} placeholder="0 = بدون شرط" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">حد الاستخدام (اختياري)</label>
                          <input type="number" min="0" value={couponMaxUsesInput} onChange={(e) => setCouponMaxUsesInput(e.target.value)} placeholder="0 = بدون حد" className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">تاريخ الانتهاء (اختياري)</label>
                        <input type="date" value={couponExpiryInput} onChange={(e) => setCouponExpiryInput(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                      </div>
                      <button type="submit" disabled={couponSaving} className={`w-full bg-amber-500 text-white font-bold py-3 rounded-lg text-xs transition-all active:scale-[0.98] ${couponSaving ? 'opacity-60' : ''}`}>
                        {couponSaving ? '⏳ جاري الإضافة...' : '🏷️ إضافة الكود'}
                      </button>
                    </form>
                  </div>

                  <div className={`p-5 rounded-xl border h-fit ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-black text-sm mb-4">📋 الأكواد الحالية ({allCoupons.length})</h3>
                    {allCoupons.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">لا توجد أكواد خصم مضافة بعد</p>
                    ) : (
                      <div className="space-y-2">
                        {allCoupons.map(coupon => (
                          <div key={coupon.id} className={`p-3 rounded-lg border text-xs ${coupon.isActive ? (isDark ? 'bg-slate-950 border-amber-900/40' : 'bg-amber-50/50 border-amber-100') : isDark ? 'bg-slate-950/50 border-gray-800 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-mono font-black tracking-wider">{coupon.code}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  خصم {coupon.discountPercentage}% • استخدم {coupon.usedCount} {coupon.maxUses > 0 ? `/ ${coupon.maxUses}` : ''} مرة
                                  {coupon.expiresAt && ` • حتى ${new Date(coupon.expiresAt).toLocaleDateString('ar-EG')}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => toggleCouponActive(coupon)} className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${coupon.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                  {coupon.isActive ? 'فعّال' : 'متوقف'}
                                </button>
                                <button onClick={() => deleteCoupon(coupon.id)} className="text-red-500 font-black px-1.5">×</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= كارت سلة المشتريات Side Drawer (تصميم محسّن) ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
          <style>{`
            @keyframes cartSlideIn { from { opacity: 0; transform: scale(0.98) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
          <div className={`w-full max-w-md h-full shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`} style={{ animation: 'cartSlideIn 0.22s ease-out' }}>

            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-black">{t.cartTitle}</h3>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-xl font-bold transition-colors active:scale-90">×</button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="text-5xl">🛍️</span>
                <p className="text-sm text-gray-400 font-medium">{t.emptyCart}</p>
                <button onClick={() => { setIsCartOpen(false); setPage('collections'); }} className="mt-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg">{t.browseProducts}</button>
              </div>
            ) : (
              <>
                <div className="flex-grow overflow-y-auto px-6 py-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.cartItemId} className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
                      <img src={item.chosenImage} alt={item.nameAr} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-xs truncate">{item.nameAr}</h4>
                        <span className="text-[10px] text-amber-600 block mt-0.5">اللون: {item.chosenColor}</span>
                        <span className="text-xs font-black text-blue-500 block mt-1">{item.price} {t.currency}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button onClick={() => removeFromCart(item.cartItemId)} title={t.remove} className="text-gray-400 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="text-red-500 font-bold w-4">-</button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="text-green-500 font-bold w-4">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-3">
                  {/* كود الخصم */}
                  {appliedCouponCode ? (
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-2.5 rounded-lg">
                      <span className="flex items-center gap-1.5">🏷️ {appliedCouponCode}</span>
                      <button onClick={removeCouponCode} className="text-red-500 hover:text-red-600">
                        {lang === 'ar' ? 'إزالة' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                          placeholder={lang === 'ar' ? 'عندك كود خصم؟' : 'Have a coupon code?'}
                          className={`flex-grow border rounded-lg p-2.5 text-xs outline-none focus:border-[#2563EB] ${isDark ? 'bg-slate-950 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                        />
                        <button
                          onClick={applyCouponCode}
                          disabled={couponApplying || !couponInput.trim()}
                          className={`bg-[#0F172A] text-white font-bold px-4 rounded-lg text-xs shrink-0 transition-all active:scale-95 ${couponApplying || !couponInput.trim() ? 'opacity-50' : ''}`}
                        >
                          {couponApplying ? '⏳' : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-red-500 font-bold mt-1.5">{couponError}</p>}
                    </div>
                  )}

                  {cartTotalsLoading ? (
                    <p className="text-center text-xs text-gray-400 py-2">⏳ {lang === 'ar' ? 'جاري حساب السلة...' : 'Calculating...'}</p>
                  ) : cartTotals ? (
                    <>
                      {cartTotals.appliedPromotions.length > 0 && (
                        <div className="space-y-1.5 mb-1">
                          {cartTotals.appliedPromotions.map((promo, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg">
                              <span>🎁</span>
                              <span>{promo.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-gray-400 font-medium">
                        <span>{t.subtotal} ({cart.reduce((c, i) => c + i.quantity, 0)} {lang === 'ar' ? 'قطعة' : 'items'})</span>
                        <span>{cartTotals.subTotal} {t.currency}</span>
                      </div>
                      {cartTotals.discountAmount > 0 && (
                        <div className="flex justify-between text-xs text-emerald-600 font-bold">
                          <span>{lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                          <span>- {cartTotals.discountAmount} {t.currency}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-gray-400 font-medium">
                        <span>{lang === 'ar' ? 'رسوم الشحن' : 'Shipping'}</span>
                        <span>{cartTotals.shippingFees === 0 ? (lang === 'ar' ? 'مجاني 🎉' : 'Free 🎉') : `${cartTotals.shippingFees} ${t.currency}`}</span>
                      </div>
                      <div className="flex justify-between font-black text-lg pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span>{t.total}</span>
                        <span className="text-[#2563EB]">{cartTotals.grandTotal} {t.currency}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-black text-lg">
                      <span>{t.total}</span>
                      <span className="text-[#2563EB]">{cart.reduce((tt, i) => tt + (i.price * i.quantity), 0)} {t.currency}</span>
                    </div>
                  )}
                  <button onClick={handleCheckout} disabled={checkoutLoading} className={`w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 text-sm transition-all active:scale-[0.98] ${checkoutLoading ? 'opacity-60 cursor-wait' : ''}`}>
                    {checkoutLoading ? (lang === 'ar' ? '⏳ جاري تأكيد الطلب...' : '⏳ Confirming order...') : t.checkout}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= مودال الحساب (لوج إن + إنشاء حساب) ================= */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden border p-6 ${isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-gray-900 border-gray-100'}`} style={{ animation: 'cartSlideIn 0.25s ease-out' }}>

            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 left-4 font-black text-xl hover:text-red-500 transition-colors p-1 cursor-pointer active:scale-90">×</button>

            <div className="flex rounded-xl bg-gray-500/10 p-1 mb-6 mt-4 font-bold text-xs">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setLoginError(''); }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${authTab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                🔑 تسجيل دخول
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setRegisterError(''); }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${authTab === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                👤 حساب شحن جديد
              </button>
            </div>

            {authTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-medium">
                <div className="text-center mb-2">
                  <h3 className="text-sm font-black text-blue-500">مرحباً بك مجدداً في MoBi Boost</h3>
                  <p className="text-[11px] text-gray-400 mt-1">ادخل بريدك الإلكتروني وكلمة المرور للوصول لحسابك وسلتك</p>
                </div>

                {loginError && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold p-2.5 rounded-lg border border-red-200 dark:border-red-900/40">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1.5 text-gray-400">{t.yourEmail}:</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full border rounded-xl p-3 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-gray-400">{t.password}:</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border rounded-xl p-3 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <button type="submit" disabled={authSubmitting} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all mt-2 shadow-lg shadow-blue-600/20 cursor-pointer active:scale-[0.98] ${authSubmitting ? 'opacity-60 cursor-wait' : ''}`}>
                  {authSubmitting ? '⏳ جاري الدخول...' : 'تأكيد الدخول 🚀'}
                </button>
                <p className="text-center text-[11px] text-gray-400">
                  مستخدم جديد؟{' '}
                  <button type="button" onClick={() => { setAuthTab('register'); setLoginError(''); }} className="text-blue-500 font-bold">أنشئ حساب شحن الآن</button>
                </p>
              </form>
            )}

            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs font-medium">
                <div className="text-center mb-1">
                  <h3 className="text-sm font-black text-emerald-500">{t.createAccount}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">يرجى كتابة البيانات بدقة لضمان وصول الأوردر لباب بيتك</p>
                </div>

                {registerError && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold p-2.5 rounded-lg border border-red-200 dark:border-red-900/40">
                    {registerError}
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1 text-gray-400">{t.yourName} *</label>
                  <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="الاسم ثلاثي" className="w-full border rounded-xl p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-400">{t.yourEmail} *</label>
                  <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="name@example.com" className="w-full border rounded-xl p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-400">{t.password} *</label>
                  <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="••••••••" className="w-full border rounded-xl p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-400">{t.yourPhone} *</label>
                  <input type="tel" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} placeholder="01xxxxxxxxx" className="w-full border rounded-xl p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-400">{t.yourAddress} *</label>
                  <textarea rows="2" value={registerAddress} onChange={(e) => setRegisterAddress(e.target.value)} placeholder="المحافظة - المدينة - اسم الشارع ورقم العقار" className="w-full border rounded-xl p-2.5 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500 resize-none" required></textarea>
                </div>
                <button type="submit" disabled={authSubmitting} className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 mt-3 cursor-pointer transition-all active:scale-[0.98] ${authSubmitting ? 'opacity-60 cursor-wait' : ''}`}>
                  {authSubmitting ? '⏳ جاري الإنشاء...' : `${t.registerBtn} ✨`}
                </button>
                <p className="text-center text-[11px] text-gray-400">
                  عندك حساب بالفعل؟{' '}
                  <button type="button" onClick={() => { setAuthTab('login'); setRegisterError(''); }} className="text-blue-500 font-bold">سجل الدخول</button>
                </p>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ================= الفوتر ================= */}
      <footer className="bg-[#0F172A] text-gray-400 pt-12 pb-6 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-8">
            <MobiBoostLogo variant="light" className="h-9 mb-3" />
            <p className="text-gray-500 text-[11px] tracking-widest uppercase">Upgrade Your Phone Experience</p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <a
              href="https://instagram.com/YOUR_INSTAGRAM_USERNAME"
              target="_blank" rel="noopener noreferrer"
              title="Instagram"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-gradient-to-tr hover:from-amber-400 hover:via-pink-500 hover:to-purple-600 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a
              href="https://facebook.com/YOUR_FACEBOOK_PAGE"
              target="_blank" rel="noopener noreferrer"
              title="Facebook"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#2563EB] text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.878h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z"/>
              </svg>
            </a>
            <a
              href="https://wa.me/201023538775"
              target="_blank" rel="noopener noreferrer"
              title="WhatsApp"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-emerald-500 text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.005c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.09c-.245.69-1.415 1.32-1.955 1.4-.5.08-1.13.11-1.825-.115-.42-.135-.96-.31-1.655-.61-2.915-1.26-4.82-4.19-4.965-4.385-.145-.195-1.185-1.575-1.185-3.005 0-1.43.75-2.13 1.015-2.42.265-.29.58-.36.775-.36.195 0 .39.002.56.01.18.008.42-.068.655.5.245.585.83 2.02.9 2.165.07.145.115.315.02.51-.095.195-.145.315-.29.485-.145.17-.305.38-.435.51-.145.145-.295.305-.125.6.17.29.75 1.24 1.615 2.01 1.11.99 2.045 1.295 2.335 1.44.29.145.46.12.63-.075.17-.195.725-.845.92-1.135.195-.29.39-.24.655-.145.265.095 1.68.795 1.965.935.285.145.475.215.545.335.07.12.07.7-.175 1.39z"/>
              </svg>
            </a>
          </div>

          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <span className="text-gray-500">© 2026 MoBi Boost — {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</span>
            {!user && (
              <button
                onClick={() => setPage('admin-login')}
                className="flex items-center gap-1.5 text-gray-700 hover:text-[#2563EB] transition-colors duration-300 group cursor-pointer font-mono text-[10px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span>MoBi-Secure v2.6</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* نظام الإشعارات الاحترافي - يظهر فوق كل حاجة */}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} lang={lang} />

      {/* مودال تأكيد الطلب - يظهر بعد نجاح الشراء مباشرة */}
      {orderConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-toast-in ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#10B981" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-black mb-1">{lang === 'ar' ? 'تم تأكيد طلبك بنجاح! 🎉' : 'Order Confirmed! 🎉'}</h3>
            <p className="text-sm text-gray-400 mb-5">{lang === 'ar' ? `شكراً لثقتك في MoBi Boost يا ${user?.name}` : `Thanks for trusting MoBi Boost, ${user?.name}`}</p>
            <div className={`rounded-xl p-4 mb-5 space-y-2 text-sm ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
              <div className="flex justify-between">
                <span className="text-gray-400">{lang === 'ar' ? 'رقم الطلب' : 'Order Number'}</span>
                <span className="font-mono font-bold text-[#2563EB]">{orderConfirmation.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="font-black">{orderConfirmation.grandTotal} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
            <button
              onClick={() => setOrderConfirmation(null)}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {lang === 'ar' ? 'تمام، متابعة التسوق' : 'Great, keep shopping'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
