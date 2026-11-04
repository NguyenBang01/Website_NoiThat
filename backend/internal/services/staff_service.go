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

var (
	ErrCannotSelfDelete      = errors.New("bạn không thể tự xóa tài khoản của chính mình")
	ErrCannotSelfLock        = errors.New("bạn không thể tự khóa tài khoản của chính mình")
	ErrCannotSelfDemote      = errors.New("bạn không thể tự hạ quyền hạn của chính mình")
	ErrCannotDeleteLastAdmin = errors.New("không thể xóa hoặc khóa quản trị viên tối cao (super_admin) duy nhất còn lại")
	ErrStaffNotFound         = errors.New("không tìm thấy nhân viên yêu cầu")
	ErrRoleNotFound          = errors.New("vai trò được chọn không tồn tại")
)

type StaffService struct {
	DB           *gorm.DB
	AuditService *AuditService
	RBACService  *RBACService
}

func NewStaffService(db *gorm.DB, audit *AuditService, rbac *RBACService) *StaffService {
	return &StaffService{
		DB:           db,
		AuditService: audit,
		RBACService:  rbac,
	}
}

// ListStaff lấy danh sách nhân viên kèm tìm kiếm, lọc theo vai trò và trạng thái
func (s *StaffService) ListStaff(q dto.StaffQuery) ([]dto.StaffResponse, int64, error) {
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.Limit <= 0 || q.Limit > 100 {
		q.Limit = 10
	}

	// Nhân viên là những tài khoản có vai trò nội bộ (không phải customer thông thường hoặc có RoleID)
	query := s.DB.Model(&models.User{}).
		Preload("RoleModel").
		Where("role != 'customer' OR role_id IS NOT NULL")

	if q.Search != "" {
		sTerm := "%" + strings.TrimSpace(q.Search) + "%"
		query = query.Where("(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)", sTerm, sTerm, sTerm)
	}

	if q.RoleID > 0 {
		query = query.Where("role_id = ?", q.RoleID)
	}

	if q.Status != "" {
		query = query.Where("status = ?", q.Status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var users []models.User
	offset := (q.Page - 1) * q.Limit
	if err := query.Order("id desc").Offset(offset).Limit(q.Limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	responses := make([]dto.StaffResponse, 0, len(users))
	for _, u := range users {
		responses = append(responses, dto.StaffResponse{
			ID:          u.ID,
			FullName:    u.FullName,
			Email:       u.Email,
			Phone:       u.Phone,
			Role:        u.Role,
			RoleID:      u.RoleID,
			RoleDetail:  u.RoleModel,
			Status:      u.Status,
			LastLoginAt: u.LastLoginAt,
			CreatedAt:   u.CreatedAt,
			UpdatedAt:   u.UpdatedAt,
		})
	}

	return responses, total, nil
}

// GetStaff lấy thông tin chi tiết một nhân viên
func (s *StaffService) GetStaff(id uint64) (*dto.StaffResponse, error) {
	var user models.User
	if err := s.DB.Preload("RoleModel").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStaffNotFound
		}
		return nil, err
	}

	return &dto.StaffResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		Phone:       user.Phone,
		Role:        user.Role,
		RoleID:      user.RoleID,
		RoleDetail:  user.RoleModel,
		Status:      user.Status,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}, nil
}

// CreateStaff thêm mới nhân viên
func (s *StaffService) CreateStaff(req dto.CreateStaffRequest, actorID uint64, ip, ua string) (*dto.StaffResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	// Kiểm tra trùng email
	var count int64
	if err := s.DB.Unscoped().Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("email này đã được sử dụng trong hệ thống")
	}

	// Kiểm tra vai trò tồn tại
	var role models.Role
	if err := s.DB.First(&role, req.RoleID).Error; err != nil {
		return nil, ErrRoleNotFound
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	roleID := req.RoleID
	user := models.User{
		FullName:     strings.TrimSpace(req.FullName),
		Email:        email,
		PasswordHash: hash,
		Role:         role.Name, // đồng bộ mã role vào cột role
		RoleID:       &roleID,
		Status:       "active",
	}
	if req.Phone != "" {
		p := strings.TrimSpace(req.Phone)
		user.Phone = &p
	}

	if err := s.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	user.RoleModel = &role

	// Ghi audit log
	s.AuditService.Record(actorID, "staff.create", fmt.Sprintf("Nhân viên: %s (#%d)", user.Email, user.ID),
		fmt.Sprintf("Tạo nhân viên mới với vai trò: %s (%s)", role.DisplayName, role.Name), ip, ua)

	return &dto.StaffResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		Phone:       user.Phone,
		Role:        user.Role,
		RoleID:      user.RoleID,
		RoleDetail:  user.RoleModel,
		Status:      user.Status,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}, nil
}

