export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  image?: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

export interface ProductVariant {
  id: number;
  product_id?: number;
  sku: string;
  color?: string;
  size?: string;
  material?: string;
  price: number;
  sale_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface ProductImage {
  id?: number;
  url: string;
  alt?: string;
  is_primary: boolean;
  sort_order: number;
  variant_sku?: string;
}

export interface Product {
  id: number;
  category_id: number;
  brand_id?: number | null;
  name: string;
  slug: string;
  sku: string;
  short_desc?: string;
  description?: string;
  warranty?: string;
  status: 'draft' | 'active' | 'hidden';
  is_featured: boolean;
  min_price?: number;
  max_price?: number;
  total_stock?: number;
  category?: Category;
  brand?: Brand;
  variants: ProductVariant[];
  images: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  product_name: string;
  variant_sku: string;
  variant_info: string;
  price: number;
  sale_price?: number | null;
  quantity: number;
  sub_total: number;
  image_url?: string;
}

export interface OrderStatusLog {
  id: number;
  order_id: number;
  from_status: string;
  to_status: string;
  note?: string | null;
  changed_by: number;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  order_code?: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned';
  sub_total: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  coupon_id?: number | null;
  coupon_code?: string | null;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  note?: string | null;
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  payment_method?: 'cod' | 'bank_transfer';
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_logs?: OrderStatusLog[];
  user?: {
    id: number;
    full_name: string;
    email: string;
    phone?: string | null;
    status?: string | null;
    role?: string | null;
    created_at?: string | null;
  };
}

export interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number | null;
  usage_limit: number;
  used_count: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'admin';
  status: 'active' | 'blocked';
  created_at: string;
  updated_at: string;
  orders_count?: number;
  total_spent?: number;
}

export interface Review {
  id: number;
  user_id?: number;
  product_id?: number;
  rating: number;
  comment?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
  created_at: string;
  user?: {
    name?: string;
    full_name?: string;
  };
  product?: {
    id?: number;
    name?: string;
  };
}

export interface Contact {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
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

export interface DashboardOverview {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
  orders_today: number;
  revenue_today: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  order_count?: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_image?: string | null;
  total_sold: number;
  total_revenue: number;
}

export interface RecentOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface LowStockItem {
  variant_id: number;
  product_id?: number;
  product_name: string;
  variant_sku: string;
  variant_info: string;
  stock_quantity: number;
}
