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
  Staff,
  Role,
  AuditLog,
  PermissionGroup,
  CreateStaffInput,
  UpdateStaffInput,
  CreateRoleInput,
  UpdateRoleInput,
  StaffFilterParams,
  AuditLogFilterParams,
  TrashItem,
  TrashModule,
  TrashFilterParams,
  RestoreResponse,
  ShippingSetting,
  ShippingTier,
  ShippingEstimateResponse,
  ShippingValidationResult,
  EstimateShippingRequest,
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
  getAdminMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/admin/me');
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

  uploadMedia: async (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
    if (isVideo) {
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Dung lượng video không được vượt quá 50MB.');
      }
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<ApiResponse<{ url: string; file_name: string; size: number }>>(
        '/admin/uploads',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    }
    return uploadApi.uploadImage(file);
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

// ==========================================
// 14. QUẢN LÝ NHÂN VIÊN (STAFF) API
// ==========================================
export const staffApi = {
  getAll: async (params?: StaffFilterParams) => {
    const res = await apiClient.get<ApiResponse<Staff[]>>('/admin/staff', { params });
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await apiClient.get<ApiResponse<Staff>>(`/admin/staff/${id}`);
    return res.data;
  },
  create: async (data: CreateStaffInput) => {
    const res = await apiClient.post<ApiResponse<Staff>>('/admin/staff', data);
    return res.data;
  },
  update: async (id: number | string, data: UpdateStaffInput) => {
    const res = await apiClient.put<ApiResponse<Staff>>(`/admin/staff/${id}`, data);
    return res.data;
  },
  changeStatus: async (id: number | string, status: 'active' | 'locked') => {
    const res = await apiClient.patch<ApiResponse<Staff>>(`/admin/staff/${id}/status`, { status });
    return res.data;
  },
  resetPassword: async (id: number | string, new_password?: string) => {
    const res = await apiClient.post<ApiResponse<{ new_password?: string }>>(`/admin/staff/${id}/reset-password`, {
      new_password,
    });
    return res.data;
  },
  delete: async (id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/staff/${id}`);
    return res.data;
  },
};

// ==========================================
// 15. QUẢN LÝ VAI TRÒ & PHÂN QUYỀN (ROLES) API
// ==========================================
export const roleApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<Role[]>>('/admin/roles');
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await apiClient.get<ApiResponse<Role>>(`/admin/roles/${id}`);
    return res.data;
  },
  create: async (data: CreateRoleInput) => {
    const res = await apiClient.post<ApiResponse<Role>>('/admin/roles', data);
    return res.data;
  },
  update: async (id: number | string, data: UpdateRoleInput) => {
    const res = await apiClient.put<ApiResponse<Role>>(`/admin/roles/${id}`, data);
    return res.data;
  },
  delete: async (id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/roles/${id}`);
    return res.data;
  },
  getPermissions: async () => {
    const res = await apiClient.get<ApiResponse<PermissionGroup[]>>('/admin/permissions');
    return res.data;
  },
};

// ==========================================
// 16. NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS) API
// ==========================================
export const auditLogApi = {
  getAll: async (params?: AuditLogFilterParams) => {
    const res = await apiClient.get<ApiResponse<AuditLog[]>>('/admin/audit-logs', { params });
    return res.data;
  },
};

// ==========================================
// 17. THÙNG RÁC & KHÔI PHỤC (TRASH) API
// ==========================================
export const trashApi = {
  getList: async (params: TrashFilterParams) => {
    const res = await apiClient.get<ApiResponse<TrashItem[]>>('/admin/trash', { params });
    return res.data;
  },
  restore: async (module: TrashModule, id: number | string) => {
    const res = await apiClient.post<ApiResponse<null>>(`/admin/trash/${module}/${id}/restore`);
    return res.data;
  },
  restoreBatch: async (module: TrashModule, ids: number[]) => {
    const res = await apiClient.post<ApiResponse<RestoreResponse>>(`/admin/trash/${module}/restore-batch`, { ids });
    return res.data;
  },
  purge: async (module: TrashModule, id: number | string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/trash/${module}/${id}`);
    return res.data;
  },
  empty: async (module: TrashModule) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/trash/${module}/empty`);
    return res.data;
  },
};

