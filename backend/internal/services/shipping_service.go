package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type ShippingService struct {
	DB               *gorm.DB
	GeocodingService GeocodingService
	RoutingService   RoutingService
}

func NewShippingService(db *gorm.DB, geo GeocodingService, routing RoutingService) *ShippingService {
	if geo == nil {
		geo = NewNominatimGeocodingService()
	}
	if routing == nil {
		routing = NewOSRMRoutingService()
	}
	return &ShippingService{
		DB:               db,
		GeocodingService: geo,
		RoutingService:   routing,
	}
}

// GetSettings lấy cấu hình vận chuyển hiện tại
func (s *ShippingService) GetSettings() (*models.ShippingSetting, error) {
	var setting models.ShippingSetting
	err := s.DB.First(&setting).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Tạo mặc định nếu chưa có
			setting = models.ShippingSetting{
				WarehouseName:             "Kho hàng trung tâm - Nội Thất Góc Nhà Đẹp",
				WarehouseAddress:          "123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
				WarehouseLat:              10.776900,
				WarehouseLng:              106.700900,
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
				FallbackMultiplier:        1.30,
			}
			if createErr := s.DB.Create(&setting).Error; createErr != nil {
				return nil, createErr
			}
			return &setting, nil
		}
		return nil, err
	}
	return &setting, nil
}

// UpdateSettings cập nhật cài đặt vận chuyển
func (s *ShippingService) UpdateSettings(req dto.UpdateShippingSettingRequest) (*models.ShippingSetting, error) {
	setting, err := s.GetSettings()
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(req.WarehouseName) != "" {
		setting.WarehouseName = strings.TrimSpace(req.WarehouseName)
	}
	if strings.TrimSpace(req.WarehouseAddress) != "" {
		setting.WarehouseAddress = strings.TrimSpace(req.WarehouseAddress)
	}
	if req.WarehouseLat != 0 {
		setting.WarehouseLat = req.WarehouseLat
	}
	if req.WarehouseLng != 0 {
		setting.WarehouseLng = req.WarehouseLng
	}
	if req.MaxDistanceKM > 0 {
		setting.MaxDistanceKM = req.MaxDistanceKM
	} else if setting.MaxDistanceKM <= 0 {
		setting.MaxDistanceKM = 50.0
	}
	if req.MinShippingFee >= 0 {
		setting.MinShippingFee = req.MinShippingFee
	}
	if req.FreeShippingThreshold >= 0 {
		setting.FreeShippingThreshold = req.FreeShippingThreshold
	}
	if req.FreeShippingMaxDistanceKM >= 0 {
		setting.FreeShippingMaxDistanceKM = req.FreeShippingMaxDistanceKM
	}

	// Xử lý EnableBulkySurcharge (ưu tiên enable_bulky_surcharge, rồi is_bulky_surcharge_enabled)
	if req.EnableBulkySurcharge != nil {
		setting.EnableBulkySurcharge = *req.EnableBulkySurcharge
	} else if req.IsBulkySurchargeEnabled != nil {
		setting.EnableBulkySurcharge = *req.IsBulkySurchargeEnabled
	}

	// Xử lý BulkySurchargeFee
	if req.BulkySurchargeFee > 0 {
		setting.BulkySurchargeFee = req.BulkySurchargeFee
	} else if req.BulkySurchargePerItem > 0 {
		setting.BulkySurchargeFee = req.BulkySurchargePerItem
	}

	if req.BulkyWeightThreshold > 0 {
		setting.BulkyWeightThreshold = req.BulkyWeightThreshold
	}

	// Xử lý Floor Surcharge
	if req.EnableFloorSurcharge != nil {
		setting.EnableFloorSurcharge = *req.EnableFloorSurcharge
	} else if req.IsFloorSurchargeEnabled != nil {
		setting.EnableFloorSurcharge = *req.IsFloorSurchargeEnabled
	}
	if req.FloorSurchargePerFloor >= 0 {
		setting.FloorSurchargePerFloor = req.FloorSurchargePerFloor
	}

	// Xử lý Assembly Fee
	if req.EnableAssemblyFee != nil {
		setting.EnableAssemblyFee = *req.EnableAssemblyFee
	} else if req.IsAssemblyFeeEnabled != nil {
		setting.EnableAssemblyFee = *req.IsAssemblyFeeEnabled
	}
	if req.AssemblyFee >= 0 {
		setting.AssemblyFee = req.AssemblyFee
	}

	// Xử lý FallbackMultiplier
	if req.FallbackMultiplier >= 1.0 {
		setting.FallbackMultiplier = req.FallbackMultiplier
	} else if setting.FallbackMultiplier < 1.0 {
		setting.FallbackMultiplier = 1.30
	}

	setting.UpdatedAt = time.Now()

	if err := s.DB.Save(setting).Error; err != nil {
		return nil, err
	}

	return setting, nil
}

