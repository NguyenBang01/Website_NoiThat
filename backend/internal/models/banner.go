package models

import "time"

type Banner struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	Title     string    `json:"title"`
	Subtitle  *string   `json:"subtitle"`
	Image     string    `json:"image"`
	MediaType string    `gorm:"type:varchar(20);default:'image'" json:"media_type"` // "image" hoặc "video"
	Link      *string   `json:"link"`
	SortOrder int       `json:"sort_order"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Banner) TableName() string {
	return "banners"
}
