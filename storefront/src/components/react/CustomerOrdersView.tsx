import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  User,
  ExternalLink,
} from 'lucide-react';
import { $auth, openAuthModal } from '../../stores/authStore';
import { clientFetch } from '../../lib/api';
import { formatCurrency, imgUrl } from '../../lib/format';

interface OrderItem {
  id: number;
  product_name: string;
  variant_sku: string;
  variant_info: string;
  price: number;
  sale_price?: number | null;
  quantity: number;
  sub_total: number;
  variant?: {
    product?: {
      images?: Array<{ url: string }>;
    };
  };
}

interface OrderStatusLog {
  id: number;
  from_status: string;
  to_status: string;
  note?: string | null;
  created_at: string;
}

interface CustomerOrder {
  id: number;
  order_number: string;
  order_code?: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  sub_total?: number;
  shipping_fee?: number;
  discount_amount?: number;
  total_amount: number;
  item_count?: number;
  recipient_name?: string;
  recipient_phone?: string;
  shipping_address?: string;
  note?: string | null;
  created_at: string;
  items?: OrderItem[];
  status_logs?: OrderStatusLog[];
}

export default function CustomerOrdersView() {
  const auth = useStore($auth);

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal hủy đơn
  const [cancelModalOrder, setCancelModalOrder] = useState<CustomerOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Copy memo
  const [copiedMemo, setCopiedMemo] = useState(false);

  const fetchOrders = async () => {
    if (!auth.token) return;
    setLoading(true);
    try {
      const res = await clientFetch<any>('/orders');
      if (res.success && res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setOrders(raw);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [auth.isAuthenticated, auth.token]);

  // Xem chi tiết một đơn
  const handleViewDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const res = await clientFetch<any>(`/orders/${orderId}`);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết đơn hàng:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xác nhận hủy đơn
  const handleCancelOrder = async () => {
    if (!cancelModalOrder || !cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đơn.');
      return;
    }
    setCancelling(true);
    setCancelError('');
    try {
      const res = await clientFetch<any>(`/orders/${cancelModalOrder.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      if (res.success) {
        setCancelModalOrder(null);
        setCancelReason('');
        await fetchOrders();
        if (selectedOrder && selectedOrder.id === cancelModalOrder.id) {
          handleViewDetail(cancelModalOrder.id);
        }
      } else {
        setCancelError(res.message || 'Không thể hủy đơn hàng này.');
      }
    } catch (err: any) {
      setCancelError(err.message || 'Lỗi khi gửi yêu cầu hủy đơn');
    } finally {
      setCancelling(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Đã xác nhận
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3.5 h-3.5 text-indigo-600" /> Đang giao hàng
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã giao thành công
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  // Lọc đơn hàng theo tab
  const filteredOrders = orders.filter((o) => {
    if (selectedStatus === 'all') return true;
    return o.status === selectedStatus;
  });

  // NẾU CHƯA ĐĂNG NHẬP
  if (!auth.isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-warm-900 mb-2">
          Theo Dõi & Quản Lý Đơn Hàng
        </h1>
        <p className="text-sm text-warm-600 max-w-md mx-auto mb-8">
          Vui lòng đăng nhập vào tài khoản Góc Nhà Đẹp của bạn để theo dõi tiến độ giao hàng, tra cứu thông tin bảo hành và lịch sử đặt hàng.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-8 py-3.5 rounded-xl bg-brand-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-800 transition shadow-md cursor-pointer"
        >
          Đăng Nhập Tài Khoản
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Top Profile Banner */}
      <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
            {auth.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-warm-900">
                {auth.user?.full_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 uppercase tracking-wide">
                Thành viên
              </span>
            </div>
            <p className="text-xs text-warm-500 mt-0.5">
              Email: <span className="font-mono text-warm-700">{auth.user?.email}</span>
              {auth.user?.phone && (
                <> • Hotline/SĐT: <span className="font-mono text-warm-700">{auth.user.phone}</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-warm-200 pt-4 md:pt-0 md:pl-8 text-xs text-warm-600">
          <div>
            <span className="text-[11px] text-warm-400 block uppercase tracking-wider">
              Tổng số đơn hàng
            </span>
            <span className="font-serif text-2xl font-bold text-warm-900 block mt-0.5">
              {orders.length}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-warm-400 block uppercase tracking-wider">
              Hỗ trợ 24/7
            </span>
            <a
              href="tel:0931883988"
              className="font-bold text-brand-700 hover:text-brand-800 text-sm block mt-0.5"
            >
              0931.883.988
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-warm-200 text-xs font-semibold">
        {[
          { key: 'all', label: 'Tất cả đơn' },
          { key: 'pending', label: 'Chờ xác nhận' },
          { key: 'confirmed', label: 'Đã xác nhận' },
          { key: 'shipping', label: 'Đang vận chuyển' },
          { key: 'delivered', label: 'Đã giao' },
          { key: 'cancelled', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedStatus(tab.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl transition cursor-pointer ${
              selectedStatus === tab.key
                ? 'bg-brand-700 text-white shadow-xs'
                : 'bg-white text-warm-700 hover:bg-warm-100 border border-warm-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-warm-400">
          Đang tải thông tin đơn hàng của bạn...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-warm-200 p-12 text-center text-warm-500 space-y-4">
          <div className="w-16 h-16 rounded-full bg-warm-100 text-warm-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-warm-900">
            {selectedStatus === 'all'
              ? 'Bạn chưa có đơn hàng nào tại Góc Nhà Đẹp'
              : 'Không có đơn hàng nào ở trạng thái này'}
          </h3>
          <p className="text-xs text-warm-400 max-w-sm mx-auto">
            Hãy khám phá các mẫu nội thất sang trọng của Góc Nhà Đẹp và tạo đơn hàng đầu tiên của bạn nhé!
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-800 transition"
          >
            Khám phá sản phẩm
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-warm-200 p-5 sm:p-6 shadow-xs hover:border-brand-300 transition space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold text-xs shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-warm-900">
                        #{order.order_number || order.order_code || `FS-${order.id}`}
                      </span>
                      {getStatusBadge(order.status)}
                      {order.payment_method === 'bank_transfer' && order.status !== 'awaiting_payment' && order.status !== 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Đã chuyển khoản
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-warm-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center justify-between sm:justify-end gap-4">
                  <div>
                    <span className="text-[11px] text-warm-400 block">Tổng thanh toán</span>
                    <span className="font-serif text-lg font-bold text-brand-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewDetail(order.id)}
                    className="px-4 py-2 rounded-xl bg-warm-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-warm-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-warm-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-warm-900">
                    Chi Tiết Đơn Hàng #{selectedOrder.order_number || selectedOrder.order_code || selectedOrder.id}
                  </h2>
                  <p className="text-xs text-warm-500">
                    Đặt lúc: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-600 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Trạng thái đơn & Tiến trình */}
              <div className="bg-warm-50/70 p-5 rounded-2xl border border-warm-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-warm-400 block uppercase tracking-wider">
                    Trạng thái hiện tại
                  </span>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {getStatusBadge(selectedOrder.status)}
                    {selectedOrder.payment_method === 'bank_transfer' && selectedOrder.status !== 'awaiting_payment' && selectedOrder.status !== 'cancelled' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                        ✓ Đã chuyển khoản (SePay)
                      </span>
                    ) : selectedOrder.payment_method === 'bank_transfer' && selectedOrder.status === 'awaiting_payment' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Chờ chuyển khoản
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warm-100 text-warm-700 border border-warm-300">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    )}
                  </div>
                </div>

                {selectedOrder.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalOrder(selectedOrder);
                      setCancelError('');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer self-start sm:self-center"
                  >
                    Yêu cầu hủy đơn hàng
                  </button>
                )}
              </div>

              {/* Danh sách sản phẩm trong đơn */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-warm-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-700" />
                  Sản phẩm đã đặt ({selectedOrder.items?.length || 0})
                </h3>

                <div className="rounded-2xl border border-warm-200 divide-y divide-warm-100 overflow-hidden">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-white">
                      <div className="flex-1">
                        <h4 className="font-semibold text-xs sm:text-sm text-warm-900">
                          {item.product_name}
                        </h4>
                        <p className="text-[11px] text-warm-500 font-mono mt-0.5">
                          SKU: {item.variant_sku} • {item.variant_info || 'Mặc định'}
                        </p>
                        <p className="text-xs text-warm-600 mt-1">
                          Đơn giá: {formatCurrency(item.price)} ×{' '}
                          <span className="font-bold text-warm-900">{item.quantity}</span>
                        </p>
                      </div>

                      <div className="text-right font-bold text-brand-800 text-sm font-serif">
                        {formatCurrency(item.sub_total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông tin nhận hàng & thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-warm-200 bg-white space-y-2 text-xs">
                  <h4 className="font-bold text-warm-900 flex items-center gap-2 pb-2 border-b border-warm-100">
                    <MapPin className="w-4 h-4 text-brand-700" />
                    Địa chỉ nhận hàng
                  </h4>
                  <p>
                    <span className="text-warm-400">Người nhận:</span>{' '}
                    <strong className="text-warm-900">{selectedOrder.recipient_name}</strong>
                  </p>
                  <p>
                    <span className="text-warm-400">Điện thoại:</span>{' '}
                    <strong className="text-warm-900">{selectedOrder.recipient_phone}</strong>
                  </p>
                  <p>
                    <span className="text-warm-400">Địa chỉ:</span>{' '}
                    <strong className="text-warm-900">{selectedOrder.shipping_address}</strong>
                  </p>
                  {selectedOrder.note && (
                    <p className="pt-1 text-warm-600 italic">
                      <span className="text-warm-400">Ghi chú:</span> {selectedOrder.note}
                    </p>
                  )}
                </div>

                <div className="p-5 rounded-2xl border border-warm-200 bg-white space-y-2 text-xs">
                  <h4 className="font-bold text-warm-900 flex items-center gap-2 pb-2 border-b border-warm-100">
                    <FileText className="w-4 h-4 text-brand-700" />
                    Tổng kết thanh toán
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-warm-500">Tạm tính:</span>
                    <span className="font-semibold text-warm-800">
                      {formatCurrency(selectedOrder.sub_total || selectedOrder.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">Phí giao hàng & lắp đặt:</span>
                    <span className="text-emerald-700 font-semibold">Miễn phí</span>
                  </div>
                  {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>Mã giảm giá:</span>
                      <span className="font-semibold">
                        -{formatCurrency(selectedOrder.discount_amount)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-2 border-t border-warm-100 text-sm font-bold">
                    <span className="text-warm-900">Tổng thanh toán:</span>
                    <span className="text-brand-900 font-serif text-base">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-warm-200 text-xs">
                    <span className="text-warm-500 font-medium">Hình thức:</span>
                    <span className="font-semibold text-warm-900">
                      {selectedOrder.payment_method === 'bank_transfer' ? 'Chuyển khoản SePay' : 'Thanh toán COD'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-warm-500 font-medium">Trạng thái:</span>
                    {selectedOrder.payment_method === 'bank_transfer' && selectedOrder.status !== 'awaiting_payment' && selectedOrder.status !== 'cancelled' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Đã chuyển khoản
                      </span>
                    ) : selectedOrder.payment_method === 'bank_transfer' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Chờ chuyển khoản
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warm-100 text-warm-700 border border-warm-200">
                        Chưa thu tiền (COD)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lịch sử trạng thái */}
              {selectedOrder.status_logs && selectedOrder.status_logs.length > 0 && (
                <div className="p-5 rounded-2xl border border-warm-200 bg-warm-50/50 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warm-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-700" />
                    Tiến độ đơn hàng
                  </h4>
                  <div className="space-y-3 text-xs pl-2 border-l-2 border-brand-300">
                    {selectedOrder.status_logs.map((log) => (
                      <div key={log.id} className="relative pl-3">
                        <span className="font-bold text-warm-900 block">
                          {log.to_status === 'pending'
                            ? 'Khách hàng đặt hàng thành công'
                            : log.to_status === 'confirmed'
                            ? 'Góc Nhà Đẹp đã xác nhận đơn hàng'
                            : log.to_status === 'shipping'
                            ? 'Đang vận chuyển và chuẩn bị lắp đặt'
                            : log.to_status === 'delivered'
                            ? 'Đã giao hàng và hoàn tất lắp đặt'
                            : log.to_status === 'cancelled'
                            ? 'Đơn hàng đã được hủy'
                            : log.to_status}
                        </span>
                        <span className="text-[11px] text-warm-400">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </span>
                        {log.note && (
                          <p className="text-[11px] text-warm-600 mt-0.5 italic">
                            Ghi chú: {log.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotline hỗ trợ */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-brand-50 text-brand-900 text-xs">
                <span>Cần tư vấn hoặc thay đổi thông tin giao hàng?</span>
                <a
                  href="tel:0931883988"
                  className="font-bold text-brand-800 hover:text-brand-900 underline"
                >
                  Gọi Hotline: 0931.883.988
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY ĐƠN */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-warm-200 space-y-4">
            <h3 className="font-serif text-lg font-bold text-warm-900">
              Yêu Cầu Hủy Đơn Hàng #{cancelModalOrder.order_number || cancelModalOrder.id}
            </h3>
            <p className="text-xs text-warm-500">
              Bạn có chắc chắn muốn hủy đơn hàng này? Vui lòng chia sẻ lý do để Góc Nhà Đẹp cải thiện chất lượng dịch vụ.
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Lý do hủy đơn <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Muốn đổi sang mẫu khác, đổi địa chỉ, thay đổi thời gian giao..."
                className="w-full p-3 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="py-2.5 rounded-xl border border-warm-300 text-warm-700 text-xs font-semibold hover:bg-warm-100 transition cursor-pointer"
              >
                Giữ đơn hàng
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase transition disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
