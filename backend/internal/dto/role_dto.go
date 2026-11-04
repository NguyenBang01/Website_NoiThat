package dto

import (
	"time"

	"furniture-shop/backend/internal/models"
)

type CreateRoleRequest struct {
	Name          string   `json:"name" binding:"required,min=2,max=50"`
	DisplayName   string   `json:"display_name" binding:"required,min=2,max=100"`
	Description   string   `json:"description" binding:"max=255"`
	PermissionIDs []uint64 `json:"permission_ids"`
}

type UpdateRoleRequest struct {
	DisplayName   string   `json:"display_name" binding:"required,min=2,max=100"`
	Description   string   `json:"description" binding:"max=255"`
	PermissionIDs []uint64 `json:"permission_ids"`
}

type RoleResponse struct {
	ID          uint64              `json:"id"`
	Name        string              `json:"name"`
	DisplayName string              `json:"display_name"`
	Description string              `json:"description"`
	IsSystem    bool                `json:"is_system"`
	Permissions []models.Permission `json:"permissions"`
	UsersCount  int64               `json:"users_count"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
}

type PermissionGroup struct {
	Module      string              `json:"module"`
	ModuleName  string              `json:"module_name"`
	Permissions []models.Permission `json:"permissions"`
}
