package services

import (
	"errors"
	"strings"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

func detectMediaType(mediaType, url string) string {
	if mediaType == "video" || mediaType == "image" {
		return mediaType
	}
	lower := strings.ToLower(url)
	if strings.Contains(lower, ".mp4") || strings.Contains(lower, ".webm") || strings.Contains(lower, ".ogg") || strings.Contains(lower, ".mov") {
		return "video"
	}
	return "image"
}

type BannerService struct {
	DB *gorm.DB
}

func NewBannerService(db *gorm.DB) *BannerService {
	return &BannerService{DB: db}
}

func normalizePosition(pos string) string {
	p := strings.TrimSpace(pos)
	if p == "" {
		return "home_slider"
	}
	return p
}

func (s *BannerService) PublicList(position string) ([]models.Banner, error) {
	var banners []models.Banner
	q := s.DB.Where("is_active = ?", true)
	if strings.TrimSpace(position) != "" {
		q = q.Where("position = ?", strings.TrimSpace(position))
	}
	err := q.Order("position asc, sort_order asc, id asc").Find(&banners).Error
	return banners, err
}

func (s *BannerService) AdminList(page, limit int, position string) ([]models.Banner, int64, error) {
	var banners []models.Banner
	var total int64
	offset := (page - 1) * limit
	q := s.DB.Model(&models.Banner{})
	if strings.TrimSpace(position) != "" {
		q = q.Where("position = ?", strings.TrimSpace(position))
	}
	err := q.Count(&total).Offset(offset).Limit(limit).Order("position asc, sort_order asc, id asc").Find(&banners).Error
	return banners, total, err
}

func (s *BannerService) Create(req dto.BannerRequest) (*models.Banner, error) {
	banner := &models.Banner{
		Title:     req.Title,
		Subtitle:  req.Subtitle,
		Image:     req.Image,
		MediaType: detectMediaType(req.MediaType, req.Image),
		Position:  normalizePosition(req.Position),
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
	banner.MediaType = detectMediaType(req.MediaType, req.Image)
	if strings.TrimSpace(req.Position) != "" {
		banner.Position = normalizePosition(req.Position)
	}
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
