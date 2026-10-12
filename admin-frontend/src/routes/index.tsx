import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '@/components/layout';

// Pages
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Categories } from '@/pages/Categories';
import { Brands } from '@/pages/Brands';
import { ProductList } from '@/pages/ProductList';
import { ProductForm } from '@/pages/ProductForm';
import { Orders } from '@/pages/Orders';
import { OrderDetail } from '@/pages/OrderDetail';
import { Customers } from '@/pages/Customers';
import { Coupons } from '@/pages/Coupons';
import { Reviews } from '@/pages/Reviews';
import { Contacts } from '@/pages/Contacts';
import { Banners } from '@/pages/Banners';
import { Settings } from '@/pages/Settings';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* 1. Tổng quan Dashboard */}
          <Route index element={<Dashboard />} />

          {/* 2. Sản phẩm */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />

          {/* 3. Danh mục */}
          <Route path="categories" element={<Categories />} />

          {/* 4. Thương hiệu */}
          <Route path="brands" element={<Brands />} />

          {/* 5. Đơn hàng */}
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />

          {/* 6. Khách hàng */}
          <Route path="customers" element={<Customers />} />

          {/* 7. Mã giảm giá */}
          <Route path="coupons" element={<Coupons />} />

          {/* 8. Đánh giá */}
          <Route path="reviews" element={<Reviews />} />

          {/* 9. Liên hệ */}
          <Route path="contacts" element={<Contacts />} />

          {/* 10. Banner */}
          <Route path="banners" element={<Banners />} />

          {/* 11. Cài đặt */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
