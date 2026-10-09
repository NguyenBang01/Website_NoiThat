package models

import (
	"time"

	"gorm.io/gorm"
)

// Product ứng với bảng `products`
type Product struct {
	ID          uint64         `gorm:"primaryKey" json:"id"`
	CategoryID  uint64         `json:"category_id"`
	BrandID     *uint64        `json:"brand_id"`
	Name        string         `gorm:"type:varchar(255);not null" json:"name"`
	Slug        string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"slug"`
	SKU         string         `gorm:"column:sku;type:varchar(100);uniqueIndex;not null" json:"sku"`
	ShortDesc   *string        `gorm:"type:text" json:"short_desc"`
	Description *string        `gorm:"type:longtext" json:"description"`
	BasePrice   int64          `json:"base_price"`
	SalePrice   *int64         `json:"sale_price"`
	Warranty    *string        `gorm:"type:varchar(100)" json:"warranty"`
	Status      string         `gorm:"type:varchar(50);default:'draft'" json:"status"`
	IsFeatured  bool           `json:"is_featured"`
	ViewCount   uint           `json:"view_count"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Các quan hệ (chỉ có khi được Preload)
	Category *Category        `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Brand    *Brand           `gorm:"foreignKey:BrandID" json:"brand,omitempty"`
	Variants []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	Images   []ProductImage   `gorm:"foreignKey:ProductID" json:"images,omitempty"`
}

func (Product) TableName() string {
	return "products"
}

// ProductVariant ứng với bảng `product_variants` (màu / kích thước / chất liệu)
type ProductVariant struct {
	ID            uint64    `gorm:"primaryKey" json:"id"`
	ProductID     uint64    `gorm:"index;not null" json:"product_id"`
	SKU           string    `gorm:"column:sku;type:varchar(100);uniqueIndex;not null" json:"sku"`
	Color         *string   `gorm:"type:varchar(60)" json:"color"`
	Size          *string   `gorm:"type:varchar(100)" json:"size"`
	Material      *string   `gorm:"type:varchar(100)" json:"material"`
	Price         int64     `gorm:"not null" json:"price"`
	SalePrice     *int64    `json:"sale_price"`
	StockQuantity int       `gorm:"default:0" json:"stock_quantity"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (ProductVariant) TableName() string {
	return "product_variants"
}

// ProductImage ứng với bảng `product_images`
type ProductImage struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	ProductID uint64    `gorm:"index;not null" json:"product_id"`
	VariantID *uint64   `gorm:"index" json:"variant_id"`
	URL       string    `gorm:"column:url;type:varchar(255);not null" json:"url"`
	Alt       *string   `gorm:"type:varchar(255)" json:"alt"`
	IsPrimary bool      `gorm:"default:false" json:"is_primary"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

func (ProductImage) TableName() string {
	return "product_images"
}
