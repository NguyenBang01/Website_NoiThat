package services

import (
	"errors"
	"fmt"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type OrderService struct {
	DB          *gorm.DB
	MailService *MailService
}

func NewOrderService(db *gorm.DB, mailService ...*MailService) *OrderService {
	var ms *MailService
	if len(mailService) > 0 {
		ms = mailService[0]
	}
	return &OrderService{DB: db, MailService: ms}
}

func (s *OrderService) generateOrderNumber(tx *gorm.DB) (string, error) {
	dateStr := time.Now().Format("20060102")
	prefix := "FS-" + dateStr + "-"
	
	var count int64
	if err := tx.Model(&models.Order{}).Where("order_code LIKE ?", prefix+"%").Count(&count).Error; err != nil {
		return "", err
	}
	
	return fmt.Sprintf("%s%05d", prefix, count+1), nil
}

func (s *OrderService) CreateOrder(userID uint64, req dto.CreateOrderRequest) (*models.Order, error) {
	var order *models.Order

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		if len(req.Items) == 0 {
			return errors.New("đơn hàng phải có ít nhất 1 sản phẩm")
		}

		var subTotal int64 = 0
		var orderItems []models.OrderItem

		for _, itemReq := range req.Items {
			var variant models.ProductVariant
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&variant, itemReq.VariantID).Error; err != nil {
				return fmt.Errorf("không tìm thấy biến thể sản phẩm (ID: %d)", itemReq.VariantID)
			}

			if !variant.IsActive {
				return fmt.Errorf("sản phẩm %s không còn được bán", variant.SKU)
			}

			if variant.StockQuantity < itemReq.Quantity {
				return fmt.Errorf("sản phẩm %s không đủ số lượng (còn %d)", variant.SKU, variant.StockQuantity)
			}

			// Deduct stock
			if err := tx.Model(&variant).UpdateColumn("stock_quantity", variant.StockQuantity-itemReq.Quantity).Error; err != nil {
				return fmt.Errorf("lỗi cập nhật số lượng tồn kho")
			}

			var product models.Product
			if err := tx.First(&product, variant.ProductID).Error; err != nil {
				return fmt.Errorf("không tìm thấy sản phẩm gốc")
			}

			// Effective price
			effectivePrice := variant.Price
			if variant.SalePrice != nil {
				effectivePrice = *variant.SalePrice
			}

			itemSubTotal := effectivePrice * int64(itemReq.Quantity)
			subTotal += itemSubTotal

			var variantInfoParts []string
			if variant.Color != nil {
				variantInfoParts = append(variantInfoParts, *variant.Color)
			}
			if variant.Size != nil {
				variantInfoParts = append(variantInfoParts, *variant.Size)
			}
			if variant.Material != nil {
				variantInfoParts = append(variantInfoParts, *variant.Material)
			}
			variantInfoStr := strings.Join(variantInfoParts, ", ")

			orderItems = append(orderItems, models.OrderItem{
				VariantID:   variant.ID,
				ProductName: product.Name,
				VariantSKU:  variant.SKU,
				VariantInfo: variantInfoStr,
				Price:       variant.Price,
				SalePrice:   variant.SalePrice,
				Quantity:    itemReq.Quantity,
				SubTotal:    itemSubTotal,
			})
		}

		var discountAmount int64 = 0
		var couponID *uint64
		var couponCode *string

		if req.CouponCode != "" {
			var coupon models.Coupon
			if err := tx.Where("code = ?", req.CouponCode).First(&coupon).Error; err != nil {
				return errors.New("mã giảm giá không hợp lệ")
			}

			now := time.Now()
			if !coupon.IsActive {
				return errors.New("mã giảm giá không còn hiệu lực")
			}
			if coupon.StartDate != nil && coupon.StartDate.After(now) {
				return errors.New("mã giảm giá chưa đến thời gian áp dụng")
			}
			if coupon.EndDate != nil && coupon.EndDate.Before(now) {
				return errors.New("mã giảm giá đã hết hạn")
			}

			if coupon.MinOrderAmount > 0 && coupon.MinOrderAmount > subTotal {
				return fmt.Errorf("đơn hàng phải từ %d đ để sử dụng mã này", coupon.MinOrderAmount)
			}

			if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
				return errors.New("mã giảm giá đã hết lượt sử dụng")
			}

			if coupon.DiscountType == "percent" {
				discountAmount = (subTotal * coupon.DiscountValue) / 100
				if coupon.MaxDiscount != nil && discountAmount > *coupon.MaxDiscount {
					discountAmount = *coupon.MaxDiscount
				}
			} else {
				discountAmount = coupon.DiscountValue
			}

			if discountAmount > subTotal {
				discountAmount = subTotal
			}

			couponID = &coupon.ID
			cc := coupon.Code
			couponCode = &cc

			if err := tx.Model(&coupon).UpdateColumn("used_count", gorm.Expr("used_count + 1")).Error; err != nil {
				return errors.New("lỗi cập nhật lượt sử dụng mã giảm giá")
			}
		}

		shippingFee := int64(0)
		totalAmount := subTotal - discountAmount + shippingFee

		orderNum, err := s.generateOrderNumber(tx)
		if err != nil {
			return errors.New("lỗi tạo mã đơn hàng")
		}
		
		var notePtr *string
		if req.Note != "" {
			n := req.Note
			notePtr = &n
		}

		newOrder := models.Order{
			UserID:          userID,
			OrderNumber:     orderNum,
			OrderCode:       orderNum,
			Status:          "pending",
			SubTotal:        subTotal,
			DiscountAmount:  discountAmount,
			ShippingFee:     shippingFee,
			TotalAmount:     totalAmount,
			CouponID:        couponID,
			CouponCode:      couponCode,
			RecipientName:   req.RecipientName,
			RecipientPhone:  req.RecipientPhone,
			ShippingAddress: req.ShippingAddress,
			Note:            notePtr,
			Items:           orderItems,
		}

		if err := tx.Create(&newOrder).Error; err != nil {
			return err
		}
		
		logNote := "Khách hàng đặt hàng"
		statusLog := models.OrderStatusLog{
			OrderID:    newOrder.ID,
			FromStatus: "",
			ToStatus:   "pending",
			Note:       &logNote,
			ChangedBy:  userID,
		}
		if err := tx.Create(&statusLog).Error; err != nil {
			return err
		}

		// Xóa giỏ hàng của khách sau khi đặt hàng thành công
		var userCart models.Cart
		if err := tx.Where("user_id = ?", userID).First(&userCart).Error; err == nil {
			_ = tx.Where("cart_id = ?", userCart.ID).Delete(&models.CartItem{}).Error
		}

		order = &newOrder
		return nil
	})

	if err == nil && order != nil && s.MailService != nil {
		var user models.User
		if errUser := s.DB.First(&user, userID).Error; errUser == nil && user.Email != "" {
			s.MailService.SendOrderConfirmation(order, user.Email, user.FullName, order.Items)
		}
	}

	return order, err
}

