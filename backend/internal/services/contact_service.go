package services

import (
	"errors"
	"fmt"
	"strings"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"
	"gorm.io/gorm"
)

type ContactService struct {
	DB                  *gorm.DB
	MailService         *MailService
	NotificationService *NotificationService
}

func NewContactService(db *gorm.DB, mailService ...*MailService) *ContactService {
	var ms *MailService
	if len(mailService) > 0 {
		ms = mailService[0]
	}
	return &ContactService{DB: db, MailService: ms}
}

func (s *ContactService) SetNotificationService(ns *NotificationService) {
	s.NotificationService = ns
}

func (s *ContactService) Submit(req dto.ContactRequest) (*models.Contact, error) {
	validName, err := utils.ValidateFullName(req.FullName)
	if err != nil {
		return nil, err
	}
	if _, err := utils.ValidateEmail(req.Email); err != nil {
		return nil, err
	}
	var cleanPhone *string
	if req.Phone != nil && strings.TrimSpace(*req.Phone) != "" {
		p, err := utils.NormalizeAndValidateVNPhone(*req.Phone)
		if err != nil {
			return nil, err
		}
		cleanPhone = &p
	}
	if strings.TrimSpace(req.Subject) == "" || strings.TrimSpace(req.Message) == "" {
		return nil, errors.New("tiêu đề và nội dung tin nhắn không được để trống")
	}

	contact := &models.Contact{
		FullName: validName,
		Email:    strings.ToLower(strings.TrimSpace(req.Email)),
		Phone:    cleanPhone,
		Subject:  strings.TrimSpace(req.Subject),
		Message:  strings.TrimSpace(req.Message),
		IsRead:   false,
	}
	err = s.DB.Create(contact).Error
	if err == nil {
		if s.MailService != nil {
			s.MailService.SendContactNotification(contact)
		}
		if s.NotificationService != nil {
			_, _ = s.NotificationService.Create(
				nil,
				"admin",
				"✉️ Liên hệ mới từ: "+contact.FullName,
				fmt.Sprintf("Tiêu đề: %s. Tin nhắn: %s", contact.Subject, contact.Message),
				"contact",
				"/admin/contacts",
			)
		}
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
