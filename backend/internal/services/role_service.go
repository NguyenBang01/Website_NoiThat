package services

import (
	"errors"
	"fmt"
	"strings"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrRoleNameExists       = errors.New("mã định danh vai trò này đã tồn tại")
	ErrCannotDeleteSystem   = errors.New("không thể xóa hoặc đổi mã của vai trò hệ thống mặc định")
	ErrRoleHasActiveUsers   = errors.New("không thể xóa vai trò vì đang có nhân viên được gán vai trò này")
	ErrCannotEditSystemRole = errors.New("không thể sửa mã định danh của vai trò hệ thống mặc định")
)

type RoleService struct {
	DB           *gorm.DB
	RBACService  *RBACService
	AuditService *AuditService
}

func NewRoleService(db *gorm.DB, rbac *RBACService, audit *AuditService) *RoleService {
	return &RoleService{
		DB:           db,
		RBACService:  rbac,
		AuditService: audit,
	}
}

// ListRoles lấy toàn bộ danh sách vai trò kèm số lượng nhân viên đang giữ vai trò
func (s *RoleService) ListRoles() ([]dto.RoleResponse, error) {
	var roles []models.Role
	if err := s.DB.Preload("Permissions").Order("id asc").Find(&roles).Error; err != nil {
		return nil, err
	}

	responses := make([]dto.RoleResponse, 0, len(roles))
	for _, r := range roles {
		var userCount int64
		s.DB.Model(&models.User{}).Where("role_id = ?", r.ID).Count(&userCount)

		responses = append(responses, dto.RoleResponse{
			ID:          r.ID,
			Name:        r.Name,
			DisplayName: r.DisplayName,
			Description: r.Description,
			IsSystem:    r.IsSystem,
			Permissions: r.Permissions,
			UsersCount:  userCount,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		})
	}

	return responses, nil
}

// GetRole lấy thông tin chi tiết một vai trò kèm danh sách quyền
func (s *RoleService) GetRole(id uint64) (*dto.RoleResponse, error) {
	var role models.Role
	if err := s.DB.Preload("Permissions").First(&role, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRoleNotFound
		}
		return nil, err
	}

	var userCount int64
	s.DB.Model(&models.User{}).Where("role_id = ?", role.ID).Count(&userCount)

	return &dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsSystem:    role.IsSystem,
		Permissions: role.Permissions,
		UsersCount:  userCount,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}, nil
}

// CreateRole tạo mới vai trò và gán danh sách quyền ban đầu
func (s *RoleService) CreateRole(req dto.CreateRoleRequest, actorID uint64, ip, ua string) (*dto.RoleResponse, error) {
	name := strings.ToLower(strings.TrimSpace(req.Name))

	// Kiểm tra trùng mã name
	var count int64
	if err := s.DB.Model(&models.Role{}).Where("name = ?", name).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrRoleNameExists
	}

	role := models.Role{
		Name:        name,
		DisplayName: strings.TrimSpace(req.DisplayName),
		Description: strings.TrimSpace(req.Description),
		IsSystem:    false,
	}

	if err := s.DB.Create(&role).Error; err != nil {
		return nil, err
	}

	// Gán quyền nếu có danh sách permission_ids
	if len(req.PermissionIDs) > 0 {
		var perms []models.Permission
		s.DB.Where("id IN ?", req.PermissionIDs).Find(&perms)
		if err := s.DB.Model(&role).Association("Permissions").Replace(&perms); err != nil {
			return nil, err
		}
		role.Permissions = perms
	}

	s.AuditService.Record(actorID, "role.create", fmt.Sprintf("Vai trò: %s (#%d)", role.DisplayName, role.ID),
		fmt.Sprintf("Tạo mới vai trò tùy chỉnh: %s (%s)", role.DisplayName, role.Name), ip, ua)

	return &dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsSystem:    role.IsSystem,
		Permissions: role.Permissions,
		UsersCount:  0,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}, nil
}

