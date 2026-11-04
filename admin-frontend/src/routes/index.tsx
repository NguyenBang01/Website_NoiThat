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
import { ShippingSettings } from '@/pages/ShippingSettings';
import { StaffPage } from '@/pages/Staff';
import { RolesPage } from '@/pages/Roles';
import { AuditLogsPage } from '@/pages/AuditLogs';
import { TrashPage } from '@/pages/Trash';
import { Forbidden } from '@/pages/Forbidden';

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
          {/* 403 Forbidden Route */}
          <Route path="403" element={<Forbidden />} />

          {/* 1. Tổng quan Dashboard */}
          <Route
            index
            element={
              <ProtectedRoute permission="dashboard.view">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 2. Sản phẩm */}
          <Route
            path="products"
            element={
              <ProtectedRoute permission="product.view">
                <ProductList />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/new"
            element={
              <ProtectedRoute permission="product.create">
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/:id"
            element={
              <ProtectedRoute permission="product.update">
                <ProductForm />
              </ProtectedRoute>
            }
          />

          {/* 3. Danh mục */}
          <Route
            path="categories"
            element={
              <ProtectedRoute permission="category.view">
                <Categories />
              </ProtectedRoute>
            }
          />

          {/* 4. Thương hiệu */}
          <Route
            path="brands"
            element={
              <ProtectedRoute permission="brand.view">
                <Brands />
              </ProtectedRoute>
            }
          />

          {/* 5. Đơn hàng */}
          <Route
            path="orders"
            element={
              <ProtectedRoute permission="order.view">
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute permission="order.view">
                <OrderDetail />
              </ProtectedRoute>
            }
          />

          {/* 6. Khách hàng */}
          <Route
            path="customers"
            element={
              <ProtectedRoute permission="customer.view">
                <Customers />
              </ProtectedRoute>
            }
          />

          {/* 7. Mã giảm giá */}
          <Route
            path="coupons"
            element={
              <ProtectedRoute permission="voucher.view">
                <Coupons />
              </ProtectedRoute>
            }
          />

          {/* 8. Đánh giá */}
          <Route
            path="reviews"
            element={
              <ProtectedRoute permission="review.view">
                <Reviews />
              </ProtectedRoute>
            }
          />

          {/* 9. Liên hệ */}
          <Route
            path="contacts"
            element={
              <ProtectedRoute permission="contact.view">
                <Contacts />
              </ProtectedRoute>
            }
          />

          {/* 10. Banner */}
          <Route
            path="banners"
            element={
              <ProtectedRoute permission="banner.view">
                <Banners />
              </ProtectedRoute>
            }
          />

          {/* 11. Quản lý nhân viên (Staff) */}
          <Route
            path="staff"
            element={
              <ProtectedRoute permission="staff.view">
                <StaffPage />
              </ProtectedRoute>
            }
          />

          {/* 12. Quản lý vai trò & quyền (Roles) */}
          <Route
            path="roles"
            element={
              <ProtectedRoute permission="role.view">
                <RolesPage />
              </ProtectedRoute>
            }
          />

          {/* 13. Nhật ký hoạt động (Audit Logs) */}
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute permission="audit_log.view">
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* 14. Thùng rác & Khôi phục */}
          <Route
            path="trash"
            element={
              <ProtectedRoute permission="trash.view">
                <TrashPage />
              </ProtectedRoute>
            }
          />

          {/* 15. Cấu hình vận chuyển */}
          <Route
            path="shipping-settings"
            element={
              <ProtectedRoute permission="shipping.view">
                <ShippingSettings />
              </ProtectedRoute>
            }
          />

          {/* 16. Cài đặt hệ thống */}
          <Route
            path="settings"
            element={
              <ProtectedRoute permission="setting.view">
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
