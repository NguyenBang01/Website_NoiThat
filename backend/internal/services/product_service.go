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
	ErrProductNotFound = errors.New("không tìm thấy sản phẩm")
	ErrInvalidInput    = errors.New("dữ liệu không hợp lệ")
	ErrConflict        = errors.New("dữ liệu bị trùng")
)

// ProductService xử lý nghiệp vụ sản phẩm
type ProductService struct {
	DB *gorm.DB
}

// ProductListParams là điều kiện lọc danh sách sản phẩm
type ProductListParams struct {
	Page       int
	Limit      int
	Q          string // tìm theo tên hoặc SKU
	CategoryID uint64 // gồm cả danh mục con
	Status     string
}

// AdminList trả danh sách sản phẩm cho admin (có lọc + phân trang)
func (s *ProductService) AdminList(p ProductListParams) ([]models.Product, int64, error) {
	var categoryIDs []uint64
	if p.CategoryID > 0 {
		ids, err := s.categoryIDsWithChildren(p.CategoryID)
		if err != nil {
			return nil, 0, err
		}
		categoryIDs = ids
	}

	// Tạo query mới mỗi lần gọi để Count và Find không ảnh hưởng nhau
	buildQuery := func() *gorm.DB {
		q := s.DB.Model(&models.Product{})
		if p.Q != "" {
			like := "%" + p.Q + "%"
			q = q.Where("(name LIKE ? OR sku LIKE ?)", like, like)
		}
		if len(categoryIDs) > 0 {
			q = q.Where("category_id IN ?", categoryIDs)
		}
		if p.Status != "" {
			q = q.Where("status = ?", p.Status)
		}
		return q
	}

	var total int64
	if err := buildQuery().Count(&total).Error; err != nil {
		return nil, 0, err
	}

	products := []models.Product{}
	err := buildQuery().
		Preload("Category").
		Preload("Variants", func(db *gorm.DB) *gorm.DB { return db.Order("id ASC") }).
		Preload("Images", func(db *gorm.DB) *gorm.DB { return db.Order("is_primary DESC, sort_order ASC, id ASC") }).
		Order("id DESC").
		Offset((p.Page - 1) * p.Limit).
		Limit(p.Limit).
		Find(&products).Error
	if err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

// GetByID lấy chi tiết một sản phẩm kèm danh mục, thương hiệu, biến thể, ảnh
func (s *ProductService) GetByID(id uint64) (*models.Product, error) {
	var p models.Product
	err := s.DB.
		Preload("Category").
		Preload("Brand").
		Preload("Variants", func(db *gorm.DB) *gorm.DB { return db.Order("id ASC") }).
		Preload("Images", func(db *gorm.DB) *gorm.DB { return db.Order("is_primary DESC, sort_order ASC, id ASC") }).
		First(&p, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &p, nil
}

// Create thêm sản phẩm mới cùng biến thể và ảnh (trong một transaction)
func (s *ProductService) Create(req dto.ProductRequest) (*models.Product, error) {
	if err := validateProductRequest(&req); err != nil {
		return nil, err
	}
	if err := s.checkRefs(req, 0); err != nil {
		return nil, err
	}
	slug, err := s.resolveSlug(req.Slug, req.Name, 0)
	if err != nil {
		return nil, err
	}
	base, sale := calcDisplayPrice(req.Variants)

	product := models.Product{
		CategoryID:  req.CategoryID,
		BrandID:     req.BrandID,
		Name:        strings.TrimSpace(req.Name),
		Slug:        slug,
		SKU:         req.SKU,
		ShortDesc:   strPtr(req.ShortDesc),
		Description: strPtr(req.Description),
		BasePrice:   base,
		SalePrice:   sale,
		Warranty:    strPtr(req.Warranty),
		Status:      req.Status,
		IsFeatured:  req.IsFeatured,
	}

	err = s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&product).Error; err != nil {
			return err
		}

		skuToID := map[string]uint64{}
		for _, in := range req.Variants {
			v := newVariant(product.ID, in)
			if err := tx.Create(&v).Error; err != nil {
				return err
			}
			skuToID[in.SKU] = v.ID
		}

		return createImages(tx, product.ID, req.Images, skuToID)
	})
	if err != nil {
		return nil, err
	}

	return s.GetByID(product.ID)
}

