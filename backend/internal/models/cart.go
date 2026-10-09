package models

import (
	"time"
)

type Cart struct {
	ID        uint64     `gorm:"primaryKey" json:"id"`
	UserID    uint64     `gorm:"uniqueIndex:uq_cart_user;not null" json:"user_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	Items     []CartItem `gorm:"foreignKey:CartID" json:"items"`
}

func (Cart) TableName() string {
	return "carts"
}

type CartItem struct {
	ID        uint64          `gorm:"primaryKey" json:"id"`
	CartID    uint64          `gorm:"not null" json:"cart_id"`
	VariantID uint64          `gorm:"not null" json:"variant_id"`
	Quantity  int             `gorm:"not null" json:"quantity"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
	Variant   *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
}

func (CartItem) TableName() string {
	return "cart_items"
}
