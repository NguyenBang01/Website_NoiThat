package services

import (
	"errors"
	"log"
	"math"
	"strings"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

// PublicProductQuery là điều kiện lọc sản phẩm của khách
type PublicProductQuery struct {
	Page         int
	Limit        int
	Q            string   // tìm theo tên hoặc SKU
	CategorySlug string   // gồm cả danh mục con
	BrandSlug    string
	Colors       []string // lọc theo màu (chọn nhiều)
	Materials    []string // lọc theo chất liệu (chọn nhiều)
	MinPrice     int64
	MaxPrice     int64
	InStock      bool
	Featured     bool
	Sort         string // newest | price_asc | price_desc | popular | name_asc
}

// PublicList trả danh sách sản phẩm đang bán, có lọc, sắp xếp, phân trang
func (s *ProductService) PublicList(q PublicProductQuery) ([]dto.ProductListItem, int64, error) {
	items := []dto.ProductListItem{}

	// Danh mục (theo slug) -> id danh mục + id danh mục con
	var categoryIDs []uint64
	if q.CategorySlug != "" {
		var cat models.Category
		err := s.DB.Where("slug = ? AND is_active = ?", q.CategorySlug, true).First(&cat).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return items, 0, nil
			}
			return nil, 0, err
		}
		ids, err := s.categoryIDsWithChildren(cat.ID)
		if err != nil {
			return nil, 0, err
		}
		categoryIDs = ids
	}

	// Thương hiệu (theo slug)
	var brandID uint64
	if q.BrandSlug != "" {
		var brand models.Brand
		err := s.DB.Where("slug = ?", q.BrandSlug).First(&brand).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return items, 0, nil
			}
			return nil, 0, err
		}
		brandID = brand.ID
	}

	// Tạo query mới mỗi lần gọi để Count và Find không ảnh hưởng nhau
	buildQuery := func() *gorm.DB {
		db := s.DB.Model(&models.Product{}).Where("products.status = ?", "active")

		if q.Q != "" {
			like := "%" + q.Q + "%"
			db = db.Where("(products.name LIKE ? OR products.sku LIKE ?)", like, like)
		}
		if len(categoryIDs) > 0 {
			db = db.Where("products.category_id IN ?", categoryIDs)
		}
		if brandID > 0 {
			db = db.Where("products.brand_id = ?", brandID)
		}
		if q.Featured {
			db = db.Where("products.is_featured = ?", true)
		}

		// Các điều kiện về biến thể phải khớp CÙNG MỘT biến thể
		// (ví dụ: màu Xám VÀ giá dưới 5 triệu là cùng một biến thể)
		conds := []string{"v.product_id = products.id", "v.is_active = 1"}
		args := []interface{}{}
		if len(q.Colors) > 0 {
			conds = append(conds, "v.color IN ?")
			args = append(args, q.Colors)
		}
		if len(q.Materials) > 0 {
			conds = append(conds, "v.material IN ?")
			args = append(args, q.Materials)
		}
		if q.MinPrice > 0 {
			conds = append(conds, "COALESCE(v.sale_price, v.price) >= ?")
			args = append(args, q.MinPrice)
		}
		if q.MaxPrice > 0 {
			conds = append(conds, "COALESCE(v.sale_price, v.price) <= ?")
			args = append(args, q.MaxPrice)
		}
		if q.InStock {
			conds = append(conds, "v.stock_quantity > 0")
		}
		return db.Where("EXISTS (SELECT 1 FROM product_variants v WHERE "+strings.Join(conds, " AND ")+")", args...)
	}

	var total int64
	if err := buildQuery().Count(&total).Error; err != nil {
		return nil, 0, err
	}

	products := []models.Product{}
	err := withListPreloads(buildQuery()).
		Order(publicOrderBy(q.Sort)).
		Offset((q.Page - 1) * q.Limit).
		Limit(q.Limit).
		Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	for _, p := range products {
		items = append(items, toListItem(p))
	}
	return items, total, nil
}

