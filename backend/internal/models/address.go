package models

import "time"

type Address struct {
	ID            uint64    `gorm:"primaryKey" json:"id"`
	UserID        uint64    `json:"user_id"`
	RecipientName string    `gorm:"size:150;not null" json:"recipient_name"`
	Phone         string    `gorm:"size:20;not null" json:"phone"`
	Province      string    `gorm:"size:100;not null" json:"province"`
	District      string    `gorm:"size:100;not null" json:"district"`
	Ward          string    `gorm:"size:100;not null" json:"ward"`
	Street        string    `gorm:"size:255;not null" json:"street"`
	IsDefault     bool      `json:"is_default"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (Address) TableName() string {
	return "addresses"
}
