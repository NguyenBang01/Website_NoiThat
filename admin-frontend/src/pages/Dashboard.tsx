import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Badge } from '@/components/ui';
import { dashboardApi } from '@/api';
import { formatCurrency } from '@/lib/format';

export const Dashboard: React.FC = () => {
  const [revenueDays, setRevenueDays] = useState(14);

  // 1. Tổng quan số liệu
  const { data: overviewRes, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardApi.getOverview,
  });

  // 2. Biểu đồ doanh thu theo ngày
  const { data: revenueRes, isLoading: loadingRevenue } = useQuery({
    queryKey: ['dashboard-revenue', revenueDays],
    queryFn: () => dashboardApi.getRevenueByDay(revenueDays),
  });

  // 3. Top sản phẩm bán chạy
  const { data: topProductsRes } = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardApi.getTopProducts(5),
  });

  // 4. Đơn hàng gần đây
  const { data: recentOrdersRes } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: () => dashboardApi.getRecentOrders(5),
  });

  // 5. Cảnh báo sắp hết hàng
  const { data: lowStockRes } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => dashboardApi.getLowStock(10),
  });

  const overview = overviewRes?.data;
  const revenueData = revenueRes?.data || [];
  const topProducts = topProductsRes?.data || [];
  const recentOrders = recentOrdersRes?.data || [];
  const lowStock = lowStockRes?.data || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kênh Quản Trị Thương Mại Điện Tử Nội Thất</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-900">
            Bảng Điều Khiển Tổng Quan
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            Thống kê doanh thu, đơn đặt hàng và kiểm soát kho nội thất cao cấp Góc Nhà Đẹp theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition"
          >
            <Package className="w-4 h-4" />
            <span>Kho sản phẩm</span>
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs hover:shadow-md transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Xem đơn hàng</span>
          </Link>
        </div>
      </div>

      {/* 4 Thẻ chỉ số tổng quan phong cách thương mại điện tử cao cấp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Doanh thu */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Doanh thu thuần</span>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-emerald-700 shadow-2xs">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : formatCurrency(overview?.total_revenue || 0)}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>Từ các đơn đã giao thành công</span>
            </p>
          </div>
        </div>

        {/* Tổng đơn hàng */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng đơn hàng</span>
            <div className="rounded-2xl bg-sky-50 border border-sky-200/80 p-2.5 text-sky-700 shadow-2xs">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : overview?.total_orders || 0}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1.5 font-medium">
              Hôm nay: <strong className="text-emerald-800">{overview?.orders_today || 0}</strong> đơn đặt mới
            </p>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Khách hàng thành viên</span>
            <div className="rounded-2xl bg-purple-50 border border-purple-200/80 p-2.5 text-purple-700 shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : overview?.total_customers || 0}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1.5 font-medium">Tài khoản khách hàng trên hệ thống</p>
          </div>
        </div>

        {/* Sản phẩm đang bán */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Sản phẩm trong kho</span>
            <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-2.5 text-amber-700 shadow-2xs">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : overview?.total_products || 0}
            </h3>
            <p className="text-[11px] text-stone-500 mt-1.5 font-medium">Mặt hàng nội thất sẵn sàng phục vụ</p>
          </div>
        </div>
      </div>

      {/* Grid: Biểu đồ Doanh thu & Top Sản phẩm bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu theo ngày */}
        <div className="lg:col-span-2 rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Biểu đồ Doanh thu Bán hàng
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Doanh số thực tế ghi nhận theo chu kỳ ngày
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 text-xs">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRevenueDays(days)}
                  className={`rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    revenueDays === days
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
                  }`}
                >
                  {days} ngày
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {loadingRevenue ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : revenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Chưa có dữ liệu doanh thu trong khoảng thời gian này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    tickFormatter={(val) => String(val).slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(Number(val)), 'Doanh thu']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{
                      backgroundColor: '#0c1f17',
                      color: '#fafaf9',
                      borderRadius: '14px',
                      fontSize: '12px',
                      border: '1px solid #17372b',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#15803d"
                    strokeWidth={2.8}
                    dot={{ r: 3.5, fill: '#15803d' }}
                    activeDot={{ r: 7, fill: '#16a34a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Sản phẩm bán chạy */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="border-b border-stone-100 pb-3.5 mb-4">
              <h2 className="text-lg font-serif font-bold text-stone-900">Top Sản phẩm bán chạy</h2>
              <p className="text-xs text-stone-500 mt-0.5">Xếp hạng theo sản lượng bán ra thực tế</p>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-8 text-center">
                Chưa có dữ liệu sản phẩm bán ra
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.product_id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-stone-50/80 transition text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-stone-200 text-stone-700'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-stone-900 truncate" title={p.product_name}>
                        {p.product_name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-800 block">
                        Đã bán: {p.total_sold}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {formatCurrency(p.total_revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 text-center">
            <Link
              to="/products"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1"
            >
              <span>Xem báo cáo sản phẩm chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Đơn hàng mới nhất & Cảnh báo tồn kho */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn hàng mới nhất */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">Đơn hàng mới nhất</h2>
                <p className="text-[11px] text-stone-500">Các giao dịch mua sắm nội thất vừa phát sinh</p>
              </div>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-stone-100">
                {recentOrders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-2">
                      <Link
                        to={`/orders/${o.order_id}`}
                        className="font-mono font-bold text-emerald-800 hover:underline"
                      >
                        #{o.order_number}
                      </Link>
                      <p className="text-[11px] text-stone-500 mt-0.5">{o.customer_name}</p>
                    </td>
                    <td className="py-3 px-2 font-bold text-stone-900 text-right">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {o.status === 'pending' && <Badge variant="warning" size="sm">Chờ duyệt</Badge>}
                      {o.status === 'confirmed' && <Badge variant="info" size="sm">Đã duyệt</Badge>}
                      {o.status === 'shipping' && <Badge variant="info" size="sm">Đang giao</Badge>}
                      {o.status === 'delivered' && <Badge variant="success" size="sm">Hoàn thành</Badge>}
                      {o.status === 'cancelled' && <Badge variant="danger" size="sm">Đã hủy</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cảnh báo sắp hết hàng */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">Cảnh báo tồn kho</h2>
                <p className="text-[11px] text-stone-500">Mặt hàng cần nhập thêm (Tồn kho ≤ 10)</p>
              </div>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1"
            >
              <span>Xem kho</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-8 text-center">
              Kho hàng ổn định, chưa có sản phẩm nào chạm ngưỡng tồn kho thấp.
            </p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs"
                >
                  <div className="overflow-hidden">
                    <p className="font-semibold text-stone-900 truncate">{item.product_name}</p>
                    <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                      SKU: {item.variant_sku} • {item.variant_info || 'Mặc định'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-xl bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                      Còn: {item.stock_quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
