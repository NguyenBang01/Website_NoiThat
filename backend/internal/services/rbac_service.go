package services

import (
	"errors"
	"fmt"
	"sync"

	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrPermissionDenied = errors.New("bạn không có quyền thực hiện thao tác này")
)

// RBACService quản lý phân quyền và bộ nhớ đệm (in-memory cache) cho quyền của từng vai trò
type RBACService struct {
	DB        *gorm.DB
	cache     map[uint64][]string // roleID -> danh sách permission codes
	cacheLock sync.RWMutex
}

// NewRBACService khởi tạo dịch vụ RBAC với in-memory cache
func NewRBACService(db *gorm.DB) *RBACService {
	return &RBACService{
		DB:    db,
		cache: make(map[uint64][]string),
	}
}

// InvalidateRole xóa cache quyền của một vai trò cụ thể khi có chỉnh sửa
func (s *RBACService) InvalidateRole(roleID uint64) {
	s.cacheLock.Lock()
	defer s.cacheLock.Unlock()
	delete(s.cache, roleID)
}

// InvalidateAll xóa toàn bộ cache quyền
func (s *RBACService) InvalidateAll() {
	s.cacheLock.Lock()
	defer s.cacheLock.Unlock()
	s.cache = make(map[uint64][]string)
}

// GetRolePermissions lấy danh sách mã quyền của một vai trò (ưu tiên đọc từ cache)
func (s *RBACService) GetRolePermissions(roleID uint64) ([]string, error) {
	// 1. Kiểm tra cache trước (Read Lock)
	s.cacheLock.RLock()
	if perms, exists := s.cache[roleID]; exists {
		s.cacheLock.RUnlock()
		return perms, nil
	}
	s.cacheLock.RUnlock()

	// 2. Không có trong cache -> truy vấn từ CSDL
	var role models.Role
	if err := s.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
		return nil, err
	}

	codes := make([]string, 0, len(role.Permissions))
	for _, p := range role.Permissions {
		codes = append(codes, p.Code)
	}

	// 3. Ghi vào cache (Write Lock)
	s.cacheLock.Lock()
	s.cache[roleID] = codes
	s.cacheLock.Unlock()

	return codes, nil
}

// CheckUserPermission kiểm tra xem một người dùng có sở hữu quyền cụ thể không
func (s *RBACService) CheckUserPermission(userID uint64, requiredPerm string) (bool, error) {
	var user models.User
	if err := s.DB.Preload("RoleModel").First(&user, userID).Error; err != nil {
		return false, err
	}

	// Tài khoản bị khóa -> chặn ngay
	if user.Status != "active" {
		return false, ErrAccountBlocked
	}

	// Super Admin luôn có toàn quyền
	if user.Role == "super_admin" || (user.RoleModel != nil && user.RoleModel.Name == "super_admin") {
		return true, nil
	}

	// Nếu user không có RoleID
	if user.RoleID == nil || *user.RoleID == 0 {
		return false, nil
	}

	perms, err := s.GetRolePermissions(*user.RoleID)
	if err != nil {
		return false, err
	}

	for _, p := range perms {
		if p == requiredPerm || p == "*" {
			return true, nil
		}
	}

	return false, nil
}

// CheckUserAnyPermission kiểm tra xem user có ít nhất một trong các quyền truyền vào không
func (s *RBACService) CheckUserAnyPermission(userID uint64, requiredPerms ...string) (bool, error) {
	var user models.User
	if err := s.DB.Preload("RoleModel").First(&user, userID).Error; err != nil {
		return false, err
	}

	if user.Status != "active" {
		return false, ErrAccountBlocked
	}

	if user.Role == "super_admin" || (user.RoleModel != nil && user.RoleModel.Name == "super_admin") {
		return true, nil
	}

	if user.RoleID == nil || *user.RoleID == 0 {
		return false, nil
	}

	perms, err := s.GetRolePermissions(*user.RoleID)
	if err != nil {
		return false, err
	}

	permMap := make(map[string]bool, len(perms))
	for _, p := range perms {
		permMap[p] = true
	}

	if permMap["*"] {
		return true, nil
	}

	for _, req := range requiredPerms {
		if permMap[req] {
			return true, nil
		}
	}

	return false, nil
}

// GetUserEffectivePermissions lấy toàn bộ danh sách mã quyền hiệu lực của người dùng
func (s *RBACService) GetUserEffectivePermissions(userID uint64) ([]string, *models.Role, error) {
	var user models.User
	if err := s.DB.Preload("RoleModel").First(&user, userID).Error; err != nil {
		return nil, nil, err
	}

	// Nếu là super_admin (kể cả chưa gắn role_id hoặc role="admin")
	if user.Role == "super_admin" || (user.RoleModel != nil && user.RoleModel.Name == "super_admin") {
		var allPerms []models.Permission
		s.DB.Find(&allPerms)
		codes := make([]string, 0, len(allPerms))
		for _, p := range allPerms {
			codes = append(codes, p.Code)
		}
		return codes, user.RoleModel, nil
	}

	if user.RoleID == nil || *user.RoleID == 0 {
		return []string{}, nil, nil
	}

	perms, err := s.GetRolePermissions(*user.RoleID)
	if err != nil {
		return nil, nil, fmt.Errorf("lỗi nạp quyền của vai trò: %w", err)
	}

	return perms, user.RoleModel, nil
}
