import { apiClient } from './client';
import { compressImageIfNeeded } from '@/lib/imageCompressor';
import type {
  ApiResponse,
  LoginResponseData,
  User,
  Category,
  Brand,
  Product,
  Order,
  Customer,
  Coupon,
  Review,
  Contact,
  Banner,
  StoreSettings,
  DashboardOverview,
  RevenueByDay,
  TopProduct,
  RecentOrder,
  LowStockItem,
} from '@/types';

// ==========================================
// 1. AUTH API
// ==========================================
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post<ApiResponse<null>>('/account/logout');
    return res.data;
  },
};

// ==========================================
// 2. UPLOADS API
// ==========================================
export const uploadApi = {
  uploadImage: async (file: File) => {
    // Kiểm tra định dạng
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ file ảnh JPG, PNG, WEBP, GIF.');
    }

    // Tự động tối ưu và nén ảnh trên trình duyệt nếu ảnh dung lượng lớn
    const processedFile = await compressImageIfNeeded(file);

    // Kiểm tra an toàn trước khi gửi tới backend
    if (processedFile.size > 5 * 1024 * 1024) {
      throw new Error('Dung lượng ảnh quá lớn, không thể nén xuống dưới 5MB. Vui lòng chọn ảnh khác.');
    }

    const formData = new FormData();
    formData.append('file', processedFile);

    const res = await apiClient.post<ApiResponse<{ url: string; file_name: string; size: number }>>(
      '/admin/uploads',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
};

// ==========================================
// 3. DANH MỤC API
// ==========================================
export const categoryApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/admin/categories');
    return res.data;
  },
  create: async (payload: Partial<Category>) => {
    const res = await apiClient.post<ApiResponse<Category>>('/admin/categories', payload);
    return res.data;
  },
  update: async (id: number, payload: Partial<Category>) => {
    const res = await apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, payload);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/categories/${id}`);
    return res.data;
  },
};

// ==========================================
// 4. THƯƠNG HIỆU API
// ==========================================
export const brandApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<Brand[]>>('/brands');
    return res.data;
  },
  create: async (payload: { name: string; slug?: string; logo?: string }) => {
    const res = await apiClient.post<ApiResponse<Brand>>('/admin/brands', payload);
    return res.data;
  },
  update: async (id: number, payload: { name: string; slug?: string; logo?: string }) => {
    const res = await apiClient.put<ApiResponse<Brand>>(`/admin/brands/${id}`, payload);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/brands/${id}`);
    return res.data;
  },
};

// ==========================================
// 5. SẢN PHẨM API
// ==========================================
export interface ProductFilterParams {
  q?: string;
  category_id?: number | string;
  status?: string;
  page?: number;
  limit?: number;
}

export const productApi = {
  getList: async (params: ProductFilterParams = {}) => {
    const res = await apiClient.get<ApiResponse<Product[] | { items: Product[] }>>('/admin/products', {
      params,
    });
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return res.data;
  },
  create: async (payload: unknown) => {
    const res = await apiClient.post<ApiResponse<Product>>('/admin/products', payload);
    return res.data;
  },
  update: async (id: number | string, payload: unknown) => {
    const res = await apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, payload);
    return res.data;
  },
  delete: async (id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/products/${id}`);
    return res.data;
  },
};

// ==========================================
// 6. ĐƠN HÀNG API
// ==========================================
export interface OrderFilterParams {
  q?: string;
  status?: string;
  payment_status?: string;
  page?: number;
  limit?: number;
}

export const orderApi = {
  getList: async (params: OrderFilterParams = {}) => {
    const res = await apiClient.get<ApiResponse<{ items: Order[] }>>('/admin/orders', {
      params,
    });
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return res.data;
  },
  updateStatus: async (id: number | string, status: string, note?: string) => {
    const res = await apiClient.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
      status,
      note,
    });
    return res.data;
  },
};

// ==========================================
// 7. KHÁCH HÀNG API
// ==========================================
export const customerApi = {
  getList: async (params: { q?: string; status?: string; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<ApiResponse<Customer[]>>('/admin/customers', {
      params,
    });
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await apiClient.get<ApiResponse<Customer>>(`/admin/customers/${id}`);
    return res.data;
  },
  toggleStatus: async (id: number | string) => {
    const res = await apiClient.put<ApiResponse<null>>(`/admin/customers/${id}/toggle-status`);
    return res.data;
  },
};

// ==========================================
// 8. MÃ GIẢM GIÁ API
// ==========================================
export const couponApi = {
  getList: async (params: { q?: string; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<ApiResponse<Coupon[] | { items: Coupon[] }>>('/admin/coupons', {
      params,
    });
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await apiClient.get<ApiResponse<Coupon>>(`/admin/coupons/${id}`);
    return res.data;
  },
  create: async (payload: Partial<Coupon>) => {
    const res = await apiClient.post<ApiResponse<Coupon>>('/admin/coupons', payload);
    return res.data;
  },
  update: async (id: number | string, payload: Partial<Coupon>) => {
    const res = await apiClient.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, payload);
    return res.data;
  },
  delete: async (id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/coupons/${id}`);
    return res.data;
  },
};

