package services_test

import (
	"testing"
	"time"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/services"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	dsn := "root:@tcp(127.0.0.1:3306)/furniture_shop?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("Bỏ qua test vì MySQL không kết nối được: %v", err)
	}
	return db
}

func TestCouponValidation(t *testing.T) {
	db := setupTestDB(t)
	couponService := services.NewCouponService(db)

	code := "TESTSALE20"
	// Tạo coupon mẫu nếu chưa có
	var coupon models.Coupon
	if err := db.Where("code = ?", code).First(&coupon).Error; err != nil {
		coupon = models.Coupon{
			Code:           code,
			DiscountType:   "percent",
			DiscountValue:  20,
			MinOrderAmount: 500000,
			UsageLimit:     100,
			UsedCount:      0,
			IsActive:       true,
		}
		db.Create(&coupon)
	}

	// 1. Kiểm tra đơn dưới min_order_amount
	res, err := couponService.ValidateCoupon(code, 400000)
	if err != nil {
		t.Fatalf("Lỗi validate coupon: %v", err)
	}
	if res.Valid {
		t.Errorf("Kỳ vọng coupon không hợp lệ vì đơn hàng chưa đủ min_order_amount")
	}

	// 2. Kiểm tra đơn đủ min_order_amount
	res, err = couponService.ValidateCoupon(code, 1000000)
	if err != nil {
		t.Fatalf("Lỗi validate coupon: %v", err)
	}
	if !res.Valid {
		t.Errorf("Kỳ vọng coupon hợp lệ, message: %s", res.Message)
	}
	if res.DiscountAmount != 200000 {
		t.Errorf("Kỳ vọng giảm 200,000đ nhưng thực tế là %d", res.DiscountAmount)
	}
}

func TestOrderAndStockDeduction(t *testing.T) {
	db := setupTestDB(t)
	orderService := services.NewOrderService(db)

	// Tạo biến thể test
	vSKU := "TEST-SKU-ORDER-" + time.Now().Format("150405")
	variant := models.ProductVariant{
		ProductID:     1, // sản phẩm id 1
		SKU:           vSKU,
		Price:         500000,
		StockQuantity: 10,
		IsActive:      true,
	}
	if err := db.Create(&variant).Error; err != nil {
		t.Fatalf("Không tạo được biến thể test: %v", err)
	}

	// Lấy một user test
	var user models.User
	if err := db.First(&user).Error; err != nil {
		t.Fatalf("Không có user trong db để test: %v", err)
	}

	// Đặt 3 sản phẩm
	req := dto.CreateOrderRequest{
		RecipientName:   "Người Nhận Test",
		RecipientPhone:  "0988776655",
		ShippingAddress: "123 Đường Test, Quận 1, TP.HCM",
		Items: []dto.OrderItemInput{
			{
				VariantID: variant.ID,
				Quantity:  3,
			},
		},
	}

	order, err := orderService.CreateOrder(user.ID, req)
	if err != nil {
		t.Fatalf("Lỗi tạo đơn hàng: %v", err)
	}

	if order.TotalAmount != 1500000 {
		t.Errorf("Kỳ vọng tổng tiền 1,500,000 đ nhưng thực tế: %d", order.TotalAmount)
	}

	// Kiểm tra tồn kho đã giảm từ 10 xuống 7
	var updatedVariant models.ProductVariant
	db.First(&updatedVariant, variant.ID)
	if updatedVariant.StockQuantity != 7 {
		t.Errorf("Kỳ vọng tồn kho còn 7 nhưng thực tế: %d", updatedVariant.StockQuantity)
	}

	// Hủy đơn và kiểm tra hoàn kho về 10
	err = orderService.CancelOrder(user.ID, order.ID, "Khách đổi ý")
	if err != nil {
		t.Fatalf("Lỗi hủy đơn hàng: %v", err)
	}

	db.First(&updatedVariant, variant.ID)
	if updatedVariant.StockQuantity != 10 {
		t.Errorf("Kỳ vọng tồn kho hoàn lại 10 nhưng thực tế: %d", updatedVariant.StockQuantity)
	}
}
