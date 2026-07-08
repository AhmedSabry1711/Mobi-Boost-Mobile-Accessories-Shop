import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const Admin = () => {
  const [products, setProducts] = useState([
    { id: '1', name: 'جراب شفاف مضاد للصدمات', price: 180, discount: 5, category: 'جرابات' }
  ]);

  const [form, setForm] = useState({ name: '', price: '', discount: '', category: '', description: '', image: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const newProduct = { ...form, id: Date.now().toString(), image: form.image || 'https://via.placeholder.com/150' };
    setProducts([...products, newProduct]);
    setForm({ name: '', price: '', discount: '', category: '', description: '', image: '' });
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto text-right min-h-screen" dir="rtl">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 border-b pb-3">لوحة تحكم المنتجات</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* فورم الإضافة */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold mb-4 text-blue-600 flex items-center gap-2 justify-start">
            <FiPlus /> إضافة منتج جديد
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
            <input type="text" placeholder="اسم المنتج" required className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="السعر" required className="p-2.5 border rounded-xl outline-none focus:border-blue-500" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              <input type="number" placeholder="الخصم %" className="p-2.5 border rounded-xl outline-none focus:border-blue-500" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
            </div>
            <select className="w-full p-2.5 border rounded-xl bg-white outline-none focus:border-blue-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">اختر القسم</option>
              <option value="جرابات">جرابات</option>
              <option value="شواحن">شواحن</option>
              <option value="باور بانك">باور بانك</option>
            </select>
            <textarea placeholder="وصف المنتج" rows="2" className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
            <input type="text" placeholder="رابط صورة المنتج" className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
            <button type="submit" className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition mt-2">حفظ المنتج في القائمة</button>
          </form>
        </div>

        {/* الجدول */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4 text-slate-800">المنتجات المعروضة حالياً</h2>
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b">
                <th className="p-3">المنتج</th>
                <th className="p-3">القسم</th>
                <th className="p-3">السعر</th>
                <th className="p-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-none hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-800">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.category || 'عام'}</td>
                  <td className="p-3 font-bold text-blue-600">{p.price} ج.م</td>
                  <td className="p-3">
                    <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="text-red-500 hover:text-red-700 p-1">
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Admin;