export interface ShippingSetting {
  id?: number;
  warehouse_lat?: number;
  warehouse_lng?: number;
  warehouse_name?: string;
  warehouse_address?: string;
  warehouse_phone?: string;
  max_distance_km?: number;
  is_distance_limit_enabled?: boolean;
  min_shipping_fee?: number;
  free_shipping_threshold?: number;
  free_shipping_max_distance_km?: number;
  is_free_shipping_enabled?: boolean;
  enable_bulky_surcharge?: boolean;
  bulky_surcharge_fee?: number;
  bulky_weight_threshold?: number;
  bulky_surcharge_per_item?: number;
  is_bulky_surcharge_enabled?: boolean;
  enable_floor_surcharge?: boolean;
  floor_surcharge_per_floor?: number;
  is_floor_surcharge_enabled?: boolean;
  enable_assembly_fee?: boolean;
  assembly_fee?: number;
  is_assembly_fee_enabled?: boolean;
  fallback_multiplier?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingTier {
  id: number;
  from_km: number;
  to_km: number;
  base_fee: number;
  price_per_km: number;
  step_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingEstimateResponse {
  distance_km: number;
  source: 'osrm' | 'haversine_fallback' | string;
  base_fee: number;
  bulky_surcharge: number;
  floor_surcharge: number;
  assembly_fee: number;
  total_bulky_items: number;
  free_shipping_discount: number;
  final_shipping_fee: number;
  is_free_shipping: boolean;
  is_deliverable: boolean;
  message: string;
  applied_tier?: ShippingTier | null;
}

export interface ShippingValidationResult {
  valid: boolean;
  message: string;
  gaps: string[];
  overlaps: string[];
}

export interface EstimateShippingRequest {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  sub_total?: number;
  coupon_code?: string;
  floor?: number;
  needs_assembly?: boolean;
  items?: Array<{
    variant_id: number;
    quantity: number;
  }>;
}
