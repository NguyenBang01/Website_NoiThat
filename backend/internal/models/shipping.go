package models

import "time"

// ShippingSetting lưu cấu hình vận chuyển tổng thể của cửa hàng
type ShippingSetting struct {
	ID                         uint64    `gorm:"primaryKey" json:"id"`
	WarehouseName              string    `gorm:"type:varchar(255);default:'Kho hàng chính - Góc Nhà Đẹp'" json:"warehouse_name"`
	WarehouseAddress           string    `gorm:"type:varchar(500);default:'123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'" json:"warehouse_address"`
	WarehouseLat               float64   `gorm:"type:decimal(10,8);default:10.776900" json:"warehouse_lat"`
	WarehouseLng               float64   `gorm:"type:decimal(11,8);default:106.700900" json:"warehouse_lng"`
	MaxDistanceKM              float64   `gorm:"type:decimal(8,2);default:50.0" json:"max_distance_km"` // Khoảng cách giao hàng tối đa (km)
	MinShippingFee             int64     `gorm:"default:30000" json:"min_shipping_fee"`                 // Phí vận chuyển tối thiểu
	FreeShippingThreshold      int64     `gorm:"default:5000000" json:"free_shipping_threshold"`       // Đơn từ mức này được freeship (VNĐ)
	FreeShippingMaxDistanceKM  float64   `gorm:"type:decimal(8,2);default:15.0" json:"free_shipping_max_distance_km"` // Bán kính tối đa áp dụng freeship (0 = không giới hạn km)
	EnableBulkySurcharge       bool      `gorm:"default:true" json:"enable_bulky_surcharge"`            // Bật phụ phí hàng cồng kềnh
	BulkySurchargeFee          int64     `gorm:"default:80000" json:"bulky_surcharge_fee"`              // Phụ phí hàng cồng kềnh (VNĐ / đơn hoặc món)
	BulkyWeightThreshold       float64   `gorm:"type:decimal(8,2);default:25.0" json:"bulky_weight_threshold"` // Ngưỡng cân nặng coi là cồng kềnh (kg)
	EnableFloorSurcharge       bool      `gorm:"default:true" json:"enable_floor_surcharge"`            // Bật phụ phí khiêng lên lầu/tầng
	FloorSurchargePerFloor     int64     `gorm:"default:30000" json:"floor_surcharge_per_floor"`        // Phụ phí mỗi tầng khiêng bộ (VNĐ/tầng)
	EnableAssemblyFee          bool      `gorm:"default:true" json:"enable_assembly_fee"`               // Bật phí lắp đặt hoàn thiện tại nhà
	AssemblyFee                int64     `gorm:"default:50000" json:"assembly_fee"`                     // Phí lắp đặt (VNĐ)
	FallbackMultiplier         float64   `gorm:"type:decimal(4,2);default:1.30" json:"fallback_multiplier"` // Hệ số nhân khoảng cách Haversine khi OSRM lỗi
	UpdatedAt                  time.Time `json:"updated_at"`
}

func (ShippingSetting) TableName() string {
	return "shipping_settings"
}

// ShippingTier lưu các bậc thang tính phí vận chuyển theo khoảng cách
type ShippingTier struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	FromKM     float64   `gorm:"type:decimal(8,2);not null" json:"from_km"`     // Từ khoảng cách (km)
	ToKM       float64   `gorm:"type:decimal(8,2);not null" json:"to_km"`       // Đến khoảng cách (km)
	BaseFee    int64     `gorm:"not null" json:"base_fee"`                      // Phí cố định của bậc (VNĐ)
	PricePerKM int64     `gorm:"default:0" json:"price_per_km"`                 // Đơn giá mỗi km cho phần vượt quá FromKM (VNĐ/km)
	SortOrder  int       `gorm:"default:0" json:"sort_order"`                   // Thứ tự sắp xếp
	IsActive   bool      `gorm:"default:true" json:"is_active"`                 // Trạng thái kích hoạt
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (ShippingTier) TableName() string {
	return "shipping_tiers"
}
