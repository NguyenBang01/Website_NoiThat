import { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import api from '../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers');
      setCustomers(res.data.data?.items || []);
    } catch (err) {
      alert('Lỗi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (id) => {
    if (confirm('Xác nhận thay đổi trạng thái tài khoản này?')) {
      try {
        await api.put(`/admin/customers/${id}/toggle-status`);
        fetchCustomers();
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Khách hàng</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4">ID</th>
              <th className="p-4">Họ tên</th>
              <th className="p-4">Email</th>
              <th className="p-4">Điện thoại</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="p-4 text-center">Đang tải...</td></tr> : 
             customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{c.id}</td>
                <td className="p-4 font-medium">{c.full_name}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4">{c.phone || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleToggleStatus(c.id)} 
                    className={`p-2 rounded-lg ${c.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                    title={c.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                  >
                    {c.is_active ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
