package services

import (
	"furniture-shop/backend/internal/dto"
	"time"

	"gorm.io/gorm"
)

type DashboardService struct {
	DB *gorm.DB
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{DB: db}
}

func (s *DashboardService) GetOverview() (*dto.DashboardOverview, error) {
	var overview dto.DashboardOverview
	now := time.Now()
	todayStr := now.Format("2006-01-02")

	// Total Orders (delivered)
	s.DB.Table("orders").Where("status = ?", "delivered").Count(&overview.TotalOrders)

	// Total Revenue (delivered)
	s.DB.Table("orders").Select("COALESCE(SUM(total_amount), 0)").Where("status = ?", "delivered").Scan(&overview.TotalRevenue)

	// Total Customers (role = 'customer' or 'user')
	s.DB.Table("users").Where("role IN ('customer', 'user')").Count(&overview.TotalCustomers)

	// Total Products
	s.DB.Table("products").Where("deleted_at IS NULL").Count(&overview.TotalProducts)

	// Orders Today (delivered)
	s.DB.Table("orders").Where("status = ? AND DATE(created_at) = ?", "delivered", todayStr).Count(&overview.OrdersToday)

	// Revenue Today (delivered)
	s.DB.Table("orders").Select("COALESCE(SUM(total_amount), 0)").Where("status = ? AND DATE(created_at) = ?", "delivered", todayStr).Scan(&overview.RevenueToday)

	return &overview, nil
}

func (s *DashboardService) GetRevenueByDay(days int) ([]dto.RevenueByDay, error) {
	if days <= 0 {
		days = 30
	}
	var result []dto.RevenueByDay
	err := s.DB.Table("orders").
		Select("DATE(created_at) as date, COALESCE(SUM(total_amount), 0) as revenue, COUNT(id) as order_count").
		Where("status = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", "delivered", days).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&result).Error
	return result, err
}

func (s *DashboardService) GetRevenueByMonth(months int) ([]dto.RevenueByMonth, error) {
	if months <= 0 {
		months = 12
	}
	var result []dto.RevenueByMonth
	err := s.DB.Table("orders").
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as revenue, COUNT(id) as order_count").
		Where("status = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)", "delivered", months).
		Group("DATE_FORMAT(created_at, '%Y-%m')").
		Order("month ASC").
		Scan(&result).Error
	return result, err
}

func (s *DashboardService) GetTopProducts(limit int) ([]dto.TopProduct, error) {
	if limit <= 0 {
		limit = 10
	}
	var result []dto.TopProduct
	err := s.DB.Table("order_items").
		Select("products.id as product_id, products.name as product_name, " +
			"(SELECT url FROM product_images WHERE product_id = products.id AND is_primary = true LIMIT 1) as product_image, " +
			"SUM(order_items.quantity) as total_sold, SUM(order_items.price * order_items.quantity) as total_revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Joins("JOIN product_variants ON product_variants.id = order_items.variant_id").
		Joins("JOIN products ON products.id = product_variants.product_id").
		Where("orders.status = ?", "delivered").
		Group("products.id, products.name").
		Order("total_sold DESC").
		Limit(limit).
		Scan(&result).Error
	return result, err
}

func (s *DashboardService) GetRecentOrders(limit int) ([]dto.RecentOrder, error) {
	if limit <= 0 {
		limit = 10
	}
	var result []dto.RecentOrder
	err := s.DB.Table("orders").
		Select("orders.id as order_id, orders.order_number, users.full_name as customer_name, orders.total_amount, orders.status, orders.created_at").
		Joins("JOIN users ON users.id = orders.user_id").
		Order("orders.created_at DESC").
		Limit(limit).
		Scan(&result).Error
	return result, err
}

func (s *DashboardService) GetLowStockItems(threshold int) ([]dto.LowStockItem, error) {
	if threshold <= 0 {
		threshold = 10
	}
	var result []dto.LowStockItem
	err := s.DB.Table("product_variants").
		Select("product_variants.id as variant_id, products.id as product_id, products.name as product_name, product_variants.sku as variant_sku, " +
			"CONCAT_WS(' / ', NULLIF(product_variants.color, ''), NULLIF(product_variants.size, ''), NULLIF(product_variants.material, '')) as variant_info, " +
			"product_variants.stock_quantity").
		Joins("JOIN products ON products.id = product_variants.product_id").
		Where("product_variants.is_active = ? AND product_variants.stock_quantity <= ? AND products.deleted_at IS NULL", true, threshold).
		Order("product_variants.stock_quantity ASC").
		Scan(&result).Error
	return result, err
}