// ==========================================
// 18. XUẤT DỮ LIỆU EXCEL (EXPORT) API
// ==========================================
const triggerBlobDownload = (data: Blob, defaultFilename: string, contentDisposition?: string) => {
  let filename = defaultFilename;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (filenameMatch && filenameMatch[1]) {
      try {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      } catch {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
  }
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportApi = {
  exportProducts: async (params?: { q?: string; category_id?: string | number; status?: string; ids?: string }) => {
    const res = await apiClient.get('/admin/products/export', {
      params,
      responseType: 'blob',
    });
    triggerBlobDownload(res.data, 'danh_sach_san_pham.xlsx', res.headers['content-disposition']);
  },
  exportOrders: async (params?: {
    q?: string;
    status?: string;
    payment_method?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
    ids?: string;
  }) => {
    const res = await apiClient.get('/admin/orders/export', {
      params,
      responseType: 'blob',
    });
    triggerBlobDownload(res.data, 'danh_sach_don_hang.xlsx', res.headers['content-disposition']);
  },
  exportInventory: async (params?: { threshold?: number; category_id?: string | number; ids?: string }) => {
    const res = await apiClient.get('/admin/inventory/export', {
      params,
      responseType: 'blob',
    });
    triggerBlobDownload(res.data, 'bao_cao_ton_kho.xlsx', res.headers['content-disposition']);
  },
  exportCustomers: async (params?: { q?: string; status?: string; ids?: string }) => {
    const res = await apiClient.get('/admin/customers/export', {
      params,
      responseType: 'blob',
    });
    triggerBlobDownload(res.data, 'danh_sach_khach_hang.xlsx', res.headers['content-disposition']);
  },
  exportVouchers: async (params?: { q?: string; discount_type?: string; is_active?: string | boolean; ids?: string }) => {
    const res = await apiClient.get('/admin/vouchers/export', {
      params,
      responseType: 'blob',
    });
    triggerBlobDownload(res.data, 'danh_sach_ma_giam_gia.xlsx', res.headers['content-disposition']);
  },
  exportRevenue: async (params?: { days?: number; start_date?: string; end_date?: string }) => {
    const res = await apiClient.get('/admin/reports/revenue/export', {
      params,
      responseType: 'blob',
    });
    triggerBlobDownload(res.data, 'bao_cao_doanh_thu.xlsx', res.headers['content-disposition']);
  },
};

// ==========================================
// 19. SHIPPING & DISTANCE CONFIGURATION API
// ==========================================
export const shippingApi = {
  getSettings: async () => {
    const res = await apiClient.get<ApiResponse<ShippingSetting>>('/admin/shipping/settings');
    return res.data;
  },
  updateSettings: async (data: Partial<ShippingSetting>) => {
    const res = await apiClient.put<ApiResponse<ShippingSetting>>('/admin/shipping/settings', data);
    return res.data;
  },
  listTiers: async () => {
    const res = await apiClient.get<ApiResponse<ShippingTier[]>>('/admin/shipping/tiers');
    return res.data;
  },
  createTier: async (data: Omit<ShippingTier, 'id' | 'created_at' | 'updated_at'>) => {
    const res = await apiClient.post<ApiResponse<ShippingTier>>('/admin/shipping/tiers', data);
    return res.data;
  },
  updateTier: async (id: number, data: Partial<ShippingTier>) => {
    const res = await apiClient.put<ApiResponse<ShippingTier>>(`/admin/shipping/tiers/${id}`, data);
    return res.data;
  },
  deleteTier: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/shipping/tiers/${id}`);
    return res.data;
  },
  reorderTiers: async (tierIds: number[]) => {
    const res = await apiClient.put<ApiResponse<ShippingTier[]>>('/admin/shipping/tiers/reorder', {
      tier_ids: tierIds,
    });
    return res.data;
  },
  validateTiers: async () => {
    const res = await apiClient.get<ApiResponse<ShippingValidationResult>>('/admin/shipping/tiers/validate');
    return res.data;
  },
  estimateShipping: async (data: EstimateShippingRequest) => {
    const res = await apiClient.post<ApiResponse<ShippingEstimateResponse>>('/shipping/estimate', data);
    return res.data;
  },
};
