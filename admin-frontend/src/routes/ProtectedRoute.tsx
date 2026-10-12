import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getStoredRefreshToken } from '@/lib/authStore';
import { authApi } from '@/api';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(!isAuthenticated);
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated) {
        setIsInitializing(false);
        return;
      }

      const storedToken = getStoredRefreshToken();
      if (!storedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        // Tải lại thông tin người dùng từ token đã lưu
        useAuthStore.getState().setAccessToken(storedToken);
        const meRes = await authApi.getMe();
        if (meRes.data && meRes.data.role === 'admin') {
          setAuth(storedToken, meRes.data, storedToken);
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
  }, [isAuthenticated, setAuth, clearAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        <p className="text-sm font-medium text-stone-600">Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  return <>{children}</>;
};
