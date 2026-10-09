package models

import "time"

// Brand ứng với bảng `brands`
type Brand struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(150);not null" json:"name"`
	Slug      string    `gorm:"type:varchar(190);uniqueIndex;not null" json:"slug"`
	Logo      *string   `gorm:"type:varchar(255)" json:"logo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Brand) TableName() string {
	return "brands"
}