// PublicDetail trả chi tiết sản phẩm theo slug, kèm sản phẩm liên quan, và tăng lượt xem
func (s *ProductService) PublicDetail(slug string) (*dto.ProductDetail, error) {
	var p models.Product
	err := s.DB.
		Where("slug = ? AND status = ?", slug, "active").
		Preload("Category").
		Preload("Brand").
		Preload("Variants", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("id ASC")
		}).
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("is_primary DESC, sort_order ASC, id ASC")
		}).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	// Tăng lượt xem (UpdateColumn để không làm đổi updated_at)
	if err := s.DB.Model(&models.Product{}).Where("id = ?", p.ID).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error; err != nil {
		log.Println("Không tăng được lượt xem:", err)
	}

	detail := &dto.ProductDetail{
		ID:              p.ID,
		Name:            p.Name,
		Slug:            p.Slug,
		SKU:             p.SKU,
		ShortDesc:       p.ShortDesc,
		Description:     p.Description,
		BasePrice:       p.BasePrice,
		SalePrice:       p.SalePrice,
		DiscountPercent: discountPercent(p.BasePrice, p.SalePrice),
		Warranty:        p.Warranty,
		IsFeatured:      p.IsFeatured,
		ViewCount:       p.ViewCount + 1,
		Images:          []dto.PublicImage{},
		Variants:        []dto.PublicVariant{},
		Related:         []dto.ProductListItem{},
		CreatedAt:       p.CreatedAt,
	}

	// Danh mục kèm danh mục cha (để làm breadcrumb)
	if p.Category != nil {
		brief := &dto.CategoryBrief{ID: p.Category.ID, Name: p.Category.Name, Slug: p.Category.Slug}
		if p.Category.ParentID != nil {
			var parent models.Category
			if err := s.DB.First(&parent, *p.Category.ParentID).Error; err == nil {
				brief.Parent = &dto.CategoryBrief{ID: parent.ID, Name: parent.Name, Slug: parent.Slug}
			}
		}
		detail.Category = brief
	}
	if p.Brand != nil {
		detail.Brand = &dto.BrandBrief{ID: p.Brand.ID, Name: p.Brand.Name, Slug: p.Brand.Slug}
	}

	for _, img := range p.Images {
		detail.Images = append(detail.Images, dto.PublicImage{
			ID: img.ID, URL: img.URL, Alt: img.Alt,
			IsPrimary: img.IsPrimary, SortOrder: img.SortOrder, VariantID: img.VariantID,
		})
	}
	for _, v := range p.Variants {
		detail.Variants = append(detail.Variants, dto.PublicVariant{
			ID: v.ID, SKU: v.SKU, Color: v.Color, Size: v.Size, Material: v.Material,
			Price: v.Price, SalePrice: v.SalePrice,
			StockQuantity: v.StockQuantity, InStock: v.StockQuantity > 0,
		})
	}

	// Sản phẩm liên quan: cùng danh mục, tối đa 4
	related := []models.Product{}
	err = withListPreloads(s.DB.Model(&models.Product{}).
		Where("status = ? AND category_id = ? AND id <> ?", "active", p.CategoryID, p.ID)).
		Order("is_featured DESC, id DESC").
		Limit(4).
		Find(&related).Error
	if err != nil {
		log.Println("Không lấy được sản phẩm liên quan:", err)
	} else {
		for _, r := range related {
			detail.Related = append(detail.Related, toListItem(r))
		}
	}

	return detail, nil
}