// ListTiers lấy danh sách các bậc thang vận chuyển theo thứ tự
func (s *ShippingService) ListTiers() ([]models.ShippingTier, error) {
	var tiers []models.ShippingTier
	if err := s.DB.Order("sort_order ASC, from_km ASC").Find(&tiers).Error; err != nil {
		return nil, err
	}
	return tiers, nil
}

// CreateTier tạo một bậc thang vận chuyển mới kèm validate
func (s *ShippingService) CreateTier(req dto.CreateShippingTierRequest) (*models.ShippingTier, error) {
	if req.ToKM <= req.FromKM {
		return nil, errors.New("khoảng cách kết thúc (ToKM) phải lớn hơn khoảng cách bắt đầu (FromKM)")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	tier := models.ShippingTier{
		FromKM:     req.FromKM,
		ToKM:       req.ToKM,
		BaseFee:    req.BaseFee,
		PricePerKM: req.PricePerKM,
		SortOrder:  req.SortOrder,
		IsActive:   isActive,
	}

	if err := s.DB.Create(&tier).Error; err != nil {
		return nil, err
	}

	return &tier, nil
}

// UpdateTier cập nhật thông tin bậc thang
func (s *ShippingService) UpdateTier(id uint64, req dto.UpdateShippingTierRequest) (*models.ShippingTier, error) {
	var tier models.ShippingTier
	if err := s.DB.First(&tier, id).Error; err != nil {
		return nil, errors.New("không tìm thấy bậc thang vận chuyển")
	}

	if req.ToKM <= req.FromKM {
		return nil, errors.New("khoảng cách kết thúc (ToKM) phải lớn hơn khoảng cách bắt đầu (FromKM)")
	}

	tier.FromKM = req.FromKM
	tier.ToKM = req.ToKM
	tier.BaseFee = req.BaseFee
	tier.PricePerKM = req.PricePerKM
	tier.SortOrder = req.SortOrder
	if req.IsActive != nil {
		tier.IsActive = *req.IsActive
	}
	tier.UpdatedAt = time.Now()

	if err := s.DB.Save(&tier).Error; err != nil {
		return nil, err
	}

	return &tier, nil
}

// DeleteTier xóa bậc thang
func (s *ShippingService) DeleteTier(id uint64) error {
	var count int64
	if err := s.DB.Model(&models.ShippingTier{}).Count(&count).Error; err != nil {
		return err
	}
	if count <= 1 {
		return errors.New("hệ thống phải giữ lại ít nhất 1 bậc thang vận chuyển")
	}

	return s.DB.Delete(&models.ShippingTier{}, id).Error
}

// ReorderTiers cập nhật thứ tự các bậc thang
func (s *ShippingService) ReorderTiers(req dto.ReorderShippingTiersRequest) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		for index, id := range req.TierIDs {
			if err := tx.Model(&models.ShippingTier{}).Where("id = ?", id).Update("sort_order", index+1).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// ValidateTiers kiểm tra tính hợp lý của danh sách bậc thang: không chồng lấn, không hở khoảng cách
func (s *ShippingService) ValidateTiers(tiers []models.ShippingTier) []string {
	var errs []string
	if len(tiers) == 0 {
		return []string{"chưa có bậc thang vận chuyển nào được thiết lập"}
	}

	// Lọc các bậc đang active và sắp xếp theo FromKM
	var activeTiers []models.ShippingTier
	for _, t := range tiers {
		if t.IsActive {
			activeTiers = append(activeTiers, t)
		}
	}

	if len(activeTiers) == 0 {
		return []string{"tất cả các bậc thang đang bị vô hiệu hóa"}
	}

	sort.Slice(activeTiers, func(i, j int) bool {
		return activeTiers[i].FromKM < activeTiers[j].FromKM
	})

	if activeTiers[0].FromKM > 0 {
		errs = append(errs, fmt.Sprintf("Bậc đầu tiên nên bắt đầu từ 0 km (hiện tại bắt đầu từ %.1f km)", activeTiers[0].FromKM))
	}

	for i := 0; i < len(activeTiers)-1; i++ {
		current := activeTiers[i]
		next := activeTiers[i+1]

		if current.ToKM > next.FromKM {
			errs = append(errs, fmt.Sprintf("Bậc %.1f - %.1f km đang chồng lấn với bậc %.1f - %.1f km", current.FromKM, current.ToKM, next.FromKM, next.ToKM))
		} else if current.ToKM < next.FromKM {
			errs = append(errs, fmt.Sprintf("Có khoảng trống chưa tính cước giữa bậc %.1f - %.1f km và %.1f - %.1f km", current.FromKM, current.ToKM, next.FromKM, next.ToKM))
		}
	}

	return errs
}

// EstimateShipping tính toán phí vận chuyển đầy đủ cho storefront và admin
func (s *ShippingService) EstimateShipping(ctx context.Context, req dto.ShippingEstimateRequest) (*dto.ShippingEstimateResponse, error) {
	setting, err := s.GetSettings()
	if err != nil {
		return nil, fmt.Errorf("không thể lấy cấu hình vận chuyển: %w", err)
	}

	tiers, err := s.ListTiers()
	if err != nil {
		return nil, fmt.Errorf("không thể lấy bảng giá vận chuyển: %w", err)
	}

	// 1. Xác định tọa độ điểm đến
	var destLat, destLng float64
	var geocodedAddress string

	if req.Latitude != nil && req.Longitude != nil && *req.Latitude != 0 && *req.Longitude != 0 {
		destLat = *req.Latitude
		destLng = *req.Longitude
		geocodedAddress = req.Address
	} else if strings.TrimSpace(req.Address) != "" {
		// Gọi Geocoding Nominatim
		lat, lng, displayName, geoErr := s.GeocodingService.Geocode(ctx, req.Address)
		if geoErr != nil {
			return &dto.ShippingEstimateResponse{
				IsDeliverable: false,
				Message:       "Không thể xác định vị trí từ địa chỉ cung cấp: " + geoErr.Error() + ". Quý khách vui lòng chọn ghim vị trí trực tiếp trên bản đồ.",
			}, nil
		}
		destLat = lat
		destLng = lng
		geocodedAddress = displayName
	} else {
		return &dto.ShippingEstimateResponse{
			IsDeliverable: false,
			Message:       "Vui lòng cung cấp tọa độ hoặc địa chỉ nhận hàng để tính cước vận chuyển.",
		}, nil
	}

	// 2. Tính khoảng cách qua Routing Service (OSRM + Fallback Haversine)
	distanceKM, durationMinutes, source, distErr := s.RoutingService.CalculateDistance(
		ctx,
		setting.WarehouseLat,
		setting.WarehouseLng,
		destLat,
		destLng,
		setting.FallbackMultiplier,
	)
	if distErr != nil {
		return &dto.ShippingEstimateResponse{
			IsDeliverable: false,
			Message:       "Lỗi tính toán khoảng cách đường đi: " + distErr.Error(),
		}, nil
	}

	// 3. Kiểm tra khoảng cách tối đa
	if distanceKM > setting.MaxDistanceKM {
		return &dto.ShippingEstimateResponse{
			IsDeliverable:   false,
			DistanceKM:      distanceKM,
			DurationMinutes: durationMinutes,
			Source:          source,
			GeocodedAddress: geocodedAddress,
			Message: fmt.Sprintf(
				"Khoảng cách giao hàng (%.1f km) vượt quá bán kính giao hàng tiêu chuẩn của cửa hàng (%.1f km). Quý khách vui lòng liên hệ hotline shop để được báo giá và thỏa thuận phương thức vận chuyển riêng.",
				distanceKM,
				setting.MaxDistanceKM,
			),
		}, nil
	}

	// 4. Tìm bậc thang phù hợp
	var matchedTier *models.ShippingTier
	var activeTiers []models.ShippingTier
	for _, t := range tiers {
		if t.IsActive {
			activeTiers = append(activeTiers, t)
		}
	}

	sort.Slice(activeTiers, func(i, j int) bool {
		return activeTiers[i].FromKM < activeTiers[j].FromKM
	})

	for i, t := range activeTiers {
		isLast := (i == len(activeTiers)-1)
		if isLast {
			if distanceKM >= t.FromKM && distanceKM <= t.ToKM {
				matchedTier = &activeTiers[i]
				break
			}
		} else {
			if distanceKM >= t.FromKM && distanceKM < t.ToKM {
				matchedTier = &activeTiers[i]
				break
			}
		}
	}

	// Nếu không nằm trong bậc nào nhưng khoảng cách nhỏ hơn FromKM của bậc đầu tiên
	if matchedTier == nil && len(activeTiers) > 0 && distanceKM < activeTiers[0].FromKM {
		matchedTier = &activeTiers[0]
	}

	if matchedTier == nil {
		return &dto.ShippingEstimateResponse{
			IsDeliverable:   false,
			DistanceKM:      distanceKM,
			DurationMinutes: durationMinutes,
			Source:          source,
			GeocodedAddress: geocodedAddress,
			Message:         fmt.Sprintf("Không tìm thấy bậc giá vận chuyển phù hợp cho khoảng cách %.1f km.", distanceKM),
		}, nil
	}

	// 5. Tính phí cơ bản theo bậc thang
	tierApplied := fmt.Sprintf("Bậc %.1f - %.1f km", matchedTier.FromKM, matchedTier.ToKM)
	tierBaseFee := matchedTier.BaseFee
	var excessKMFee int64 = 0

	if matchedTier.PricePerKM > 0 && distanceKM > matchedTier.FromKM {
		excessDistance := distanceKM - matchedTier.FromKM
		excessKMFee = int64(math.Round(excessDistance * float64(matchedTier.PricePerKM)))
	}

	baseShippingFee := tierBaseFee + excessKMFee

	// 6. Tính phụ phí đồ cồng kềnh (Bulky Surcharge)
	var bulkySurcharge int64 = 0
	if setting.EnableBulkySurcharge && len(req.Items) > 0 {
		for _, item := range req.Items {
			var variant models.ProductVariant
			if err := s.DB.Preload("Product").First(&variant, item.VariantID).Error; err == nil {
				isBulky := false
				if variant.Product != nil && variant.Product.IsBulky {
					isBulky = true
				}
				if variant.WeightKG != nil && *variant.WeightKG >= setting.BulkyWeightThreshold {
					isBulky = true
				}
				if variant.Product != nil && variant.Product.WeightKG != nil && *variant.Product.WeightKG >= setting.BulkyWeightThreshold {
					isBulky = true
				}

				if isBulky {
					bulkySurcharge += setting.BulkySurchargeFee * int64(item.Quantity)
				}
			}
		}
	}

	// 7. Phụ phí khiêng tầng bộ
	var floorSurcharge int64 = 0
	if setting.EnableFloorSurcharge && req.Floor > 0 {
		floorSurcharge = int64(req.Floor) * setting.FloorSurchargePerFloor
	}

	// 8. Phí lắp đặt hoàn thiện
	var assemblyFee int64 = 0
	if setting.EnableAssemblyFee && req.NeedsAssembly {
		assemblyFee = setting.AssemblyFee
	}

	// Tổng tiền trước giảm trừ
	rawTotal := baseShippingFee + bulkySurcharge + floorSurcharge + assemblyFee

	// 9. Xét miễn phí vận chuyển theo chính sách cửa hàng
	var discountAmount int64 = 0
	isFreeShipping := false
	freeShippingReason := ""

	if setting.FreeShippingThreshold > 0 && req.SubTotal >= setting.FreeShippingThreshold {
		if setting.FreeShippingMaxDistanceKM <= 0 || distanceKM <= setting.FreeShippingMaxDistanceKM {
			// Miễn phí vận chuyển cơ bản
			discountAmount += baseShippingFee
			isFreeShipping = true
			if setting.FreeShippingMaxDistanceKM > 0 {
				freeShippingReason = fmt.Sprintf("Miễn phí vận chuyển cho đơn hàng từ %s (áp dụng trong bán kính %.0f km)", formatCurrencyVND(setting.FreeShippingThreshold), setting.FreeShippingMaxDistanceKM)
			} else {
				freeShippingReason = fmt.Sprintf("Miễn phí vận chuyển cho đơn hàng từ %s", formatCurrencyVND(setting.FreeShippingThreshold))
			}
		}
	}

	// 10. Xét mã giảm giá freeship nếu có
	if req.CouponCode != "" {
		var coupon models.Coupon
		if err := s.DB.Where("code = ? AND is_active = ? AND deleted_at IS NULL", req.CouponCode, true).First(&coupon).Error; err == nil {
			now := time.Now()
			isValidDate := (coupon.StartDate == nil || !coupon.StartDate.After(now)) && (coupon.EndDate == nil || !coupon.EndDate.Before(now))
			isValidMinOrder := (coupon.MinOrderAmount <= 0 || req.SubTotal >= coupon.MinOrderAmount)
			isValidUsage := (coupon.UsageLimit <= 0 || coupon.UsedCount < coupon.UsageLimit)

			if isValidDate && isValidMinOrder && isValidUsage && coupon.DiscountType == "freeship" {
				remainFee := rawTotal - discountAmount
				if remainFee > 0 {
					couponDiscount := remainFee
					if coupon.MaxDiscount != nil && couponDiscount > *coupon.MaxDiscount {
						couponDiscount = *coupon.MaxDiscount
					}
					discountAmount += couponDiscount
					if freeShippingReason == "" {
						freeShippingReason = fmt.Sprintf("Áp dụng mã giảm giá vận chuyển: %s", coupon.Code)
					} else {
						freeShippingReason += fmt.Sprintf(" + Mã freeship: %s", coupon.Code)
					}
					if discountAmount >= rawTotal {
						isFreeShipping = true
					}
				}
			}
		}
	}

	// 11. Tính tổng phí cuối cùng và làm tròn lên 1.000đ
	finalFee := rawTotal - discountAmount
	if finalFee < 0 {
		finalFee = 0
	}

	// Làm tròn lên hàng nghìn (1.000 đ)
	if finalFee > 0 {
		finalFee = int64(math.Ceil(float64(finalFee)/1000.0) * 1000)
	}

	// Áp dụng phí tối thiểu nếu không phải freeship
	if !isFreeShipping && finalFee < setting.MinShippingFee && finalFee > 0 {
		finalFee = setting.MinShippingFee
	}

	return &dto.ShippingEstimateResponse{
		IsDeliverable:      true,
		DistanceKM:         distanceKM,
		DurationMinutes:    durationMinutes,
		Source:             source,
		GeocodedAddress:    geocodedAddress,
		FinalShippingFee:   finalFee,
		IsFreeShipping:     isFreeShipping,
		FreeShippingReason: freeShippingReason,
		Breakdown: dto.ShippingFeeBreakdown{
			TierApplied:    tierApplied,
			TierBaseFee:    tierBaseFee,
			ExcessKMFee:    excessKMFee,
			BulkySurcharge: bulkySurcharge,
			FloorSurcharge: floorSurcharge,
			AssemblyFee:    assemblyFee,
			DiscountAmount: discountAmount,
			RawTotal:       rawTotal,
		},
	}, nil
}

func formatCurrencyVND(amount int64) string {
	s := fmt.Sprintf("%d", amount)
	n := len(s)
	if n <= 3 {
		return s + "đ"
	}
	var result []string
	remainder := n % 3
	if remainder > 0 {
		result = append(result, s[:remainder])
	}
	for i := remainder; i < n; i += 3 {
		result = append(result, s[i:i+3])
	}
	return strings.Join(result, ".") + "đ"
}
