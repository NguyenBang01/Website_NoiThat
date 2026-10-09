package models

import "time"

// Category ứng với bảng `categories` trong database
type Category struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	ParentID  *uint64   `json:"parent_id"`
	Name      string    `gorm:"type:varchar(150);not null" json:"name"`
	Slug      string    `gorm:"type:varchar(190);uniqueIndex;not null" json:"slug"`
	Image     *string   `gorm:"type:varchar(255)" json:"image"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Children chỉ dùng khi trả danh mục dạng cây, không lưu trong database
	Children []*Category `gorm:"-" json:"children,omitempty"`
}

// TableName cho GORM biết tên bảng
func (Category) TableName() string {
	return "categories"
}
