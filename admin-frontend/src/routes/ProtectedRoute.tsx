import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getStoredRefreshToken, getStoredUser } from '@/lib/authStore';
import { authApi } from '@/api';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(() => {
    // Nếu store đã có user admin hợp lệ thì không cần loading
    return !(isAuthenticated && user?.role === 'admin');
  });
  const location = useLocation();

  useEffect(() => {
    // Đã có session admin hợp lệ -> vào luôn
    if (isAuthenticated && user?.role === 'admin') {
      setIsInitializing(false);
      // Dọn dẹp param token khỏi URL nếu còn
      if (window.location.search.includes('token=')) {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('token');
        cleanParams.delete('user');
        const newSearch = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
        window.history.replaceState({}, document.title, window.location.pathname + newSearch);
      }
      return;
    }

    const initAuth = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      let urlToken = searchParams.get('token');
      let urlUserStr = searchParams.get('user');

      // Kiểm tra nếu token bị bọc trong redirect param (ví dụ: ?redirect=/?token=...)
      if (!urlToken && searchParams.get('redirect')) {
        const red = decodeURIComponent(searchParams.get('redirect')!);
        const tMatch = red.match(/[?&]token=([^&]+)/);
        if (tMatch) urlToken = decodeURIComponent(tMatch[1]);
        const uMatch = red.match(/[?&]user=([^&]+)/);
        if (uMatch) urlUserStr = decodeURIComponent(uMatch[1]);
      }

      // 1. Nếu có cả token và user từ URL (chuyển hướng từ Storefront)
      if (urlToken && urlUserStr) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(urlUserStr));
          if (parsedUser && parsedUser.role === 'admin') {
            setAuth(urlToken, parsedUser, urlToken);
            setIsInitializing(false);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch {}
      }

      // 2. Nếu có token và user trong localStorage
      const tokenToUse = urlToken || getStoredRefreshToken();
      const storedUser = getStoredUser();

      if (tokenToUse && storedUser && storedUser.role === 'admin') {
        setAuth(tokenToUse, storedUser, tokenToUse);
        setIsInitializing(false);
        if (urlToken) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      if (!tokenToUse) {
        setIsInitializing(false);
        return;
      }

      try {
        useAuthStore.getState().setAccessToken(tokenToUse);
        const meRes = await authApi.getMe();
        if (meRes.data && meRes.data.role === 'admin') {
          setAuth(tokenToUse, meRes.data, tokenToUse);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [isAuthenticated, user, setAuth, clearAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        <p className="text-sm font-medium text-stone-600">Đang kiểm tra quyền quản trị Góc Nhà Đẹp...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
