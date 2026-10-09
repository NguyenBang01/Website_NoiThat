package services

import (
	"errors"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type BannerService struct {
	DB *gorm.DB
}

func NewBannerService(db *gorm.DB) *BannerService {
	return &BannerService{DB: db}
}

func (s *BannerService) PublicList() ([]models.Banner, error) {
	var banners []models.Banner
	err := s.DB.Where("is_active = ?", true).Order("sort_order asc").Find(&banners).Error
	return banners, err
}

func (s *BannerService) AdminList(page, limit int) ([]models.Banner, int64, error) {
	var banners []models.Banner
	var total int64
	offset := (page - 1) * limit
	err := s.DB.Model(&models.Banner{}).Count(&total).Offset(offset).Limit(limit).Order("sort_order asc").Find(&banners).Error
	return banners, total, err
}

func (s *BannerService) Create(req dto.BannerRequest) (*models.Banner, error) {
	banner := &models.Banner{
		Title:     req.Title,
		Subtitle:  req.Subtitle,
		Image:     req.Image,
		Link:      req.Link,
		SortOrder: req.SortOrder,
		IsActive:  req.IsActive,
	}
	err := s.DB.Create(banner).Error
	return banner, err
}

func (s *BannerService) Update(id uint64, req dto.BannerRequest) error {
	var banner models.Banner
	if err := s.DB.First(&banner, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("banner not found")
		}
		return err
	}
	banner.Title = req.Title
	banner.Subtitle = req.Subtitle
	banner.Image = req.Image
	banner.Link = req.Link
	banner.SortOrder = req.SortOrder
	banner.IsActive = req.IsActive
	return s.DB.Save(&banner).Error
}

func (s *BannerService) Delete(id uint64) error {
	res := s.DB.Delete(&models.Banner{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("banner not found")
	}
	return nil
}