// UpdateStaff chỉnh sửa thông tin nhân viên
func (s *StaffService) UpdateStaff(id uint64, req dto.UpdateStaffRequest, actorID uint64, ip, ua string) (*dto.StaffResponse, error) {
	var user models.User
	if err := s.DB.Preload("RoleModel").First(&user, id).Error; err != nil {
		return nil, ErrStaffNotFound
	}

	// Kiểm tra nếu tự hạ quyền của chính mình
	if user.ID == actorID && user.RoleID != nil && *user.RoleID != req.RoleID {
		return nil, ErrCannotSelfDemote
	}

	// Kiểm tra vai trò mới có tồn tại
	var newRole models.Role
	if err := s.DB.First(&newRole, req.RoleID).Error; err != nil {
		return nil, ErrRoleNotFound
	}

	// Nếu hạ quyền của super_admin duy nhất
	if user.Role == "super_admin" && newRole.Name != "super_admin" {
		if s.isLastSuperAdmin(user.ID) {
			return nil, ErrCannotDeleteLastAdmin
		}
	}

	roleID := req.RoleID
	user.FullName = strings.TrimSpace(req.FullName)
	user.Role = newRole.Name
	user.RoleID = &roleID
	if req.Phone != "" {
		p := strings.TrimSpace(req.Phone)
		user.Phone = &p
	} else {
		user.Phone = nil
	}

	if err := s.DB.Save(&user).Error; err != nil {
		return nil, err
	}

	user.RoleModel = &newRole

	s.AuditService.Record(actorID, "staff.update", fmt.Sprintf("Nhân viên: %s (#%d)", user.Email, user.ID),
		fmt.Sprintf("Cập nhật thông tin và vai trò mới: %s", newRole.DisplayName), ip, ua)

	return &dto.StaffResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		Phone:       user.Phone,
		Role:        user.Role,
		RoleID:      user.RoleID,
		RoleDetail:  user.RoleModel,
		Status:      user.Status,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}, nil
}

// ChangeStaffStatus khóa hoặc mở khóa tài khoản nhân viên
func (s *StaffService) ChangeStaffStatus(id uint64, status string, actorID uint64, ip, ua string) error {
	if id == actorID {
		return ErrCannotSelfLock
	}

	var user models.User
	if err := s.DB.First(&user, id).Error; err != nil {
		return ErrStaffNotFound
	}

	// Không cho khóa super_admin cuối cùng
	if status == "locked" && (user.Role == "super_admin") {
		if s.isLastSuperAdmin(user.ID) {
			return ErrCannotDeleteLastAdmin
		}
	}

	if err := s.DB.Model(&user).Update("status", status).Error; err != nil {
		return err
	}

	actionName := "staff.lock"
	detailMsg := "Khóa tài khoản nhân viên"
	if status == "active" {
		actionName = "staff.unlock"
		detailMsg = "Mở khóa tài khoản nhân viên"
	}

	s.AuditService.Record(actorID, actionName, fmt.Sprintf("Nhân viên: %s (#%d)", user.Email, user.ID), detailMsg, ip, ua)
	return nil
}

// ResetStaffPassword đặt lại mật khẩu cho nhân viên
func (s *StaffService) ResetStaffPassword(id uint64, newPassword string, actorID uint64, ip, ua string) error {
	var user models.User
	if err := s.DB.First(&user, id).Error; err != nil {
		return ErrStaffNotFound
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	if err := s.DB.Model(&user).Update("password_hash", hash).Error; err != nil {
		return err
	}

	s.AuditService.Record(actorID, "staff.reset_password", fmt.Sprintf("Nhân viên: %s (#%d)", user.Email, user.ID),
		"Đặt lại mật khẩu cho nhân viên", ip, ua)
	return nil
}

// DeleteStaff xóa nhân viên
func (s *StaffService) DeleteStaff(id uint64, actorID uint64, ip, ua string) error {
	if id == actorID {
		return ErrCannotSelfDelete
	}

	var user models.User
	if err := s.DB.First(&user, id).Error; err != nil {
		return ErrStaffNotFound
	}

	if user.Role == "super_admin" && s.isLastSuperAdmin(user.ID) {
		return ErrCannotDeleteLastAdmin
	}

	_ = s.DB.Model(&user).Update("deleted_by", actorID).Error

	if err := s.DB.Delete(&user).Error; err != nil {
		return err
	}

	s.AuditService.Record(actorID, "staff.delete", fmt.Sprintf("Nhân viên: %s (#%d)", user.Email, user.ID),
		"Xóa nhân viên khỏi hệ thống", ip, ua)
	return nil
}

func (s *StaffService) isLastSuperAdmin(targetUserID uint64) bool {
	var count int64
	s.DB.Model(&models.User{}).
		Where("role = 'super_admin' AND id != ? AND status = 'active'", targetUserID).
		Count(&count)
	return count == 0
}
