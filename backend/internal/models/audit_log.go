package models

import (
	"time"
)

// AuditLog lưu nhật ký các hành vi quan trọng của nhân viên (phân quyền, khóa nick, đổi mật khẩu...)
type AuditLog struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	UserID    uint64    `gorm:"index;not null" json:"user_id"`
	Action    string    `gorm:"type:varchar(100);not null;index" json:"action"` // ví dụ: "staff.create", "staff.lock", "role.update"
	Target    string    `gorm:"type:varchar(150)" json:"target"`                // Đối tượng bị tác động (ví dụ: "Nhân viên: tranvanb@gmail.com")
	Details   string    `gorm:"type:text" json:"details"`                       // Chi tiết thay đổi hoặc mô tả
	IP        string    `gorm:"type:varchar(50);not null" json:"ip"`
	UserAgent string    `gorm:"type:varchar(500)" json:"user_agent"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}