// Update sửa sản phẩm, đồng bộ danh sách biến thể và (nếu có gửi) danh sách ảnh
func (s *ProductService) Update(id uint64, req dto.ProductRequest) (*models.Product, error) {
	var product models.Product
	if err := s.DB.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	if err := validateProductRequest(&req); err != nil {
		return nil, err
	}
	if err := s.checkRefs(req, id); err != nil {
		return nil, err
	}

	// Không gửi slug thì giữ slug cũ
	slug := product.Slug
	if strings.TrimSpace(req.Slug) != "" {
		var err error
		slug, err = s.resolveSlug(req.Slug, req.Name, id)
		if err != nil {
			return nil, err
		}
	}

	base, sale := calcDisplayPrice(req.Variants)

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var salePrice interface{}
		if sale != nil {
			salePrice = *sale
		}
		var brand interface{}
		if req.BrandID != nil {
			brand = *req.BrandID
		}

		updates := map[string]interface{}{
			"category_id": req.CategoryID,
			"brand_id":    brand,
			"name":        strings.TrimSpace(req.Name),
			"slug":        slug,
			"sku":         req.SKU,
			"short_desc":  nullIfEmpty(req.ShortDesc),
			"description": nullIfEmpty(req.Description),
			"base_price":  base,
			"sale_price":  salePrice,
			"warranty":    nullIfEmpty(req.Warranty),
			"status":      req.Status,
			"is_featured": req.IsFeatured,
		}
		if err := tx.Model(&product).Updates(updates).Error; err != nil {
			return err
		}

		skuToID, err := syncVariants(tx, id, req.Variants)
		if err != nil {
			return err
		}

		// Chỉ thay ảnh khi request có gửi trường "images"
		if req.Images != nil {
			if err := tx.Where("product_id = ?", id).Delete(&models.ProductImage{}).Error; err != nil {
				return err
			}
			if err := createImages(tx, id, req.Images, skuToID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.GetByID(id)
}

// Delete xóa mềm sản phẩm (đánh dấu deleted_at, dữ liệu vẫn còn trong database)
func (s *ProductService) Delete(id uint64) error {
	var product models.Product
	if err := s.DB.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrProductNotFound
		}
		return err
	}
	return s.DB.Delete(&product).Error
}

// ---------------------------------------------------------------------
// Các hàm hỗ trợ
// ---------------------------------------------------------------------

// validateProductRequest chuẩn hóa và kiểm tra logic của request
func validateProductRequest(req *dto.ProductRequest) error {
	req.SKU = strings.ToUpper(strings.TrimSpace(req.SKU))
	if req.SKU == "" {
		return fmt.Errorf("%w: SKU không được để trống", ErrInvalidInput)
	}
	if req.Status == "" {
		req.Status = "draft"
	}

	skus := map[string]bool{}
	combos := map[string]bool{}
	for i := range req.Variants {
		v := &req.Variants[i]
		v.SKU = strings.ToUpper(strings.TrimSpace(v.SKU))
		v.Color = strings.TrimSpace(v.Color)
		v.Size = strings.TrimSpace(v.Size)
		v.Material = strings.TrimSpace(v.Material)

		if v.SKU == "" {
			return fmt.Errorf("%w: SKU của biến thể không được để trống", ErrInvalidInput)
		}
		if v.SalePrice != nil && *v.SalePrice > v.Price {
			return fmt.Errorf("%w: biến thể %s có giá khuyến mãi lớn hơn giá gốc", ErrInvalidInput, v.SKU)
		}
		if skus[v.SKU] {
			return fmt.Errorf("%w: SKU biến thể %s bị lặp trong danh sách", ErrInvalidInput, v.SKU)
		}
		skus[v.SKU] = true

		combo := strings.ToLower(v.Color + "|" + v.Size + "|" + v.Material)
		if combos[combo] {
			return fmt.Errorf("%w: biến thể %s trùng tổ hợp màu/kích thước/chất liệu với biến thể khác", ErrInvalidInput, v.SKU)
		}
		combos[combo] = true
	}

	// Ảnh: kiểm tra biến thể được tham chiếu, và đảm bảo có đúng 1 ảnh chính
	primaryIdx := -1
	for i := range req.Images {
		img := &req.Images[i]
		img.URL = strings.TrimSpace(img.URL)
		img.VariantSKU = strings.ToUpper(strings.TrimSpace(img.VariantSKU))
		if img.VariantSKU != "" && !skus[img.VariantSKU] {
			return fmt.Errorf("%w: ảnh tham chiếu variant_sku %s không có trong danh sách biến thể", ErrInvalidInput, img.VariantSKU)
		}
		if img.IsPrimary && primaryIdx == -1 {
			primaryIdx = i
		}
	}
	if len(req.Images) > 0 {
		if primaryIdx == -1 {
			primaryIdx = 0
		}
		for i := range req.Images {
			req.Images[i].IsPrimary = (i == primaryIdx)
		}
	}
	return nil
}

