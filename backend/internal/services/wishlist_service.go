package services

import (
	"errors"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type WishlistService struct {
	DB *gorm.DB
}

func NewWishlistService(db *gorm.DB) *WishlistService {
	return &WishlistService{DB: db}
}

func (s *WishlistService) ListWishlist(userID uint64, page, limit int) ([]models.WishlistItem, int64, error) {
	var items []models.WishlistItem
	var total int64

	query := s.DB.Model(&models.WishlistItem{}).
		Joins("JOIN products ON wishlist_items.product_id = products.id").
		Where("wishlist_items.user_id = ? AND products.status = ?", userID, "active")

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("Product").Preload("Product.Images").Preload("Product.Variants").Preload("Product.Category").Offset(offset).Limit(limit).Order("wishlist_items.created_at desc").Find(&items).Error
	return items, total, err
}

func (s *WishlistService) AddToWishlist(userID, productID uint64) error {
	var product models.Product
	if err := s.DB.First(&product, productID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("sản phẩm không tồn tại")
		}
		return err
	}

	item := models.WishlistItem{
		UserID:    userID,
		ProductID: productID,
	}

	err := s.DB.Where("user_id = ? AND product_id = ?", userID, productID).FirstOrCreate(&item).Error
	return err
}

func (s *WishlistService) RemoveFromWishlist(userID, productID uint64) error {
	return s.DB.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&models.WishlistItem{}).Error
}

func (s *WishlistService) IsInWishlist(userID, productID uint64) (bool, error) {
	var count int64
	err := s.DB.Model(&models.WishlistItem{}).Where("user_id = ? AND product_id = ?", userID, productID).Count(&count).Error
	return count > 0, err
}
