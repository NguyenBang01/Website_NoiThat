package services

import (
	"errors"
	"furniture-shop/backend/internal/models"
	"gorm.io/gorm"
)

type CustomerService struct {
	DB *gorm.DB
}

func NewCustomerService(db *gorm.DB) *CustomerService {
	return &CustomerService{DB: db}
}

func (s *CustomerService) AdminListCustomers(page, limit int, q string) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	offset := (page - 1) * limit
	query := s.DB.Model(&models.User{}).Where("role IN ('customer', 'user')")
	
	if q != "" {
		searchParam := "%" + q + "%"
		query = query.Where("full_name LIKE ? OR email LIKE ? OR phone LIKE ?", searchParam, searchParam, searchParam)
	}

	err := query.Count(&total).Offset(offset).Limit(limit).Order("created_at desc").Find(&users).Error
	return users, total, err
}

func (s *CustomerService) AdminGetCustomer(id uint64) (*models.User, error) {
	var user models.User
	if err := s.DB.Where("role IN ('customer', 'user')").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("customer not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *CustomerService) AdminToggleStatus(id uint64) error {
	var user models.User
	if err := s.DB.Where("role IN ('customer', 'user')").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("customer not found")
		}
		return err
	}
	if user.Status == "active" {
		user.Status = "blocked"
	} else {
		user.Status = "active"
	}
	return s.DB.Save(&user).Error
}
