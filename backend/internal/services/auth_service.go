package services

import (
	"errors"
	"strings"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"gorm.io/gorm"
)

var (
	ErrEmailExists        = errors.New("email đã được sử dụng")
	ErrInvalidCredentials = errors.New("email hoặc mật khẩu không đúng")
	ErrAccountBlocked     = errors.New("tài khoản đã bị khóa")
	ErrUserNotFound       = errors.New("không tìm thấy tài khoản")
)

// AuthService xử lý nghiệp vụ đăng ký, đăng nhập
type AuthService struct {
	DB             *gorm.DB
	JWTSecret      string
	JWTExpireHours int
}

// Register tạo tài khoản khách hàng mới
func (s *AuthService) Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	// Kiểm tra trùng email (Unscoped: tính cả tài khoản đã xóa mềm)
	var count int64
	if err := s.DB.Unscoped().Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrEmailExists
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		FullName:     strings.TrimSpace(req.FullName),
		Email:        email,
		PasswordHash: hash,
		Role:         "customer", // đăng ký công khai luôn là khách hàng
		Status:       "active",
	}
	if req.Phone != "" {
		phone := req.Phone
		user.Phone = &phone
	}

	if err := s.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	return s.buildAuthResponse(&user)
}

// Login kiểm tra email + mật khẩu và trả về token
func (s *AuthService) Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		return nil, ErrInvalidCredentials
	}
	if user.Status != "active" {
		return nil, ErrAccountBlocked
	}

	return s.buildAuthResponse(&user)
}

// GetUser lấy thông tin tài khoản theo id
func (s *AuthService) GetUser(id uint64) (*models.User, error) {
	var user models.User
	if err := s.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) buildAuthResponse(user *models.User) (*dto.AuthResponse, error) {
	token, err := utils.GenerateToken(user.ID, user.Role, s.JWTSecret, s.JWTExpireHours)
	if err != nil {
		return nil, err
	}
	return &dto.AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   s.JWTExpireHours * 3600,
		User:        user,
	}, nil
}
