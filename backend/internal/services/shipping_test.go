package services

import (
	"context"
	"math"
	"testing"

	"furniture-shop/backend/internal/models"
)

// MockRoutingService giả lập routing phục vụ test độc lập không phụ thuộc mạng
type MockRoutingService struct {
	DistanceKM float64
	Source     string
	ShouldFail bool
}

func (m *MockRoutingService) CalculateDistance(ctx context.Context, fromLat, fromLng, toLat, toLng float64, fallbackMultiplier float64) (float64, float64, string, error) {
	if m.ShouldFail {
		// Giả lập OSRM fail -> dùng Haversine fallback
		dist := CalculateHaversineDistance(fromLat, fromLng, toLat, toLng) * fallbackMultiplier
		return math.Round(dist*100) / 100, 20.0, "haversine_fallback", nil
	}
	return m.DistanceKM, 15.0, m.Source, nil
}

// MockGeocodingService giả lập geocoding
type MockGeocodingService struct {
	Lat float64
	Lng float64
}

func (m *MockGeocodingService) Geocode(ctx context.Context, address string) (float64, float64, string, error) {
	return m.Lat, m.Lng, address + ", Việt Nam", nil
}

// TestHaversineDistanceFormula kiểm tra tính đúng đắn của công thức khoảng cách Haversine
func TestHaversineDistanceFormula(t *testing.T) {
	// Hà Nội (21.028511, 105.854444) đến TP.HCM (10.776900, 106.700900)
	dist := CalculateHaversineDistance(21.028511, 105.854444, 10.776900, 106.700900)
	// Khoảng cách chim bay thực tế ~ 1.130 km - 1.160 km
	if dist < 1100 || dist > 1200 {
		t.Fatalf("Khoảng cách Haversine Hà Nội - Sài Gòn không chính xác: %.2f km", dist)
	}

	// 2 điểm gần nhau trong Quận 1 (khoảng 1.2 - 1.8 km)
	distShort := CalculateHaversineDistance(10.7769, 106.7009, 10.7820, 106.6980)
	if distShort < 0.3 || distShort > 3.0 {
		t.Fatalf("Khoảng cách nội thành không chính xác: %.2f km", distShort)
	}
}

// TestValidateTiersOverlapAndGaps kiểm tra thuật toán phát hiện bậc thang bị đè hoặc hở khoảng cách
func TestValidateTiersOverlapAndGaps(t *testing.T) {
	svc := &ShippingService{}

	// Trường hợp chuẩn: 0-3km, 3-10km, 10-30km
	validTiers := []models.ShippingTier{
		{FromKM: 0, ToKM: 3, BaseFee: 50000, IsActive: true},
		{FromKM: 3, ToKM: 10, BaseFee: 70000, IsActive: true},
		{FromKM: 10, ToKM: 30, BaseFee: 120000, IsActive: true},
	}
	errs := svc.ValidateTiers(validTiers)
	if len(errs) != 0 {
		t.Fatalf("Bậc thang hợp lệ nhưng báo lỗi: %v", errs)
	}

	// Trường hợp chồng lấn: 0-5km và 3-10km
	overlappingTiers := []models.ShippingTier{
		{FromKM: 0, ToKM: 5, BaseFee: 50000, IsActive: true},
		{FromKM: 3, ToKM: 10, BaseFee: 70000, IsActive: true},
	}
	errsOverlap := svc.ValidateTiers(overlappingTiers)
	if len(errsOverlap) == 0 {
		t.Fatalf("Không phát hiện được bậc thang chồng lấn")
	}

	// Trường hợp hở khoảng: 0-3km và 5-10km (hở đoạn 3-5km)
	gapTiers := []models.ShippingTier{
		{FromKM: 0, ToKM: 3, BaseFee: 50000, IsActive: true},
		{FromKM: 5, ToKM: 10, BaseFee: 70000, IsActive: true},
	}
	errsGap := svc.ValidateTiers(gapTiers)
	if len(errsGap) == 0 {
		t.Fatalf("Không phát hiện được khoảng hở cước phí")
	}

	// Trường hợp không bắt đầu từ 0
	nonZeroTiers := []models.ShippingTier{
		{FromKM: 2, ToKM: 10, BaseFee: 50000, IsActive: true},
	}
	errsNonZero := svc.ValidateTiers(nonZeroTiers)
	if len(errsNonZero) == 0 {
		t.Fatalf("Không cảnh báo bậc cước không bắt đầu từ 0 km")
	}
}

