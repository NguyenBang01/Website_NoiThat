package services

import (
	"errors"
	"strings"
	"time"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type CouponService struct {
	DB *gorm.DB
}

func NewCouponService(db *gorm.DB) *CouponService {
	return &CouponService{DB: db}
}

func (s *CouponService) AdminList(page, limit int, q string) ([]models.Coupon, int64, error) {
	var coupons []models.Coupon
	var total int64

	query := s.DB.Model(&models.Coupon{})

	if q != "" {
		query = query.Where("code LIKE ?", "%"+q+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("id desc").Find(&coupons).Error; err != nil {
		return nil, 0, err
	}

	return coupons, total, nil
}

func (s *CouponService) AdminGet(id uint64) (*models.Coupon, error) {
	var coupon models.Coupon
	if err := s.DB.First(&coupon, id).Error; err != nil {
		return nil, err
	}
	return &coupon, nil
}

func (s *CouponService) Create(req *dto.CouponRequest) (*models.Coupon, error) {
	code := strings.ToUpper(req.Code)

	var existing models.Coupon
	if err := s.DB.Where("code = ?", code).First(&existing).Error; err == nil {
		return nil, errors.New("mã giảm giá đã tồn tại")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	coupon := models.Coupon{
		Code:           code,
		Description:    req.Description,
		DiscountType:   req.DiscountType,
		DiscountValue:  req.DiscountValue,
		MinOrderAmount: req.MinOrderAmount,
		MaxDiscount:    req.MaxDiscount,
		UsageLimit:     req.UsageLimit,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		IsActive:       isActive,
	}

	if err := s.DB.Create(&coupon).Error; err != nil {
		return nil, err
	}

	return &coupon, nil
}

func (s *CouponService) Update(id uint64, req *dto.CouponRequest) (*models.Coupon, error) {
	coupon, err := s.AdminGet(id)
	if err != nil {
		return nil, err
	}

	code := strings.ToUpper(req.Code)
	if code != coupon.Code {
		var existing models.Coupon
		if err := s.DB.Where("code = ?", code).First(&existing).Error; err == nil {
			return nil, errors.New("mã giảm giá đã tồn tại")
		}
	}

	coupon.Code = code
	coupon.Description = req.Description
	coupon.DiscountType = req.DiscountType
	coupon.DiscountValue = req.DiscountValue
	coupon.MinOrderAmount = req.MinOrderAmount
	coupon.MaxDiscount = req.MaxDiscount
	coupon.UsageLimit = req.UsageLimit
	coupon.StartDate = req.StartDate
	coupon.EndDate = req.EndDate

	if req.IsActive != nil {
		coupon.IsActive = *req.IsActive
	}

	if err := s.DB.Save(coupon).Error; err != nil {
		return nil, err
	}

	return coupon, nil
}

func (s *CouponService) Delete(id uint64) error {
	result := s.DB.Delete(&models.Coupon{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("không tìm thấy mã giảm giá")
	}
	return nil
}

func (s *CouponService) ValidateCoupon(code string, orderTotal int64) (*dto.CouponValidationResponse, error) {
	code = strings.ToUpper(code)

	var coupon models.Coupon
	if err := s.DB.Where("code = ?", code).First(&coupon).Error; err != nil {
		return &dto.CouponValidationResponse{
			Valid:   false,
			Message: "Mã giảm giá không tồn tại",
		}, nil
	}

	if !coupon.IsActive {
		return &dto.CouponValidationResponse{
			Valid:   false,
			Message: "Mã giảm giá không còn hoạt động",
		}, nil
	}

	now := time.Now()
	if coupon.StartDate != nil && now.Before(*coupon.StartDate) {
		return &dto.CouponValidationResponse{
			Valid:   false,
			Message: "Mã giảm giá chưa đến thời gian áp dụng",
		}, nil
	}
	if coupon.EndDate != nil && now.After(*coupon.EndDate) {
		return &dto.CouponValidationResponse{
			Valid:   false,
			Message: "Mã giảm giá đã hết hạn",
		}, nil
	}

	if orderTotal < coupon.MinOrderAmount {
		return &dto.CouponValidationResponse{
			Valid:   false,
			Message: "Đơn hàng chưa đạt giá trị tối thiểu",
		}, nil
	}

	if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
		return &dto.CouponValidationResponse{
			Valid:   false,
			Message: "Mã giảm giá đã hết lượt sử dụng",
		}, nil
	}

	var discountAmount int64
	if coupon.DiscountType == "percent" {
		discountAmount = (orderTotal * coupon.DiscountValue) / 100
		if coupon.MaxDiscount != nil && discountAmount > *coupon.MaxDiscount {
			discountAmount = *coupon.MaxDiscount
		}
	} else if coupon.DiscountType == "fixed" {
		discountAmount = coupon.DiscountValue
	}

	if discountAmount > orderTotal {
		discountAmount = orderTotal
	}

	return &dto.CouponValidationResponse{
		Valid:          true,
		CouponID:       coupon.ID,
		Code:           coupon.Code,
		DiscountAmount: discountAmount,
		Message:        "Áp dụng mã giảm giá thành công",
	}, nil
}

func (s *CouponService) IncrementUsage(id uint64) error {
	return s.DB.Model(&models.Coupon{}).Where("id = ?", id).Update("used_count", gorm.Expr("used_count + ?", 1)).Error
}
