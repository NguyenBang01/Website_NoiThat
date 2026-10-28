package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

type SepayService struct {
	DB              *gorm.DB
	APIKey          string
	MailService     *MailService
	TelegramService *TelegramService
	lastSyncMu      sync.Mutex
	lastSync        time.Time
}

func NewSepayService(db *gorm.DB, apiKey string, mailService *MailService, telegramService ...*TelegramService) *SepayService {
	var ts *TelegramService
	if len(telegramService) > 0 {
		ts = telegramService[0]
	}
	return &SepayService{
		DB:              db,
		APIKey:          apiKey,
		MailService:     mailService,
		TelegramService: ts,
	}
}

// cleanStr loại bỏ khoảng trắng, dấu gạch nối và chuyển thành chữ in hoa để so khớp
func cleanStr(s string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9]`)
	return strings.ToUpper(reg.ReplaceAllString(s, ""))
}

// ProcessWebhook xử lý webhook giao dịch từ SePay
func (s *SepayService) ProcessWebhook(payload dto.SepayWebhookPayload) (*models.SepayTransaction, error) {
	// 1. Kiểm tra trùng lặp (Idempotency) theo SepayID
	var existing models.SepayTransaction
	if err := s.DB.Where("sepay_id = ?", payload.ID).First(&existing).Error; err == nil {
		log.Printf("[SePay] Giao dịch ID %d đã được xử lý trước đó, bỏ qua trùng lặp", payload.ID)
		return &existing, nil
	}

	txRecord := models.SepayTransaction{
		SepayID:         payload.ID,
		Gateway:         payload.Gateway,
		TransactionDate: payload.TransactionDate,
		AccountNumber:   payload.AccountNumber,
		SubAccount:      payload.SubAccount,
		TransferType:    payload.TransferType,
		TransferAmount:  payload.TransferAmount,
		Accumulated:     payload.Accumulated,
		Code:            payload.Code,
		Content:         payload.Content,
		ReferenceCode:   payload.ReferenceCode,
		Description:     payload.Description,
		Status:          "unmatched",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Chỉ xử lý giao dịch tiền vào ("in")
	if strings.ToLower(payload.TransferType) != "in" {
		txRecord.Status = "ignored"
		_ = s.DB.Create(&txRecord).Error
		log.Printf("[SePay] Giao dịch ID %d không phải tiền vào (type=%s), bỏ qua", payload.ID, payload.TransferType)
		return &txRecord, nil
	}

	// 2. Tìm kiếm đơn hàng tương ứng
	desc := ""
	if payload.Description != nil {
		desc = *payload.Description
	}
	matchedOrder, err := s.findMatchingOrder(payload.Content, desc)
	if err != nil {
		log.Printf("[SePay] Không tìm thấy đơn hàng khớp với nội dung '%s': %v", payload.Content, err)
		_ = s.DB.Create(&txRecord).Error
		return &txRecord, nil
	}

	// 3. Khớp đơn hàng
	txRecord.OrderID = &matchedOrder.ID
	txRecord.Status = "matched"

	// Cập nhật trạng thái đơn hàng trong Transaction DB
	isTransitionToPaid := false
	err = s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&txRecord).Error; err != nil {
			return err
		}

		// Nếu đơn hàng đang awaiting_payment hoặc pending thì chuyển thành confirmed (chống gửi trùng email)
		if matchedOrder.Status == "awaiting_payment" || matchedOrder.Status == "pending" {
			isTransitionToPaid = true
			oldStatus := matchedOrder.Status
			if err := tx.Model(matchedOrder).Updates(map[string]interface{}{
				"status":     "confirmed",
				"updated_at": time.Now(),
			}).Error; err != nil {
				return err
			}

			noteMsg := fmt.Sprintf("SePay: Thanh toán thành công %d đ qua %s (STK: %s, Mã GD: %d)",
				payload.TransferAmount, payload.Gateway, payload.AccountNumber, payload.ID)

			statusLog := models.OrderStatusLog{
				OrderID:    matchedOrder.ID,
				FromStatus: oldStatus,
				ToStatus:   "confirmed",
				Note:       &noteMsg,
				ChangedBy:  0, // Hệ thống tự động
				CreatedAt:  time.Now(),
			}

			if err := tx.Create(&statusLog).Error; err != nil {
				return err
			}

			// Xóa giỏ hàng của khách sau khi thanh toán thành công
			if matchedOrder.UserID > 0 {
				var userCart models.Cart
				if err := tx.Where("user_id = ?", matchedOrder.UserID).First(&userCart).Error; err == nil {
					_ = tx.Where("cart_id = ?", userCart.ID).Delete(&models.CartItem{}).Error
				}
			}
		}

		return nil
	})

	if err != nil {
		log.Printf("[SePay] Lỗi cập nhật đơn hàng #%s: %v", matchedOrder.OrderCode, err)
		return nil, err
	}

	// Xử lý gửi thông báo khi đơn chuyển sang Đã thanh toán (chỉ gửi 1 lần duy nhất)
	if isTransitionToPaid {
		refCodeStr := ""
		if payload.ReferenceCode != nil {
			refCodeStr = *payload.ReferenceCode
		}

		// 1. Gửi Email 3 Xác nhận thanh toán thành công cho khách hàng
		if s.MailService != nil && matchedOrder.UserID > 0 {
			var user models.User
			if errUser := s.DB.First(&user, matchedOrder.UserID).Error; errUser == nil && user.Email != "" {
				s.MailService.SendPaymentSuccessConfirmation(
					matchedOrder,
					user.Email,
					user.FullName,
					payload.TransferAmount,
					payload.Gateway,
					payload.TransactionDate,
					refCodeStr,
				)
			}
		}

		// 2. Gửi thông báo Telegram cho chủ shop
		if s.TelegramService != nil {
			s.TelegramService.SendPaymentSuccessAlert(matchedOrder, payload.TransferAmount, payload.Gateway, refCodeStr)
		}
	}

	log.Printf("[SePay] Đã khớp và tự động xác nhận đơn hàng #%s với số tiền %d đ!", matchedOrder.OrderCode, payload.TransferAmount)
	return &txRecord, nil
}

// findMatchingOrder tìm đơn hàng dựa vào nội dung hoặc mô tả giao dịch
func (s *SepayService) findMatchingOrder(content, description string) (*models.Order, error) {
	searchContent := content + " " + description
	cleanedSearch := cleanStr(searchContent)

	if cleanedSearch == "" {
		return nil, errors.New("nội dung giao dịch rỗng")
	}

	// Lấy danh sách các đơn hàng đang chờ thanh toán (awaiting_payment hoặc pending) gần đây (100 đơn gần nhất)
	var pendingOrders []models.Order
	if err := s.DB.Where("status IN ?", []string{"awaiting_payment", "pending"}).Order("id DESC").Limit(100).Find(&pendingOrders).Error; err != nil {
		return nil, err
	}

	for _, order := range pendingOrders {
		cleanCode := cleanStr(order.OrderCode)
		cleanNum := cleanStr(order.OrderNumber)

		if cleanCode != "" && strings.Contains(cleanedSearch, cleanCode) {
			return &order, nil
		}
		if cleanNum != "" && strings.Contains(cleanedSearch, cleanNum) {
			return &order, nil
		}
	}

	// Nếu không có trong pending, tìm trong tất cả các đơn hàng gần đây (để lưu liên kết)
	var allOrders []models.Order
	if err := s.DB.Order("id DESC").Limit(50).Find(&allOrders).Error; err != nil {
		return nil, err
	}

	for _, order := range allOrders {
		cleanCode := cleanStr(order.OrderCode)
		cleanNum := cleanStr(order.OrderNumber)

		if cleanCode != "" && strings.Contains(cleanedSearch, cleanCode) {
			return &order, nil
		}
		if cleanNum != "" && strings.Contains(cleanedSearch, cleanNum) {
			return &order, nil
		}
	}

	return nil, errors.New("không tìm thấy đơn hàng phù hợp")
}

// SyncTransactionsFromSepay chủ động gọi SePay API v2 để kéo danh sách giao dịch mới nhất và tự động khớp
func (s *SepayService) SyncTransactionsFromSepay() {
	apiKey := strings.TrimSpace(s.APIKey)
	if apiKey == "" {
		return
	}

	s.lastSyncMu.Lock()
	if time.Since(s.lastSync) < 3*time.Second {
		s.lastSyncMu.Unlock()
		return
	}
	s.lastSync = time.Now()
	s.lastSyncMu.Unlock()

	req, err := http.NewRequest("GET", "https://userapi.sepay.vn/v2/transactions?page=1&per_page=20", nil)
	if err != nil {
		return
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return
	}

	var apiResp struct {
		Status string `json:"status"`
		Data   []struct {
			ID                 interface{} `json:"id"`
			TransactionDate    string      `json:"transaction_date"`
			AccountNumber      string      `json:"account_number"`
			TransferType       string      `json:"transfer_type"`
			AmountIn           int64       `json:"amount_in"`
			Accumulated        int64       `json:"accumulated"`
			TransactionContent string      `json:"transaction_content"`
			ReferenceNumber    string      `json:"reference_number"`
			BankBrandName      string      `json:"bank_brand_name"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return
	}

	for _, item := range apiResp.Data {
		if strings.ToLower(item.TransferType) != "in" && item.AmountIn <= 0 {
			continue
		}

		var numID int64
		switch v := item.ID.(type) {
		case float64:
			numID = int64(v)
		case int64:
			numID = v
		case string:
			if n, err := strconv.ParseInt(v, 10, 64); err == nil {
				numID = n
			} else {
				var h int64
				for _, b := range []byte(v) {
					h = h*31 + int64(b)
				}
				if h < 0 {
					h = -h
				}
				numID = h
			}
		}

		ref := item.ReferenceNumber
		desc := item.TransactionContent
		payload := dto.SepayWebhookPayload{
			ID:              numID,
			Gateway:         item.BankBrandName,
			TransactionDate: item.TransactionDate,
			AccountNumber:   item.AccountNumber,
			TransferType:    "in",
			TransferAmount:  item.AmountIn,
			Accumulated:     item.Accumulated,
			Content:         item.TransactionContent,
			ReferenceCode:   &ref,
			Description:     &desc,
		}

		_, _ = s.ProcessWebhook(payload)
	}
}