// UpdateRole cập nhật tên, mô tả và ma trận quyền của vai trò
func (s *RoleService) UpdateRole(id uint64, req dto.UpdateRoleRequest, actorID uint64, ip, ua string) (*dto.RoleResponse, error) {
	var role models.Role
	if err := s.DB.Preload("Permissions").First(&role, id).Error; err != nil {
		return nil, ErrRoleNotFound
	}

	role.DisplayName = strings.TrimSpace(req.DisplayName)
	role.Description = strings.TrimSpace(req.Description)

	if err := s.DB.Save(&role).Error; err != nil {
		return nil, err
	}

	// Cập nhật ma trận quyền (chỉ cho phép sửa quyền nếu không phải super_admin)
	if role.Name != "super_admin" {
		var perms []models.Permission
		if len(req.PermissionIDs) > 0 {
			s.DB.Where("id IN ?", req.PermissionIDs).Find(&perms)
		}
		if err := s.DB.Model(&role).Association("Permissions").Replace(&perms); err != nil {
			return nil, err
		}
		role.Permissions = perms
	}

	// Xóa cache của vai trò này để quyền mới có hiệu lực ngay lập tức!
	s.RBACService.InvalidateRole(role.ID)

	s.AuditService.Record(actorID, "role.update", fmt.Sprintf("Vai trò: %s (#%d)", role.DisplayName, role.ID),
		fmt.Sprintf("Cập nhật quyền và thông tin vai trò: %s", role.DisplayName), ip, ua)

	var userCount int64
	s.DB.Model(&models.User{}).Where("role_id = ?", role.ID).Count(&userCount)

	return &dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsSystem:    role.IsSystem,
		Permissions: role.Permissions,
		UsersCount:  userCount,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}, nil
}

// DeleteRole xóa vai trò (không xóa vai trò hệ thống và vai trò đang có nhân viên)
func (s *RoleService) DeleteRole(id uint64, actorID uint64, ip, ua string) error {
	var role models.Role
	if err := s.DB.First(&role, id).Error; err != nil {
		return ErrRoleNotFound
	}

	if role.IsSystem {
		return ErrCannotDeleteSystem
	}

	var userCount int64
	s.DB.Model(&models.User{}).Where("role_id = ?", role.ID).Count(&userCount)
	if userCount > 0 {
		return ErrRoleHasActiveUsers
	}

	// Xóa liên kết quyền trước
	s.DB.Model(&role).Association("Permissions").Clear()

	if err := s.DB.Delete(&role).Error; err != nil {
		return err
	}

	s.RBACService.InvalidateRole(role.ID)

	s.AuditService.Record(actorID, "role.delete", fmt.Sprintf("Vai trò: %s (#%d)", role.DisplayName, role.ID),
		fmt.Sprintf("Xóa vai trò: %s (%s)", role.DisplayName, role.Name), ip, ua)

	return nil
}

var moduleNames = map[string]string{
	"dashboard": "Bảng điều khiển tổng quan",
	"product":   "Quản lý sản phẩm",
	"category":  "Quản lý danh mục",
	"brand":     "Quản lý thương hiệu",
	"inventory": "Quản lý tồn kho",
	"order":     "Quản lý đơn hàng",
	"voucher":   "Quản lý mã giảm giá",
	"review":    "Quản lý đánh giá",
	"customer":  "Quản lý khách hàng",
	"contact":   "Quản lý liên hệ & góp ý",
	"banner":    "Quản lý banner quảng cáo",
	"report":    "Báo cáo & doanh thu",
	"staff":     "Quản lý nhân viên",
	"role":      "Quản lý vai trò & quyền hạn",
	"setting":   "Cài đặt hệ thống",
	"audit_log": "Nhật ký hoạt động hệ thống",
}

// ListPermissionsGrouped trả về danh sách tất cả các quyền được nhóm theo module
func (s *RoleService) ListPermissionsGrouped() ([]dto.PermissionGroup, error) {
	var permissions []models.Permission
	if err := s.DB.Order("module asc, id asc").Find(&permissions).Error; err != nil {
		return nil, err
	}

	// Duy trì thứ tự nhóm module đẹp mắt
	moduleOrder := []string{
		"dashboard",
		"product",
		"category",
		"brand",
		"inventory",
		"order",
		"voucher",
		"review",
		"customer",
		"contact",
		"banner",
		"report",
		"staff",
		"role",
		"setting",
		"audit_log",
	}

	groupMap := make(map[string][]models.Permission)
	for _, p := range permissions {
		groupMap[p.Module] = append(groupMap[p.Module], p)
	}

	var result []dto.PermissionGroup
	for _, m := range moduleOrder {
		if perms, exists := groupMap[m]; exists {
			name := moduleNames[m]
			if name == "" {
				name = m
			}
			result = append(result, dto.PermissionGroup{
				Module:      m,
				ModuleName:  name,
				Permissions: perms,
			})
			delete(groupMap, m)
		}
	}

	// Bổ sung các module khác nếu có phát sinh
	for m, perms := range groupMap {
		result = append(result, dto.PermissionGroup{
			Module:      m,
			ModuleName:  m,
			Permissions: perms,
		})
	}

	return result, nil
}
