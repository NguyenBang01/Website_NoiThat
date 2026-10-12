import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
  User as UserIcon,
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
  banners: 'Banner',
  settings: 'Cài đặt',
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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-2xs">
        {/* Left: Mobile menu toggle + Desktop collapse toggle + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onToggleMobile}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden cursor-pointer"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:inline-flex cursor-pointer"
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
              className="font-medium text-stone-600 hover:text-amber-700 transition-colors"
            >
              Trang chủ
            </Link>
            {pathnames.length === 0 ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-semibold text-stone-900">Tổng quan</span>
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
                      <span className="font-semibold text-stone-900">{label}</span>
                    ) : (
                      <Link
                        to={to}
                        className="font-medium text-stone-600 hover:text-amber-700 transition-colors"
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

        {/* Right: User Info & Logout button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-full">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-white font-semibold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-stone-800 leading-tight">
                {user?.full_name || 'Quản trị viên'}
              </p>
              <p className="text-[10px] text-stone-500 leading-tight">
                {user?.email || 'admin@noithat.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Logout confirm dialog */}
      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Đăng xuất khỏi trang quản trị?"
        message="Bạn có chắc chắn muốn đăng xuất tài khoản? Phiên làm việc hiện tại sẽ kết thúc."
        confirmText="Đăng xuất"
        variant="warning"
        isLoading={isLoggingOut}
      />
    </>
  );
};
