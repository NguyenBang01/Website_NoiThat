package dto

// VariantInput là một biến thể (màu / kích thước / chất liệu) trong request
type VariantInput struct {
	ID            uint64 `json:"id"` // có id = sửa biến thể cũ; không có = thêm biến thể mới
	SKU           string `json:"sku" binding:"required,max=100"`
	Color         string `json:"color" binding:"max=60"`
	Size          string `json:"size" binding:"max=100"`
	Material      string `json:"material" binding:"max=100"`
	Price         int64  `json:"price" binding:"required,gt=0"`
	SalePrice     *int64 `json:"sale_price" binding:"omitempty,gt=0"`
	StockQuantity int    `json:"stock_quantity" binding:"gte=0"`
	IsActive      *bool  `json:"is_active"` // để trống = đang bán
}

// ImageInput là một ảnh sản phẩm trong request
type ImageInput struct {
	URL        string `json:"url" binding:"required,max=255"` // đường dẫn lấy từ API upload
	Alt        string `json:"alt" binding:"max=255"`
	IsPrimary  bool   `json:"is_primary"`
	SortOrder  int    `json:"sort_order"`
	VariantSKU string `json:"variant_sku"` // để trống = ảnh chung; có giá trị = ảnh riêng của biến thể đó
}

// ProductRequest là dữ liệu admin gửi lên khi thêm / sửa sản phẩm
type ProductRequest struct {
	CategoryID  uint64         `json:"category_id" binding:"required"`
	BrandID     *uint64        `json:"brand_id"`
	Name        string         `json:"name" binding:"required,min=2,max=255"`
	Slug        string         `json:"slug" binding:"omitempty,max=255"` // để trống thì tự tạo từ tên
	SKU         string         `json:"sku" binding:"required,max=100"`
	ShortDesc   string         `json:"short_desc" binding:"max=500"`
	Description string         `json:"description"`
	Warranty    string         `json:"warranty" binding:"max=100"`
	Status      string         `json:"status" binding:"omitempty,oneof=draft active hidden"`
	IsFeatured  bool           `json:"is_featured"`
	Variants    []VariantInput `json:"variants" binding:"required,min=1,dive"`
	// Images: không gửi trường này khi sửa = giữ nguyên ảnh cũ; gửi [] = xóa hết ảnh
	Images []ImageInput `json:"images" binding:"omitempty,dive"`
}
