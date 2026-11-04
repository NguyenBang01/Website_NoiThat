package dto

import (
	"time"

	"furniture-shop/backend/internal/models"
)

type StaffQuery struct {
	Page   int    `form:"page,default=1"`
	Limit  int    `form:"limit,default=10"`
	Search string `form:"search"`
	RoleID uint64 `form:"role_id"`
	Status string `form:"status"` // "active" hoặc "locked"
}

type CreateStaffRequest struct {
	FullName string `json:"full_name" binding:"required,min=2,max=150"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone" binding:"omitempty,max=20"`
	Password string `json:"password" binding:"required,min=6,max=50"`
	RoleID   uint64 `json:"role_id" binding:"required"`
}

type UpdateStaffRequest struct {
	FullName string `json:"full_name" binding:"required,min=2,max=150"`
	Phone    string `json:"phone" binding:"omitempty,max=20"`
	RoleID   uint64 `json:"role_id" binding:"required"`
}

type ChangeStaffStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=active locked"`
}

type ResetStaffPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6,max=50"`
}

type StaffResponse struct {
	ID          uint64       `json:"id"`
	FullName    string       `json:"full_name"`
	Email       string       `json:"email"`
	Phone       *string      `json:"phone"`
	Role        string       `json:"role"`
	RoleID      *uint64      `json:"role_id"`
	RoleDetail  *models.Role `json:"role_detail,omitempty"`
	Status      string       `json:"status"`
	LastLoginAt *time.Time   `json:"last_login_at"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