// CheckPaymentStatus kiểm tra trạng thái thanh toán của đơn hàng theo orderCode
func (s *SepayService) CheckPaymentStatus(orderCode string) (*dto.PaymentCheckResponse, error) {
	trimmed := strings.TrimSpace(orderCode)
	var order models.Order
	if err := s.DB.Where("order_code = ? OR order_number = ?", trimmed, trimmed).First(&order).Error; err != nil {
		// Thử tìm theo clean string
		clean := cleanStr(trimmed)
		var orders []models.Order
		s.DB.Order("id DESC").Limit(20).Find(&orders)
		found := false
		for _, o := range orders {
			if cleanStr(o.OrderCode) == clean || cleanStr(o.OrderNumber) == clean {
				order = o
				found = true
				break
			}
		}
		if !found {
			return nil, errors.New("không tìm thấy đơn hàng")
		}
	}

	// Nếu đơn hàng chưa thanh toán và có SePay API Token, chủ động kéo giao dịch mới từ SePay API v2
	if (order.Status == "awaiting_payment" || order.Status == "pending") && strings.TrimSpace(s.APIKey) != "" {
		s.SyncTransactionsFromSepay()
		// Lấy lại trạng thái mới nhất của đơn hàng
		_ = s.DB.Where("id = ?", order.ID).First(&order).Error
	}

	// Kiểm tra xem đã có giao dịch SePay khớp chưa
	var txRecord models.SepayTransaction
	paidAmount := int64(0)
	if err := s.DB.Where("order_id = ? AND status = ?", order.ID, "matched").Order("id DESC").First(&txRecord).Error; err == nil {
		paidAmount = txRecord.TransferAmount
	} else if order.Status == "confirmed" || order.Status == "shipping" || order.Status == "delivered" {
		paidAmount = order.TotalAmount
	}

	isPaid := order.Status == "confirmed" || order.Status == "shipping" || order.Status == "delivered"

	return &dto.PaymentCheckResponse{
		OrderCode:   order.OrderCode,
		Status:      order.Status,
		IsPaid:      isPaid,
		TotalAmount: order.TotalAmount,
		PaidAmount:  paidAmount,
	}, nil
}

