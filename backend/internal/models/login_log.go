package models

import "time"

// LoginLog lưu vết các phiên đăng nhập của người dùng để nhận diện thiết bị mới / IP mới
type LoginLog struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	UserID    uint64    `gorm:"index;not null" json:"user_id"`
	IP        string    `gorm:"type:varchar(50);not null" json:"ip"`
	UserAgent string    `gorm:"type:varchar(500);not null" json:"user_agent"`
	Device    string    `gorm:"type:varchar(150)" json:"device"`
	Location  string    `gorm:"type:varchar(150)" json:"location"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (LoginLog) TableName() string {
	return "login_logs"
}
