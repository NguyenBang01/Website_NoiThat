import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Award,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  Mail,
  Image,
  Settings,
  X,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  History,
  Trash2,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/format';
import { usePermission } from '@/hooks/usePermission';

export interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Tổng quan', icon: LayoutDashboard, permission: 'dashboard.view' },
  { path: '/products', label: 'Sản phẩm', icon: Package, permission: 'product.view' },
  { path: '/categories', label: 'Danh mục', icon: FolderTree, permission: 'category.view' },
  { path: '/brands', label: 'Thương hiệu', icon: Award, permission: 'brand.view' },
  { path: '/orders', label: 'Đơn hàng', icon: ShoppingCart, permission: 'order.view' },
  { path: '/customers', label: 'Khách hàng', icon: Users, permission: 'customer.view' },
  { path: '/coupons', label: 'Mã giảm giá', icon: Ticket, permission: 'voucher.view' },
  { path: '/reviews', label: 'Đánh giá', icon: Star, permission: 'review.view' },
  { path: '/contacts', label: 'Liên hệ', icon: Mail, permission: 'contact.view' },
  { path: '/banners', label: 'Banner & Quảng cáo', icon: Image, permission: 'banner.view' },
  { path: '/staff', label: 'Nhân viên', icon: UserCheck, permission: 'staff.view' },
  { path: '/roles', label: 'Vai trò & Quyền', icon: ShieldCheck, permission: 'role.view' },
  { path: '/audit-logs', label: 'Nhật ký hoạt động', icon: History, permission: 'audit_log.view' },
  { path: '/trash', label: 'Thùng rác', icon: Trash2, permission: 'trash.view' },
  { path: '/shipping-settings', label: 'Cấu hình vận chuyển', icon: Truck, permission: 'shipping.view' },
  { path: '/settings', label: 'Cài đặt hệ thống', icon: Settings, permission: 'setting.view' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
}) => {
  const { can } = usePermission();

  const visibleNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0c1f17] text-stone-200 transition-all duration-300 ease-in-out lg:static border-r border-[#17372b] shadow-2xl lg:shadow-none',
          // Mobile state
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop width
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between px-4 border-b border-[#17372b]">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 font-semibold text-white transition-opacity hover:opacity-95 group"
          >
            {/* Logo 'G' đặc trưng đồng bộ với Storefront */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-serif font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
              G
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="block text-sm font-serif font-bold tracking-tight text-white leading-tight">
                  GÓC NHÀ ĐẸP
                </span>
                <span className="block text-[10px] text-emerald-400 font-medium uppercase tracking-wider leading-none mt-1">
                  Quản Trị Cửa Hàng
                </span>
              </div>
            )}
          </NavLink>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-stone-300 hover:bg-white/10 hover:text-white'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick link to Storefront */}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            <a
              href="http://localhost:4321"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-emerald-300 hover:text-white transition-all"
            >
              <span>Xem Website Cửa Hàng</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        {/* Footer info */}
        {!isCollapsed && (
          <div className="border-t border-[#17372b] p-3.5 text-center text-[11px] text-stone-400 flex items-center justify-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Góc Nhà Đẹp Admin v2.0</span>
          </div>
        )}
      </aside>
    </>
  );
};
