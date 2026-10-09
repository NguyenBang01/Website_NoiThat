package dto

import "time"

type DashboardOverview struct {
	TotalOrders    int64 `json:"total_orders"`
	TotalRevenue   int64 `json:"total_revenue"`
	TotalCustomers int64 `json:"total_customers"`
	TotalProducts  int64 `json:"total_products"`
	OrdersToday    int64 `json:"orders_today"`
	RevenueToday   int64 `json:"revenue_today"`
}

type RevenueByDay struct {
	Date       string `json:"date"`
	Revenue    int64  `json:"revenue"`
	OrderCount int64  `json:"order_count"`
}

type RevenueByMonth struct {
	Month      string `json:"month"`
	Revenue    int64  `json:"revenue"`
	OrderCount int64  `json:"order_count"`
}

type TopProduct struct {
	ProductID    uint64  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	ProductImage *string `json:"product_image"`
	TotalSold    int64   `json:"total_sold"`
	TotalRevenue int64   `json:"total_revenue"`
}

type RecentOrder struct {
	OrderID      uint64    `json:"order_id"`
	OrderNumber  string    `json:"order_number"`
	CustomerName string    `json:"customer_name"`
	TotalAmount  int64     `json:"total_amount"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type LowStockItem struct {
	VariantID     uint64 `json:"variant_id"`
	ProductID     uint64 `json:"product_id"`
	ProductName   string `json:"product_name"`
	VariantSKU    string `json:"variant_sku"`
	VariantInfo   string `json:"variant_info"`
	StockQuantity int    `json:"stock_quantity"`
}
