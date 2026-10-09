package models

import "time"

type Coupon struct {
	ID             uint64     `gorm:"primaryKey" json:"id"`
	Code           string     `gorm:"uniqueIndex;type:varchar(50);not null" json:"code"`
	Description    *string    `gorm:"type:text" json:"description,omitempty"`
	DiscountType   string     `gorm:"type:varchar(20);not null" json:"discount_type"` // percent or fixed
	DiscountValue  int64      `gorm:"not null" json:"discount_value"`
	MinOrderAmount int64      `gorm:"default:0" json:"min_order_amount"`
	MaxDiscount    *int64     `json:"max_discount,omitempty"`
	UsageLimit     int        `gorm:"default:0" json:"usage_limit"`
	UsedCount      int        `gorm:"default:0" json:"used_count"`
	StartDate      *time.Time `json:"start_date,omitempty"`
	EndDate        *time.Time `json:"end_date,omitempty"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (Coupon) TableName() string {
	return "coupons"
}
