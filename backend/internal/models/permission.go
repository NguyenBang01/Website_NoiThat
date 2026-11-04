package models

import (
	"time"
)

// Permission ứng với bảng `permissions`
type Permission struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	Code        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"code"` // module.action ví dụ "product.view"
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`             // Tên quyền hiển thị tiếng Việt
	Module      string    `gorm:"type:varchar(50);index;not null" json:"module"`      // Tên module: product, order, category...
	Description string    `gorm:"type:varchar(255)" json:"description"`               // Giải thích quyền
	CreatedAt   time.Time `json:"created_at"`
}

func (Permission) TableName() string {
	return "permissions"
}