// PublicFilters trả các lựa chọn cho bộ lọc (màu, chất liệu, khoảng giá)
// trong phạm vi các sản phẩm đang bán; có thể giới hạn theo danh mục.
func (s *ProductService) PublicFilters(categorySlug string) (*dto.ProductFilters, error) {
	filters := &dto.ProductFilters{Colors: []string{}, Materials: []string{}}

	var categoryIDs []uint64
	if categorySlug != "" {
		var cat models.Category
		err := s.DB.Where("slug = ? AND is_active = ?", categorySlug, true).First(&cat).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return filters, nil
			}
			return nil, err
		}
		ids, err := s.categoryIDsWithChildren(cat.ID)
		if err != nil {
			return nil, err
		}
		categoryIDs = ids
	}

	buildQuery := func() *gorm.DB {
		db := s.DB.Table("product_variants AS v").
			Joins("JOIN products p ON p.id = v.product_id").
			Where("p.status = ? AND p.deleted_at IS NULL AND v.is_active = ?", "active", true)
		if len(categoryIDs) > 0 {
			db = db.Where("p.category_id IN ?", categoryIDs)
		}
		return db
	}

	if err := buildQuery().Where("v.color IS NOT NULL").Distinct().Order("v.color ASC").
		Pluck("v.color", &filters.Colors).Error; err != nil {
		return nil, err
	}
	if err := buildQuery().Where("v.material IS NOT NULL").Distinct().Order("v.material ASC").
		Pluck("v.material", &filters.Materials).Error; err != nil {
		return nil, err
	}

	var row struct {
		MinPrice int64
		MaxPrice int64
	}
	err := buildQuery().
		Select("COALESCE(MIN(COALESCE(v.sale_price, v.price)), 0) AS min_price, COALESCE(MAX(COALESCE(v.sale_price, v.price)), 0) AS max_price").
		Scan(&row).Error
	if err != nil {
		return nil, err
	}
	filters.MinPrice = row.MinPrice
	filters.MaxPrice = row.MaxPrice
	return filters, nil
}

// ---------------------------------------------------------------------
// Các hàm hỗ trợ
// ---------------------------------------------------------------------

// withListPreloads nạp danh mục, ảnh, biến thể đang bán cho thẻ sản phẩm
func withListPreloads(db *gorm.DB) *gorm.DB {
	return db.
		Preload("Category").
		Preload("Images", func(d *gorm.DB) *gorm.DB {
			return d.Order("is_primary DESC, sort_order ASC, id ASC")
		}).
		Preload("Variants", func(d *gorm.DB) *gorm.DB {
			return d.Where("is_active = ?", true).Order("id ASC")
		})
}

// publicOrderBy đổi tham số sort thành câu ORDER BY (chỉ nhận các giá trị cho phép)
func publicOrderBy(sort string) string {
	switch sort {
	case "price_asc":
		return "COALESCE(products.sale_price, products.base_price) ASC, products.id DESC"
	case "price_desc":
		return "COALESCE(products.sale_price, products.base_price) DESC, products.id DESC"
	case "popular":
		return "products.view_count DESC, products.id DESC"
	case "name_asc":
		return "products.name ASC"
	default: // newest
		return "products.id DESC"
	}
}

// toListItem đổi sản phẩm (đã preload) thành thẻ sản phẩm
func toListItem(p models.Product) dto.ProductListItem {
	item := dto.ProductListItem{
		ID:              p.ID,
		Name:            p.Name,
		Slug:            p.Slug,
		ShortDesc:       p.ShortDesc,
		BasePrice:       p.BasePrice,
		SalePrice:       p.SalePrice,
		DiscountPercent: discountPercent(p.BasePrice, p.SalePrice),
		IsFeatured:      p.IsFeatured,
		Colors:          []string{},
	}
	if p.Category != nil {
		item.Category = &dto.CategoryBrief{ID: p.Category.ID, Name: p.Category.Name, Slug: p.Category.Slug}
	}
	if len(p.Images) > 0 {
		url := p.Images[0].URL // đã sắp xếp: ảnh chính đứng đầu
		item.Image = &url
	}

	seen := map[string]bool{}
	for _, v := range p.Variants {
		if v.StockQuantity > 0 {
			item.InStock = true
		}
		if v.Color != nil && !seen[*v.Color] {
			seen[*v.Color] = true
			item.Colors = append(item.Colors, *v.Color)
		}
	}
	return item
}

// discountPercent tính % giảm giá (làm tròn)
func discountPercent(base int64, sale *int64) int {
	if sale == nil || base <= 0 || *sale >= base {
		return 0
	}
	return int(math.Round(float64(base-*sale) * 100 / float64(base)))
}
