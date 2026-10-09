package services

import (
	"errors"
	"strings"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"gorm.io/gorm"
)

var (
	ErrCategoryNotFound    = errors.New("không tìm thấy danh mục")
	ErrSlugExists          = errors.New("đường dẫn (slug) đã tồn tại")
	ErrInvalidSlug         = errors.New("không tạo được slug từ tên danh mục")
	ErrInvalidParent       = errors.New("danh mục cha không hợp lệ (chỉ hỗ trợ 2 cấp, không được chọn chính nó)")
	ErrCategoryHasChildren = errors.New("danh mục còn danh mục con, hãy xóa hoặc chuyển danh mục con trước")
	ErrCategoryHasProducts = errors.New("danh mục còn sản phẩm, hãy chuyển sản phẩm sang danh mục khác trước")
)

// CategoryService xử lý nghiệp vụ danh mục
type CategoryService struct {
	DB *gorm.DB
}

// ListTree trả danh mục đang hiển thị dạng cây (cho khách xem)
func (s *CategoryService) ListTree() ([]*models.Category, error) {
	cats := []models.Category{}
	if err := s.DB.Where("is_active = ?", true).Order("sort_order ASC, id ASC").Find(&cats).Error; err != nil {
		return nil, err
	}
	return buildTree(cats), nil
}

// ListFlat trả danh sách phẳng. onlyActive=false thì lấy cả danh mục đang ẩn (cho admin)
func (s *CategoryService) ListFlat(onlyActive bool) ([]models.Category, error) {
	cats := []models.Category{}
	q := s.DB.Order("sort_order ASC, id ASC")
	if onlyActive {
		q = q.Where("is_active = ?", true)
	}
	if err := q.Find(&cats).Error; err != nil {
		return nil, err
	}
	return cats, nil
}

// Create thêm danh mục mới
func (s *CategoryService) Create(req dto.CategoryRequest) (*models.Category, error) {
	slug, err := s.resolveSlug(req.Slug, req.Name, 0)
	if err != nil {
		return nil, err
	}
	if err := s.checkParent(req.ParentID, 0); err != nil {
		return nil, err
	}

	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	cat := models.Category{
		ParentID:  req.ParentID,
		Name:      strings.TrimSpace(req.Name),
		Slug:      slug,
		SortOrder: req.SortOrder,
		IsActive:  active,
	}
	if req.Image != "" {
		img := req.Image
		cat.Image = &img
	}

	if err := s.DB.Create(&cat).Error; err != nil {
		return nil, err
	}
	return &cat, nil
}

// Update sửa danh mục
func (s *CategoryService) Update(id uint64, req dto.CategoryRequest) (*models.Category, error) {
	var cat models.Category
	if err := s.DB.First(&cat, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}

	// Không gửi slug thì giữ slug cũ (đổi tên không làm đổi đường dẫn)
	slug := cat.Slug
	if strings.TrimSpace(req.Slug) != "" {
		var err error
		slug, err = s.resolveSlug(req.Slug, req.Name, id)
		if err != nil {
			return nil, err
		}
	}

	if err := s.checkParent(req.ParentID, id); err != nil {
		return nil, err
	}

	var parent interface{} // nil nghĩa là đặt parent_id = NULL
	if req.ParentID != nil {
		parent = *req.ParentID
	}
	var image interface{}
	if req.Image != "" {
		image = req.Image
	}

	updates := map[string]interface{}{
		"name":       strings.TrimSpace(req.Name),
		"slug":       slug,
		"parent_id":  parent,
		"image":      image,
		"sort_order": req.SortOrder,
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := s.DB.Model(&cat).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Đọc lại để trả dữ liệu mới nhất
	if err := s.DB.First(&cat, id).Error; err != nil {
		return nil, err
	}
	return &cat, nil
}

// Delete xóa danh mục (chỉ khi không còn danh mục con và sản phẩm)
func (s *CategoryService) Delete(id uint64) error {
	var cat models.Category
	if err := s.DB.First(&cat, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCategoryNotFound
		}
		return err
	}

	var n int64
	if err := s.DB.Model(&models.Category{}).Where("parent_id = ?", id).Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		return ErrCategoryHasChildren
	}

	if err := s.DB.Table("products").Where("category_id = ?", id).Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		return ErrCategoryHasProducts
	}

	return s.DB.Delete(&cat).Error
}

// resolveSlug tạo slug và kiểm tra trùng. excludeID = id danh mục đang sửa (0 nếu thêm mới)
func (s *CategoryService) resolveSlug(slugInput, name string, excludeID uint64) (string, error) {
	base := strings.TrimSpace(slugInput)
	if base == "" {
		base = name
	}
	slug := utils.Slugify(base)
	if slug == "" {
		return "", ErrInvalidSlug
	}

	var count int64
	q := s.DB.Model(&models.Category{}).Where("slug = ?", slug)
	if excludeID > 0 {
		q = q.Where("id <> ?", excludeID)
	}
	if err := q.Count(&count).Error; err != nil {
		return "", err
	}
	if count > 0 {
		return "", ErrSlugExists
	}
	return slug, nil
}

// checkParent kiểm tra danh mục cha hợp lệ. Chỉ cho phép 2 cấp để tránh vòng lặp.
func (s *CategoryService) checkParent(parentID *uint64, selfID uint64) error {
	if parentID == nil {
		return nil
	}
	if selfID > 0 && *parentID == selfID {
		return ErrInvalidParent
	}

	var parent models.Category
	if err := s.DB.First(&parent, *parentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidParent
		}
		return err
	}
	if parent.ParentID != nil { // cha phải là danh mục gốc
		return ErrInvalidParent
	}

	// Danh mục đang có con thì không được trở thành con của danh mục khác
	if selfID > 0 {
		var n int64
		if err := s.DB.Model(&models.Category{}).Where("parent_id = ?", selfID).Count(&n).Error; err != nil {
			return err
		}
		if n > 0 {
			return ErrInvalidParent
		}
	}
	return nil
}

// buildTree gom danh sách phẳng thành cây cha - con
func buildTree(cats []models.Category) []*models.Category {
	nodes := make(map[uint64]*models.Category, len(cats))
	for i := range cats {
		nodes[cats[i].ID] = &cats[i]
	}

	roots := []*models.Category{}
	for i := range cats {
		c := &cats[i]
		if c.ParentID == nil {
			roots = append(roots, c)
			continue
		}
		if parent, ok := nodes[*c.ParentID]; ok {
			parent.Children = append(parent.Children, c)
		}
	}
	return roots
}
