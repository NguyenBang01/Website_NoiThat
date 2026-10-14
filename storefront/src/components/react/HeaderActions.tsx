import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  User as UserIcon,
  ShoppingCart,
  Bell,
  Phone,
  LogOut,
  Package,
  ChevronDown,
} from 'lucide-react';
import { $cart, openCart } from '../../stores/cartStore';
import { $auth, openAuthModal, logout } from '../../stores/authStore';
import { toast } from 'sonner';

export default function HeaderActions() {
  const cart = useStore($cart);
  const auth = useStore($auth);
  const [lang, setLang] = useState<'VN' | 'EN'>('VN');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi nhấp ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountClick = () => {
    if (auth.isAuthenticated) {
      setShowUserDropdown(!showUserDropdown);
    } else {
      openAuthModal('login');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    toast.info('Bạn đã đăng xuất tài khoản thành công.');
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-5 text-warm-700 text-xs">
        {/* User Account / Login Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleAccountClick}
            className="flex flex-col items-center gap-1 hover:text-brand-700 transition group cursor-pointer"
            title={auth.isAuthenticated ? 'Tài khoản của bạn' : 'Đăng nhập / Đăng ký'}
          >
            <div className="w-8 h-8 rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition bg-white">
              <UserIcon className="w-4 h-4 text-warm-700 group-hover:text-brand-700" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="font-medium text-[11px] whitespace-nowrap max-w-[85px] truncate">
                {auth.isAuthenticated && auth.user ? auth.user.full_name : 'Đăng nhập'}
              </span>
              {auth.isAuthenticated && <ChevronDown className="w-3 h-3 text-warm-400" />}
            </div>
          </button>

          {/* Dropdown Menu khi đã đăng nhập */}
          {auth.isAuthenticated && showUserDropdown && auth.user && (
            <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-2xl shadow-xl border border-neutral-100 p-2.5 animate-in fade-in zoom-in-95 space-y-1.5 text-xs">
              <div className="px-3 py-2 border-b border-neutral-100">
                <span className="font-bold text-neutral-900 block truncate">
                  {auth.user.full_name}
                </span>
                <span className="text-[11px] text-neutral-400 block truncate">
                  {auth.user.email}
                </span>
              </div>

              <a
                href="/orders"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:text-brand-700 transition font-medium"
              >
                <Package className="w-4 h-4 text-brand-700" />
                <span>Đơn hàng của tôi</span>
              </a>

              <a
                href="/products"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:text-brand-700 transition"
              >
                <ShoppingCart className="w-4 h-4 text-neutral-400" />
                <span>Xem sản phẩm</span>
              </a>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer text-left font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>

        {/* Cart Drawer Trigger */}
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center gap-1 hover:text-brand-700 transition group relative cursor-pointer"
          title="Giỏ hàng"
        >
          <div className="w-8 h-8 rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition relative bg-white">
            <ShoppingCart className="w-4 h-4" />
            {cart.totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cart.totalQuantity}
              </span>
            )}
          </div>
          <span className="font-medium text-[11px] whitespace-nowrap">Giỏ hàng</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => toast.info('Chưa có thông báo mới.')}
          className="flex flex-col items-center gap-1 hover:text-brand-700 transition group cursor-pointer"
          title="Thông báo"
        >
          <div className="w-8 h-8 rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition bg-white">
            <Bell className="w-4 h-4" />
          </div>
          <span className="font-medium text-[11px] whitespace-nowrap">Thông báo</span>
        </button>

        {/* Hotline */}
        <a
          href="tel:0931883988"
          className="flex flex-col items-center gap-1 hover:text-brand-700 transition group"
          title="Gọi Hotline 0931.883.988"
        >
          <div className="w-8 h-8 rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition bg-white">
            <Phone className="w-4 h-4 text-[#0068ff]" />
          </div>
          <span className="font-bold text-[11px] text-warm-900 whitespace-nowrap">
            0931.883.988
          </span>
        </a>

        {/* Language switch VN | EN */}
        <div className="flex items-center rounded-full bg-warm-200/80 p-0.5 border border-warm-300 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setLang('VN')}
            className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
              lang === 'VN'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-warm-600 hover:text-warm-900'
            }`}
          >
            VN
          </button>
          <button
            type="button"
            onClick={() => setLang('EN')}
            className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
              lang === 'EN'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-warm-600 hover:text-warm-900'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
