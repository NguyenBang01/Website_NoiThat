package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config chứa các cài đặt đọc từ file .env
type Config struct {
	Port           string
	GinMode        string
	DBDSN          string
	JWTSecret      string
	JWTExpireHours int
	UploadDir      string // thư mục lưu ảnh upload
	MaxUploadMB    int    // dung lượng tối đa mỗi ảnh (MB)
	SMTPHost       string
	SMTPPort       int
	SMTPUsername   string
	SMTPPassword   string
	SMTPFromEmail  string
	SMTPFromName   string
	SepayAPIKey    string // API key / Webhook token của SePay (nếu có cấu hình)
	GoogleClientID string // Google OAuth2 Client ID dùng để xác thực Google Sign-In
}

// Load đọc file .env (nếu có) rồi trả về cấu hình
func Load() *Config {
	_ = godotenv.Load() // nếu không có file .env thì dùng biến môi trường hệ thống

	return &Config{
		Port:           getEnv("PORT", "8080"),
		GinMode:        getEnv("GIN_MODE", "debug"),
		DBDSN:          getEnv("DB_DSN", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		JWTExpireHours: getEnvInt("JWT_EXPIRE_HOURS", 24),
		UploadDir:      getEnv("UPLOAD_DIR", "uploads"),
		MaxUploadMB:    getEnvInt("MAX_UPLOAD_MB", 5),
		SMTPHost:       getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:       getEnvInt("SMTP_PORT", 587),
		SMTPUsername:   getEnv("SMTP_USERNAME", ""),
		SMTPPassword:   getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail:  getEnv("SMTP_FROM_EMAIL", ""),
		SMTPFromName:   getEnv("SMTP_FROM_NAME", "Nội Thất Góc Nhà Đẹp"),
		SepayAPIKey:    getEnv("SEPAY_API_KEY", ""),
		GoogleClientID: getEnv("GOOGLE_CLIENT_ID", "169312903386-cslsqt049mv7gbkjb11kaq7kbj3agb0r.apps.googleusercontent.com"),
	}
}

func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultValue
}