func (s *OrderService) CustomerOrders(userID uint64, page, limit int) ([]dto.OrderListItem, int64, error) {
	var orders []models.Order
	var total int64

	query := s.DB.Model(&models.Order{}).Where("user_id = ?", userID)
	
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * limit
	if err := query.Preload("Items").Order("created_at desc").Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	
	var result []dto.OrderListItem
	for _, o := range orders {
		itemCount := 0
		for _, item := range o.Items {
			itemCount += item.Quantity
		}
		result = append(result, dto.OrderListItem{
			ID:          o.ID,
			OrderNumber: o.OrderNumber,
			Status:      o.Status,
			TotalAmount: o.TotalAmount,
			ItemCount:   itemCount,
			CreatedAt:   o.CreatedAt,
		})
	}
	return result, total, nil
}

func (s *OrderService) CustomerOrderDetail(userID, orderID uint64) (*models.Order, error) {
	var order models.Order
	if err := s.DB.Preload("Items").Preload("StatusLogs").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		return nil, errors.New("không tìm thấy đơn hàng")
	}
	return &order, nil
}

func (s *OrderService) restoreStock(tx *gorm.DB, orderID uint64) error {
	var items []models.OrderItem
	if err := tx.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return err
	}
	for _, item := range items {
		if err := tx.Model(&models.ProductVariant{}).Where("id = ?", item.VariantID).
			UpdateColumn("stock_quantity", gorm.Expr("stock_quantity + ?", item.Quantity)).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *OrderService) restoreCoupon(tx *gorm.DB, order *models.Order) error {
	if order.CouponID != nil && *order.CouponID > 0 {
		return tx.Model(&models.Coupon{}).
			Where("id = ? AND used_count > 0", *order.CouponID).
			UpdateColumn("used_count", gorm.Expr("used_count - 1")).Error
	}
	return nil
}

