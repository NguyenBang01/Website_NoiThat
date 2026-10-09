import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import api from '../utils/api';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: null,
    title: '',
    subtitle: '',
    image: '',
    link: '',
    sort_order: 0,
    is_active: true
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/banners');
      setBanners(res.data.data?.items || []);
    } catch (err) {
      alert('Lỗi tải banner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openModal = (b = null) => {
    if (b) {
      setFormData({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || '',
        image: b.image || '',
        link: b.link || '',
        sort_order: b.sort_order,
        is_active: b.is_active
      });
    } else {
      setFormData({
        id: null,
        title: '',
        subtitle: '',
        image: '',
        link: '',
        sort_order: 0,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/admin/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, image: res.data.data.url });
    } catch (err) {
      alert('Lỗi upload ảnh');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sort_order: parseInt(formData.sort_order),
      };

      if (formData.id) {
        await api.put(`/admin/banners/${formData.id}`, payload);
      } else {
        await api.post('/admin/banners', payload);
      }
      closeModal();
      fetchBanners();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      try {
        await api.delete(`/admin/banners/${id}`);
        fetchBanners();
      } catch (err) {
        alert('Lỗi xóa banner');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Banner</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" /> Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4">Ảnh</th>
              <th className="p-4">Tiêu đề</th>
              <th className="p-4">Thứ tự</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="p-4 text-center">Đang tải...</td></tr> : 
             banners.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {b.image && <img src={b.image.startsWith('http') ? b.image : `http://localhost:8080${b.image}`} alt={b.title} className="h-16 w-32 object-cover rounded" />}
                </td>
                <td className="p-4 font-medium">{b.title}</td>
                <td className="p-4">{b.sort_order}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {b.is_active ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(b)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{formData.id ? 'Sửa banner' : 'Thêm banner'}</h3>
              <button onClick={closeModal}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phụ đề</label>
                <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hình ảnh *</label>
                <div className="flex gap-2">
                  <input required value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full border p-2 rounded" placeholder="Nhập URL hoặc Upload" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-gray-100 p-2 rounded border hover:bg-gray-200">
                    <Upload className="w-5 h-5 text-gray-600" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                </div>
                {formData.image && <img src={formData.image.startsWith('http') ? formData.image : `http://localhost:8080${formData.image}`} className="mt-2 h-20 rounded" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link chuyển hướng</label>
                <input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Thứ tự</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})} className="w-full border p-2 rounded">
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
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
