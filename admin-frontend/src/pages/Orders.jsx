import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/orders?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`);
      setOrders(res.data.data?.items || []);
    } catch (err) {
      alert('Lỗi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Thành công',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h2>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg p-2 bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="delivered">Thành công</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-medium text-gray-600">Mã ĐH</th>
              <th className="p-4 font-medium text-gray-600">Khách hàng</th>
              <th className="p-4 font-medium text-gray-600">SĐT</th>
              <th className="p-4 font-medium text-gray-600">Ngày đặt</th>
              <th className="p-4 font-medium text-gray-600">Tổng tiền</th>
              <th className="p-4 font-medium text-gray-600">Trạng thái</th>
              <th className="p-4 font-medium text-gray-600 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-4 text-center">Đang tải...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center">Không có dữ liệu</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-blue-600">{o.order_number}</td>
                  <td className="p-4 text-gray-800">{o.recipient_name}</td>
                  <td className="p-4 text-gray-600">{o.recipient_phone}</td>
                  <td className="p-4 text-gray-600">{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 font-medium text-gray-800">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total_amount)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                      {getStatusText(o.status)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link to={`/orders/${o.id}`} className="inline-block text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                      <Eye className="w-5 h-5" />
                    </Link>
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
