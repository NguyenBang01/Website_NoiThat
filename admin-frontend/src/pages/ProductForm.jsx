import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Upload } from 'lucide-react';
import api from '../utils/api';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    brand_id: '',
    sku: '',
    short_desc: '',
    description: '',
    warranty: '',
    status: 'active',
    is_featured: false,
  });

  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchOptions();
    if (isEdit) {
      fetchProduct();
    } else {
      // Thêm 1 variant mặc định khi tạo mới
      setVariants([{ id: Date.now(), sku: '', color: '', size: '', material: '', price: 0, sale_price: 0, stock_quantity: 0, is_active: true }]);
    }
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/brands') // brand đang ở public API /brands
      ]);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/products/${id}`);
      const p = res.data.data;
      setFormData({
        name: p.name,
        slug: p.slug,
        category_id: p.category_id,
        brand_id: p.brand_id || '',
        sku: p.sku,
        short_desc: p.short_desc || '',
        description: p.description || '',
        warranty: p.warranty || '',
        status: p.status,
        is_featured: p.is_featured,
      });
      setVariants(p.variants || []);
      setImages(p.images || []);
    } catch (err) {
      alert('Lỗi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newV = [...variants];
    newV[index][field] = value;
    setVariants(newV);
  };

  const addVariant = () => {
    setVariants([...variants, { id: Date.now(), sku: '', color: '', size: '', material: '', price: 0, sale_price: 0, stock_quantity: 0, is_active: true }]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) return alert('Phải có ít nhất 1 biến thể');
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/admin/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = res.data.data.url;
        setImages(prev => [...prev, { url, alt: '', is_primary: prev.length === 0, sort_order: prev.length, variant_sku: '' }]);
      } catch (err) {
        alert('Lỗi upload ảnh');
      }
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index) => {
    const newI = images.map((img, i) => ({ ...img, is_primary: i === index }));
    setImages(newI);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
        variants: variants.map(v => ({
          ...v,
          id: typeof v.id === 'string' || v.id > 1000000000000 ? 0 : v.id, // reset temp ID
          price: parseInt(v.price),
          sale_price: v.sale_price ? parseInt(v.sale_price) : null,
          stock_quantity: parseInt(v.stock_quantity),
          is_active: v.is_active !== false // default true
        })),
        images: images.map((img, i) => ({ ...img, sort_order: i }))
      };

      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name && isEdit) return <div>Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Thông tin cơ bản */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thông tin cơ bản</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU chung *</label>
              <input required name="sku" value={formData.sku} onChange={handleChange} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (Đường dẫn)</label>
              <input name="slug" value={formData.slug} onChange={handleChange} placeholder="Để trống tự tạo từ tên" className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục *</label>
              <select required name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border rounded-lg p-2">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thương hiệu</label>
              <select name="brand_id" value={formData.brand_id} onChange={handleChange} className="w-full border rounded-lg p-2">
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
              <textarea name="short_desc" value={formData.short_desc} onChange={handleChange} className="w-full border rounded-lg p-2 h-20" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded-lg p-2 h-32" />
            </div>
          </div>
        </div>

        {/* Biến thể */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold">Biến thể (Giá & Tồn kho) *</h3>
            <button type="button" onClick={addVariant} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
          
          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div key={v.id} className="p-4 border rounded-lg bg-gray-50 grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">SKU *</label>
                  <input required value={v.sku} onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">Màu sắc</label>
                  <input value={v.color} onChange={(e) => handleVariantChange(idx, 'color', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1">Size</label>
                  <input value={v.size} onChange={(e) => handleVariantChange(idx, 'size', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">Chất liệu</label>
                  <input value={v.material} onChange={(e) => handleVariantChange(idx, 'material', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">Giá gốc *</label>
                  <input required type="number" value={v.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1">Giá Sale</label>
                  <input type="number" value={v.sale_price || ''} onChange={(e) => handleVariantChange(idx, 'sale_price', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1">Tồn kho</label>
                  <input required type="number" value={v.stock_quantity} onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)} className="w-full border p-1.5 rounded text-sm" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ảnh */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold">Hình ảnh</h3>
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
              <Upload className="w-4 h-4" /> Tải lên
            </button>
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
          </div>
          <div className="grid grid-cols-5 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className={`relative border rounded-lg overflow-hidden group ${img.is_primary ? 'ring-2 ring-blue-500' : ''}`}>
                <img src={img.url.startsWith('http') ? img.url : `http://localhost:8080${img.url}`} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setPrimaryImage(idx)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Chính</button>
                  <button type="button" onClick={() => removeImage(idx)} className="text-xs bg-red-600 text-white p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
                {img.is_primary && <div className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1 rounded">Ảnh bìa</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Cài đặt khác */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thiết lập khác</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bảo hành</label>
              <input name="warranty" value={formData.warranty} onChange={handleChange} placeholder="VD: 12 tháng" className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded-lg p-2">
                <option value="active">Hiển thị (Active)</option>
                <option value="hidden">Ẩn (Hidden)</option>
                <option value="draft">Nháp (Draft)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="w-4 h-4" />
                <span className="text-sm font-medium">Đánh dấu là Sản phẩm nổi bật</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/products')} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
        </div>
      </form>
    </div>
  );
}
