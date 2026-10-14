export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  detail?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'admin';
  status: 'active' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  image?: string | null;
  sort_order?: number;
  is_active?: boolean;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
}

export interface ProductVariant {
  id: number;
  product_id?: number;
  sku: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  price: number;
  sale_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface ProductImage {
  id?: number;
  url: string;
  alt?: string | null;
  is_primary: boolean;
  sort_order?: number;
  variant_sku?: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  brand_id?: number | null;
  name: string;
  slug: string;
  sku: string;
  short_desc?: string | null;
  description?: string | null;
  warranty?: string | null;
  status: 'draft' | 'active' | 'hidden';
  is_featured: boolean;
  base_price?: number;
  sale_price?: number | null;
  min_price?: number;
  max_price?: number;
  total_stock?: number;
  category?: Category;
  brand?: Brand;
  image?: string | null;
  colors?: string[];
  in_stock?: boolean;
  variants?: ProductVariant[];
  images?: ProductImage[];
  rating_avg?: number;
  rating_count?: number;
  created_at?: string;
}

export interface CartItem {
  id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  sku: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  image_url?: string | null;
  original_price: number;
  unit_price: number;
  quantity: number;
  line_total: number;
  stock_quantity: number;
  available: boolean;
}

export interface Cart {
  items: CartItem[];
  total_quantity: number;
  subtotal: number;
}

export interface GuestCartItem {
  variant_id: number;
  quantity: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  image_url?: string | null;
  price: number;
  variant_info: string;
  stock_quantity: number;
}

export interface StoreSettings {
  shop_name: string;
  hotline: string;
  email: string;
  address: string;
  default_shipping_fee: string;
  free_shipping_threshold: string;
  [key: string]: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  image: string;
  link_url?: string | null;
  sort_order: number;
  position?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  user_name: string;
  created_at: string;
}
