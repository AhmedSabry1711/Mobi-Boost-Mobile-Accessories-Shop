import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';

const mockProducts = [
  { id: '1', name: 'جراب سيليكون حماية كاميرا فاخر', price: 250, discount: 10, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400', isPopular: true, category: 'cases', compatiblePhones: [{ model: 'iPhone 16 Pro Max', isAvailable: true }, { model: 'iPhone 13 Pro', isAvailable: false }] },
  { id: '2', name: 'رأس شاحن سريع بقوة 35 وات دبل بورت', price: 450, discount: 0, image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=400', isPopular: true, category: 'chargers' },
  { id: '3', name: 'باور بانك لاسلكي مغناطيسي 10000 مللي أمبير', price: 950, discount: 15, image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=400', isPopular: false, category: 'powerbanks' },
];

const Home = ({ onAddToCart }) => {
  const popularProducts = mockProducts.filter(p => p.isPopular);
  const latestProducts = [...mockProducts].reverse();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <div className="min-h-screen py-10 px-4 md:px-12 text-right" dir="rtl">
      {/* قسم الأكثر طلباً */}
      <section className="mb-14">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 border-r-4 border-blue-500 pr-3">
          🔥 الأكثر طلباً
        </h2>
        <motion.div 
          variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {popularProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </motion.div>
      </section>

      {/* قسم أحدث الإضافات */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 border-r-4 border-cyan-500 pr-3">
          ✨ أحدث الإضافات
        </h2>
        <motion.div 
          variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {latestProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </motion.div>
      </section>
    </div>
  );
};
export default Home;