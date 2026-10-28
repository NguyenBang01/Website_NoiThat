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
	TelegramBotToken string // Token của Telegram Bot thông báo cho chủ shop
	TelegramChatID   string // Chat ID nhận thông báo Telegram của chủ shop
	StorefrontURL    string // Đường dẫn web người dùng (mặc định http://localhost:4321)
	BackendURL       string // Đường dẫn backend công khai để hiển thị ảnh trên email (ngrok hoặc domain)
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
		MaxUploadMB:    getEnvInt("MAX_UPLOAD_MB", 50),
		SMTPHost:       getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:       getEnvInt("SMTP_PORT", 587),
		SMTPUsername:   getEnv("SMTP_USERNAME", ""),
		SMTPPassword:   getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail:  getEnv("SMTP_FROM_EMAIL", ""),
		SMTPFromName:   getEnv("SMTP_FROM_NAME", "Nội Thất Góc Nhà Đẹp"),
		SepayAPIKey:    getEnv("SEPAY_API_KEY", ""),
		GoogleClientID: getEnv("GOOGLE_CLIENT_ID", "169312903386-cslsqt049mv7gbkjb11kaq7kbj3agb0r.apps.googleusercontent.com"),
		TelegramBotToken: getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramChatID:   getEnv("TELEGRAM_CHAT_ID", ""),
		StorefrontURL:    getEnv("STOREFRONT_URL", "http://localhost:4321"),
		BackendURL:       getEnv("BACKEND_URL", "https://shrug-guidance-captive.ngrok-free.dev"),
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
