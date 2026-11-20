import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getStoredRefreshToken } from '@/lib/authStore';
import { authApi } from '@/api';
import { usePermission } from '@/hooks/usePermission';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();
  const { can } = usePermission();
  const [isInitializing, setIsInitializing] = useState(() => {
    // Nếu store đã có user nội bộ hợp lệ thì không cần loading toàn màn hình
    return !(isAuthenticated && user && user.role !== 'customer');
  });
  const location = useLocation();

  useEffect(() => {
    // Nếu đã xác thực thành công trong store và không có token mới truyền qua URL, không cần gọi lại /admin/me
    const hasHashToken = Boolean(window.location.hash && window.location.hash.includes('token='));
    const hasSearchToken = Boolean(window.location.search && window.location.search.includes('token='));
    if (!hasHashToken && !hasSearchToken && isAuthenticated && user && user.role !== 'customer') {
      setIsInitializing(false);
      return;
    }

    const initAuth = async () => {
      let urlToken: string | null = null;
      if (window.location.hash && window.location.hash.length > 1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        urlToken = hashParams.get('token');
      }

      if (!urlToken) {
        const searchParams = new URLSearchParams(window.location.search);
        urlToken = searchParams.get('token');

        // Kiểm tra nếu token bị bọc trong redirect param (ví dụ: ?redirect=/?token=...)
        if (!urlToken && searchParams.get('redirect')) {
          const red = decodeURIComponent(searchParams.get('redirect')!);
          const tMatch = red.match(/[?&]token=([^&]+)/);
          if (tMatch) urlToken = decodeURIComponent(tMatch[1]);
        }
      }

      const tokenToUse = urlToken || getStoredRefreshToken();

      if (!tokenToUse) {
        clearAuth();
        setIsInitializing(false);
        return;
      }

      // Nạp thông tin tài khoản và danh sách quyền mới nhất từ /admin/me
      try {
        useAuthStore.getState().setAccessToken(tokenToUse);
        const meRes = await authApi.getAdminMe();
        if (meRes.data && meRes.data.role !== 'customer' && meRes.data.status !== 'locked' && meRes.data.status !== 'blocked') {
          setAuth(tokenToUse, meRes.data, tokenToUse, meRes.data.permissions || []);
          if (urlToken) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          clearAuth();
        }
      } catch {
        // Bảo mật: Nếu /admin/me thất bại (401/403/lỗi token), xóa auth và buộc đăng nhập lại
        // Tuyệt đối không fallback tin tưởng dữ liệu cũ trong localStorage để chống bypass quyền
        clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [setAuth, clearAuth, isAuthenticated, user]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        <p className="text-sm font-medium text-stone-600">Đang kiểm tra quyền quản trị Góc Nhà Đẹp...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role === 'customer' || user.status === 'locked' || user.status === 'blocked') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra permission nếu có yêu cầu
  if (permission && !can(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
