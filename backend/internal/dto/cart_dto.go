package dto

type AddToCartRequest struct {
	VariantID uint64 `json:"variant_id" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,min=1"`
}

type UpdateCartItemRequest struct {
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type CartItemResponse struct {
	ID           uint64  `json:"id"`
	VariantID    uint64  `json:"variant_id"`
	ProductID    uint64  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	ProductSlug  string  `json:"product_slug"`
	ProductImage string  `json:"product_image"` // primary image of product or variant
	VariantSKU   string  `json:"variant_sku"`
	Color        *string `json:"color"`
	Size         *string `json:"size"`
	Material     *string `json:"material"`
	Price        int64   `json:"price"`
	SalePrice    *int64  `json:"sale_price"`
	Quantity     int     `json:"quantity"`
	Subtotal     int64   `json:"subtotal"`
	InStock      int     `json:"in_stock"`
}

type CartResponse struct {
	Items []CartItemResponse `json:"items"`
	Total int64              `json:"total"`
}
