package database

import (
	"testing"

	"furniture-shop/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestDatabaseIndexesMigration(t *testing.T) {
	dsn := "root:@tcp(127.0.0.1:3306)/furniture_shop?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("Bỏ qua test migration index do không kết nối được MySQL local: %v", err)
	}

	if err := db.AutoMigrate(
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.Notification{},
	); err != nil {
		t.Fatalf("AutoMigrate thất bại khi tạo index: %v", err)
	}

	m := db.Migrator()
	expectedIndexes := []struct {
		model interface{}
		name  string
	}{
		{&models.Product{}, "idx_prod_cat_status"},
		{&models.Product{}, "idx_prod_featured"},
		{&models.Order{}, "idx_orders_order_code"},
		{&models.Order{}, "idx_orders_order_number"},
		{&models.Order{}, "idx_orders_status_created"},
		{&models.Notification{}, "idx_notif_user_read_created"},
		{&models.Notification{}, "idx_notif_role_read_created"},
	}

	for _, exp := range expectedIndexes {
		if !m.HasIndex(exp.model, exp.name) {
			t.Errorf("Thiếu index %s trên model %T sau khi AutoMigrate", exp.name, exp.model)
		}
	}
}

