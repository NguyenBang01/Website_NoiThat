package services

import (
	"furniture-shop/backend/internal/models"
	"gorm.io/gorm"
)

type NotificationService struct {
	DB *gorm.DB
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	s := &NotificationService{DB: db}
	s.EnsureDefaultNotifications()
	return s
}

// Create tạo một thông báo mới
func (s *NotificationService) Create(userID *uint64, targetRole, title, message, notifType, link string) (*models.Notification, error) {
	if targetRole == "" {
		targetRole = "all"
	}
	if notifType == "" {
		notifType = "system"
	}

	notif := &models.Notification{
		UserID:     userID,
		TargetRole: targetRole,
		Title:      title,
		Message:    message,
		Type:       notifType,
		Link:       link,
		IsRead:     false,
	}

	err := s.DB.Create(notif).Error
	return notif, err
}

// List lấy danh sách thông báo theo vai trò và userID, kèm số lượng chưa đọc
func (s *NotificationService) List(userID uint64, role string, page, limit int) ([]models.Notification, int64, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}
	offset := (page - 1) * limit

	var notifications []models.Notification
	var total int64
	var unreadCount int64

	query := s.DB.Model(&models.Notification{})
	unreadQuery := s.DB.Model(&models.Notification{}).Where("is_read = ?", false)

	if role == "admin" || role == "staff" || role == "super_admin" {
		// Quản trị viên: xem thông báo gửi tới admin hoặc broadcast
		cond := "(target_role IN ('admin', 'staff', 'all') AND user_id IS NULL) OR user_id = ?"
		query = query.Where(cond, userID)
		unreadQuery = unreadQuery.Where(cond, userID)
	} else {
		// Khách hàng: xem thông báo riêng của mình hoặc thông báo chung cho khách hàng
		cond := "(user_id = ?) OR (user_id IS NULL AND target_role IN ('customer', 'all'))"
		query = query.Where(cond, userID)
		unreadQuery = unreadQuery.Where(cond, userID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	_ = unreadQuery.Count(&unreadCount).Error

	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&notifications).Error

	return notifications, total, unreadCount, err
}

// MarkRead đánh dấu 1 thông báo đã đọc
func (s *NotificationService) MarkRead(id uint64, userID uint64, role string) error {
	query := s.DB.Model(&models.Notification{}).Where("id = ?", id)
	if !(role == "admin" || role == "super_admin") {
		query = query.Where("user_id = ? OR (user_id IS NULL AND target_role IN ('customer', 'all'))", userID)
	}
	return query.Update("is_read", true).Error
}

// MarkAllRead đánh dấu tất cả thông báo là đã đọc
func (s *NotificationService) MarkAllRead(userID uint64, role string) error {
	query := s.DB.Model(&models.Notification{}).Where("is_read = ?", false)
	if role == "admin" || role == "staff" || role == "super_admin" {
		query = query.Where("(target_role IN ('admin', 'staff', 'all') AND user_id IS NULL) OR user_id = ?", userID)
	} else {
		query = query.Where("(user_id = ?) OR (user_id IS NULL AND target_role IN ('customer', 'all'))", userID)
	}
	return query.Update("is_read", true).Error
}

// EnsureDefaultNotifications tạo các thông báo mẫu nếu hệ thống chưa có
func (s *NotificationService) EnsureDefaultNotifications() {
	var count int64
	if err := s.DB.Model(&models.Notification{}).Count(&count).Error; err != nil || count > 0 {
		return
	}

	defaults := []models.Notification{
		{
			TargetRole: "customer",
			Title:      "🚚 Cập nhật cước xe tải theo km thực tế",
			Message:    "Hệ thống đã tích hợp bản đồ tính cước giao hàng minh bạch theo khoảng cách thực tế từ showroom.",
			Type:       "system",
			Link:       "/checkout",
			IsRead:     false,
		},
		{
			TargetRole: "customer",
			Title:      "🎁 Ưu đãi thành viên mới: Mã SALE10",
			Message:    "Nhập mã SALE10 để được giảm ngay 10% cho đơn hàng đầu tiên tại Góc Nhà Đẹp.",
			Type:       "promo",
			Link:       "/products",
			IsRead:     false,
		},
		{
			TargetRole: "admin",
			Title:      "🎉 Chào mừng đến với Bảng Quản Trị Góc Nhà Đẹp",
			Message:    "Hệ thống quản lý nội thất đã sẵn sàng. Bạn có thể theo dõi đơn hàng, quản lý kho và xem liên hệ của khách hàng tại đây.",
			Type:       "system",
			Link:       "/admin",
			IsRead:     false,
		},
	}

	for _, n := range defaults {
		_ = s.DB.Create(&n).Error
	}
}

