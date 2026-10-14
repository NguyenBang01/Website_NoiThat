package models

import "time"

type Order struct {
	ID              uint64           `gorm:"primaryKey" json:"id"`
	UserID          uint64           `gorm:"index" json:"user_id"`
	OrderNumber     string           `gorm:"column:order_number;type:varchar(50)" json:"order_number"`
	OrderCode       string           `gorm:"column:order_code;type:varchar(50)" json:"order_code"`
	Status          string           `gorm:"type:varchar(20)" json:"status"` // pending, confirmed, shipping, delivered, cancelled
	SubTotal        int64            `json:"sub_total"`
	DiscountAmount  int64            `json:"discount_amount"`
	ShippingFee     int64            `json:"shipping_fee"`
	TotalAmount     int64            `json:"total_amount"`
	CouponID        *uint64          `json:"coupon_id"`
	CouponCode      *string          `gorm:"type:varchar(50)" json:"coupon_code"`
	RecipientName   string           `gorm:"type:varchar(100)" json:"recipient_name"`
	RecipientPhone  string           `gorm:"type:varchar(20)" json:"recipient_phone"`
	ShippingAddress string           `gorm:"type:text" json:"shipping_address"`
	Note            *string          `gorm:"type:text" json:"note"`
	CancelledAt     *time.Time       `json:"cancelled_at"`
	CancelReason    *string          `gorm:"type:text" json:"cancel_reason"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`

	User       User             `gorm:"foreignKey:UserID" json:"user"`
	Items      []OrderItem      `gorm:"foreignKey:OrderID" json:"items"`
	StatusLogs []OrderStatusLog `gorm:"foreignKey:OrderID" json:"status_logs"`
	Coupon     *Coupon          `gorm:"foreignKey:CouponID" json:"coupon"`
}

func (Order) TableName() string {
	return "orders"
}

type OrderItem struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	OrderID     uint64    `gorm:"index" json:"order_id"`
	VariantID   uint64    `json:"variant_id"`
	ProductName string    `gorm:"type:varchar(255)" json:"product_name"`
	VariantSKU  string    `gorm:"type:varchar(100)" json:"variant_sku"`
	VariantInfo string    `gorm:"type:varchar(255)" json:"variant_info"`
	Price       int64     `json:"price"`
	SalePrice   *int64    `json:"sale_price"`
	Quantity    int       `json:"quantity"`
	SubTotal    int64     `json:"sub_total"`
	CreatedAt   time.Time `json:"created_at"`

	Variant     *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
}

func (OrderItem) TableName() string {
	return "order_items"
}

type OrderStatusLog struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	OrderID    uint64    `gorm:"index" json:"order_id"`
	FromStatus string    `gorm:"type:varchar(20)" json:"from_status"`
	ToStatus   string    `gorm:"type:varchar(20)" json:"to_status"`
	Note       *string   `gorm:"type:text" json:"note"`
	ChangedBy  uint64    `json:"changed_by"`
	CreatedAt  time.Time `json:"created_at"`
}

func (OrderStatusLog) TableName() string {
	return "order_status_logs"
}
