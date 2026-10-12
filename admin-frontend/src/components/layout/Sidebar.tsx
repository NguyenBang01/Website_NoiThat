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
  Armchair,
} from 'lucide-react';
import { cn } from '@/lib/format';

export interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
}

const navItems = [
  { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/products', label: 'Sản phẩm', icon: Package },
  { path: '/categories', label: 'Danh mục', icon: FolderTree },
  { path: '/brands', label: 'Thương hiệu', icon: Award },
  { path: '/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/coupons', label: 'Mã giảm giá', icon: Ticket },
  { path: '/reviews', label: 'Đánh giá', icon: Star },
  { path: '/contacts', label: 'Liên hệ', icon: Mail },
  { path: '/banners', label: 'Banner', icon: Image },
  { path: '/settings', label: 'Cài đặt', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-stone-900 text-stone-200 transition-all duration-300 ease-in-out lg:static',
          // Mobile state
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop width
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64 border-r border-stone-800 shadow-xl lg:shadow-none'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-stone-800">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-white shadow-md">
              <Armchair className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="block text-sm font-bold tracking-tight text-white leading-tight">
                  NỘI THẤT ADMIN
                </span>
                <span className="block text-[11px] text-amber-500 font-medium leading-none mt-0.5">
                  Quản trị cửa hàng
                </span>
              </div>
            )}
          </NavLink>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
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

        {/* Footer info */}
        {!isCollapsed && (
          <div className="border-t border-stone-800 p-3.5 text-center text-[11px] text-stone-500">
            Hệ thống Quản trị v2.0
          </div>
        )}
      </aside>
    </>
  );
};
