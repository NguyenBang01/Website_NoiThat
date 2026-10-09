import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/admin/products?limit=50'),
        api.get('/admin/categories')
      ]);
      setProducts(prodRes.data.data?.items || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error(err);
      alert('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await api.delete(`/admin/products/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || id;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h2>
        <Link
          to="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm mới</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-medium text-gray-600">ID</th>
              <th className="p-4 font-medium text-gray-600">Ảnh</th>
              <th className="p-4 font-medium text-gray-600">Tên SP</th>
              <th className="p-4 font-medium text-gray-600">Danh mục</th>
              <th className="p-4 font-medium text-gray-600">Giá từ</th>
              <th className="p-4 font-medium text-gray-600">Trạng thái</th>
              <th className="p-4 font-medium text-gray-600 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-4 text-center">Đang tải...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center">Không có dữ liệu</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{p.id}</td>
                  <td className="p-4">
                    {p.images && p.images.length > 0 && (
                      <img src={p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:8080${p.images[0].url}`} alt={p.name} className="w-12 h-12 object-cover rounded" />
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{p.name}</td>
                  <td className="p-4 text-gray-500">{getCategoryName(p.category_id)}</td>
                  <td className="p-4 text-gray-800">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.min_price || 0)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.status === 'active' ? 'Hiển thị' : p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <Link to={`/products/${p.id}`} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
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
    </div>
  );
}
