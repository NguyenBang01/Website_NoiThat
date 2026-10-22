import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
  User as UserIcon,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { authApi } from '@/api';
import { showToast } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface HeaderProps {
  onToggleMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const breadcrumbMap: Record<string, string> = {
  '': 'Tổng quan',
  products: 'Sản phẩm',
  new: 'Thêm mới',
  categories: 'Danh mục',
  brands: 'Thương hiệu',
  orders: 'Đơn hàng',
  customers: 'Khách hàng',
  coupons: 'Mã giảm giá',
  reviews: 'Đánh giá',
  contacts: 'Liên hệ',
  banners: 'Banner & Quảng cáo',
  settings: 'Cài đặt hệ thống',
};

export const Header: React.FC<HeaderProps> = ({
  onToggleMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pathnames = location.pathname.split('/').filter(Boolean);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Bỏ qua lỗi logout nếu mạng lỗi
    } finally {
      clearAuth();
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
      showToast.success('Đã đăng xuất', 'Hẹn gặp lại bạn!');
      navigate('/login');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-stone-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-2xs">
        {/* Left: Mobile menu toggle + Desktop collapse toggle + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onToggleMobile}
            className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 hover:text-emerald-800 lg:hidden cursor-pointer transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl p-2 text-stone-600 hover:bg-stone-100 hover:text-emerald-800 lg:inline-flex cursor-pointer transition-colors"
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
            <Link
              to="/"
              className="font-medium text-stone-600 hover:text-emerald-700 transition-colors"
            >
              Trang chủ
            </Link>
            {pathnames.length === 0 ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-semibold text-emerald-950">Tổng quan</span>
              </>
            ) : (
              pathnames.map((segment, idx) => {
                const to = `/${pathnames.slice(0, idx + 1).join('/')}`;
                const isLast = idx === pathnames.length - 1;
                const label = breadcrumbMap[segment] || (segment.length > 8 ? `#${segment.slice(0, 6)}` : segment);

                return (
                  <React.Fragment key={to}>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                    {isLast ? (
                      <span className="font-semibold text-emerald-950">{label}</span>
                    ) : (
                      <Link
                        to={to}
                        className="font-medium text-stone-600 hover:text-emerald-700 transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </nav>
        </div>

        {/* Right: Storefront Link & Admin Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick link to Storefront */}
          <a
            href="http://localhost:4321"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-2xs"
            title="Mở Website bán hàng Góc Nhà Đẹp"
          >
            <span>Xem Cửa Hàng</span>
            <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
          </a>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200/90 px-3 py-1.5 rounded-2xl shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-2xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-stone-900 leading-tight">
                {user?.full_name || 'Quản trị viên'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold leading-none flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Admin</span>
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition-all cursor-pointer shadow-2xs"
            title="Đăng xuất tài khoản"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Dialog xác nhận đăng xuất */}
      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi Bảng điều khiển Quản trị Góc Nhà Đẹp?"
        confirmText="Đăng xuất ngay"
        cancelText="Ở lại"
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onClose={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
};