// checkRefs kiểm tra danh mục, thương hiệu tồn tại và SKU không bị trùng
func (s *ProductService) checkRefs(req dto.ProductRequest, productID uint64) error {
	var n int64

	if err := s.DB.Model(&models.Category{}).Where("id = ?", req.CategoryID).Count(&n).Error; err != nil {
		return err
	}
	if n == 0 {
		return fmt.Errorf("%w: danh mục không tồn tại", ErrInvalidInput)
	}

	if req.BrandID != nil {
		if err := s.DB.Model(&models.Brand{}).Where("id = ?", *req.BrandID).Count(&n).Error; err != nil {
			return err
		}
		if n == 0 {
			return fmt.Errorf("%w: thương hiệu không tồn tại", ErrInvalidInput)
		}
	}

	// SKU sản phẩm (Unscoped: tính cả sản phẩm đã xóa mềm vì database vẫn giữ khóa duy nhất)
	q := s.DB.Unscoped().Model(&models.Product{}).Where("sku = ?", req.SKU)
	if productID > 0 {
		q = q.Where("id <> ?", productID)
	}
	if err := q.Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		return fmt.Errorf("%w: SKU sản phẩm %s đã tồn tại", ErrConflict, req.SKU)
	}

	// SKU từng biến thể
	for _, v := range req.Variants {
		vq := s.DB.Model(&models.ProductVariant{}).Where("sku = ?", v.SKU)
		if v.ID > 0 {
			vq = vq.Where("id <> ?", v.ID)
		}
		if err := vq.Count(&n).Error; err != nil {
			return err
		}
		if n > 0 {
			return fmt.Errorf("%w: SKU biến thể %s đã tồn tại", ErrConflict, v.SKU)
		}
	}
	return nil
}

// resolveSlug tạo slug cho sản phẩm.
// Admin tự nhập slug mà trùng -> báo lỗi. Slug tự tạo từ tên mà trùng -> tự thêm -2, -3...
func (s *ProductService) resolveSlug(slugInput, name string, excludeID uint64) (string, error) {
	explicit := strings.TrimSpace(slugInput) != ""
	source := name
	if explicit {
		source = slugInput
	}
	base := utils.Slugify(source)
	if base == "" {
		return "", fmt.Errorf("%w: không tạo được slug từ tên sản phẩm", ErrInvalidInput)
	}

	candidate := base
	for i := 2; ; i++ {
		var n int64
		q := s.DB.Unscoped().Model(&models.Product{}).Where("slug = ?", candidate)
		if excludeID > 0 {
			q = q.Where("id <> ?", excludeID)
		}
		if err := q.Count(&n).Error; err != nil {
			return "", err
		}
		if n == 0 {
			return candidate, nil
		}
		if explicit {
			return "", fmt.Errorf("%w: slug %s đã tồn tại", ErrConflict, candidate)
		}
		candidate = fmt.Sprintf("%s-%d", base, i)
	}
}

// categoryIDsWithChildren trả id danh mục cùng id các danh mục con
func (s *ProductService) categoryIDsWithChildren(id uint64) ([]uint64, error) {
	ids := []uint64{id}
	var children []uint64
	if err := s.DB.Model(&models.Category{}).Where("parent_id = ?", id).Pluck("id", &children).Error; err != nil {
		return nil, err
	}
	return append(ids, children...), nil
}

