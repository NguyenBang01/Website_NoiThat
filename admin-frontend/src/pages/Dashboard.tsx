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
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Bảng Điều Khiển Tổng Quan
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Báo cáo thống kê doanh thu, đơn hàng và tình trạng tồn kho của cửa hàng nội thất.
        </p>
      </div>

      {/* 4 Thẻ chỉ số tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Doanh thu */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Tổng doanh thu</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : formatCurrency(overview?.total_revenue || 0)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span>Chỉ tính từ các đơn đã giao thành công</span>
            </p>
          </div>
        </div>

        {/* Tổng đơn hàng */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Tổng đơn hàng</span>
            <div className="rounded-xl bg-sky-50 p-2 text-sky-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : overview?.total_orders || 0}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Hôm nay: <strong className="text-stone-700">{overview?.orders_today || 0}</strong> đơn
            </p>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Khách hàng</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : overview?.total_customers || 0}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Tài khoản khách hàng đăng ký</p>
          </div>
        </div>

        {/* Sản phẩm đang bán */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Sản phẩm</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
              {loadingOverview ? '...' : overview?.total_products || 0}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Mặt hàng nội thất trong kho</p>
          </div>
        </div>
      </div>

      {/* Grid: Biểu đồ Recharts & Top Sản phẩm bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu theo ngày */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Biểu đồ Doanh thu (VND)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Doanh số bán hàng thực tế theo từng ngày
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
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
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
                Đang tải biểu đồ...
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
                      backgroundColor: '#1c1917',
                      color: '#fafaf9',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#b45309"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#b45309' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Sản phẩm bán chạy */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold text-stone-900">Top Sản phẩm bán chạy</h2>
            <p className="text-xs text-stone-500 mt-0.5">Xếp hạng theo số lượng đã bán</p>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-6 text-center">
              Chưa có dữ liệu sản phẩm bán ra
            </p>
          ) : (
            <div className="space-y-3.5">
              {topProducts.map((p, idx) => (
                <div key={p.product_id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 font-bold text-[10px] text-stone-700">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-stone-800 truncate" title={p.product_name}>
                      {p.product_name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-800 block">
                      Đã bán: {p.total_sold}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {formatCurrency(p.total_revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Đơn hàng gần đây & Cảnh báo sắp hết hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn hàng mới nhất */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-700" />
              <h2 className="text-base font-bold text-stone-900">Đơn hàng mới nhất</h2>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-stone-100">
                {recentOrders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-stone-50/50">
                    <td className="py-2.5 px-2">
                      <Link
                        to={`/orders/${o.order_id}`}
                        className="font-mono font-bold text-amber-800 hover:underline"
                      >
                        #{o.order_number}
                      </Link>
                      <p className="text-[11px] text-stone-500 mt-0.5">{o.customer_name}</p>
                    </td>
                    <td className="py-2.5 px-2 font-bold text-stone-900 text-right">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-2.5 px-2 text-right">
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
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h2 className="text-base font-bold text-stone-900">Cảnh báo sắp hết hàng</h2>
            </div>
            <span className="text-xs text-stone-400">Tồn kho ≤ 10</span>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-6 text-center">
              Kho hàng ổn định, không có sản phẩm nào sắp hết.
            </p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs"
                >
                  <div className="overflow-hidden">
                    <p className="font-semibold text-stone-900 truncate">{item.product_name}</p>
                    <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                      SKU: {item.variant_sku} • {item.variant_info || 'Mặc định'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
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
