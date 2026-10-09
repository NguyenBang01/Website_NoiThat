import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import api from '../utils/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      alert('Lỗi tải chi tiết đơn hàng');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    if (!confirm('Xác nhận chuyển trạng thái đơn hàng?')) return;
    try {
      setUpdating(true);
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      await fetchOrder();
      alert('Cập nhật trạng thái thành công!');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !order) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng: #{order.order_number}</h2>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          Trạng thái hiện tại: {order.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Danh sách sản phẩm</h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.variant_sku} | {item.variant_info}</p>
                    <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="font-medium text-gray-800">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.sub_total)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.sub_total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Giảm giá:</span>
                <span>- {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Khách hàng</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Người nhận:</span> <span className="font-medium">{order.recipient_name}</span></p>
              <p><span className="text-gray-500">Điện thoại:</span> <span className="font-medium">{order.recipient_phone}</span></p>
              <p><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{order.shipping_address}</span></p>
              {order.note && <p><span className="text-gray-500">Ghi chú:</span> <span className="font-medium text-red-500">{order.note}</span></p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Cập nhật trạng thái</h3>
            <div className="flex flex-col gap-3">
              {order.status === 'pending' && (
                <>
                  <button disabled={updating} onClick={() => handleUpdateStatus('confirmed')} className="flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    <CheckCircle className="w-5 h-5" /> Xác nhận đơn
                  </button>
                  <button disabled={updating} onClick={() => handleUpdateStatus('cancelled')} className="flex items-center justify-center gap-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700">
                    <XCircle className="w-5 h-5" /> Hủy đơn
                  </button>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <button disabled={updating} onClick={() => handleUpdateStatus('shipping')} className="flex items-center justify-center gap-2 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700">
                    <Truck className="w-5 h-5" /> Giao hàng
                  </button>
                  <button disabled={updating} onClick={() => handleUpdateStatus('cancelled')} className="flex items-center justify-center gap-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700">
                    <XCircle className="w-5 h-5" /> Hủy đơn
                  </button>
                </>
              )}
              {order.status === 'shipping' && (
                <button disabled={updating} onClick={() => handleUpdateStatus('delivered')} className="flex items-center justify-center gap-2 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">
                  <Package className="w-5 h-5" /> Đã giao thành công
                </button>
              )}
              {(order.status === 'delivered' || order.status === 'cancelled') && (
                <div className="text-center text-sm text-gray-500 italic">
                  Đơn hàng đã hoàn tất quá trình xử lý, không thể thay đổi trạng thái.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
