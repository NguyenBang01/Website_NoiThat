package models

import "time"

type WishlistItem struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	UserID    uint64    `gorm:"uniqueIndex:idx_user_product" json:"user_id"`
	ProductID uint64    `gorm:"uniqueIndex:idx_user_product" json:"product_id"`
	CreatedAt time.Time `json:"created_at"`

	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (WishlistItem) TableName() string {
	return "wishlist_items"
}
