package dto

import "furniture-shop/backend/internal/models"

// ShippingEstimateItemInput đại diện cho 1 sản phẩm trong giỏ hàng cần ước tính phí ship
type ShippingEstimateItemInput struct {
	VariantID uint64 `json:"variant_id" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,min=1"`
}

// ShippingEstimateRequest request ước tính phí vận chuyển từ storefront hoặc admin
type ShippingEstimateRequest struct {
	Latitude      *float64                    `json:"latitude"`
	Longitude     *float64                    `json:"longitude"`
	Address       string                      `json:"address"`
	Items         []ShippingEstimateItemInput `json:"items"`
	SubTotal      int64                       `json:"sub_total"`
	CouponCode    string                      `json:"coupon_code"`
	Floor         int                         `json:"floor"`          // Tầng khiêng bộ lên lầu (0 = tầng trệt / có thang máy)
	NeedsAssembly bool                        `json:"needs_assembly"` // Khách có yêu cầu thợ lắp đặt tận nhà không
}

// ShippingFeeBreakdown phân tích chi tiết các thành phần cấu thành phí ship
type ShippingFeeBreakdown struct {
	TierApplied    string `json:"tier_applied"`
	TierBaseFee    int64  `json:"tier_base_fee"`
	ExcessKMFee    int64  `json:"excess_km_fee"`
	BulkySurcharge int64  `json:"bulky_surcharge"`
	FloorSurcharge int64  `json:"floor_surcharge"`
	AssemblyFee    int64  `json:"assembly_fee"`
	DiscountAmount int64  `json:"discount_amount"`
	RawTotal       int64  `json:"raw_total"`
}

// ShippingEstimateResponse kết quả trả về khi tính phí vận chuyển
type ShippingEstimateResponse struct {
	IsDeliverable      bool                 `json:"is_deliverable"`
	Message            string               `json:"message,omitempty"`
	DistanceKM         float64              `json:"distance_km"`
	DurationMinutes    float64              `json:"duration_minutes"`
	Source             string               `json:"source"` // osrm | haversine_fallback
	GeocodedAddress    string               `json:"geocoded_address,omitempty"`
	FinalShippingFee   int64                `json:"final_shipping_fee"`
	IsFreeShipping     bool                 `json:"is_free_shipping"`
	FreeShippingReason string               `json:"free_shipping_reason,omitempty"`
	Breakdown          ShippingFeeBreakdown `json:"breakdown"`
}

// UpdateShippingSettingRequest body cập nhật cài đặt vận chuyển
type UpdateShippingSettingRequest struct {
	WarehouseName             string   `json:"warehouse_name"`
	WarehouseAddress          string   `json:"warehouse_address"`
	WarehouseLat              float64  `json:"warehouse_lat"`
	WarehouseLng              float64  `json:"warehouse_lng"`
	MaxDistanceKM             float64  `json:"max_distance_km"`
	MinShippingFee            int64    `json:"min_shipping_fee"`
	FreeShippingThreshold     int64    `json:"free_shipping_threshold"`
	FreeShippingMaxDistanceKM float64  `json:"free_shipping_max_distance_km"`
	EnableBulkySurcharge      *bool    `json:"enable_bulky_surcharge"`
	BulkySurchargeFee         int64    `json:"bulky_surcharge_fee"`
	BulkyWeightThreshold      float64  `json:"bulky_weight_threshold"`
	EnableFloorSurcharge      *bool    `json:"enable_floor_surcharge"`
	FloorSurchargePerFloor     int64    `json:"floor_surcharge_per_floor"`
	EnableAssemblyFee          *bool    `json:"enable_assembly_fee"`
	AssemblyFee                int64    `json:"assembly_fee"`
	FallbackMultiplier         float64  `json:"fallback_multiplier"`

	// Aliases tương thích frontend
	IsDistanceLimitEnabled    *bool    `json:"is_distance_limit_enabled"`
	IsFreeShippingEnabled     *bool    `json:"is_free_shipping_enabled"`
	IsBulkySurchargeEnabled   *bool    `json:"is_bulky_surcharge_enabled"`
	BulkySurchargePerItem     int64    `json:"bulky_surcharge_per_item"`
	IsFloorSurchargeEnabled   *bool    `json:"is_floor_surcharge_enabled"`
	IsAssemblyFeeEnabled      *bool    `json:"is_assembly_fee_enabled"`
}

// CreateShippingTierRequest body tạo bậc thang vận chuyển mới
type CreateShippingTierRequest struct {
	FromKM     float64 `json:"from_km" binding:"min=0"`
	ToKM       float64 `json:"to_km" binding:"required,gtfield=FromKM"`
	BaseFee    int64   `json:"base_fee" binding:"min=0"`
	PricePerKM int64   `json:"price_per_km" binding:"min=0"`
	SortOrder  int     `json:"sort_order"`
	IsActive   *bool   `json:"is_active"`
}

// UpdateShippingTierRequest body cập nhật bậc thang
type UpdateShippingTierRequest struct {
	FromKM     float64 `json:"from_km" binding:"min=0"`
	ToKM       float64 `json:"to_km" binding:"required,gtfield=FromKM"`
	BaseFee    int64   `json:"base_fee" binding:"min=0"`
	PricePerKM int64   `json:"price_per_km" binding:"min=0"`
	SortOrder  int     `json:"sort_order"`
	IsActive   *bool   `json:"is_active"`
}

// ReorderShippingTiersRequest sắp xếp lại thứ tự bậc thang
type ReorderShippingTiersRequest struct {
	TierIDs []uint64 `json:"tier_ids" binding:"required,min=1"`
}

// ValidateTiersResponse kết quả kiểm tra tính hợp lệ của các bậc thang
type ValidateTiersResponse struct {
	IsValid bool     `json:"is_valid"`
	Errors  []string `json:"errors,omitempty"`
}

// ShippingSettingsFullResponse trả về cấu hình tổng và danh sách các bậc thang
type ShippingSettingsFullResponse struct {
	Settings models.ShippingSetting `json:"settings"`
	Tiers    []models.ShippingTier  `json:"tiers"`
}
