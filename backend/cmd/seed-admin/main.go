// Công cụ tạo tài khoản admin.
// Cách chạy:  go run ./cmd/seed-admin
// Hoặc tự đặt thông tin:
//   go run ./cmd/seed-admin -email=ban@gmail.com -password=MatKhau123 -name="Nguyen Van A"
package main

import (
	"errors"
	"flag"
	"log"
	"strings"

	"furniture-shop/backend/internal/config"
	"furniture-shop/backend/internal/database"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"gorm.io/gorm"
)

func main() {
	email := flag.String("email", "admin@noithat.com", "Email đăng nhập của admin")
	password := flag.String("password", "Admin@123", "Mật khẩu của admin")
	name := flag.String("name", "Quản trị viên", "Họ tên admin")
	flag.Parse()

	cfg := config.Load()
	db, err := database.Connect(cfg.DBDSN)
	if err != nil {
		log.Fatalf("Không kết nối được MySQL: %v", err)
	}

	mail := strings.ToLower(strings.TrimSpace(*email))
	hash, err := utils.HashPassword(*password)
	if err != nil {
		log.Fatalf("Lỗi mã hóa mật khẩu: %v", err)
	}

	var user models.User
	err = db.Unscoped().Where("email = ?", mail).First(&user).Error

	if err == nil {
		// Email đã tồn tại -> nâng lên admin và đặt lại mật khẩu
		db.Unscoped().Model(&user).Updates(map[string]interface{}{
			"full_name":     *name,
			"password_hash": hash,
			"role":          "admin",
			"status":        "active",
			"deleted_at":    nil,
		})
		log.Printf("Đã CẬP NHẬT tài khoản admin: %s", mail)
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatalf("Lỗi truy vấn: %v", err)
	}

	admin := models.User{
		FullName:     *name,
		Email:        mail,
		PasswordHash: hash,
		Role:         "admin",
		Status:       "active",
	}
	if err := db.Create(&admin).Error; err != nil {
		log.Fatalf("Không tạo được admin: %v", err)
	}
	log.Printf("Đã TẠO tài khoản admin: %s", mail)
}