// syncVariants đồng bộ biến thể trong database theo danh sách gửi lên:
//   - có id  -> cập nhật
//   - không có id -> thêm mới
//   - biến thể cũ không còn trong danh sách -> xóa; nếu đã từng được đặt hàng thì chỉ ngừng bán
func syncVariants(tx *gorm.DB, productID uint64, inputs []dto.VariantInput) (map[string]uint64, error) {
	var existing []models.ProductVariant
	if err := tx.Where("product_id = ?", productID).Find(&existing).Error; err != nil {
		return nil, err
	}
	existingByID := map[uint64]bool{}
	for _, e := range existing {
		existingByID[e.ID] = true
	}

	keep := map[uint64]bool{}
	for _, in := range inputs {
		if in.ID > 0 {
			if !existingByID[in.ID] {
				return nil, fmt.Errorf("%w: biến thể id %d không thuộc sản phẩm này", ErrInvalidInput, in.ID)
			}
			keep[in.ID] = true
		}
	}

	// 1. Xử lý biến thể bị bỏ khỏi danh sách
	for _, e := range existing {
		if keep[e.ID] {
			continue
		}
		var used int64
		if err := tx.Table("order_items").Where("variant_id = ?", e.ID).Count(&used).Error; err != nil {
			return nil, err
		}
		if used > 0 {
			if err := tx.Model(&models.ProductVariant{}).Where("id = ?", e.ID).Update("is_active", false).Error; err != nil {
				return nil, err
			}
		} else {
			if err := tx.Delete(&models.ProductVariant{}, e.ID).Error; err != nil {
				return nil, err
			}
		}
	}

	// 2. Cập nhật biến thể cũ, thêm biến thể mới
	skuToID := map[string]uint64{}
	for _, in := range inputs {
		if in.ID > 0 {
			var salePrice interface{}
			if in.SalePrice != nil {
				salePrice = *in.SalePrice
			}
			updates := map[string]interface{}{
				"sku":            in.SKU,
				"color":          nullIfEmpty(in.Color),
				"size":           nullIfEmpty(in.Size),
				"material":       nullIfEmpty(in.Material),
				"price":          in.Price,
				"sale_price":     salePrice,
				"stock_quantity": in.StockQuantity,
				"is_active":      isActive(in),
			}
			if err := tx.Model(&models.ProductVariant{}).Where("id = ?", in.ID).Updates(updates).Error; err != nil {
				return nil, err
			}
			skuToID[in.SKU] = in.ID
		} else {
			v := newVariant(productID, in)
			if err := tx.Create(&v).Error; err != nil {
				return nil, err
			}
			skuToID[in.SKU] = v.ID
		}
	}
	return skuToID, nil
}

// createImages thêm danh sách ảnh cho sản phẩm
func createImages(tx *gorm.DB, productID uint64, images []dto.ImageInput, skuToID map[string]uint64) error {
	for _, in := range images {
		img := models.ProductImage{
			ProductID: productID,
			URL:       in.URL,
			Alt:       strPtr(in.Alt),
			IsPrimary: in.IsPrimary,
			SortOrder: in.SortOrder,
		}
		if in.VariantSKU != "" {
			variantID := skuToID[in.VariantSKU]
			img.VariantID = &variantID
		}
		if err := tx.Create(&img).Error; err != nil {
			return err
		}
	}
	return nil
}

// calcDisplayPrice chọn biến thể có giá bán thấp nhất (trong các biến thể đang bán)
// để làm giá hiển thị "từ ... đ" của sản phẩm
func calcDisplayPrice(vs []dto.VariantInput) (int64, *int64) {
	anyActive := false
	for _, v := range vs {
		if isActive(v) {
			anyActive = true
			break
		}
	}

	var best *dto.VariantInput
	var bestPrice int64
	for i := range vs {
		v := &vs[i]
		if anyActive && !isActive(*v) {
			continue
		}
		effective := v.Price
		if v.SalePrice != nil {
			effective = *v.SalePrice
		}
		if best == nil || effective < bestPrice {
			best = v
			bestPrice = effective
		}
	}
	return best.Price, best.SalePrice
}

func newVariant(productID uint64, in dto.VariantInput) models.ProductVariant {
	return models.ProductVariant{
		ProductID:     productID,
		SKU:           in.SKU,
		Color:         strPtr(in.Color),
		Size:          strPtr(in.Size),
		Material:      strPtr(in.Material),
		Price:         in.Price,
		SalePrice:     in.SalePrice,
		StockQuantity: in.StockQuantity,
		IsActive:      isActive(in),
	}
}

func isActive(v dto.VariantInput) bool {
	return v.IsActive == nil || *v.IsActive
}

// strPtr: chuỗi rỗng -> nil (lưu NULL trong database)
func strPtr(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

// nullIfEmpty: chuỗi rỗng -> nil (dùng cho map Updates để ghi NULL)
func nullIfEmpty(s string) interface{} {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return s
}
