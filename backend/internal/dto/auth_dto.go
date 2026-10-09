package dto

import "furniture-shop/backend/internal/models"

// RegisterRequest là dữ liệu khách gửi lên khi đăng ký
type RegisterRequest struct {
	FullName string `json:"full_name" binding:"required,min=2,max=150"`
	Email    string `json:"email" binding:"required,email,max=190"`
	Phone    string `json:"phone" binding:"omitempty,max=20"`
	Password string `json:"password" binding:"required,min=6,max=72"`
}

// LoginRequest là dữ liệu gửi lên khi đăng nhập
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse là dữ liệu trả về sau khi đăng ký / đăng nhập thành công
type AuthResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	ExpiresIn   int          `json:"expires_in"` // số giây token còn sống
	User        *models.User `json:"user"`
}
