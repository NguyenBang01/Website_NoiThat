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
	var product models.Product
	if err := s.DB.First(&product, req.ProductID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("sản phẩm không tồn tại")
		}
		return err
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
