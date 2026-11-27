package services

import (
	"errors"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"gorm.io/gorm"
)

var (
	ErrBrandNotFound      = errors.New("không tìm thấy thương hiệu")
	ErrBrandHasProducts   = errors.New("không thể xóa thương hiệu đang có sản phẩm liên kết")
	ErrBrandDuplicateSlug = errors.New("đường dẫn (slug) thương hiệu đã tồn tại")
)

type BrandService struct {
	DB *gorm.DB
}

func NewBrandService(db *gorm.DB) *BrandService {
	return &BrandService{DB: db}
}

func (s *BrandService) List() ([]models.Brand, error) {
	var brands []models.Brand
	err := s.DB.Order("name ASC").Find(&brands).Error
	return brands, err
}

func (s *BrandService) Create(name, slug string, logo *string) (*models.Brand, error) {
	if slug == "" {
		slug = utils.Slugify(name)
	}

	var count int64
	s.DB.Model(&models.Brand{}).Where("slug = ?", slug).Count(&count)
	if count > 0 {
		return nil, ErrBrandDuplicateSlug
	}

	brand := models.Brand{
		Name: name,
		Slug: slug,
		Logo: logo,
	}
	if err := s.DB.Create(&brand).Error; err != nil {
		return nil, err
	}
	return &brand, nil
}

func (s *BrandService) Update(id uint64, name, slug string, logo *string) (*models.Brand, error) {
	var brand models.Brand
	if err := s.DB.First(&brand, id).Error; err != nil {
		return nil, ErrBrandNotFound
	}

	if slug == "" {
		slug = utils.Slugify(name)
	}

	var count int64
	s.DB.Model(&models.Brand{}).Where("slug = ? AND id != ?", slug, id).Count(&count)
	if count > 0 {
		return nil, ErrBrandDuplicateSlug
	}

	brand.Name = name
	brand.Slug = slug
	brand.Logo = logo

	if err := s.DB.Save(&brand).Error; err != nil {
		return nil, err
	}
	return &brand, nil
}

func (s *BrandService) Delete(id uint64) error {
	var brand models.Brand
	if err := s.DB.First(&brand, id).Error; err != nil {
		return ErrBrandNotFound
	}

	// Kiểm tra nếu có sản phẩm đang liên kết với thương hiệu này
	var productCount int64
	if err := s.DB.Model(&models.Product{}).Where("brand_id = ?", id).Count(&productCount).Error; err != nil {
		return err
	}
	if productCount > 0 {
		return ErrBrandHasProducts
	}

	return s.DB.Delete(&brand).Error
}
