package database

import (
	"fmt"
	"log"
	"time"

	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Connect mở kết nối tới MySQL bằng GORM và kiểm tra kết nối
func Connect(dsn string) (*gorm.DB, error) {
	// 1. Tự động tạo database nếu chưa có
	ensureDatabaseExists(dsn)

	// 2. Kết nối tới database chính
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Cấu hình connection pool
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	// Ping để chắc chắn kết nối được
	if err := sqlDB.Ping(); err != nil {
		return nil, err
	}

	// 3. Tự động migrate các bảng (nếu gặp cảnh báo recovery thì không sập server nếu bảng đã có)
	if err := AutoMigrate(db); err != nil {
		log.Printf("[CẢNH BÁO] AutoMigrate cảnh báo: %v. Tiếp tục chạy với các bảng hiện có...", err)
	}

	// 4. Tự động kiểm tra và tạo tài khoản Admin mặc định nếu chưa có
	ensureDefaultAdmin(db)

	// 5. Tự động gộp danh mục 'Tủ' và 'Kệ' thành 'Tủ & Kệ', chuyển sản phẩm và xóa danh mục 'Kệ'
	ensureMergedTuKeCategory(db)

	return db, nil
}

// ensureDatabaseExists tự động kết nối MySQL và tạo database nếu chưa tồn tại
func ensureDatabaseExists(dsn string) {
	cfg, err := mysqlDriver.ParseDSN(dsn)
	if err != nil || cfg.DBName == "" {
		return
	}
	dbName := cfg.DBName
	cfg.DBName = "" // kết nối MySQL server mà không chỉ định tên DB

	tempDB, err := gorm.Open(mysql.Open(cfg.FormatDSN()), &gorm.Config{})
	if err != nil {
		return
	}
	rawSQL, err := tempDB.DB()
	if err != nil {
		return
	}
	defer rawSQL.Close()

	_ = tempDB.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", dbName)).Error
}

// ensureDefaultAdmin tự động tạo tài khoản admin@noithat.com / Admin@123 nếu database chưa có admin
func ensureDefaultAdmin(db *gorm.DB) {
	var count int64
	if err := db.Model(&models.User{}).Where("role = ?", "admin").Count(&count).Error; err != nil {
		return
	}
	if count == 0 {
		hash, err := utils.HashPassword("Admin@123")
		if err != nil {
			return
		}
		admin := models.User{
			FullName:     "Quản trị viên",
			Email:        "admin@noithat.com",
			PasswordHash: hash,
			Role:         "admin",
			Status:       "active",
		}
		if err := db.Create(&admin).Error; err == nil {
			log.Println("[INFO] Đã tự động tạo tài khoản Admin mặc định: admin@noithat.com / Admin@123")
		}
	}
}

// ensureMergedTuKeCategory tự động chuyển sản phẩm từ "Kệ" sang "Tủ & Kệ", cập nhật tên "Tủ & Kệ" và xóa "Kệ"
func ensureMergedTuKeCategory(db *gorm.DB) {
	var keCat models.Category
	// Tìm danh mục "Kệ" (hoặc slug = "ke")
	errKe := db.Where("(name = ? OR slug = ?) AND deleted_at IS NULL", "Kệ", "ke").First(&keCat).Error

	var tuCat models.Category
	// Tìm danh mục "Tủ" hoặc "Tủ & Kệ"
	errTu := db.Where("(name LIKE ? OR slug = ? OR slug = ?) AND deleted_at IS NULL", "%Tủ%", "tu", "tu-ke").Order("id ASC").First(&tuCat).Error

	if errKe == nil {
		if errTu == nil && tuCat.ID != keCat.ID {
			// Chuyển toàn bộ sản phẩm đang thuộc danh mục "Kệ" sang danh mục "Tủ"
			db.Model(&models.Product{}).Where("category_id = ?", keCat.ID).Update("category_id", tuCat.ID)

			// Cập nhật danh mục Tủ thành "Tủ & Kệ", slug = "tu-ke"
			db.Model(&tuCat).Updates(map[string]interface{}{
				"name": "Tủ & Kệ",
				"slug": "tu-ke",
			})

			// Xóa danh mục Kệ riêng biệt (xóa vĩnh viễn khỏi DB)
			db.Unscoped().Delete(&keCat)
			log.Printf("[INFO] Đã gộp thành công sản phẩm từ danh mục 'Kệ' (ID: %d) sang 'Tủ & Kệ' (ID: %d) và xóa danh mục 'Kệ' riêng.", keCat.ID, tuCat.ID)
		} else if errTu != nil {
			// Chỉ có Kệ, đổi tên thành "Tủ & Kệ"
			db.Model(&keCat).Updates(map[string]interface{}{
				"name": "Tủ & Kệ",
				"slug": "tu-ke",
			})
			log.Println("[INFO] Đã đổi tên danh mục 'Kệ' thành 'Tủ & Kệ'.")
		}
	} else if errTu == nil {
		// Đảm bảo tên là "Tủ & Kệ"
		if tuCat.Name != "Tủ & Kệ" {
			db.Model(&tuCat).Updates(map[string]interface{}{
				"name": "Tủ & Kệ",
				"slug": "tu-ke",
			})
			log.Println("[INFO] Đã cập nhật tên danh mục 'Tủ' thành 'Tủ & Kệ'.")
		}
	}
}

// AutoMigrate đồng bộ tất cả các bảng vào database
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Brand{},
		&models.Product{},
		&models.ProductVariant{},
		&models.ProductImage{},
		&models.Cart{},
		&models.CartItem{},
		&models.Coupon{},
		&models.Order{},
		&models.OrderItem{},
		&models.OrderStatusLog{},
		&models.Address{},
		&models.Review{},
		&models.WishlistItem{},
		&models.Banner{},
		&models.Setting{},
		&models.Contact{},
		&models.PasswordReset{},
	)
}