func (s *OrderService) CancelOrder(userID, orderID uint64, reason string) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
			return errors.New("không tìm thấy đơn hàng")
		}

		if order.Status != "pending" {
			return errors.New("chỉ có thể hủy đơn hàng đang chờ xử lý")
		}

		now := time.Now()
		updates := map[string]interface{}{
			"status":        "cancelled",
			"cancelled_at":  now,
			"cancel_reason": reason,
		}
		if err := tx.Model(&order).Updates(updates).Error; err != nil {
			return err
		}

		if err := s.restoreStock(tx, order.ID); err != nil {
			return errors.New("lỗi khi hoàn lại số lượng tồn kho")
		}

		_ = s.restoreCoupon(tx, &order)

		statusLog := models.OrderStatusLog{
			OrderID:    order.ID,
			FromStatus: "pending",
			ToStatus:   "cancelled",
			Note:       &reason,
			ChangedBy:  userID,
		}
		return tx.Create(&statusLog).Error
	})
}

func (s *OrderService) AdminOrders(page, limit int, status, q string) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := s.DB.Model(&models.Order{}).Preload("User")
	
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if q != "" {
		query = query.Where("order_number LIKE ? OR recipient_name LIKE ? OR recipient_phone LIKE ?", "%"+q+"%", "%"+q+"%", "%"+q+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (s *OrderService) AdminOrderDetail(orderID uint64) (*models.Order, error) {
	var order models.Order
	if err := s.DB.Preload("Items").Preload("User").Preload("StatusLogs").First(&order, orderID).Error; err != nil {
		return nil, errors.New("không tìm thấy đơn hàng")
	}
	return &order, nil
}

func (s *OrderService) UpdateStatus(orderID, adminID uint64, req dto.UpdateOrderStatusRequest) error {
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&order, orderID).Error; err != nil {
			return errors.New("không tìm thấy đơn hàng")
		}

		validTransitions := map[string][]string{
			"pending":   {"confirmed", "cancelled"},
			"confirmed": {"shipping", "cancelled"},
			"shipping":  {"delivered"},
		}

		allowed, ok := validTransitions[order.Status]
		if !ok {
			return errors.New("không thể thay đổi trạng thái đơn hàng này")
		}

		isValid := false
		for _, s := range allowed {
			if s == req.Status {
				isValid = true
				break
			}
		}
		if !isValid {
			return fmt.Errorf("không thể chuyển trạng thái từ %s sang %s", order.Status, req.Status)
		}

		updates := map[string]interface{}{
			"status": req.Status,
		}
		if req.Status == "cancelled" {
			now := time.Now()
			updates["cancelled_at"] = now
			if req.Note != "" {
				updates["cancel_reason"] = req.Note
			}
		}

		if err := tx.Model(&order).Updates(updates).Error; err != nil {
			return err
		}

		if req.Status == "cancelled" {
			if err := s.restoreStock(tx, order.ID); err != nil {
				return errors.New("lỗi khi hoàn lại số lượng tồn kho")
			}
			_ = s.restoreCoupon(tx, &order)
		}

		var notePtr *string
		if req.Note != "" {
			n := req.Note
			notePtr = &n
		}

		statusLog := models.OrderStatusLog{
			OrderID:    order.ID,
			FromStatus: order.Status,
			ToStatus:   req.Status,
			Note:       notePtr,
			ChangedBy:  adminID,
		}
		return tx.Create(&statusLog).Error
	})

	if err == nil && s.MailService != nil {
		var order models.Order
		if errOrder := s.DB.Preload("User").First(&order, orderID).Error; errOrder == nil && order.User.Email != "" {
			s.MailService.SendOrderStatusUpdate(&order, order.User.Email, order.User.FullName, order.Status, req.Status, req.Note)
		}
	}

	return err
}
