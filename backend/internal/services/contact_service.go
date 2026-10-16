package services

import (
	"errors"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"gorm.io/gorm"
)

type ContactService struct {
	DB          *gorm.DB
	MailService *MailService
}

func NewContactService(db *gorm.DB, mailService ...*MailService) *ContactService {
	var ms *MailService
	if len(mailService) > 0 {
		ms = mailService[0]
	}
	return &ContactService{DB: db, MailService: ms}
}

func (s *ContactService) Submit(req dto.ContactRequest) (*models.Contact, error) {
	contact := &models.Contact{
		FullName: req.FullName,
		Email:    req.Email,
		Phone:    req.Phone,
		Subject:  req.Subject,
		Message:  req.Message,
		IsRead:   false,
	}
	err := s.DB.Create(contact).Error
	if err == nil && s.MailService != nil {
		s.MailService.SendContactNotification(contact)
	}
	return contact, err
}

func (s *ContactService) AdminList(page, limit int) ([]models.Contact, int64, error) {
	var contacts []models.Contact
	var total int64
	offset := (page - 1) * limit
	err := s.DB.Model(&models.Contact{}).Count(&total).Offset(offset).Limit(limit).Order("created_at desc").Find(&contacts).Error
	return contacts, total, err
}

func (s *ContactService) MarkAsRead(id uint64) error {
	var contact models.Contact
	if err := s.DB.First(&contact, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("contact not found")
		}
		return err
	}
	contact.IsRead = true
	return s.DB.Save(&contact).Error
}

func (s *ContactService) Delete(id uint64) error {
	res := s.DB.Delete(&models.Contact{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("contact not found")
	}
	return nil
}
