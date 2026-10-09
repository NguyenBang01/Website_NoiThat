package database

import (
	"time"

	"furniture-shop/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Connect mở kết nối tới MySQL bằng GORM và kiểm tra kết nối
func Connect(dsn string) (*gorm.DB, error) {
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

	// Tự động migrate các bảng
	if err := AutoMigrate(db); err != nil {
		return nil, err
	}

	return db, nil
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
	)
}
