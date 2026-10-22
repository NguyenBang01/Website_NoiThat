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
  compare_at_price?: number | null;
  stock_quantity: number;
  weight_grams?: number | null;
  color?: string | null;
  material?: string | null;
  dimensions?: string | null;
  is_default: boolean;
  image?: string | null;
}

export interface ProductImage {
  id: number;
  product_id?: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category_id?: number | null;
  brand_id?: number | null;
  description?: string | null;
  short_description?: string | null;
  origin?: string | null;
  warranty_months?: number | null;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  view_count: number;
  category?: Category | null;
  brand?: Brand | null;
  variants: ProductVariant[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_variant_id: number;
  quantity: number;
  price_at_addition: number;
  variant: ProductVariant & {
    product: Product;
  };
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
