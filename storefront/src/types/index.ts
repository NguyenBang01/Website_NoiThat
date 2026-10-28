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
  google_id?: string | null;
  avatar_url?: string | null;
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
  price: number;
  sale_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity: number;
  weight_grams?: number | null;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  dimensions?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  image?: string | null;
}

export interface ProductImage {
  id?: number;
  product_id?: number;
  url: string;
  image_url?: string;
  alt?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category_id?: number | null;
  brand_id?: number | null;
  description?: string | null;
  short_desc?: string | null;
  short_description?: string | null;
  origin?: string | null;
  warranty?: string | null;
  warranty_months?: number | null;
  status: 'active' | 'inactive' | 'draft' | 'hidden';
  is_featured: boolean;
  view_count: number;
  base_price?: number;
  sale_price?: number | null;
  min_price?: number;
  max_price?: number;
  total_stock?: number;
  colors?: string[];
  image?: string;
  category?: Category | null;
  brand?: Brand | null;
  variants: ProductVariant[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
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
  stock_quantity?: number;
  available?: boolean;
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
  variant_info?: string;
  stock_quantity?: number;
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
  media_type?: 'image' | 'video';
  link?: string | null;
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  position?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  user_name: string;
  user_avatar?: string | null;
  created_at: string;
}

export interface Address {
  id: number;
  user_id?: number;
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressRequest {
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  is_default?: boolean;
}

export interface UpdateProfileRequest {
  full_name: string;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product?: Product;
  created_at?: string;
}

