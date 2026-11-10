package models

import (
	"time"
)

// Notification đại diện cho thông báo người dùng và thông báo quản trị
type Notification struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     *uint64   `gorm:"index" json:"user_id,omitempty"` // nil = thông báo chung / admin
	TargetRole string    `gorm:"type:varchar(50);default:'all'" json:"target_role"` // "all", "customer", "admin"
	Title      string    `gorm:"type:varchar(255);not null" json:"title"`
	Message    string    `gorm:"type:text;not null" json:"message"`
	Type       string    `gorm:"type:varchar(50);default:'system'" json:"type"` // "order", "promo", "contact", "inventory", "system"
	Link       string    `gorm:"type:varchar(255)" json:"link"`
	IsRead     bool      `gorm:"default:false" json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

