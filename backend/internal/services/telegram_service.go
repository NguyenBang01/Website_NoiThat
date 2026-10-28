package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"furniture-shop/backend/internal/config"
	"furniture-shop/backend/internal/models"
)

// TelegramService quản lý gửi thông báo tự động cho chủ cửa hàng qua Telegram Bot
type TelegramService struct {
	BotToken string
	ChatID   string
	Client   *http.Client
}

// NewTelegramService khởi tạo service từ cấu hình hệ thống
func NewTelegramService(cfg *config.Config) *TelegramService {
	return &TelegramService{
		BotToken: cfg.TelegramBotToken,
		ChatID:   cfg.TelegramChatID,
		Client:   &http.Client{Timeout: 6 * time.Second},
	}
}

// IsConfigured kiểm tra xem chủ shop đã cấu hình Telegram Bot chưa
func (t *TelegramService) IsConfigured() bool {
	return t.BotToken != "" && t.ChatID != ""
}

// SendMessageAsync gửi tin nhắn Telegram ở background, không làm gián đoạn luồng chính
func (t *TelegramService) SendMessageAsync(htmlText string) {
	if !t.IsConfigured() {
		return
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[TELEGRAM PANIC] Phục hồi từ lỗi: %v", r)
			}
		}()

		apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.BotToken)
		body := map[string]interface{}{
			"chat_id":    t.ChatID,
			"text":       htmlText,
			"parse_mode": "HTML",
		}

		jsonBytes, err := json.Marshal(body)
		if err != nil {
			log.Printf("[TELEGRAM ERROR] Lỗi marshal JSON: %v", err)
			return
		}

		resp, err := t.Client.Post(apiURL, "application/json", bytes.NewBuffer(jsonBytes))
		if err != nil {
			log.Printf("[TELEGRAM ERROR] Lỗi gửi thông báo Telegram: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("[TELEGRAM CẢNH BÁO] Telegram phản hồi mã lỗi HTTP %d", resp.StatusCode)
		} else {
			log.Printf("[TELEGRAM SUCCESS] Đã gửi thông báo cho chủ shop thành công!")
		}
	}()
}

// SendNewOrderAlert thông báo khi có khách tạo đơn hàng mới trên website
func (t *TelegramService) SendNewOrderAlert(order *models.Order, customerName string) {
	if !t.IsConfigured() || order == nil {
		return
	}

	name := customerName
	if name == "" {
		name = order.RecipientName
	}

	paymentMethodStr := "Thanh toán khi nhận hàng (COD)"
	if order.PaymentMethod == "bank_transfer" {
		paymentMethodStr = "Chuyển khoản SePay (VietQR)"
	}

	statusStr := "Chờ xác nhận"
	if order.Status == "awaiting_payment" {
		statusStr = "Chờ chuyển khoản"
	}

	noteStr := "Không có"
	if order.Note != nil && *order.Note != "" {
		noteStr = *order.Note
	}

	msg := fmt.Sprintf(`🔔 <b>CÓ ĐƠN HÀNG MỚI #[%s]</b>
━━━━━━━━━━━━━━━━━━━━
👤 Khách hàng: <b>%s</b>
📞 Số điện thoại: <code>%s</code>
💰 Tổng tiền: <b>%s</b>
💳 Phương thức: <b>%s</b>
📦 Trạng thái: <b>%s</b>
📍 Địa chỉ giao: %s
📝 Ghi chú: <i>%s</i>
⏰ Lúc: %s
━━━━━━━━━━━━━━━━━━━━
👉 Vui lòng kiểm tra trang quản trị để chuẩn bị hàng.`,
		order.OrderCode,
		name,
		order.RecipientPhone,
		FormatVND(order.TotalAmount),
		paymentMethodStr,
		statusStr,
		order.ShippingAddress,
		noteStr,
		time.Now().Format("15:04:05 02/01/2006"),
	)

	t.SendMessageAsync(msg)
}

// SendPaymentSuccessAlert thông báo khi SePay phát hiện tiền đã vào tài khoản ngân hàng
func (t *TelegramService) SendPaymentSuccessAlert(order *models.Order, amount int64, gateway string, refCode string) {
	if !t.IsConfigured() || order == nil {
		return
	}

	msg := fmt.Sprintf(`💰 <b>TIỀN ĐÃ VỀ TÀI KHOẢN! (SEPAY)</b>
━━━━━━━━━━━━━━━━━━━━
✅ Đơn hàng: <b>#%s</b>
💵 Số tiền nhận: <b>%s</b>
🏦 Cổng / Ngân hàng: <b>%s</b>
🔖 Mã tham chiếu GD: <code>%s</code>
👤 Người nhận: <b>%s</b> (<code>%s</code>)
🚀 Trạng thái: <b>ĐÃ THANH TOÁN (CONFIRMED)</b>
⏰ Thời gian: %s
━━━━━━━━━━━━━━━━━━━━
👉 Hãy tiến hành đóng gói và xuất kho cho khách hàng!`,
		order.OrderCode,
		FormatVND(amount),
		gateway,
		refCode,
		order.RecipientName,
		order.RecipientPhone,
		time.Now().Format("15:04:05 02/01/2006"),
	)

	t.SendMessageAsync(msg)
}
