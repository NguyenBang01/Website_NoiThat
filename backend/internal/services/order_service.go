package services

import (
	"context"
	crand "crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"
	"math/big"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type OrderService struct {
	DB                  *gorm.DB
	MailService         *MailService
	TelegramService     *TelegramService
	ShippingService     *ShippingService
	NotificationService *NotificationService
}

func NewOrderService(db *gorm.DB, mailService *MailService, telegramService ...*TelegramService) *OrderService {
	var ts *TelegramService
	if len(telegramService) > 0 {
		ts = telegramService[0]
	}
	return &OrderService{DB: db, MailService: mailService, TelegramService: ts}
}

func (s *OrderService) SetShippingService(shippingService *ShippingService) {
	s.ShippingService = shippingService
}

func (s *OrderService) SetNotificationService(ns *NotificationService) {
	s.NotificationService = ns
}

func (s *OrderService) generateOrderNumber(tx *gorm.DB) (string, error) {
	dateStr := time.Now().Format("20060102")
	prefix := "FS-" + dateStr + "-"
	
	// Thử sinh mã ngẫu nhiên bảo mật và kiểm tra chống trùng lặp (tránh race condition khi checkout đồng thời)
	for i := 0; i < 5; i++ {
		n, err := crand.Int(crand.Reader, big.NewInt(90000))
		if err != nil {
			return "", err
		}
		candidate := fmt.Sprintf("%s%05d", prefix, n.Int64()+10000)
		var exists int64
		if err := tx.Model(&models.Order{}).Where("order_code = ? OR order_number = ?", candidate, candidate).Count(&exists).Error; err != nil {
			return "", err
		}
		if exists == 0 {
			return candidate, nil
		}
	}
	
	return "", errors.New("không thể tạo mã đơn hàng duy nhất sau 5 lần thử")
}

func (s *OrderService) CreateOrder(userID uint64, req dto.CreateOrderRequest) (*models.Order, error) {
	validName, err := utils.ValidateFullName(req.RecipientName)
	if err != nil {
		return nil, fmt.Errorf("thông tin người nhận: %w", err)
	}
	validPhone, err := utils.NormalizeAndValidateVNPhone(req.RecipientPhone)
	if err != nil {
		return nil, fmt.Errorf("số điện thoại người nhận: %w", err)
	}
	validAddr, err := utils.ValidateAddress(req.ShippingAddress)
	if err != nil {
		return nil, fmt.Errorf("địa chỉ nhận hàng: %w", err)
	}
	req.RecipientName = validName
	req.RecipientPhone = validPhone
	req.ShippingAddress = validAddr

	var order *models.Order

	err = s.DB.Transaction(func(tx *gorm.DB) error {
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
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("code = ?", req.CouponCode).First(&coupon).Error; err != nil {
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

			// Kiểm tra giới hạn 1 lần sử dụng cho mỗi khách hàng (tránh lạm dụng mã giảm giá)
			var userOrderQuery = tx.Model(&models.Order{}).Where("coupon_id = ? AND status != 'cancelled'", coupon.ID)
			if userID > 0 {
				userOrderQuery = userOrderQuery.Where("user_id = ? OR recipient_phone = ?", userID, req.RecipientPhone)
			} else {
				userOrderQuery = userOrderQuery.Where("recipient_phone = ?", req.RecipientPhone)
			}
			var userUsedCount int64
			if err := userOrderQuery.Count(&userUsedCount).Error; err == nil && userUsedCount > 0 {
				return errors.New("bạn đã sử dụng mã giảm giá này cho đơn hàng trước đó")
			}

			if coupon.DiscountType == "percent" {
				discountAmount = (subTotal * coupon.DiscountValue) / 100
				if coupon.MaxDiscount != nil && discountAmount > *coupon.MaxDiscount {
					discountAmount = *coupon.MaxDiscount
				}
			} else if coupon.DiscountType == "fixed" {
				discountAmount = coupon.DiscountValue
			} else if coupon.DiscountType == "freeship" {
				discountAmount = 0 // Đã được miễn giảm ở phí vận chuyển bởi ShippingService
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

		// Tính toán phí vận chuyển lại từ đầu phía server (KHÔNG tin cậy frontend)
		var shippingFee int64 = 0
		var shippingDistKM *float64
		var shippingDistSource = "osrm"
		var shippingFeeDetails *string

		if s.ShippingService != nil {
			estimateReq := dto.ShippingEstimateRequest{
				Latitude:      req.ShippingLat,
				Longitude:     req.ShippingLng,
				Address:       req.ShippingAddress,
				SubTotal:      subTotal,
				CouponCode:    req.CouponCode,
				Floor:         req.Floor,
				NeedsAssembly: req.NeedsAssembly,
			}
			for _, it := range req.Items {
				estimateReq.Items = append(estimateReq.Items, dto.ShippingEstimateItemInput{
					VariantID: it.VariantID,
					Quantity:  it.Quantity,
				})
			}

			estimateResp, err := s.ShippingService.EstimateShipping(context.Background(), estimateReq)
			if err != nil {
				return fmt.Errorf("không thể tính phí vận chuyển tự động: %w. Quý khách vui lòng kiểm tra lại địa chỉ hoặc thử lại sau", err)
			} else if !estimateResp.IsDeliverable {
				return errors.New(estimateResp.Message)
			} else {
				shippingFee = estimateResp.FinalShippingFee
				shippingDistKM = &estimateResp.DistanceKM
				shippingDistSource = estimateResp.Source
				detailsJSON, _ := json.Marshal(estimateResp.Breakdown)
				detailsStr := string(detailsJSON)
				shippingFeeDetails = &detailsStr
			}
		}

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

		initialStatus := "pending"
		logNote := "Khách hàng đặt hàng (COD) - Chờ xác nhận"
		paymentMethod := "cod"
		if req.PaymentMethod == "bank_transfer" {
			initialStatus = "awaiting_payment"
			logNote = "Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)"
			paymentMethod = "bank_transfer"
		}

		newOrder := models.Order{
			UserID:                 userID,
			OrderNumber:            orderNum,
			OrderCode:              orderNum,
			Status:                 initialStatus,
			PaymentMethod:          paymentMethod,
			SubTotal:               subTotal,
			DiscountAmount:         discountAmount,
			ShippingFee:            shippingFee,
			ShippingLat:            req.ShippingLat,
			ShippingLng:            req.ShippingLng,
			ShippingDistanceKM:     shippingDistKM,
			ShippingDistanceSource: shippingDistSource,
			ShippingFeeDetails:     shippingFeeDetails,
			TotalAmount:            totalAmount,
			CouponID:               couponID,
			CouponCode:             couponCode,
			RecipientName:          req.RecipientName,
			RecipientPhone:         req.RecipientPhone,
			ShippingAddress:        req.ShippingAddress,
			Note:                   notePtr,
			Items:                  orderItems,
		}

		if err := tx.Create(&newOrder).Error; err != nil {
			return err
		}

		// Nếu người dùng đăng nhập có truyền tọa độ, lưu nhớ lại vào địa chỉ mặc định
		if userID > 0 && req.ShippingLat != nil && req.ShippingLng != nil {
			_ = tx.Model(&models.Address{}).
				Where("user_id = ? AND is_default = ?", userID, true).
				Updates(map[string]interface{}{
					"latitude":  req.ShippingLat,
					"longitude": req.ShippingLng,
				}).Error
		}
		
		statusLog := models.OrderStatusLog{
			OrderID:    newOrder.ID,
			FromStatus: "",
			ToStatus:   initialStatus,
			Note:       &logNote,
			ChangedBy:  userID,
		}
		if err := tx.Create(&statusLog).Error; err != nil {
			return err
		}

		// Xóa giỏ hàng ngay nếu thanh toán COD; nếu chuyển khoản ngân hàng thì giữ giỏ hàng cho tới khi chuyển tiền thành công
		if paymentMethod != "bank_transfer" {
			var userCart models.Cart
			if err := tx.Where("user_id = ?", userID).First(&userCart).Error; err == nil {
				_ = tx.Where("cart_id = ?", userCart.ID).Delete(&models.CartItem{}).Error
			}
		}

		order = &newOrder
		return nil
	})

	if err == nil && order != nil {
		var user models.User
		_ = s.DB.First(&user, userID).Error

		// Lấy ảnh thật của các sản phẩm trong đơn hàng để đưa vào email (Batch Query triệt tiêu N+1)
		itemImages := make(map[uint64]string)
		if len(order.Items) > 0 {
			variantIDs := make([]uint64, 0, len(order.Items))
			for _, it := range order.Items {
				variantIDs = append(variantIDs, it.VariantID)
			}

			var variants []models.ProductVariant
			if errV := s.DB.Where("id IN ?", variantIDs).Find(&variants).Error; errV == nil && len(variants) > 0 {
				variantProductMap := make(map[uint64]uint64, len(variants))
				productIDSet := make(map[uint64]struct{}, len(variants))
				for _, v := range variants {
					variantProductMap[v.ID] = v.ProductID
					if v.ProductID > 0 {
						productIDSet[v.ProductID] = struct{}{}
					}
				}

				productIDs := make([]uint64, 0, len(productIDSet))
				for pid := range productIDSet {
					productIDs = append(productIDs, pid)
				}

				var allImages []models.ProductImage
				_ = s.DB.Where("variant_id IN ? OR product_id IN ?", variantIDs, productIDs).
					Order("is_primary desc, sort_order asc, id asc").
					Find(&allImages).Error

				variantImgMap := make(map[uint64]string)
				productImgMap := make(map[uint64]string)
				for _, img := range allImages {
					if img.URL == "" {
						continue
					}
					if img.VariantID != nil && *img.VariantID > 0 {
						if _, exists := variantImgMap[*img.VariantID]; !exists {
							variantImgMap[*img.VariantID] = img.URL
						}
					}
					if img.ProductID > 0 {
						if _, exists := productImgMap[img.ProductID]; !exists {
							productImgMap[img.ProductID] = img.URL
						}
					}
				}

				backendURL := ""
				if s.MailService != nil {
					backendURL = s.MailService.BackendURL
				}
				if backendURL == "" {
					backendURL = "http://localhost:8080"
				}
				trimmedBackendURL := strings.TrimRight(backendURL, "/")

				for _, it := range order.Items {
					imgURL := ""
					if u, ok := variantImgMap[it.VariantID]; ok {
						imgURL = u
					} else if pID, ok := variantProductMap[it.VariantID]; ok {
						if u, ok := productImgMap[pID]; ok {
							imgURL = u
						}
					}
					if imgURL != "" {
						if strings.HasPrefix(imgURL, "/") {
							imgURL = trimmedBackendURL + imgURL
						}
						itemImages[it.VariantID] = imgURL
					}
				}
			}
		}

		// Tạo bản sao độc lập của order để chạy bất đồng bộ / truyền an toàn không bị Race Condition
		orderCopy := *order
		itemsCopy := make([]models.OrderItem, len(order.Items))
		copy(itemsCopy, order.Items)
		orderCopy.Items = itemsCopy

		// 1. Gửi Email xác nhận đặt hàng cho khách hàng
		if s.MailService != nil && user.Email != "" {
			s.MailService.SendOrderConfirmation(&orderCopy, user.Email, user.FullName, orderCopy.Items, itemImages)
		}

		// 2. Gửi thông báo Telegram cho chủ shop
		if s.TelegramService != nil {
			s.TelegramService.SendNewOrderAlert(&orderCopy, user.FullName)
		}

		// 3. Tạo thông báo hệ thống (In-app Notification)
		if s.NotificationService != nil {
			// Thông báo cho khách hàng
			_, _ = s.NotificationService.Create(
				&userID,
				"customer",
				"📦 Đặt hàng thành công",
				fmt.Sprintf("Đơn hàng #%s trị giá %s đ đã được tiếp nhận và đang chờ xử lý.", order.OrderNumber, utils.FormatMoney(order.TotalAmount)),
				"order",
				"/orders",
			)
			// Thông báo cho Admin
			_, _ = s.NotificationService.Create(
				nil,
				"admin",
				"🛒 Đơn hàng mới: "+order.OrderNumber,
				fmt.Sprintf("Khách hàng %s vừa đặt đơn hàng #%s (Tổng tiền: %s đ).", order.RecipientName, order.OrderNumber, utils.FormatMoney(order.TotalAmount)),
				"order",
				"/admin/orders",
			)
		}
	}

	return order, err
}

func (s *OrderService) CustomerOrders(userID uint64, page, limit int) ([]dto.OrderListItem, int64, error) {
	var orders []models.Order
	var total int64

	// Chỉ hiển thị đơn hàng đã xác nhận thanh toán (hoặc COD), KHÔNG hiển thị đơn chưa chuyển khoản (awaiting_payment)
	query := s.DB.Model(&models.Order{}).Where("user_id = ? AND status != 'awaiting_payment'", userID)
	
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
			ID:            o.ID,
			OrderNumber:   o.OrderNumber,
			Status:        o.Status,
			PaymentMethod: o.PaymentMethod,
			TotalAmount:   o.TotalAmount,
			ItemCount:     itemCount,
			CreatedAt:     o.CreatedAt,
		})
	}
	return result, total, nil
}

