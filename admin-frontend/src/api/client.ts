import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  useAuthStore,
  getStoredRefreshToken,
  setStoredRefreshToken,
  removeStoredRefreshToken,
} from '@/lib/authStore';
import type { ApiResponse, RefreshResponseData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Single-flight refresh token queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Gắn Access Token từ Zustand Store
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Tự động refresh token khi gặp 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Bỏ qua các endpoint auth không cần refresh lại
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/account/refresh-token');

    if (error.response?.status === 401 && originalRequest && !isAuthRoute) {
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      const storedToken = getStoredRefreshToken();
      if (!storedToken) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đã có request khác đang refresh, đợi trong queue
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Thử refresh qua endpoint backend /account/refresh-token (hoặc /auth/refresh)
        let newAccessToken = '';
        try {
          // Thử /account/refresh-token kèm Bearer token hiện có
          const res = await axios.post<ApiResponse<RefreshResponseData>>(
            `${API_BASE_URL.replace(/\/+$/, '')}/api/v1/account/refresh-token`,
            {},
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            }
          );
          newAccessToken = res.data.data?.token || res.data.data?.access_token || '';
        } catch {
          // Fallback thử /auth/refresh với body
          const res = await axios.post<ApiResponse<RefreshResponseData>>(
            `${API_BASE_URL.replace(/\/+$/, '')}/api/v1/auth/refresh`,
            { refresh_token: storedToken }
          );
          newAccessToken = res.data.data?.access_token || res.data.data?.token || '';
          if (res.data.data?.refresh_token) {
            setStoredRefreshToken(res.data.data.refresh_token);
          }
        }

        if (!newAccessToken) {
          throw new Error('Không nhận được token mới');
        }

        // Cập nhật access token mới vào Zustand & localStorage
        useAuthStore.getState().setAccessToken(newAccessToken);
        setStoredRefreshToken(newAccessToken);

        // Gắn vào request gốc và gửi lại
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clearAuth();
        removeStoredRefreshToken();

        if (window.location.pathname !== '/login') {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Trích xuất câu thông báo lỗi tiếng Việt từ response
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này';
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu';
    }
    if (error.response?.status === 500) {
      return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại';
}
