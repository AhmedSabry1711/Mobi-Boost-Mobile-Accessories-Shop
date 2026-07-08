import { useState } from 'react';
import { motion } from 'framer-motion';

const ProductCard = ({ product, onAddToCart }) => {
  const [selectedPhone, setSelectedPhone] = useState('');

  const finalPrice = product.discount 
    ? product.price - (product.price * (product.discount / 100))
    : product.price;

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md p-4 flex flex-col gap-3 border border-slate-100 text-right"
      dir="rtl"
    >
      <img src={product.image} alt={product.name} className="w-full h-44 object-cover rounded-xl bg-slate-100" />
      
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-bold text-base text-slate-800 min-h-[48px]">{product.name}</h3>
        {product.discount > 0 && (
          <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-lg shrink-0">
            خصم {product.discount}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 my-1">
        <span className="text-lg font-bold text-blue-600">{finalPrice} ج.م</span>
        {product.discount > 0 && (
          <span className="text-sm text-gray-400 line-through">{product.price} ج.م</span>
        )}
      </div>

      {product.compatiblePhones && product.compatiblePhones.length > 0 && (
        <select 
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
          value={selectedPhone}
          onChange={(e) => setSelectedPhone(e.target.value)}
        >
          <option value="" disabled>اختر نوع الهاتف المتاح</option>
          {product.compatiblePhones.map((phone, i) => (
            <option key={i} value={phone.model} disabled={!phone.isAvailable}>
              {phone.model} {!phone.isAvailable && '(غير متاح)'}
            </option>
          ))}
        </select>
      )}

      <button 
        onClick={() => {
          onAddToCart({ ...product, selectedPhone });
          setSelectedPhone('');
        }}
        disabled={product.compatiblePhones?.length > 0 && !selectedPhone}
        className="mt-auto w-full bg-slate-900 text-white text-sm py-2.5 rounded-xl font-medium hover:bg-blue-600 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        إضافة إلى السلة
      </button>
    </motion.div>
  );
};
export default ProductCard;