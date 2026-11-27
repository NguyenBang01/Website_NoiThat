 package services

import (
	"errors"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type ReviewService struct {
	DB *gorm.DB
}

func NewReviewService(db *gorm.DB) *ReviewService {
	return &ReviewService{DB: db}
}

func (s *ReviewService) CreateReview(userID uint64, req dto.CreateReviewRequest) error {
	if req.Rating < 1 || req.Rating > 5 {
		return errors.New("số sao đánh giá phải từ 1 đến 5 sao")
	}

	var product models.Product
	if err := s.DB.First(&product, req.ProductID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("sản phẩm không tồn tại")
		}
		return err
	}

	// Kiểm tra khách hàng đã từng mua sản phẩm này và đơn hàng đã được giao thành công (delivered)
	var purchasedCount int64
	err := s.DB.Table("order_items").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Joins("JOIN product_variants ON product_variants.id = order_items.variant_id").
		Where("orders.user_id = ? AND product_variants.product_id = ? AND orders.status = 'delivered'", userID, req.ProductID).
		Count(&purchasedCount).Error
	if err != nil || purchasedCount == 0 {
		return errors.New("chỉ khách hàng đã mua và nhận hàng thành công mới có thể gửi đánh giá cho sản phẩm này")
	}

	var count int64
	s.DB.Model(&models.Review{}).Where("user_id = ? AND product_id = ?", userID, req.ProductID).Count(&count)
	if count > 0 {
		return errors.New("bạn đã đánh giá sản phẩm này rồi")
	}

	review := models.Review{
		UserID:    userID,
		ProductID: req.ProductID,
		Rating:    req.Rating,
		Comment:   req.Comment,
		Status:    "pending",
	}

	return s.DB.Create(&review).Error
}

func (s *ReviewService) MyReviews(userID uint64, page, limit int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64

	query := s.DB.Model(&models.Review{}).Where("user_id = ?", userID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("Product").Offset(offset).Limit(limit).Order("created_at desc").Find(&reviews).Error
	return reviews, total, err
}

func (s *ReviewService) ProductReviews(productID uint64, page, limit int) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64

	query := s.DB.Model(&models.Review{}).Where("product_id = ? AND status = ?", productID, "approved")
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("User").Offset(offset).Limit(limit).Order("created_at desc").Find(&reviews).Error
	return reviews, total, err
}

func (s *ReviewService) AdminListReviews(page, limit int, status string) ([]models.Review, int64, error) {
	var reviews []models.Review
	var total int64

	query := s.DB.Model(&models.Review{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("User").Preload("Product").Offset(offset).Limit(limit).Order("created_at desc").Find(&reviews).Error
	return reviews, total, err
}

func (s *ReviewService) AdminUpdateReview(reviewID uint64, req dto.AdminReviewActionRequest) error {
	var review models.Review
	if err := s.DB.First(&review, reviewID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("đánh giá không tồn tại")
		}
		return err
	}

	updates := map[string]interface{}{
		"status": req.Status,
	}
	if req.AdminNote != nil {
		updates["admin_note"] = req.AdminNote
	} else {
		updates["admin_note"] = nil
	}

	return s.DB.Model(&review).Updates(updates).Error
}

func (s *ReviewService) DeleteReview(userID, reviewID uint64) error {
	res := s.DB.Where("id = ? AND user_id = ?", reviewID, userID).Delete(&models.Review{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("đánh giá không tồn tại hoặc bạn không có quyền xóa")
	}
	return nil
}

func (s *ReviewService) AdminDeleteReview(reviewID, deletedBy uint64) error {
	var rev models.Review
	if err := s.DB.First(&rev, reviewID).Error; err != nil {
		return errors.New("đánh giá không tồn tại")
	}
	if deletedBy > 0 {
		_ = s.DB.Model(&rev).Update("deleted_by", deletedBy).Error
	}
	return s.DB.Delete(&rev).Error
}
