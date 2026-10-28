package services

import (
	cryptoRand "crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	mathRand "math/rand"
	"net/http"
	"net/url"
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

// GoogleTokenInfo chứa các trường trả về từ Google tokeninfo endpoint
type GoogleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
	Error         string `json:"error"`
	ErrorDesc     string `json:"error_description"`
}

// AuthService xử lý nghiệp vụ đăng ký, đăng nhập và khôi phục mật khẩu
type AuthService struct {
	DB             *gorm.DB
	JWTSecret      string
	JWTExpireHours int
	MailService    *MailService
	GoogleClientID string
}

// Register tạo tài khoản khách hàng mới
func (s *AuthService) Register(req dto.RegisterRequest, clientIP, userAgent string) (*dto.AuthResponse, error) {
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

	res, err := s.buildAuthResponse(&user)
	if err == nil {
		s.RecordLoginAndNotify(&user, clientIP, userAgent)
	}
	return res, err
}

// Login kiểm tra email + mật khẩu và trả về token
func (s *AuthService) Login(req dto.LoginRequest, clientIP, userAgent string) (*dto.AuthResponse, error) {
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

	res, err := s.buildAuthResponse(&user)
	if err == nil {
		s.RecordLoginAndNotify(&user, clientIP, userAgent)
	}
	return res, err
}

// GoogleAuth xử lý đăng nhập hoặc đăng ký tự động cho người dùng thông qua Google ID Token
func (s *AuthService) GoogleAuth(idToken string, clientIP, userAgent string) (*dto.AuthResponse, error) {
	idToken = strings.TrimSpace(idToken)
	if idToken == "" {
		return nil, errors.New("Google ID token không được để trống")
	}

	// 1. Gọi Google tokeninfo API để xác thực chữ ký và lấy thông tin người dùng
	verifyURL := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(verifyURL)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối đến máy chủ xác thực của Google: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("Google ID Token không hợp lệ hoặc đã hết hạn")
	}

	var info GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, errors.New("không thể phân tích dữ liệu phản hồi từ Google")
	}

	if info.Email == "" {
		return nil, errors.New("không tìm thấy thông tin email từ tài khoản Google")
	}
	if info.EmailVerified != "true" && info.EmailVerified != "1" {
		return nil, errors.New("email tài khoản Google này chưa được xác minh")
	}

	// Nếu hệ thống có cấu hình GoogleClientID thì kiểm tra aud khớp với Client ID
	if s.GoogleClientID != "" && info.Aud != s.GoogleClientID {
		return nil, errors.New("Google Client ID không khớp với cấu hình hệ thống")
	}

	email := strings.ToLower(strings.TrimSpace(info.Email))

	// 2. Tìm người dùng theo email trong Database
	var user models.User
	err = s.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// ĐĂNG KÝ MỚI BẰNG GOOGLE TỰ ĐỘNG
			// Tạo mật khẩu ngẫu nhiên bảo mật
			randomBytes := make([]byte, 16)
			_, _ = cryptoRand.Read(randomBytes)
			randomPass := hex.EncodeToString(randomBytes)
			pwdHash, err := utils.HashPassword(randomPass)
			if err != nil {
				return nil, fmt.Errorf("lỗi khởi tạo mật khẩu: %w", err)
			}

			fullName := strings.TrimSpace(info.Name)
			if fullName == "" {
				fullName = strings.Split(email, "@")[0]
			}

			user = models.User{
				FullName:     fullName,
				Email:        email,
				PasswordHash: pwdHash,
				Role:         "customer",
				Status:       "active",
				GoogleID:     &info.Sub,
			}
			if info.Picture != "" {
				user.AvatarURL = &info.Picture
			}

			if err := s.DB.Create(&user).Error; err != nil {
				return nil, fmt.Errorf("không thể tạo tài khoản từ Google: %w", err)
			}
		} else {
			return nil, err
		}
	} else {
		// ĐĂNG NHẬP VỚI TÀI KHOẢN ĐÃ TỒN TẠI
		if user.Status != "active" {
			return nil, ErrAccountBlocked
		}

		// Cập nhật GoogleID hoặc AvatarURL nếu tài khoản chưa có
		updates := map[string]interface{}{}
		if user.GoogleID == nil || *user.GoogleID == "" {
			updates["google_id"] = info.Sub
		}
		if (user.AvatarURL == nil || *user.AvatarURL == "") && info.Picture != "" {
			updates["avatar_url"] = info.Picture
		}
		if len(updates) > 0 {
			s.DB.Model(&user).Updates(updates)
		}
	}

	// 3. Tạo JWT access token và trả về AuthResponse
	res, err := s.buildAuthResponse(&user)
	if err == nil {
		s.RecordLoginAndNotify(&user, clientIP, userAgent)
	}
	return res, err
}

