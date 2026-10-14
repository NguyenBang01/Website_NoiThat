import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import {
  Button,
  Badge,
  Modal,
  showToast,
} from '@/components/ui';
import { orderApi, settingsApi, getErrorMessage } from '@/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order } from '@/types';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Tải chi tiết đơn hàng
  const {
    data: orderRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => orderApi.getById(id!),
    enabled: Boolean(id),
  });

  // Tải thông tin cửa hàng cho hóa đơn in
  const { data: settingsRes } = useQuery({
    queryKey: ['store-settings'],
    queryFn: settingsApi.getAll,
  });

  const order: Order | undefined = orderRes?.data;
  const settings = settingsRes?.data;

  // Mutation cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      orderApi.updateStatus(id!, status, note),
    onSuccess: (_, variables) => {
      showToast.success('Cập nhật trạng thái thành công', `Đơn hàng đã chuyển sang: ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setCancelModalOpen(false);
      setCancelReason('');
    },
    onError: (err) => {
      showToast.error('Không thể cập nhật trạng thái', getErrorMessage(err));
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-stone-500">
        Đang tải thông tin chi tiết đơn hàng #{id}...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <p className="font-semibold">Lỗi tải đơn hàng</p>
        <p className="text-xs mt-1">{getErrorMessage(error)}</p>
        <Link to="/orders" className="mt-4 inline-block text-xs font-semibold text-amber-800 underline">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Print Styles injected for A4 Invoice */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          aside, header, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .printable-invoice {
            display: block !important;
            width: 100% !important;
            padding: 20mm !important;
            font-size: 12pt !important;
          }
        }
      `}</style>

      {/* Top Header - No print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Đơn hàng #{order.order_number || order.order_code || order.id}
              </h1>
              {order.status === 'pending' && <Badge variant="warning" dot>Chờ xác nhận</Badge>}
              {order.status === 'confirmed' && <Badge variant="info">Đã xác nhận</Badge>}
              {order.status === 'shipping' && <Badge variant="info" dot>Đang giao</Badge>}
              {order.status === 'delivered' && <Badge variant="success" dot>Hoàn thành</Badge>}
              {order.status === 'cancelled' && <Badge variant="danger">Đã hủy</Badge>}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Thời gian đặt: {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons: Next steps & Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            In hóa đơn
          </Button>

          {/* Valid Next Step Buttons */}
          {order.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="md"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ status: 'confirmed' })}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Xác nhận đơn
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setCancelModalOpen(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Hủy đơn
              </Button>
            </>
          )}

          {order.status === 'confirmed' && (
            <>
              <Button
                variant="primary"
                size="md"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ status: 'shipping' })}
                leftIcon={<Truck className="h-4 w-4" />}
              >
                Giao hàng
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setCancelModalOpen(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Hủy đơn
              </Button>
            </>
          )}

          {order.status === 'shipping' && (
            <Button
              variant="primary"
              size="md"
              isLoading={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate({ status: 'delivered' })}
              leftIcon={<PackageCheck className="h-4 w-4" />}
            >
              Hoàn thành giao hàng
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Order Details & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Cột trái (2/3): Danh sách sản phẩm và tổng tiền */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              Danh sách sản phẩm trong đơn ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-stone-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-stone-900 text-sm">{item.product_name}</p>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">
                      SKU: {item.variant_sku} • {item.variant_info || 'Mặc định'}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Đơn giá: {formatCurrency(item.price)} ×{' '}
                      <span className="font-bold text-stone-900">{item.quantity}</span>
                    </p>
                  </div>
                  <div className="text-right font-bold text-amber-800 text-sm">
                    {formatCurrency(item.sub_total)}
                  </div>
                </div>
              ))}
            </div>

            {/* Bảng tính tiền */}
            <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-medium text-stone-900">{formatCurrency(order.sub_total)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Phí vận chuyển:</span>
                <span className="font-medium text-stone-900">{formatCurrency(order.shipping_fee)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Mã giảm giá ({order.coupon_code || 'Voucher'}):</span>
                  <span className="font-bold">- {formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-amber-800 text-lg">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Timeline Lịch sử trạng thái */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Clock className="h-5 w-5 text-amber-700" />
              <h2 className="text-base font-bold text-stone-900">Lịch sử trạng thái đơn hàng</h2>
            </div>

            {order.status_logs && order.status_logs.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {order.status_logs.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-amber-700 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800">
                        {log.from_status ? `${log.from_status} → ` : ''}{log.to_status}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-500">{formatDateTime(log.created_at)}</span>
                    </div>
                    {log.note && (
                      <p className="mt-1 text-stone-600 italic bg-stone-50 p-2 rounded-lg">
                        Ghi chú: {log.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">Chưa có bản ghi lịch sử trạng thái.</p>
            )}
          </div>
        </div>

        {/* Cột phải (1/3): Người nhận & Giao hàng */}
        <div className="space-y-6">
          {/* 1. Tài khoản khách hàng */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <User className="h-4 w-4 text-amber-700" />
                <span>Tài khoản khách hàng</span>
              </h2>
              <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                User #{order.user_id || order.user?.id || '-'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Họ tên:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {order.user?.full_name || order.recipient_name}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Email đăng ký:</span>
                <span className="font-medium text-stone-800 font-mono">
                  {order.user?.email || 'Chưa liên kết email'}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">SĐT đăng ký:</span>
                <span className="font-medium text-stone-800 font-mono">
                  {order.user?.phone || order.recipient_phone || '-'}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-stone-400 text-[11px]">Trạng thái:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                  {order.user?.status === 'blocked' ? 'Bị khóa' : 'Hoạt động'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Thông tin giao hàng */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-700" />
              <span>Thông tin nhận hàng</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400 block text-[11px]">Người nhận hàng:</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {order.recipient_name || (order as any).receiver_name || order.user?.full_name}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400 block text-[11px]">Số điện thoại:</span>
                  <span className="font-semibold text-stone-800 font-mono">
                    {order.recipient_phone || (order as any).receiver_phone || order.user?.phone || '-'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-400 block text-[11px]">Địa chỉ giao hàng:</span>
                  <span className="text-stone-800 leading-relaxed font-medium">
                    {order.shipping_address}
                  </span>
                </div>
              </div>

              {order.note && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-stone-100">
                  <FileText className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-stone-400 block text-[11px]">Ghi chú của khách:</span>
                    <span className="text-amber-900 font-medium">{order.note}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mẫu Hóa Đơn In A4 (Chỉ hiển thị khi bấm In window.print) */}
      <div className="hidden printable-invoice text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {settings?.shop_name || 'CỬA HÀNG NỘI THẤT XINH'}
            </h1>
            <p className="text-sm">Địa chỉ: {settings?.address || 'TP. Hồ Chí Minh'}</p>
            <p className="text-sm">Hotline: {settings?.hotline || '0900 000 000'} • Email: {settings?.email || 'contact@noithat.vn'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">HÓA ĐƠN BÁN HÀNG</h2>
            <p className="font-mono text-sm mt-1">Mã đơn: #{order.order_number || order.id}</p>
            <p className="text-xs">Ngày in: {formatDateTime(order.updated_at || order.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="font-bold">KHÁCH HÀNG / NGƯỜI NHẬN:</p>
            <p>Họ tên: {order.recipient_name}</p>
            <p>Điện thoại: {order.recipient_phone}</p>
            <p>Địa chỉ: {order.shipping_address}</p>
          </div>
          <div className="text-right">
            <p>Ngày đặt: {formatDateTime(order.created_at)}</p>
            <p>Trạng thái: {order.status.toUpperCase()}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border border-black p-2 text-left">STT</th>
              <th className="border border-black p-2 text-left">Tên sản phẩm & Biến thể</th>
              <th className="border border-black p-2 text-right">Đơn giá</th>
              <th className="border border-black p-2 text-center">SL</th>
              <th className="border border-black p-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.id} className="border-b border-black">
                <td className="border border-black p-2 text-center">{idx + 1}</td>
                <td className="border border-black p-2">
                  <p className="font-bold">{item.product_name}</p>
                  <p className="text-xs text-gray-600">SKU: {item.variant_sku} - {item.variant_info}</p>
                </td>
                <td className="border border-black p-2 text-right">{formatCurrency(item.price)}</td>
                <td className="border border-black p-2 text-center">{item.quantity}</td>
                <td className="border border-black p-2 text-right font-bold">{formatCurrency(item.sub_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.sub_total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>{formatCurrency(order.shipping_fee)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-black">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 text-center text-sm pt-8">
          <div>
            <p className="font-bold">Người nhận hàng</p>
            <p className="text-xs italic">(Ký, ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold">Người lập hóa đơn</p>
            <p className="text-xs italic">(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
      </div>

      {/* Modal Hủy đơn hàng */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác nhận Hủy Đơn Hàng?"
        description="Khi hủy đơn hàng, hệ thống server sẽ tự động hoàn lại số lượng tồn kho cho các sản phẩm trong đơn."
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Quay lại
            </Button>
            <Button
              variant="danger"
              isLoading={updateStatusMutation.isPending}
              onClick={() =>
                updateStatusMutation.mutate({
                  status: 'cancelled',
                  note: cancelReason.trim() || 'Hủy theo yêu cầu của khách hàng',
                })
              }
            >
              Xác nhận Hủy
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-stone-700">
            Lý do hủy đơn hàng:
          </label>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy (VD: Khách đổi ý, hết hàng, v.v.)..."
            className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-amber-600 focus:outline-none"
          />
        </div>
      </Modal>
    </div>
  );
};
