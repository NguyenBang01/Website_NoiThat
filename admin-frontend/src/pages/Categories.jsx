import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../utils/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    slug: '',
    parent_id: '',
    image: '',
    sort_order: 0,
    is_active: true
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (cat = null) => {
    if (cat) {
      setFormData({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || '',
        parent_id: cat.parent_id || '',
        image: cat.image || '',
        sort_order: cat.sort_order || 0,
        is_active: cat.is_active
      });
    } else {
      setFormData({
        id: null,
        name: '',
        slug: '',
        parent_id: '',
        image: '',
        sort_order: 0,
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
        name: formData.name,
        slug: formData.slug,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        image: formData.image,
        sort_order: parseInt(formData.sort_order),
        is_active: formData.is_active
      };

      if (formData.id) {
        await api.put(`/admin/categories/${formData.id}`, payload);
      } else {
        await api.post('/admin/categories', payload);
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await api.delete(`/admin/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm mới</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-medium text-gray-600">ID</th>
              <th className="p-4 font-medium text-gray-600">Ảnh</th>
              <th className="p-4 font-medium text-gray-600">Tên danh mục</th>
              <th className="p-4 font-medium text-gray-600">Danh mục cha</th>
              <th className="p-4 font-medium text-gray-600">Thứ tự</th>
              <th className="p-4 font-medium text-gray-600">Trạng thái</th>
              <th className="p-4 font-medium text-gray-600 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-4 text-center">Đang tải...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center">Không có dữ liệu</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{cat.id}</td>
                  <td className="p-4">
                    {cat.image && (
                      <img src={cat.image.startsWith('http') ? cat.image : `http://localhost:8080${cat.image}`} alt={cat.name} className="w-12 h-12 object-cover rounded" />
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{cat.name}</td>
                  <td className="p-4 text-gray-500">
                    {cat.parent_id ? categories.find(c => c.id === cat.parent_id)?.name || cat.parent_id : '-'}
                  </td>
                  <td className="p-4">{cat.sort_order}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.is_active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openModal(cat)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{formData.id ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đường dẫn (Slug)</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="De-trong-tu-tao" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục cha</label>
                <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full border rounded-lg p-2">
                  <option value="">-- Không có --</option>
                  {categories.filter(c => c.id !== formData.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link ảnh</label>
                <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Thứ tự</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: e.target.value})} className="w-full border rounded-lg p-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})} className="w-full border rounded-lg p-2">
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
