package models

import "time"

// PasswordReset lưu mã OTP khôi phục mật khẩu gửi qua email
type PasswordReset struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"type:varchar(190);index" json:"email"`
	OTP       string    `gorm:"type:varchar(10)" json:"otp"`
	ExpiresAt time.Time `gorm:"index" json:"expires_at"`
	IsUsed    bool      `gorm:"default:false" json:"is_used"`
	CreatedAt time.Time `json:"created_at"`
}

func (PasswordReset) TableName() string {
	return "password_resets"
}
