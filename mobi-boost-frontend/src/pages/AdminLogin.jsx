import { useState } from 'react';
import { apiFetch } from '../utils/api';

export default function AdminLogin({
  setPage,
  isDark,
  onLoginSuccess
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await apiFetch('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password
        })
      });

      // يحفظ التوكن في App.jsx
      onLoginSuccess(data.token);

    } catch (err) {
      setError(`❌ ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border shadow-xl transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100">
      <div className="text-center mb-6">
        <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl text-white">🔐</div>
        <h2 className="text-xl font-black">تسجيل دخول الإدارة</h2>
        <p className="text-xs text-gray-400 mt-1">منطقة محمية خاصة بمسؤولي نظام MoBi Boost</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400 p-3 rounded-xl text-xs font-bold mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium">
        <div>
          <label className="block font-bold mb-1.5 text-gray-400">اسم المستخدم (Username):</label>
          <input

            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
            className="w-full border rounded-xl p-3 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block font-bold mb-1.5 text-gray-400">الرمز السري (Password):</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border rounded-xl p-3 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20 mt-2 cursor-pointer"
        >
          🔑 تأكيد الهوية ودخول اللوحة
        </button>

        <button
          type="button"
          onClick={() => setPage('home')}
          className="w-full bg-transparent hover:bg-gray-500/10 text-gray-400 font-bold py-2 rounded-xl text-xs transition-colors mt-1"
        >
          رجوع للمتجر الرئيسي
        </button>
      </form>
    </div>
  );
}