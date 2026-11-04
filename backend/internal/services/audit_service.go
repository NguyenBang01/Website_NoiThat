package services

import (
	"log"
	"time"

	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type AuditService struct {
	DB *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{DB: db}
}

// Record ghi lại một hành động quan trọng vào bảng audit_logs
func (s *AuditService) Record(userID uint64, action, target, details, ip, userAgent string) {
	go func() {
		entry := models.AuditLog{
			UserID:    userID,
			Action:    action,
			Target:    target,
			Details:   details,
			IP:        ip,
			UserAgent: userAgent,
			CreatedAt: time.Now(),
		}
		if err := s.DB.Create(&entry).Error; err != nil {
			log.Printf("[LỖI AUDIT LOG] Không thể ghi nhận: %v", err)
		}
	}()
}

type AuditLogFilter struct {
	Page      int
	Limit     int
	Action    string
	UserID    uint64
	StartDate string
	EndDate   string
}

// List truy vấn danh sách audit logs kèm phân trang
func (s *AuditService) List(f AuditLogFilter) ([]models.AuditLog, int64, error) {
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 20
	}

	query := s.DB.Model(&models.AuditLog{}).Preload("User")

	if f.Action != "" {
		query = query.Where("action LIKE ?", "%"+f.Action+"%")
	}
	if f.UserID > 0 {
		query = query.Where("user_id = ?", f.UserID)
	}
	if f.StartDate != "" {
		query = query.Where("created_at >= ?", f.StartDate)
	}
	if f.EndDate != "" {
		query = query.Where("created_at <= ?", f.EndDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var logs []models.AuditLog
	offset := (f.Page - 1) * f.Limit
	err := query.Order("id desc").Offset(offset).Limit(f.Limit).Find(&logs).Error
	return logs, total, err
}
