import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    shop_name: '',
    shop_address: '',
    hotline: '',
    email: '',
    shipping_fee: '0'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const data = res.data.data || {};
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      alert('Lỗi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        settings: Object.keys(settings).map(key => ({
          key,
          value: settings[key].toString()
        }))
      };
      await api.put('/admin/settings', payload);
      alert('Lưu cài đặt thành công!');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Cửa hàng</h2>

      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Tên cửa hàng</label>
            <input name="shop_name" value={settings.shop_name} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <input name="shop_address" value={settings.shop_address} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hotline</label>
              <input name="hotline" value={settings.hotline} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email liên hệ</label>
              <input type="email" name="email" value={settings.email} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phí vận chuyển mặc định (VND)</label>
            <input type="number" name="shipping_fee" value={settings.shipping_fee} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
