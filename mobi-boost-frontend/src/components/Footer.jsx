const Footer = () => {
  return (
    <footer className="bg-slate-950 text-gray-400 py-6 text-center text-xs sm:text-sm border-t border-slate-900 mt-auto">
      <p className="mb-2 text-white font-semibold">MoBi Boost &copy; {new Date().getFullYear()}</p>
      <p>جميع الحقوق محفوظة - شحن سريع ودفع عند الاستلام</p>
    </footer>
  );

  <Link 
  to="/admin-login" 
  className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-all duration-300 group cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
  <span className="text-xs font-mono tracking-wider opacity-60 group-hover:opacity-100">MoBi-Secure System v2.6</span>
</Link>
};
export default Footer;
import { Link } from 'react-router-dom';

