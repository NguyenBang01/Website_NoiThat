package services

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SettingService struct {
	DB *gorm.DB
}

func NewSettingService(db *gorm.DB) *SettingService {
	return &SettingService{DB: db}
}

func (s *SettingService) GetAll() (map[string]string, error) {
	var settings []models.Setting
	if err := s.DB.Find(&settings).Error; err != nil {
		return nil, err
	}
	res := make(map[string]string)
	for _, setting := range settings {
		res[setting.Key] = setting.Value
	}
	return res, nil
}

func (s *SettingService) GetByKey(key string) (string, error) {
	var setting models.Setting
	if err := s.DB.Where("key = ?", key).First(&setting).Error; err != nil {
		return "", err
	}
	return setting.Value, nil
}

func (s *SettingService) BulkUpdate(items []dto.SettingItem) error {
	var settings []models.Setting
	for _, item := range items {
		settings = append(settings, models.Setting{
			Key:   item.Key,
			Value: item.Value,
		})
	}
	if len(settings) == 0 {
		return nil
	}
	return s.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&settings).Error
}
