package dto

import "time"

type CouponRequest struct {
	Code           string     `json:"code" binding:"required,max=50"`
	Description    *string    `json:"description"`
	DiscountType   string     `json:"discount_type" binding:"required,oneof=percent fixed"`
	DiscountValue  int64      `json:"discount_value" binding:"required,gt=0"`
	MinOrderAmount int64      `json:"min_order_amount" binding:"gte=0"`
	MaxDiscount    *int64     `json:"max_discount"`
	UsageLimit     int        `json:"usage_limit" binding:"gte=0"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	IsActive       *bool      `json:"is_active"`
}

type ApplyCouponRequest struct {
	Code       string `json:"code" binding:"required"`
	OrderTotal int64  `json:"order_total" binding:"required,gt=0"`
}

type CouponValidationResponse struct {
	Valid          bool   `json:"valid"`
	CouponID       uint64 `json:"coupon_id,omitempty"`
	Code           string `json:"code,omitempty"`
	DiscountAmount int64  `json:"discount_amount"`
	Message        string `json:"message"`
}
