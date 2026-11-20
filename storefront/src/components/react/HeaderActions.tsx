import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  User as UserIcon,
  ShoppingCart,
  Bell,
  Phone,
  LogOut,
  Package,
  ShieldCheck,
  Heart,
  Check,
  CheckCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { $cart, openCart } from '../../stores/cartStore';
import { $auth, openAuthModal, logout } from '../../stores/authStore';
import { $wishlistCount } from '../../stores/wishlistStore';
import { clientFetch } from '../../lib/api';
import { toast } from 'sonner';

interface StoreNotification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link: string;
  type?: string;
}

function formatNotifTime(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  } catch {
    return 'Gần đây';
  }
}

export default function HeaderActions() {
  const cart = useStore($cart);
  const auth = useStore($auth);
  const wishlistCount = useStore($wishlistCount);
  const [lang, setLang] = useState<'VN' | 'EN'>('VN');

  // Dropdown states
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const endpoint = auth.isAuthenticated ? '/notifications' : '/public/notifications';
      const res = await clientFetch<StoreNotification[]>(endpoint);
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        const metaUnread = (res as any).meta?.unread_count;
        if (typeof metaUnread === 'number') {
          setUnreadCount(metaUnread);
        } else {
          setUnreadCount(res.data.filter((n) => !n.is_read).length);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [auth.isAuthenticated]);

  // Đóng dropdown khi nhấp ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountClick = (e: React.MouseEvent) => {
    // Nếu đã đăng nhập hợp lệ -> Bật / tắt menu tài khoản
    if (auth.isAuthenticated && auth.user && auth.user.id) {
      e.preventDefault();
      setShowNotificationDropdown(false);
      setShowUserDropdown(!showUserDropdown);
    } else {
      // Khi chưa đăng nhập:
      // Mở ngay popup modal Đăng nhập / Đăng ký trên trang hiện tại!
      e.preventDefault();
      openAuthModal('login');
    }
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowUserDropdown(false);
    setShowNotificationDropdown(!showNotificationDropdown);
    if (!showNotificationDropdown) {
      fetchNotifications();
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (auth.isAuthenticated) {
      await clientFetch('/notifications/read-all', { method: 'PUT' });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc.');
  };

  const handleNotificationItemClick = async (item: StoreNotification) => {
    if (!item.is_read && auth.isAuthenticated) {
      clientFetch(`/notifications/${item.id}/read`, { method: 'PUT' });
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setShowNotificationDropdown(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    toast.info('Bạn đã đăng xuất tài khoản thành công.');
  };

  return (
    <div className="flex items-center gap-[32px] font-sans">
      {/* Ảnh 3: Container các hành động - width: 423, height: 42, gap: 24px, opacity: 1 */}
      <div
        className="w-auto xl:w-[423px] max-w-full h-[42px] flex items-center gap-[24px]"
        style={{ opacity: 1 }}
      >
        {/* 1. NÚT ĐĂNG NHẬP / TÀI KHOẢN (chữ và logo: width: 62, height: 42) */}
        <div className="relative w-[62px] h-[42px] shrink-0" ref={dropdownRef}>
          <a
            href={auth.isAuthenticated && auth.user ? '/account' : '/login'}
            onClick={handleAccountClick}
            className="w-[62px] h-[42px] flex flex-col items-center justify-between hover:text-brand-700 transition group cursor-pointer"
            title={auth.isAuthenticated && auth.user ? 'Tài khoản của bạn' : 'Bấm để đăng nhập hoặc tạo tài khoản'}
            style={{ opacity: 1 }}
          >
            <div className="w-[24px] h-[24px] rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition bg-white shadow-2xs shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-warm-700 group-hover:text-brand-700" />
            </div>
            <span
              className="w-[62px] h-[18px] text-center text-warm-700 group-hover:text-brand-700 block truncate"
              style={{
                fontFamily: "'Open Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                letterSpacing: '0px',
                opacity: 1,
              }}
            >
              {auth.isAuthenticated && auth.user && auth.user.full_name
                ? auth.user.full_name
                : 'Đăng nhập'}
            </span>
          </a>

          {/* Dropdown Menu khi đã đăng nhập */}
          {auth.isAuthenticated && showUserDropdown && auth.user && (
            <div className="absolute right-0 top-12 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-warm-200 p-2.5 animate-in fade-in zoom-in-95 space-y-1.5 text-xs">
              <div className="px-3 py-2 border-b border-warm-100 bg-warm-50/60 rounded-xl">
                <span className="font-bold text-warm-900 block truncate text-sm">
                  {auth.user.full_name}
                </span>
                <span className="text-[11px] text-warm-500 block truncate font-mono">
                  {auth.user.email}
                </span>
              </div>

              {/* Mục dành riêng cho Quản trị viên */}
              {auth.user.role === 'admin' && (
                <a
                  href="http://localhost:1234"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 transition font-bold border border-amber-200"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Trang Quản Trị</span>
                    <span className="text-[10px] bg-amber-700 text-white px-1.5 py-0.5 rounded font-mono font-semibold">
                      ADMIN
                    </span>
                  </div>
                </a>
              )}

              <a
                href="/account"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-warm-700 hover:bg-warm-50 hover:text-brand-700 transition font-medium"
              >
                <UserIcon className="w-4 h-4 text-brand-700" />
                <span>Tài khoản của tôi</span>
              </a>

              <a
                href="/account?tab=wishlist"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-warm-700 hover:bg-warm-50 hover:text-brand-700 transition font-medium"
              >
                <Heart className="w-4 h-4 text-rose-600" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Sản phẩm yêu thích</span>
                  {wishlistCount > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </div>
              </a>

              <a
                href="/orders"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-warm-700 hover:bg-warm-50 hover:text-brand-700 transition font-medium"
              >
                <Package className="w-4 h-4 text-brand-700" />
                <span>Đơn hàng của tôi</span>
              </a>

              <a
                href="/products"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-warm-700 hover:bg-warm-50 hover:text-brand-700 transition"
              >
                <ShoppingCart className="w-4 h-4 text-warm-400" />
                <span>Xem sản phẩm</span>
              </a>

              <div className="pt-1 border-t border-warm-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. SẢN PHẨM YÊU THÍCH (chữ và logo: width: 62, height: 42) */}
        <a
          href="/wishlist"
          className="w-[62px] h-[42px] flex flex-col items-center justify-between hover:text-rose-600 transition group relative cursor-pointer shrink-0"
          title="Sản phẩm yêu thích của bạn"
          style={{ opacity: 1 }}
        >
          <div className="w-[24px] h-[24px] rounded-full border border-warm-300 flex items-center justify-center group-hover:border-rose-500 transition relative bg-white shadow-2xs shrink-0">
            <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'text-rose-600 fill-rose-600' : 'text-warm-700'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </div>
          <span
            className="w-[62px] h-[18px] text-center text-warm-700 group-hover:text-rose-600 block"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              letterSpacing: '0px',
              opacity: 1,
            }}
          >
            Yêu thích
          </span>
        </a>

        {/* 3. NÚT GIỎ HÀNG (chữ và logo: width: 62, height: 42) */}
        <div className="relative w-[62px] h-[42px] shrink-0">
          <a
            href="/checkout"
            onClick={(e) => {
              e.preventDefault();
              openCart();
            }}
            className="w-[62px] h-[42px] flex flex-col items-center justify-between hover:text-brand-700 transition group relative cursor-pointer"
            title="Xem giỏ hàng & Đặt hàng"
            style={{ opacity: 1 }}
          >
            <div className="w-[24px] h-[24px] rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition relative bg-white shadow-2xs shrink-0">
              <ShoppingCart className="w-3.5 h-3.5 text-warm-700 group-hover:text-brand-700" />
              {cart.totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-700 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                  {cart.totalQuantity}
                </span>
              )}
            </div>
            <span
              className="w-[62px] h-[18px] text-center text-warm-700 group-hover:text-brand-700 block"
              style={{
                fontFamily: "'Open Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                letterSpacing: '0px',
                opacity: 1,
              }}
            >
              Giỏ hàng
            </span>
          </a>
        </div>

        {/* 4. TRUNG TÂM THÔNG BÁO (chữ và logo: width: 62, height: 42) */}
        <div className="relative w-[62px] h-[42px] shrink-0" ref={notificationRef}>
          <button
            type="button"
            onClick={handleNotificationClick}
            className="w-[62px] h-[42px] flex flex-col items-center justify-between hover:text-brand-700 transition group cursor-pointer text-left"
            title="Trung tâm thông báo"
            style={{ opacity: 1 }}
          >
            <div className="w-[24px] h-[24px] rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition bg-white relative shadow-2xs shrink-0">
              <Bell className="w-3.5 h-3.5 text-warm-700 group-hover:text-brand-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#e11d48] text-white font-bold text-[9px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span
              className="w-[62px] h-[18px] text-center text-warm-700 group-hover:text-brand-700 block"
              style={{
                fontFamily: "'Open Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                letterSpacing: '0px',
                opacity: 1,
              }}
            >
              Thông báo
            </span>
          </button>

          {/* Dropdown danh sách thông báo */}
          {showNotificationDropdown && (
            <div className="absolute right-0 sm:-right-12 top-12 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-warm-200 p-3.5 animate-in fade-in zoom-in-95 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-warm-100 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-warm-900 text-sm font-serif">Thông báo của bạn</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsAsRead}
                    className="text-[11px] text-brand-700 hover:text-brand-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đã đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Danh sách các thông báo */}
              <div className="max-h-80 overflow-y-auto divide-y divide-warm-100 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-warm-400 text-xs">
                    Hiện chưa có thông báo nào.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <a
                      key={item.id}
                      href={item.link || '#'}
                      onClick={(e) => {
                        if (!item.link) e.preventDefault();
                        handleNotificationItemClick(item);
                      }}
                      className={`block p-2.5 rounded-xl transition cursor-pointer ${
                        !item.is_read ? 'bg-brand-50/60 hover:bg-brand-50' : 'hover:bg-warm-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-semibold text-warm-900 leading-snug">{item.title}</span>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-warm-600 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-warm-400">
                        <span>{formatNotifTime(item.created_at)}</span>
                        <span className="text-brand-700 hover:underline flex items-center gap-0.5 font-medium">
                          Xem chi tiết →
                        </span>
                      </div>
                    </a>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-warm-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowNotificationDropdown(false)}
                  className="text-[11px] text-warm-500 hover:text-warm-800 font-medium cursor-pointer"
                >
                  Đóng thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. HOTLINE */}
        <a
          href="tel:0931883988"
          className="h-[42px] flex flex-col items-center justify-between hover:text-brand-700 transition group shrink-0 cursor-pointer"
          title="Gọi Hotline 0931.883.988"
          style={{ opacity: 1 }}
        >
          <div className="w-[24px] h-[24px] rounded-full border border-warm-300 flex items-center justify-center group-hover:border-brand-600 transition bg-white shadow-2xs shrink-0">
            <Phone className="w-3.5 h-3.5 text-[#0068ff]" />
          </div>
          <span
            className="h-[18px] text-warm-900 group-hover:text-brand-700 block whitespace-nowrap"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 700,
              fontSize: '12px',
              lineHeight: '18px',
              letterSpacing: '0px',
              opacity: 1,
            }}
          >
            0931.883.988
          </span>
        </a>
      </div>

      {/* 6. CHUYỂN ĐỔI NGÔN NGỮ VN | EN (Ảnh 4: width: 73, height: 32, gap: 32px, opacity: 1) */}
      <div
        className="w-[73px] h-[32px] rounded-full bg-[#E8E8E8] p-[3px] border border-warm-300/80 flex items-center justify-between box-border shrink-0 select-none"
        style={{ opacity: 1 }}
      >
        <button
          type="button"
          onClick={() => setLang('VN')}
          className={`h-[26px] w-[33px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
            lang === 'VN'
              ? 'bg-[#15803d] text-white shadow-xs font-bold'
              : 'text-[#4b5563] hover:text-black font-semibold'
          }`}
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontSize: '11px',
            lineHeight: '1',
          }}
        >
          VN
        </button>
        <button
          type="button"
          onClick={() => setLang('EN')}
          className={`h-[26px] w-[33px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
            lang === 'EN'
              ? 'bg-[#15803d] text-white shadow-xs font-bold'
              : 'text-[#4b5563] hover:text-black font-semibold'
          }`}
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontSize: '11px',
            lineHeight: '1',
          }}
        >
          EN
        </button>
      </div>
    </div>
  );
}
