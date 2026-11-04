package database

import (
	"log"

	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

// SeedShipping khởi tạo cấu hình kho hàng và các bậc thang vận chuyển mẫu
func SeedShipping(db *gorm.DB) error {
	// 1. Kiểm tra cấu hình cài đặt vận chuyển
	var countSettings int64
	if err := db.Model(&models.ShippingSetting{}).Count(&countSettings).Error; err != nil {
		return err
	}

	if countSettings == 0 {
		defaultSetting := models.ShippingSetting{
			WarehouseName:             "Kho hàng trung tâm - Nội Thất Góc Nhà Đẹp",
			WarehouseAddress:          "123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
			WarehouseLat:              10.776900,
			WarehouseLng:              106.700900,
			MaxDistanceKM:             50.0,
			MinShippingFee:            30000,
			FreeShippingThreshold:     5000000, // Đơn >= 5 triệu miễn phí ship
			FreeShippingMaxDistanceKM: 15.0,    // Áp dụng freeship trong bán kính 15km
			EnableBulkySurcharge:      true,
			BulkySurchargeFee:         80000,
			BulkyWeightThreshold:      25.0,
			EnableFloorSurcharge:      true,
			FloorSurchargePerFloor:     30000,
			EnableAssemblyFee:         true,
			AssemblyFee:               50000,
			FallbackMultiplier:        1.30,
		}
		if err := db.Create(&defaultSetting).Error; err != nil {
			log.Printf("[LỖI] Không thể tạo cài đặt vận chuyển mặc định: %v", err)
		} else {
			log.Println("[INFO] Đã khởi tạo cấu hình vận chuyển mặc định thành công")
		}
	}

	// 2. Kiểm tra các bậc thang vận chuyển mẫu
	var countTiers int64
	if err := db.Model(&models.ShippingTier{}).Count(&countTiers).Error; err != nil {
		return err
	}

	if countTiers == 0 {
		sampleTiers := []models.ShippingTier{
			{
				FromKM:     0.0,
				ToKM:       3.0,
				BaseFee:    50000,
				PricePerKM: 0,
				SortOrder:  1,
				IsActive:   true,
			},
			{
				FromKM:     3.0,
				ToKM:       10.0,
				BaseFee:    50000,
				PricePerKM: 10000,
				SortOrder:  2,
				IsActive:   true,
			},
			{
				FromKM:     10.0,
				ToKM:       30.0,
				BaseFee:    120000,
				PricePerKM: 8000,
				SortOrder:  3,
				IsActive:   true,
			},
			{
				FromKM:     30.0,
				ToKM:       50.0,
				BaseFee:    280000,
				PricePerKM: 6000,
				SortOrder:  4,
				IsActive:   true,
			},
		}

		if err := db.Create(&sampleTiers).Error; err != nil {
			log.Printf("[LỖI] Không thể tạo các bậc thang vận chuyển mẫu: %v", err)
		} else {
			log.Printf("[INFO] Đã khởi tạo %d bậc thang tính phí vận chuyển mẫu", len(sampleTiers))
		}
	}

	return nil
}
