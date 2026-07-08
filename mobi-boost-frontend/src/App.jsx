import { useState, useEffect } from 'react';
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

export default function App() {
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' أو 'register'

  // لوحة تحكم المسؤول
  const [adminTab, setAdminTab] = useState('orders');
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
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stock, setStock] = useState('');
  const [productCategory, setProductCategory] = useState('cases');
  const [variantsForm, setVariantsForm] = useState([{ color: 'أسود', img: '', stock: '' }]);
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
    } catch (err) {
      setRegisterError(`⚠️ ${err.message}`);
    }
  };

  // تسجيل الدخول بحساب حقيقي عن طريق الباك إند (بالإيميل + كلمة المرور)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

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
    } catch (err) {
      setLoginError(`⚠️ ${err.message}`);
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
      loadAllOrders();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
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
  const renderProductCard = (prod) => {
    const isSoldOut = (prod.stock ?? 0) <= 0;
    const coverImg = prod.variants?.[0]?.img || prod.devices?.[0]?.variants?.[0]?.img;
    const goToDetail = () => { setDetailProductId(prod.id); setPage('product-detail'); };

    return (
      <div
        key={prod.id}
        onClick={goToDetail}
        className={`rounded-xl shadow-sm border overflow-hidden cursor-pointer group ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white hover:border-gray-300'} ${isSoldOut ? 'opacity-70' : ''} transition-colors`}
      >
        <div className="h-32 sm:h-40 bg-gray-100 overflow-hidden relative">
          <img src={coverImg} alt={prod.nameAr} className={`object-cover h-full w-full group-hover:scale-105 transition-transform duration-300 ${isSoldOut ? 'grayscale' : ''}`} />
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-lg rotate-[-8deg] shadow-lg">{t.soldOut}</span>
            </div>
          )}
        </div>
        <div className="p-2.5 sm:p-3">
          <h4 className="font-bold text-xs sm:text-sm mb-1 truncate group-hover:text-blue-500 transition-colors">{lang === 'ar' ? prod.nameAr : prod.nameEn}</h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-blue-500">{prod.price} {t.currency}</span>
            {prod.oldPrice ? <span className="text-[10px] text-gray-400 line-through">{prod.oldPrice} {t.currency}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  const addToCart = (product) => {
    if (!user) {
      alert(lang === 'ar'
        ? '⚠️ عذراً، يجب إنشاء حساب أو تسجيل الدخول أولاً لتتمكن من إضافة المنتجات إلى السلة!'
        : '⚠️ Sorry, you must create an account or log in first to add products to the cart!'
      );
      setIsAuthOpen(true);
      return;
    }

    const availableStock = product.stock ?? 0;
    if (availableStock <= 0) {
      alert(lang === 'ar' ? '🚫 عذراً، هذا المنتج نفذت كميته من المخزن حالياً.' : '🚫 Sorry, this product is currently sold out.');
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
      alert(lang === 'ar' ? `🚫 عذراً، اللون "${chosenColor}" نفذ من المخزن حالياً، جرب لون تاني.` : `🚫 Sorry, "${chosenColor}" is currently sold out, try another color.`);
      return;
    }

    if (currentQtyInCart + 1 > Math.min(availableStock, variantStock)) {
      alert(lang === 'ar'
        ? `⚠️ الكمية المتاحة من هذا اللون محدودة (متبقي ${variantStock} فقط).`
        : `⚠️ Limited stock available for this color (only ${variantStock} left).`);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartItemId, chosenColor, chosenImage, chosenDevice, quantity: 1 }]);
    }
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  const handleCheckout = async () => {
    if (!user || !authToken) {
      alert(lang === 'ar' ? '⚠️ يجب تسجيل بياناتك وعنوانك أولاً لتأكيد شحن الأوردر!' : '⚠️ Please login first!');
      setIsCartOpen(false);
      setIsAuthOpen(true);
      return;
    }

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
          paymentMethod: 'COD'
        })
      });

      alert(lang === 'ar'
        ? `🎉 تم تأكيد طلبك بنجاح يا ${user.name}!\nرقم الأوردر: ${data.orderNumber}\nالإجمالي: ${data.grandTotal} ج.م`
        : `🎉 Order Placed Successfully, ${user.name}!\nOrder: ${data.orderNumber}`
      );

      setCart([]);
      setIsCartOpen(false);

      // تحديث المنتجات (الكمية المتاحة اتغيرت) وطلبات العميل
      loadProducts();
      loadMyOrders();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
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
  const addVariantRow = () => setVariantsForm([...variantsForm, { color: '', img: '', stock: '' }]);
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
    setPrice(''); setOldPrice(''); setDiscount(''); setStock('');
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
    setVariantsForm(product.variants && product.variants.length > 0 ? product.variants.map(v => ({ ...v })) : [{ color: 'أسود', img: '' }]);
    setDevicesForm(product.devices ? product.devices.map(d => ({ deviceName: d.deviceName, variants: d.variants.map(v => ({ ...v })) })) : []);
    setAdminTab('products');
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(lang === 'ar' ? `⚠️ متأكد إنك عايز تحذف "${productName}" نهائياً؟` : `⚠️ Delete "${productName}" permanently?`)) return;
    try {
      await apiFetch(`/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (editingProductId === productId) resetProductForm();
      loadProducts();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!nameAr || !price || stock === '') return;

    const cleanedVariants = variantsForm
      .filter(v => v.color.trim())
      .map(v => ({
        color: v.color.trim(),
        img: v.img.trim() || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
        stock: v.stock === '' || v.stock === undefined ? 0 : Number(v.stock)
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
      } else {
        await apiFetch('/products', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify(payload)
        });
      }

      resetProductForm();
      loadProducts();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
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
      loadAds();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const removeAd = async (id) => {
    try {
      await apiFetch(`/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      loadAds();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
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

  const myOrders = user ? orders : [];

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ================= Nav Bar ================= */}
      {(page === 'admin' || page === 'admin-login') ? (
        // ناف بار مخصص للأدمن - نظيف ومحترف، من غير أي عناصر خاصة بالعميل (تسجيل دخول/سلة)
        <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg md:text-xl font-black">🛡️ MoBi Boost <span className="text-blue-400">Admin</span></span>
              {page === 'admin' && <span className="hidden sm:inline text-[11px] bg-slate-800 text-gray-400 font-bold px-2.5 py-1 rounded-full">لوحة تحكم المسؤول</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-slate-800 text-xs font-bold py-1.5 px-2 rounded-lg border border-slate-700">{lang === 'ar' ? '🇺🇸 EN' : '🇪🇬 عـربي'}</button>
              <button onClick={() => setIsDark(!isDark)} className="p-1.5 rounded-lg bg-slate-800 text-sm">{isDark ? '☀️' : '🌙'}</button>
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
        // ناف بار المتجر العادي للعملاء
        <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <h1 className="text-xl md:text-2xl font-black cursor-pointer whitespace-nowrap" onClick={() => setPage('home')}>MoBi Boost 📱</h1>
              <div className="flex items-center gap-2 md:gap-4 font-medium text-xs md:text-sm whitespace-nowrap">
                <button onClick={() => setPage('home')} className={`px-2 py-1 rounded ${page === 'home' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-500'}`}>{t.home}</button>
                <button onClick={() => setPage('collections')} className={`px-2 py-1 rounded ${page === 'collections' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-500'}`}>{t.collections}</button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-blue-700 text-xs font-bold py-1 px-2 rounded-lg border border-blue-500">{lang === 'ar' ? '🇺🇸 EN' : '🇪🇬 عـربي'}</button>
              <button onClick={() => setIsDark(!isDark)} className="p-1.5 rounded-lg bg-blue-700 text-sm">{isDark ? '☀️' : '🌙'}</button>

              {user ? (
                <div className="flex items-center gap-2 bg-blue-700 pl-1 pr-3 py-1 rounded-full text-xs font-semibold border border-blue-500">
                  <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-black">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="text-white max-w-[100px] truncate">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    title={t.logout}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-800 hover:bg-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthTab('login'); setLoginError(''); setRegisterError(''); setIsAuthOpen(true); }} className="bg-emerald-500 text-white font-bold text-xs py-1 px-2.5 rounded-lg">👤 {t.login}</button>
              )}

              <button onClick={() => { if (!user) { setAuthTab('login'); setIsAuthOpen(true); } else { setIsCartOpen(true); } }} className="bg-amber-500 text-white text-xs font-bold py-1 px-2 rounded-lg flex items-center gap-1">
                <span>🛒 {t.cart}</span>
                <span className="bg-white text-amber-600 text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">{cart.reduce((c, i) => c + i.quantity, 0)}</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ================= Container الموحد ================= */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8">


        {/* 1. صفحة المتجر الرئيسية */}
        {page === 'home' && (
          <div>
            <div className="text-center mb-8 py-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">{t.heroTitle}</h2>
              <p className="text-xs md:text-sm text-blue-100 px-4">{t.heroSub}</p>
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
                      onClick={() => { if (ad.productId) { setDetailProductId(ad.productId); setPage('product-detail'); } }}
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

            <h3 className="text-lg font-bold mb-6 border-b-2 border-blue-600 pb-1 w-fit">{t.latestProducts} 👇</h3>

            {productsLoading ? (
              <p className="text-center text-gray-400 py-12 text-sm">⏳ {lang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}</p>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">{lang === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'No products available yet'}</p>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(prod => renderProductCard(prod))}
            </div>
            )}

            {/* ===== تصفح حسب الأقسام - كل قسم وعدد منتجاته، بالدوس عليه بينقلك لمنتجات القسم فقط ===== */}
            <div className="mt-12">
              <h3 className="text-lg font-bold mb-6 border-b-2 border-blue-600 pb-1 w-fit">📁 {t.collections}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => {
                  const catProducts = products.filter(p => p.category === cat.id);
                  const coverImg = catProducts[0]?.variants?.[0]?.img;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCollection(cat.id); setPage('collections'); }}
                      className={`relative h-32 md:h-40 rounded-2xl overflow-hidden border shadow-sm text-right group ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
                    >
                      {coverImg ? (
                        <img src={coverImg} alt={cat.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-3">
                        <span className="text-white font-black text-xs md:text-sm">{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                        <span className="text-white/80 text-[10px] font-medium mt-0.5">{catProducts.length} {lang === 'ar' ? 'منتج' : 'products'}</span>
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
                  <p className="text-center text-gray-400 text-sm py-6">{t.noOrdersYet}</p>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map(order => (
                      <div key={order.orderId} className={`p-4 rounded-xl border flex flex-wrap justify-between items-center gap-3 text-xs ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
                        <div>
                          <span className="font-bold text-blue-500">كود الأوردر: #{order.orderId}</span>
                          <p className="text-gray-400 mt-1">{order.items.map(i => `${i.name} (${i.chosenColor || 'افتراضي'})`).join(', ')}</p>
                          <p className="text-gray-400 mt-1">{order.date}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {order.status === "preparing" && <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-bold px-3 py-1 rounded-full">⏳ {lang === 'ar' ? 'قيد التحضير والمراجعة...' : 'Preparing Order...'}</span>}
                          {order.status === "shipping" && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold px-3 py-1 rounded-full">🚚 {lang === 'ar' ? 'في الطريق إليك (مع المندوب)' : 'Out for Delivery'}</span>}
                          {order.status === "delivered" && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold px-3 py-1 rounded-full">✅ {lang === 'ar' ? 'انتهاء التسليم بنجاح' : 'Delivered Successfully'}</span>}
                          <span className="font-black text-sm">{order.totalAmount} {t.currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. صفحة تصفح الأقسام */}
        {page === 'collections' && (
          <div>
            <h2 className="text-2xl font-black mb-6 text-center">📁 تصفح حسب القسم</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCollection(cat.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCollection === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.filter(p => p.category === selectedCollection).length === 0 ? (
                <p className="col-span-full text-center text-gray-400 py-12">لا توجد منتجات في هذا القسم حالياً 🛒</p>
              ) : (
                products.filter(p => p.category === selectedCollection).map(prod => renderProductCard(prod))
              )}
            </div>
          </div>
        )}

        {/* صفحة تفاصيل المنتج - تظهر عند الضغط على أي منتج أو إعلان مرتبط بمنتج */}
        {page === 'product-detail' && (() => {
          const prod = products.find(p => p.id === detailProductId);

          if (!prod) {
            return (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">{lang === 'ar' ? 'هذا المنتج غير متاح حالياً.' : 'This product is no longer available.'}</p>
                <button onClick={() => setPage('home')} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm">{lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</button>
              </div>
            );
          }

          const hasDevices = prod.devices && prod.devices.length > 0;
          const deviceIdx = selectedDevices[prod.id] !== undefined ? selectedDevices[prod.id] : 0;
          const activeVariants = getActiveVariants(prod, deviceIdx);
          const currentIdx = selectedVariants[prod.id] !== undefined ? selectedVariants[prod.id] : 0;
          const activeVariant = activeVariants[currentIdx] || activeVariants[0] || null;
          const displayImg = activeVariant ? activeVariant.img : prod.image;
          const isSoldOut = (prod.stock ?? 0) <= 0;

          // مخزون اللون/الفاريانت المختار حالياً بالتحديد (لو متتبع لوحده)
          const variantStockValue = (activeVariant && typeof activeVariant.stock === 'number') ? activeVariant.stock : prod.stock;
          const isVariantSoldOut = isSoldOut || variantStockValue <= 0;

          return (
            <div>
              <button onClick={() => setPage('home')} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-blue-500 mb-6 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d={lang === 'ar' ? "M12.75 19.5L19.5 12.75l-6.75-6.75M19.5 12.75H4.5" : "M11.25 4.5L4.5 11.25l6.75 6.75M4.5 11.25h15"} />
                </svg>
                {lang === 'ar' ? 'العودة للمنتجات' : 'Back to products'}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-80 md:h-[420px] bg-gray-100 rounded-2xl overflow-hidden relative">
                  <img src={displayImg} alt={prod.nameAr} className={`object-cover h-full w-full ${isSoldOut ? 'grayscale' : ''}`} />
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-black text-lg px-5 py-2 rounded-lg rotate-[-8deg] shadow-lg">{t.soldOut}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase">{prod.category}</span>
                  <h2 className="text-2xl font-black mt-3 mb-2">{lang === 'ar' ? prod.nameAr : prod.nameEn}</h2>
                  {(prod.descAr || prod.descEn) && (
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{lang === 'ar' ? prod.descAr : prod.descEn}</p>
                  )}

                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-black text-blue-500">{prod.price} {t.currency}</span>
                    {prod.oldPrice ? <span className="text-base text-gray-400 line-through">{prod.oldPrice} {t.currency}</span> : null}
                    {prod.discount && prod.discount !== '0%' && (
                      <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">-{prod.discount}</span>
                    )}
                  </div>

                  {hasDevices && (
                    <div className="mb-5">
                      <label className="text-sm font-bold block mb-2">📱 {lang === 'ar' ? 'الأجهزة المتاحة لهذا المنتج:' : 'Available Devices:'}</label>
                      <div className="flex gap-2 flex-wrap">
                        {prod.devices.map((d, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setSelectedDevices({ ...selectedDevices, [prod.id]: idx }); setSelectedVariants({ ...selectedVariants, [prod.id]: 0 }); }}
                            className={`text-sm px-3.5 py-2 rounded-lg border font-bold transition-all ${deviceIdx === idx ? 'bg-purple-600 text-white border-purple-600' : isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}
                          >
                            {d.deviceName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeVariants.length > 0 && (
                    <div className="mb-6">
                      <label className="text-sm font-bold block mb-2">{lang === 'ar' ? 'الألوان المتاحة:' : 'Available Colors:'}</label>
                      <div className="flex gap-2 flex-wrap">
                        {activeVariants.map((v, idx) => {
                          const variantSoldOut = typeof v.stock === 'number' && v.stock <= 0;
                          return (
                            <button
                              key={idx}
                              onClick={() => { if (!variantSoldOut) setSelectedVariants({ ...selectedVariants, [prod.id]: idx }); }}
                              disabled={variantSoldOut}
                              className={`text-sm px-3.5 py-2 rounded-lg border font-bold transition-all ${
                                variantSoldOut
                                  ? 'opacity-50 cursor-not-allowed line-through bg-gray-100 text-gray-400 border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                                  : currentIdx === idx ? 'bg-blue-600 text-white border-blue-600' : isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-300'
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
                      <span className="text-emerald-600 font-bold text-sm">{lang === 'ar' ? 'متوفر بالمخزن ✅' : 'In Stock ✅'}</span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    disabled={isVariantSoldOut}
                    className={`w-full font-bold py-3.5 rounded-xl text-sm transition-colors ${isVariantSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'}`}
                  >
                    {isVariantSoldOut ? t.soldOut : t.addToCart}
                  </button>
                </div>
              </div>
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
                <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-lg ${adminTab === 'orders' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-800'}`}>📥 الطلبات الواردة ({orders.filter(o => o.status === 'preparing').length})</button>
                <button onClick={() => setAdminTab('products')} className={`px-4 py-2 rounded-lg ${adminTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>✨ إضافة المنتجات</button>
                <button onClick={() => setAdminTab('ads')} className={`px-4 py-2 rounded-lg ${adminTab === 'ads' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>🎬 الإعلانات</button>
                {adminTab === 'orders' && (
                  <button onClick={loadAllOrders} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300" title="تحديث الطلبات">
                    🔄 {ordersLoading ? 'جاري التحديث...' : 'تحديث'}
                  </button>
                )}
              </div>
            </div>

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
                              <button onClick={() => updateOrderStatus(order.orderId, "shipping")} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">🚚 شحن الطلب الآن</button>
                            )}
                            {order.status === "shipping" && (
                              <button onClick={() => updateOrderStatus(order.orderId, "delivered")} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">✅ تم التوصيل بنجاح</button>
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
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block font-bold">الألوان والصور المتاحة {devicesForm.length === 0 && '*'}</label>
                        <button type="button" onClick={addVariantRow} className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg">+ إضافة لون آخر</button>
                      </div>
                      {devicesForm.length > 0 && (
                        <p className="text-[10px] text-amber-500 mb-2">⚠️ لما تضيف أجهزة متوافقة تحت، الألوان دي هتتجاهل والعميل هيشوف ألوان كل جهاز لوحده.</p>
                      )}
                      <div className="space-y-2">
                        {variantsForm.map((v, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input type="text" placeholder="اسم اللون" value={v.color} onChange={(e) => updateVariantRow(idx, 'color', e.target.value)} className="w-1/4 border rounded-lg p-2 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                            <input type="text" placeholder="رابط صورة المنتج (URL)" value={v.img} onChange={(e) => updateVariantRow(idx, 'img', e.target.value)} className="flex-grow border rounded-lg p-2 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                            <input type="number" min="0" placeholder="الكمية" value={v.stock} onChange={(e) => updateVariantRow(idx, 'stock', e.target.value)} className="w-20 border rounded-lg p-2 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
                            <button type="button" onClick={() => removeVariantRow(idx)} disabled={variantsForm.length === 1} className="text-red-500 font-black px-2 disabled:opacity-30">×</button>
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
                      <button type="submit" className={`flex-grow text-white font-bold py-3 rounded-lg mt-2 text-xs ${editingProductId ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                        {editingProductId ? '💾 حفظ التعديلات' : '➕ نشر وصناعة المنتج بالمتجر'}
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
          </div>
        )}
      </main>

      {/* ================= كارت سلة المشتريات Side Drawer (تصميم محسّن) ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
          <div className={`w-full max-w-md h-full shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>

            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-black">{t.cartTitle}</h3>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-xl font-bold">×</button>
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
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>{t.subtotal} ({cart.reduce((c, i) => c + i.quantity, 0)} {lang === 'ar' ? 'قطعة' : 'items'})</span>
                    <span>{cart.reduce((t, i) => t + (i.price * i.quantity), 0)} {t.currency}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg">
                    <span>{t.total}</span>
                    <span className="text-blue-500">{cart.reduce((t, i) => t + (i.price * i.quantity), 0)} {t.currency}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-colors"> {t.checkout} </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= مودال الحساب (لوج إن + إنشاء حساب) ================= */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden border p-6 transition-all transform duration-300 ${isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-gray-900 border-gray-100'}`}>

            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 left-4 font-black text-xl hover:text-red-500 transition-colors p-1 cursor-pointer">×</button>

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
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-blue-600/20 cursor-pointer">
                  تأكيد الدخول 🚀
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
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 mt-3 cursor-pointer">
                  {t.registerBtn} ✨
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
      <footer className="bg-gray-900 text-gray-500 text-center py-6 text-xs border-t border-slate-800 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/YOUR_INSTAGRAM_USERNAME"
            target="_blank" rel="noopener noreferrer"
            title="Instagram"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gradient-to-tr hover:from-amber-400 hover:via-pink-500 hover:to-purple-600 text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a
            href="https://facebook.com/YOUR_FACEBOOK_PAGE"
            target="_blank" rel="noopener noreferrer"
            title="Facebook"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.878h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z"/>
            </svg>
          </a>
          <a
            href="https://wa.me/2010XXXXXXXX"
            target="_blank" rel="noopener noreferrer"
            title="WhatsApp"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-emerald-500 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.005c5.46 0 9.91-4.45 9.91-9.91C21.97 6.45 17.5 2 12.04 2zm5.8 14.09c-.245.69-1.415 1.32-1.955 1.4-.5.08-1.13.11-1.825-.115-.42-.135-.96-.31-1.655-.61-2.915-1.26-4.82-4.19-4.965-4.385-.145-.195-1.185-1.575-1.185-3.005 0-1.43.75-2.13 1.015-2.42.265-.29.58-.36.775-.36.195 0 .39.002.56.01.18.008.42-.068.655.5.245.585.83 2.02.9 2.165.07.145.115.315.02.51-.095.195-.145.315-.29.485-.145.17-.305.38-.435.51-.145.145-.295.305-.125.6.17.29.75 1.24 1.615 2.01 1.11.99 2.045 1.295 2.335 1.44.29.145.46.12.63-.075.17-.195.725-.845.92-1.135.195-.29.39-.24.655-.145.265.095 1.68.795 1.965.935.285.145.475.215.545.335.07.12.07.7-.175 1.39z"/>
            </svg>
          </a>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>جميع الحقوق محفوظة © MoBi Boost 2026</span>
          {!user && (
            <button
              onClick={() => setPage('admin-login')}
              className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-500 transition-colors duration-300 group cursor-pointer font-mono text-[11px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>MoBi-Secure v2.6</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