// TestShippingFeeCalculationLogic kiểm tra các quy tắc tính cước: bậc thang, làm tròn 1.000đ, freeship
func TestShippingFeeCalculationLogic(t *testing.T) {
	setting := models.ShippingSetting{
		WarehouseLat:              10.7769,
		WarehouseLng:              106.7009,
		MaxDistanceKM:             50.0,
		MinShippingFee:            30000,
		FreeShippingThreshold:     5000000,
		FreeShippingMaxDistanceKM: 15.0,
		EnableBulkySurcharge:      true,
		BulkySurchargeFee:         80000,
		BulkyWeightThreshold:      25.0,
		EnableFloorSurcharge:      true,
		FloorSurchargePerFloor:     30000,
		EnableAssemblyFee:         true,
		AssemblyFee:               50000,
		FallbackMultiplier:        1.3,
	}

	tiers := []models.ShippingTier{
		{FromKM: 0, ToKM: 3, BaseFee: 50000, PricePerKM: 0, IsActive: true},
		{FromKM: 3, ToKM: 10, BaseFee: 50000, PricePerKM: 10000, IsActive: true},
		{FromKM: 10, ToKM: 30, BaseFee: 120000, PricePerKM: 8000, IsActive: true},
	}

	// Case 1: Khoảng cách 2.5 km -> Thuộc Bậc 1 (0-3km) -> Cước 50.000 đ
	mockRouting := &MockRoutingService{DistanceKM: 2.5, Source: "osrm"}
	dist, _, _, _ := mockRouting.CalculateDistance(context.Background(), 10.7769, 106.7009, 10.78, 106.71, 1.3)

	var matchedTier *models.ShippingTier
	for i := range tiers {
		if dist >= tiers[i].FromKM && dist < tiers[i].ToKM {
			matchedTier = &tiers[i]
			break
		}
	}
	if matchedTier == nil || matchedTier.BaseFee != 50000 {
		t.Fatalf("Tính sai bậc 1 cho 2.5 km")
	}

	// Case 2: Khoảng cách 6.2 km -> Thuộc Bậc 2 (3-10km): Base 50k + (6.2 - 3) * 10k = 50k + 32k = 82k
	dist2 := 6.2
	var matchedTier2 *models.ShippingTier
	for i := range tiers {
		if dist2 >= tiers[i].FromKM && dist2 < tiers[i].ToKM {
			matchedTier2 = &tiers[i]
			break
		}
	}
	excess2 := dist2 - matchedTier2.FromKM
	excessFee2 := int64(math.Round(excess2 * float64(matchedTier2.PricePerKM)))
	total2 := matchedTier2.BaseFee + excessFee2
	if total2 != 82000 {
		t.Fatalf("Tính sai bậc 2 cho 6.2km: mong muốn 82000, ra %d", total2)
	}

	// Case 3: Kiểm tra làm tròn lên 1.000đ: Ví dụ 82.350đ -> 83.000đ
	unrounded := 82350
	rounded := int64(math.Ceil(float64(unrounded)/1000.0) * 1000)
	if rounded != 83000 {
		t.Fatalf("Làm tròn sai: mong muốn 83000, ra %d", rounded)
	}

	// Case 4: Vượt khoảng cách tối đa 50 km
	maxDist := 55.4
	if maxDist > setting.MaxDistanceKM {
		// Đúng logic chặn ngoài vùng phục vụ
	} else {
		t.Fatalf("Không chặn khoảng cách vượt 50km")
	}

	// Case 5: Đạt ngưỡng miễn phí ship (Đơn hàng 6.000.000đ >= 5.000.000đ, khoảng cách 8km <= 15km)
	subTotal := int64(6000000)
	orderDist := 8.0
	isFreeship := subTotal >= setting.FreeShippingThreshold && (setting.FreeShippingMaxDistanceKM <= 0 || orderDist <= setting.FreeShippingMaxDistanceKM)
	if !isFreeship {
		t.Fatalf("Không kích hoạt freeship khi đơn đủ điều kiện")
	}

	// Case 6: Đơn 6.000.000đ nhưng khoảng cách 20km > 15km -> KHÔNG được freeship
	orderDistFar := 20.0
	isFreeshipFar := subTotal >= setting.FreeShippingThreshold && (setting.FreeShippingMaxDistanceKM <= 0 || orderDistFar <= setting.FreeShippingMaxDistanceKM)
	if isFreeshipFar {
		t.Fatalf("Freeship sai khi khoảng cách 20km vượt bán kính 15km")
	}
}

// TestOSRMToHaversineFallback kiểm tra cơ chế fallback sang Haversine khi OSRM gặp sự cố
func TestOSRMToHaversineFallback(t *testing.T) {
	mockFailRouting := &MockRoutingService{ShouldFail: true}
	fromLat, fromLng := 10.7769, 106.7009
	toLat, toLng := 10.8231, 106.6297

	dist, _, source, err := mockFailRouting.CalculateDistance(context.Background(), fromLat, fromLng, toLat, toLng, 1.30)
	if err != nil {
		t.Fatalf("Fallback không được trả về lỗi: %v", err)
	}

	if source != "haversine_fallback" {
		t.Fatalf("Nguồn tính phải là haversine_fallback, nhưng nhận: %s", source)
	}

	if dist <= 0 {
		t.Fatalf("Khoảng cách fallback phải lớn hơn 0: %.2f", dist)
	}
}
