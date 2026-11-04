package models

// RolePermission là bảng nối quan hệ Many-to-Many giữa `roles` và `permissions`
type RolePermission struct {
	RoleID       uint64 `gorm:"primaryKey;index" json:"role_id"`
	PermissionID uint64 `gorm:"primaryKey;index" json:"permission_id"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}
