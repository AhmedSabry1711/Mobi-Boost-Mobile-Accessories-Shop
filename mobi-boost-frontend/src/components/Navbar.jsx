import { Link } from 'react-router-dom';
import { FiShoppingCart, FiSearch } from 'react-icons/fi';

const Navbar = ({ cartCount }) => {
  return (
    <nav className="flex justify-between items-center p-5 bg-slate-900 text-white sticky top-0 z-50 shadow-md" dir="rtl">
      {/* اليمين: اللوجو والروابط */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-bold tracking-wider text-blue-400">MoBi Boost</Link>
        <ul className="hidden md:flex gap-6 font-medium">
          <li><Link className="hover:text-blue-400 transition" to="/">الرئيسية</Link></li>
          <li><Link className="hover:text-blue-400 transition" to="/">الأقسام</Link></li>
          <li><Link className="hover:text-blue-400 transition" to="/">اتصل بنا</Link></li>
          <li><Link className="text-amber-400 hover:text-amber-300 transition" to="/admin">لوحة التحكم</Link></li>
        </ul>
      </div>

      {/* اليسار: السيرش والسلة */}
      <div className="flex items-center gap-4">
        <div className="relative bg-slate-800 rounded-full flex items-center px-3 py-1.5 w-40 sm:w-60">
          <FiSearch className="text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="ابحث عن منتج..." 
            className="bg-transparent border-none outline-none text-xs sm:text-sm text-white w-full text-right" 
          />
        </div>
        <Link to="/" className="relative p-2 hover:bg-slate-800 rounded-full transition">
          <FiShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;