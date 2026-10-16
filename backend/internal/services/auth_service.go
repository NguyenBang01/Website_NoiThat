package services

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

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
	ErrInvalidOTP         = errors.New("mã OTP không chính xác hoặc đã hết hạn (10 phút)")
)

// AuthService xử lý nghiệp vụ đăng ký, đăng nhập và khôi phục mật khẩu
type AuthService struct {
	DB             *gorm.DB
	JWTSecret      string
	JWTExpireHours int
	MailService    *MailService
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

// ForgotPassword tạo mã OTP 6 số và gửi qua email cho khách hàng
func (s *AuthService) ForgotPassword(req dto.ForgotPasswordRequest) error {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("không tìm thấy tài khoản với email này")
		}
		return err
	}

	if user.Status != "active" {
		return ErrAccountBlocked
	}

	// Đánh dấu hết hạn toàn bộ các mã OTP cũ chưa dùng của email này
	s.DB.Model(&models.PasswordReset{}).Where("email = ? AND is_used = false", email).Update("is_used", true)

	// Sinh mã OTP 6 số ngẫu nhiên
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	otp := fmt.Sprintf("%06d", r.Intn(900000)+100000)

	resetRecord := models.PasswordReset{
		Email:     email,
		OTP:       otp,
		ExpiresAt: time.Now().Add(10 * time.Minute), // Hạn 10 phút
		IsUsed:    false,
	}

	if err := s.DB.Create(&resetRecord).Error; err != nil {
		return fmt.Errorf("lỗi tạo mã xác thực: %w", err)
	}

	// Gửi email chứa mã OTP
	if s.MailService != nil {
		s.MailService.SendPasswordResetOTP(email, user.FullName, otp)
	}

	return nil
}

// ResetPassword kiểm tra mã OTP và cập nhật mật khẩu mới
func (s *AuthService) ResetPassword(req dto.ResetPasswordRequest) error {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	otp := strings.TrimSpace(req.OTP)

	var resetRecord models.PasswordReset
	now := time.Now()
	err := s.DB.Where("email = ? AND otp = ? AND is_used = false AND expires_at > ?", email, otp, now).
		Order("id desc").First(&resetRecord).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidOTP
		}
		return err
	}

	var user models.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return ErrUserNotFound
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// Cập nhật mật khẩu mới cho tài khoản
	if err := s.DB.Model(&user).Update("password_hash", newHash).Error; err != nil {
		return fmt.Errorf("lỗi cập nhật mật khẩu: %w", err)
	}

	// Đánh dấu mã OTP đã được sử dụng thành công
	s.DB.Model(&resetRecord).Update("is_used", true)

	return nil
}