// ParseUserAgent phân tích chuỗi User-Agent thành tên thiết bị và trình duyệt dễ hiểu
func ParseUserAgent(ua string) string {
	if ua == "" {
		return "Trình duyệt Web tiêu chuẩn"
	}

	browser := "Trình duyệt Web"
	switch {
	case strings.Contains(ua, "Edg/"):
		browser = "Microsoft Edge"
	case strings.Contains(ua, "Chrome/") && !strings.Contains(ua, "Edg/"):
		browser = "Google Chrome"
	case strings.Contains(ua, "Safari/") && !strings.Contains(ua, "Chrome/"):
		browser = "Apple Safari"
	case strings.Contains(ua, "Firefox/"):
		browser = "Mozilla Firefox"
	case strings.Contains(ua, "OPR/") || strings.Contains(ua, "Opera/"):
		browser = "Opera"
	}

	osStr := "Thiết bị không xác định"
	switch {
	case strings.Contains(ua, "Windows"):
		osStr = "Windows PC"
	case strings.Contains(ua, "iPhone"):
		osStr = "Apple iPhone"
	case strings.Contains(ua, "iPad"):
		osStr = "Apple iPad"
	case strings.Contains(ua, "Macintosh") || strings.Contains(ua, "Mac OS"):
		osStr = "Apple Mac"
	case strings.Contains(ua, "Android"):
		osStr = "Thiết bị Android"
	case strings.Contains(ua, "Linux"):
		osStr = "Hệ điều hành Linux"
	}

	return fmt.Sprintf("%s trên %s", browser, osStr)
}

// RecordLoginAndNotify lưu vết đăng nhập và gửi email cảnh báo nếu phát hiện thiết bị/IP mới hoặc lần đầu đăng nhập
func (s *AuthService) RecordLoginAndNotify(user *models.User, ip, userAgent string) {
	if user == nil || s.DB == nil {
		return
	}

	if ip == "" {
		ip = "127.0.0.1"
	}
	if userAgent == "" {
		userAgent = "Unknown"
	}

	deviceInfo := ParseUserAgent(userAgent)
	locationStr := "Việt Nam (Ước tính theo mạng)"
	if ip == "127.0.0.1" || ip == "::1" {
		locationStr = "Nội bộ máy chủ (Localhost)"
	}

	// Chạy bất đồng bộ trong goroutine để không bao giờ làm chậm luồng chính
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[LOGIN LOG PANIC] Phục hồi từ lỗi: %v", r)
			}
		}()

		// 1. Kiểm tra xem người dùng đã từng có bản ghi đăng nhập nào chưa
		var totalLogs int64
		_ = s.DB.Model(&models.LoginLog{}).Where("user_id = ?", user.ID).Count(&totalLogs).Error
		isFirstLogin := (totalLogs == 0)

		// 2. Kiểm tra xem thiết bị (IP + UserAgent) này đã từng đăng nhập trước đây chưa
		shouldSendEmail := false
		if isFirstLogin {
			shouldSendEmail = true
		} else {
			var matchCount int64
			_ = s.DB.Model(&models.LoginLog{}).
				Where("user_id = ? AND ip = ? AND user_agent = ?", user.ID, ip, userAgent).
				Count(&matchCount).Error

			// Nếu chưa từng xuất hiện (IP mới hoặc UserAgent mới) thì cảnh báo bảo mật
			if matchCount == 0 {
				shouldSendEmail = true
			}
		}

		// 3. Lưu bản ghi đăng nhập vào bảng login_logs
		now := time.Now()
		loginRecord := models.LoginLog{
			UserID:    user.ID,
			IP:        ip,
			UserAgent: userAgent,
			Device:    deviceInfo,
			Location:  locationStr,
			CreatedAt: now,
		}
		if err := s.DB.Create(&loginRecord).Error; err != nil {
			log.Printf("[LOGIN LOG ERROR] Lỗi lưu lịch sử đăng nhập: %v", err)
		}

		// 4. Gửi email nếu là lần đầu hoặc thiết bị/IP mới
		if shouldSendEmail && s.MailService != nil && user.Email != "" {
			s.MailService.SendLoginAlert(user.Email, user.FullName, ip, deviceInfo, locationStr, now, isFirstLogin)
		}
	}()
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
	r := mathRand.New(mathRand.NewSource(time.Now().UnixNano()))
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
