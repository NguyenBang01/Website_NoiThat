package models

import "time"

type Contact struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

func (Contact) TableName() string {
	return "contacts"
}
