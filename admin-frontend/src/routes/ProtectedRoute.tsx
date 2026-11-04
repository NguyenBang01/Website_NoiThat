import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getStoredRefreshToken, getStoredUser } from '@/lib/authStore';
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
    const initAuth = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      let urlToken = searchParams.get('token');

      // Kiểm tra nếu token bị bọc trong redirect param (ví dụ: ?redirect=/?token=...)
      if (!urlToken && searchParams.get('redirect')) {
        const red = decodeURIComponent(searchParams.get('redirect')!);
        const tMatch = red.match(/[?&]token=([^&]+)/);
        if (tMatch) urlToken = decodeURIComponent(tMatch[1]);
      }

      const tokenToUse = urlToken || getStoredRefreshToken();

      if (!tokenToUse) {
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
        // Fallback: nếu /admin/me lỗi do mạng hoặc API cũ, thử dùng thông tin đã lưu trong localStorage
        const storedUser = getStoredUser();
        if (storedUser && storedUser.role !== 'customer' && storedUser.status !== 'locked' && storedUser.status !== 'blocked') {
          setAuth(tokenToUse, storedUser, tokenToUse, storedUser.permissions || []);
        } else {
          clearAuth();
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Luôn refresh profile và permissions khi khởi chạy app
    initAuth();
  }, [setAuth, clearAuth]);

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