// ==========================================
// 9. ĐÁNH GIÁ API
// ==========================================
export const reviewApi = {
  getList: async (params: { status?: string; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<ApiResponse<Review[]>>('/admin/reviews', { params });
    return res.data;
  },
  updateStatus: async (id: number | string, status: 'approved' | 'rejected', admin_note?: string) => {
    const res = await apiClient.put<ApiResponse<null>>(`/admin/reviews/${id}`, {
      status,
      admin_note,
    });
    return res.data;
  },
};

// ==========================================
// 10. LIÊN HỆ API
// ==========================================
export const contactApi = {
  getList: async (params: { page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<ApiResponse<Contact[]>>('/admin/contacts', { params });
    return res.data;
  },
  markAsRead: async (id: number | string) => {
    const res = await apiClient.put<ApiResponse<null>>(`/admin/contacts/${id}/read`);
    return res.data;
  },
  delete: async (id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/contacts/${id}`);
    return res.data;
  },
};

// ==========================================
// 11. BANNER API
// ==========================================
export const bannerApi = {
  getList: async (params: { page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<ApiResponse<{ items?: Banner[] } | Banner[]>>('/admin/banners', { params });
    return res.data;
  },
  create: async (payload: Partial<Banner>) => {
    const res = await apiClient.post<ApiResponse<Banner>>('/admin/banners', payload);
    return res.data;
  },
  update: async (id: number | string, payload: Partial<Banner>) => {
    const res = await apiClient.put<ApiResponse<Banner>>(`/admin/banners/${id}`, payload);
    return res.data;
  },
  delete: async (id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/banners/${id}`);
    return res.data;
  },
};

// ==========================================
// 12. CÀI ĐẶT CỬA HÀNG API
// ==========================================
export const settingsApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<StoreSettings>>('/settings');
    return res.data;
  },
  update: async (settings: Record<string, string>) => {
    const payload = {
      settings: Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
      })),
    };
    const res = await apiClient.put<ApiResponse<null>>('/admin/settings', payload);
    return res.data;
  },
  testEmail: async (toEmail: string) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/settings/test-email', {
      to_email: toEmail,
    });
    return res.data;
  },
};

// ==========================================
// 13. DASHBOARD API
// ==========================================
export const dashboardApi = {
  getOverview: async () => {
    const res = await apiClient.get<ApiResponse<DashboardOverview>>('/admin/dashboard/overview');
    return res.data;
  },
  getRevenueByDay: async (days: number = 14) => {
    const res = await apiClient.get<ApiResponse<RevenueByDay[]>>(`/admin/dashboard/revenue-by-day?days=${days}`);
    return res.data;
  },
  getTopProducts: async (limit: number = 5) => {
    const res = await apiClient.get<ApiResponse<TopProduct[]>>(`/admin/dashboard/top-products?limit=${limit}`);
    return res.data;
  },
  getRecentOrders: async (limit: number = 5) => {
    const res = await apiClient.get<ApiResponse<RecentOrder[]>>(`/admin/dashboard/recent-orders?limit=${limit}`);
    return res.data;
  },
  getLowStock: async (threshold: number = 10) => {
    const res = await apiClient.get<ApiResponse<LowStockItem[]>>(`/admin/dashboard/low-stock?threshold=${threshold}`);
    return res.data;
  },
};
