package models

import (
	"time"

	"gorm.io/gorm"
)

// User ứng với bảng `users`
type User struct {
	ID           uint64         `gorm:"primaryKey" json:"id"`
	FullName     string         `gorm:"type:varchar(150);not null" json:"full_name"`
	Email        string         `gorm:"type:varchar(190);uniqueIndex;not null" json:"email"`
	Phone        *string        `gorm:"type:varchar(20)" json:"phone"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"` // dấu "-" nghĩa là KHÔNG bao giờ trả ra JSON
	Role         string         `gorm:"type:varchar(50);default:'customer'" json:"role"`
	Status       string         `gorm:"type:varchar(50);default:'active'" json:"status"`
	GoogleID     *string        `gorm:"type:varchar(100);index" json:"google_id,omitempty"`
	AvatarURL    *string        `gorm:"type:varchar(255)" json:"avatar_url,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}