func (s *OrderService) CustomerOrderDetail(userID, orderID uint64) (*models.Order, error) {
	var order models.Order
	if err := s.DB.Preload("Items").Preload("StatusLogs").Where("id = ? AND user_id = ? AND status != 'awaiting_payment'", orderID, userID).First(&order).Error; err != nil {
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
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
			return errors.New("không tìm thấy đơn hàng")
		}

		if order.Status != "pending" && order.Status != "awaiting_payment" {
			return errors.New("chỉ có thể hủy đơn hàng chưa xử lý")
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
			FromStatus: order.Status,
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
	var previousStatus string
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			return errors.New("không tìm thấy đơn hàng")
		}

		previousStatus = order.Status

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
			FromStatus: previousStatus,
			ToStatus:   req.Status,
			Note:       notePtr,
			ChangedBy:  adminID,
		}
		return tx.Create(&statusLog).Error
	})

	if err == nil && s.MailService != nil {
		var order models.Order
		if errOrder := s.DB.Preload("User").First(&order, orderID).Error; errOrder == nil && order.User.Email != "" {
			s.MailService.SendOrderStatusUpdate(&order, order.User.Email, order.User.FullName, previousStatus, req.Status, req.Note)
		}
	}

	if err == nil && s.NotificationService != nil {
		var order models.Order
		if errOrder := s.DB.First(&order, orderID).Error; errOrder == nil && order.UserID > 0 {
			statusVN := map[string]string{
				"confirmed": "Đã được xác nhận",
				"shipping":  "Đang được vận chuyển",
				"delivered": "Đã giao hàng thành công",
				"cancelled": "Đã bị hủy",
			}[req.Status]
			if statusVN == "" {
				statusVN = req.Status
			}
			_, _ = s.NotificationService.Create(
				&order.UserID,
				"customer",
				fmt.Sprintf("🚚 Cập nhật đơn hàng #%s", order.OrderNumber),
				fmt.Sprintf("Đơn hàng #%s của quý khách hiện %s.", order.OrderNumber, statusVN),
				"order",
				"/orders",
			)
		}
	}

	return err
}
