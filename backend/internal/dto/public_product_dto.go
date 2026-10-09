package dto

import "time"

// CategoryBrief là thông tin danh mục rút gọn (kèm danh mục cha để làm breadcrumb)
type CategoryBrief struct {
	ID     uint64         `json:"id"`
	Name   string         `json:"name"`
	Slug   string         `json:"slug"`
	Parent *CategoryBrief `json:"parent,omitempty"`
}

// BrandBrief là thông tin thương hiệu rút gọn
type BrandBrief struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// ProductListItem là một sản phẩm trong danh sách (thẻ sản phẩm)
type ProductListItem struct {
	ID              uint64         `json:"id"`
	Name            string         `json:"name"`
	Slug            string         `json:"slug"`
	ShortDesc       *string        `json:"short_desc"`
	BasePrice       int64          `json:"base_price"`
	SalePrice       *int64         `json:"sale_price"`
	DiscountPercent int            `json:"discount_percent"`
	IsFeatured      bool           `json:"is_featured"`
	Category        *CategoryBrief `json:"category"`
	Image           *string        `json:"image"`    // ảnh đại diện
	Colors          []string       `json:"colors"`   // các màu đang bán
	InStock         bool           `json:"in_stock"` // còn hàng
}

// PublicVariant là biến thể mà khách nhìn thấy
type PublicVariant struct {
	ID            uint64  `json:"id"`
	SKU           string  `json:"sku"`
	Color         *string `json:"color"`
	Size          *string `json:"size"`
	Material      *string `json:"material"`
	Price         int64   `json:"price"`
	SalePrice     *int64  `json:"sale_price"`
	StockQuantity int     `json:"stock_quantity"`
	InStock       bool    `json:"in_stock"`
}

// PublicImage là ảnh sản phẩm mà khách nhìn thấy
type PublicImage struct {
	ID        uint64  `json:"id"`
	URL       string  `json:"url"`
	Alt       *string `json:"alt"`
	IsPrimary bool    `json:"is_primary"`
	SortOrder int     `json:"sort_order"`
	VariantID *uint64 `json:"variant_id"`
}

// ProductDetail là dữ liệu trang chi tiết sản phẩm
type ProductDetail struct {
	ID              uint64            `json:"id"`
	Name            string            `json:"name"`
	Slug            string            `json:"slug"`
	SKU             string            `json:"sku"`
	ShortDesc       *string           `json:"short_desc"`
	Description     *string           `json:"description"`
	BasePrice       int64             `json:"base_price"`
	SalePrice       *int64            `json:"sale_price"`
	DiscountPercent int               `json:"discount_percent"`
	Warranty        *string           `json:"warranty"`
	IsFeatured      bool              `json:"is_featured"`
	ViewCount       uint              `json:"view_count"`
	Category        *CategoryBrief    `json:"category"`
	Brand           *BrandBrief       `json:"brand"`
	Images          []PublicImage     `json:"images"`
	Variants        []PublicVariant   `json:"variants"`
	Related         []ProductListItem `json:"related"` // sản phẩm liên quan
	CreatedAt       time.Time         `json:"created_at"`
}

// ProductFilters là các lựa chọn để dựng bộ lọc trên giao diện
type ProductFilters struct {
	Colors    []string `json:"colors"`
	Materials []string `json:"materials"`
	MinPrice  int64    `json:"min_price"`
	MaxPrice  int64    `json:"max_price"`
}
