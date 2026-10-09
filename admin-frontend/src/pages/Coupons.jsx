import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../utils/api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_amount: 0,
    max_discount: '',
    usage_limit: 0,
    start_date: '',
    end_date: '',
    is_active: true
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.data?.items || []);
    } catch (err) {
      alert('Lỗi tải mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openModal = (c = null) => {
    if (c) {
      setFormData({
        id: c.id,
        code: c.code,
        description: c.description || '',
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_order_amount: c.min_order_amount,
        max_discount: c.max_discount || '',
        usage_limit: c.usage_limit,
        start_date: c.start_date ? c.start_date.split('T')[0] : '',
        end_date: c.end_date ? c.end_date.split('T')[0] : '',
        is_active: c.is_active
      });
    } else {
      setFormData({
        id: null,
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: 0,
        min_order_amount: 0,
        max_discount: '',
        usage_limit: 0,
        start_date: '',
        end_date: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseInt(formData.discount_value),
        min_order_amount: parseInt(formData.min_order_amount),
        max_discount: formData.max_discount ? parseInt(formData.max_discount) : null,
        usage_limit: parseInt(formData.usage_limit),
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      if (formData.id) {
        await api.put(`/admin/coupons/${formData.id}`, payload);
      } else {
        await api.post('/admin/coupons', payload);
      }
      closeModal();
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa mã này?')) {
      try {
        await api.delete(`/admin/coupons/${id}`);
        fetchCoupons();
      } catch (err) {
        alert('Lỗi xóa mã');
      }
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mã giảm giá</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" /> Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4">Mã</th>
              <th className="p-4">Loại / Giá trị</th>
              <th className="p-4">Đơn tối thiểu</th>
              <th className="p-4">Hạn dùng</th>
              <th className="p-4">Đã dùng / Tổng</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="p-4 text-center">Đang tải...</td></tr> : 
             coupons.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold text-blue-600">{c.code}</td>
                <td className="p-4">
                  {c.discount_type === 'percent' ? `${c.discount_value}%` : formatMoney(c.discount_value)}
                  {c.max_discount ? ` (Tối đa ${formatMoney(c.max_discount)})` : ''}
                </td>
                <td className="p-4">{formatMoney(c.min_order_amount)}</td>
                <td className="p-4 text-sm">
                  {c.end_date ? new Date(c.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                </td>
                <td className="p-4">{c.used_count} / {c.usage_limit || '∞'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? 'Kích hoạt' : 'Khóa'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{formData.id ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}</h3>
              <button onClick={closeModal}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Mã (Code) *</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border p-2 rounded uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
                  <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})} className="w-full border p-2 rounded">
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền (VND)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá trị *</label>
                  <input required type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn tối thiểu</label>
                  <input type="number" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giảm tối đa (nếu theo %)</label>
                  <input type="number" value={formData.max_discount} onChange={e => setFormData({...formData, max_discount: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới hạn số lần dùng</label>
                  <input type="number" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})} className="w-full border p-2 rounded">
                    <option value="true">Kích hoạt</option>
                    <option value="false">Khóa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
