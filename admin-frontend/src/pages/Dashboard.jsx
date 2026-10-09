import { useState, useEffect } from 'react';
import { Package, ShoppingCart, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [ovRes, revRes, topRes, orderRes, stockRes] = await Promise.all([
          api.get('/admin/dashboard/overview'),
          api.get('/admin/dashboard/revenue-by-day?days=14'),
          api.get('/admin/dashboard/top-products?limit=5'),
          api.get('/admin/dashboard/recent-orders?limit=5'),
          api.get('/admin/dashboard/low-stock?threshold=10')
        ]);
        
        setOverview(ovRes.data.data);
        setRevenueData(revRes.data.data || []);
        setTopProducts(topRes.data.data || []);
        setRecentOrders(orderRes.data.data || []);
        setLowStock(stockRes.data.data || []);
      } catch (err) {
        console.error('Dashboard error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) return <div>Đang tải bảng điều khiển...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan (Dashboard)</h2>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatMoney(overview?.total_revenue || 0)}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng đơn hàng</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview?.total_orders || 0}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><ShoppingCart className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Khách hàng</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview?.total_customers || 0}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Sản phẩm</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview?.total_products || 0}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Package className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* Chart & Top Products */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Doanh thu 14 ngày qua</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => val.slice(5)} />
                <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip formatter={(val) => formatMoney(val)} labelFormatter={(val) => `Ngày: ${val}`} />
                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Top Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm line-clamp-1" title={p.product_name}>{p.product_name}</p>
                  <p className="text-xs text-gray-500">Đã bán: {p.total_sold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock & Recent Orders */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="text-orange-500 w-5 h-5" /> Sản phẩm sắp hết hàng
            </h3>
          </div>
          <div className="space-y-3">
            {lowStock.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-500">SKU: {item.variant_sku} | {item.variant_info}</p>
                </div>
                <div className="text-orange-600 font-bold text-sm bg-orange-100 px-3 py-1 rounded">
                  Còn: {item.stock_quantity}
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-gray-500">Không có sản phẩm nào sắp hết hàng.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Đơn hàng gần đây</h3>
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.order_id} className="flex justify-between items-center border-b pb-3 last:border-0">
                <div>
                  <Link to={`/orders/${o.order_id}`} className="font-medium text-blue-600 hover:underline">#{o.order_number}</Link>
                  <p className="text-xs text-gray-500">{o.customer_name} - {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatMoney(o.total_amount)}</p>
                  <p className="text-xs text-gray-500">{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
