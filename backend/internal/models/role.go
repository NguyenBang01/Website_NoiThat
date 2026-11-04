package models

import (
	"time"
)

// Role ứng với bảng `roles` trong hệ thống RBAC
type Role struct {
	ID          uint64       `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"type:varchar(50);uniqueIndex;not null" json:"name"`         // super_admin, manager, sales, warehouse, content
	DisplayName string       `gorm:"type:varchar(100);not null" json:"display_name"`           // Quản trị viên tối cao, Quản lý...
	Description string       `gorm:"type:varchar(255)" json:"description"`                     // Mô tả nhiệm vụ
	IsSystem    bool         `gorm:"default:false;not null" json:"is_system"`                   // Vai trò hệ thống không được sửa code / xóa
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	Permissions []Permission `gorm:"many2many:role_permissions;joinForeignKey:role_id;joinReferences:permission_id" json:"permissions,omitempty"`
	UsersCount  int64        `gorm:"-" json:"users_count,omitempty"`                           // Đếm số lượng nhân viên đang giữ vai trò
}

func (Role) TableName() string {
	return "roles"
}
