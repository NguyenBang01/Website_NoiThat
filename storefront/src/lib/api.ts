import type {
  ApiResponse,
  Category,
  Brand,
  Product,
  Banner,
  StoreSettings,
  Review,
  PaginationMeta,
} from '../types';

export const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Chuẩn hóa URL cho endpoint
 */
function resolveUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (path.startsWith('/api/') || path === '/health' || path.startsWith('/health/')) {
    return `${base}${path}`;
  }
  return `${base}/api/v1${path}`;
}

/**
 * Fetch chạy ở Server-side (SSR trong Astro frontmatter)
 */
export async function serverFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = resolveUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || `Lỗi máy chủ (${res.status})`,
        data: (data?.data ?? null) as T,
        detail: data?.detail,
      };
    }

    return (
      data || {
        success: true,
        message: 'Thành công',
        data: null as T,
      }
    );
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Không thể kết nối đến máy chủ',
      data: null as T,
    };
  }
}

/**
 * Fetch chạy ở Client-side (React components)
 * Hỗ trợ tự động gắn token và xử lý refresh token khi 401
 */
export async function clientFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = resolveUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    let res = await fetch(url, {
      ...options,
      headers,
    });

    // Xử lý 401 Refresh Token
    if (res.status === 401 && typeof window !== 'undefined') {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        try {
          const refreshRes = await fetch(resolveUrl('/account/refresh-token'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentToken}`,
            },
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData?.data?.token || refreshData?.data;
            if (newToken && typeof newToken === 'string') {
              localStorage.setItem('token', newToken);
              headers.set('Authorization', `Bearer ${newToken}`);
              // Thử lại request ban đầu
              res = await fetch(url, { ...options, headers });
            }
          } else {
            // Token hết hạn hoàn toàn -> xóa lưu trữ
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || `Lỗi máy chủ (${res.status})`,
        data: (data?.data ?? null) as T,
        detail: data?.detail,
      };
    }

    return (
      data || {
        success: true,
        message: 'Thành công',
        data: null as T,
      }
    );
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Không thể kết nối đến máy chủ',
      data: null as T,
    };
  }
}

// ==========================================
// CÁC HÀM TIỆN ÍCH LẤY DỮ LIỆU CÔNG KHAI
// ==========================================

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(resolveUrl('/health'));
    if (!res.ok) return false;
    const json = await res.json();
    return json.status === 'ok';
  } catch {
    return false;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await serverFetch<Category[]>('/categories');
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function fetchBrands(): Promise<Brand[]> {
  const res = await serverFetch<Brand[]>('/brands');
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export interface ProductFilterQuery {
  page?: number;
  limit?: number;
  q?: string;
  category_id?: number | string;
  brand_id?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  sort?: string;
  featured?: boolean;
}

export async function fetchProducts(
  query: ProductFilterQuery = {}
): Promise<{ products: Product[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams();
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.q) params.append('q', query.q);
  if (query.category_id) params.append('category_id', String(query.category_id));
  if (query.brand_id) params.append('brand_id', String(query.brand_id));
  if (query.min_price) params.append('min_price', String(query.min_price));
  if (query.max_price) params.append('max_price', String(query.max_price));
  if (query.sort) params.append('sort', query.sort);
  if (query.featured !== undefined) params.append('featured', String(query.featured));

  const qs = params.toString();
  const endpoint = qs ? `/products?${qs}` : '/products';
  const res = await serverFetch<Product[]>(endpoint);

  return {
    products: res.success && Array.isArray(res.data) ? res.data : [],
    meta: res.meta,
  };
}

export async function fetchProductDetail(slug: string): Promise<Product | null> {
  const res = await serverFetch<Product>(`/products/${slug}`);
  return res.success && res.data ? res.data : null;
}

export async function fetchProductReviews(slug: string): Promise<Review[]> {
  const res = await serverFetch<Review[]>(`/products/${slug}/reviews`);
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function fetchBanners(): Promise<Banner[]> {
  const res = await serverFetch<Banner[]>('/banners');
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function fetchSettings(): Promise<StoreSettings> {
  const res = await serverFetch<Record<string, string>>('/settings');
  const defaults: StoreSettings = {
    shop_name: 'Góc Nhà Đẹp',
    hotline: '0931883988',
    email: 'hotro@gocnhadep.vn',
    address: '615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM',
    default_shipping_fee: '30000',
    free_shipping_threshold: '1000000',
  };

  if (res.success && res.data && typeof res.data === 'object') {
    return { ...defaults, ...res.data };
  }
  return defaults;
}