// CancelUnpaidOrder hủy đơn hàng đang chờ chuyển khoản và hoàn kho
func (s *SepayService) CancelUnpaidOrder(orderCode string) error {
	trimmed := strings.TrimSpace(orderCode)
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Where("order_code = ? OR order_number = ?", trimmed, trimmed).First(&order).Error; err != nil {
			return errors.New("không tìm thấy đơn hàng")
		}

		if order.Status != "awaiting_payment" {
			return errors.New("chỉ có thể hủy đơn hàng đang chờ thanh toán")
		}

		now := time.Now()
		reason := "Khách hàng hủy thanh toán chuyển khoản"
		if err := tx.Model(&order).Updates(map[string]interface{}{
			"status":        "cancelled",
			"cancelled_at":  now,
			"cancel_reason": reason,
		}).Error; err != nil {
			return err
		}

		// Hoàn lại số lượng tồn kho
		var items []models.OrderItem
		if err := tx.Where("order_id = ?", order.ID).Find(&items).Error; err == nil {
			for _, item := range items {
				_ = tx.Model(&models.ProductVariant{}).Where("id = ?", item.VariantID).
					UpdateColumn("stock_quantity", gorm.Expr("stock_quantity + ?", item.Quantity)).Error
			}
		}

		statusLog := models.OrderStatusLog{
			OrderID:    order.ID,
			FromStatus: "awaiting_payment",
			ToStatus:   "cancelled",
			Note:       &reason,
			ChangedBy:  order.UserID,
			CreatedAt:  now,
		}
		return tx.Create(&statusLog).Error
	})
}

// ListTransactions lấy danh sách giao dịch SePay (cho admin)
func (s *SepayService) ListTransactions(limit int) ([]models.SepayTransaction, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var list []models.SepayTransaction
	err := s.DB.Preload("Order").Order("id DESC").Limit(limit).Find(&list).Error
	return list, err
}
