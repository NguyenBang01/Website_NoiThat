package dto

import (
	"furniture-shop/backend/internal/models"
	"time"
)

type OrderItemInput struct {
	VariantID uint64 `json:"variant_id" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,min=1"`
}

type CreateOrderRequest struct {
	RecipientName   string           `json:"recipient_name" binding:"required"`
	RecipientPhone  string           `json:"recipient_phone" binding:"required"`
	ShippingAddress string           `json:"shipping_address" binding:"required"`
	CouponCode      string           `json:"coupon_code"`
	Note            string           `json:"note"`
	Items           []OrderItemInput `json:"items" binding:"required,min=1,dive"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=confirmed shipping delivered cancelled"`
	Note   string `json:"note"`
}

type CancelOrderRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type OrderListItem struct {
	ID             uint64    `json:"id"`
	OrderNumber    string    `json:"order_number"`
	Status         string    `json:"status"`
	TotalAmount    int64     `json:"total_amount"`
	ItemCount      int       `json:"item_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type OrderResponse struct {
	models.Order
}
