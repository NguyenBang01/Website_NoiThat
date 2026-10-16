package services

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log"
	"net/smtp"
	"strings"
	"time"

	"furniture-shop/backend/internal/config"
	"furniture-shop/backend/internal/models"
)

// MailService quản lý toàn bộ việc gửi email qua giao thức SMTP (Gmail)
type MailService struct {
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	FromName  string
}

// NewMailService khởi tạo service gửi mail từ cấu hình config
func NewMailService(cfg *config.Config) *MailService {
	fromEmail := cfg.SMTPFromEmail
	if fromEmail == "" {
		fromEmail = cfg.SMTPUsername
	}
	fromName := cfg.SMTPFromName
	if fromName == "" {
		fromName = "Nội Thất Góc Nhà Đẹp"
	}

	return &MailService{
		Host:      cfg.SMTPHost,
		Port:      cfg.SMTPPort,
		Username:  cfg.SMTPUsername,
		Password:  cfg.SMTPPassword,
		FromEmail: fromEmail,
		FromName:  fromName,
	}
}

// IsConfigured kiểm tra xem cấu hình SMTP đã đầy đủ chưa
func (s *MailService) IsConfigured() bool {
	return s.Host != "" && s.Username != "" && s.Password != ""
}

// SendMail gửi một email HTML hoàn chỉnh tới danh sách người nhận (đồng bộ)
func (s *MailService) SendMail(to []string, subject string, htmlBody string) error {
	if !s.IsConfigured() {
		log.Println("[SMTP] Bỏ qua gửi email: chưa cấu hình SMTP_USERNAME hoặc SMTP_PASSWORD trong .env")
		return nil
	}

	if len(to) == 0 {
		return fmt.Errorf("danh sách người nhận trống")
	}

	addr := fmt.Sprintf("%s:%d", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)

	// Mã hóa tiêu đề và tên người gửi theo chuẩn RFC 2047 UTF-8 Base64 để hiển thị tiếng Việt hoàn hảo
	encodedSubject := fmt.Sprintf("=?UTF-8?B?%s?=", base64.StdEncoding.EncodeToString([]byte(subject)))
	encodedFromName := fmt.Sprintf("=?UTF-8?B?%s?=", base64.StdEncoding.EncodeToString([]byte(s.FromName)))

	toHeaders := strings.Join(to, ", ")

	header := make(map[string]string)
	header["From"] = fmt.Sprintf("%s <%s>", encodedFromName, s.FromEmail)
	header["To"] = toHeaders
	header["Subject"] = encodedSubject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/html; charset=UTF-8"
	header["Content-Transfer-Encoding"] = "base64"
	header["Date"] = time.Now().Format(time.RFC1123Z)

	var message strings.Builder
	for k, v := range header {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	message.WriteString("\r\n")

	// Mã hóa nội dung HTML sang base64 để tránh lỗi ký tự đặc biệt
	encodedBody := base64.StdEncoding.EncodeToString([]byte(htmlBody))
	// Cắt dòng base64 76 ký tự theo chuẩn MIME
	for i := 0; i < len(encodedBody); i += 76 {
		end := i + 76
		if end > len(encodedBody) {
			end = len(encodedBody)
		}
		message.WriteString(encodedBody[i:end] + "\r\n")
	}

	msgBytes := []byte(message.String())

	// Hỗ trợ cả cổng 465 (SSL direct) và cổng 587 (STARTTLS)
	if s.Port == 465 {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         s.Host,
		}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("lỗi kết nối TLS SMTP 465: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, s.Host)
		if err != nil {
			return fmt.Errorf("lỗi tạo SMTP client: %w", err)
		}
		defer client.Close()

		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("lỗi xác thực SMTP: %w", err)
		}

		if err = client.Mail(s.FromEmail); err != nil {
			return err
		}
		for _, recipient := range to {
			if err = client.Rcpt(recipient); err != nil {
				return err
			}
		}
		w, err := client.Data()
		if err != nil {
			return err
		}
		if _, err = w.Write(msgBytes); err != nil {
			return err
		}
		return w.Close()
	}

	// Mặc định cổng 587 dùng smtp.SendMail (tự động STARTTLS)
	// Đảm bảo không bị timeout treo request
	err := smtp.SendMail(addr, auth, s.FromEmail, to, msgBytes)
	if err != nil {
		log.Printf("[SMTP ERROR] Không thể gửi email tới %v: %v", to, err)
		return err
	}

	log.Printf("[SMTP SUCCESS] Đã gửi email thành công tới %v (Tiêu đề: %s)", to, subject)
	return nil
}

// SendMailAsync gửi email không đồng bộ trong Goroutine để không làm chậm request của khách
func (s *MailService) SendMailAsync(to []string, subject string, htmlBody string) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[SMTP PANIC] Phục hồi từ lỗi gửi mail: %v", r)
			}
		}()

		if err := s.SendMail(to, subject, htmlBody); err != nil {
			log.Printf("[SMTP ASYNC ERROR] Thất bại khi gửi email tới %v: %v", to, err)
		}
	}()
}

// FormatVND định dạng tiền tệ VND đẹp mắt (vd: 1.500.000 đ)
func FormatVND(amount int64) string {
	sign := ""
	if amount < 0 {
		sign = "-"
		amount = -amount
	}
	s := fmt.Sprintf("%d", amount)
	n := len(s)
	if n <= 3 {
		return fmt.Sprintf("%s%s đ", sign, s)
	}

	var res []string
	remainder := n % 3
	if remainder > 0 {
		res = append(res, s[:remainder])
	}
	for i := remainder; i < n; i += 3 {
		res = append(res, s[i:i+3])
	}
	return fmt.Sprintf("%s%s đ", sign, strings.Join(res, "."))
}

// -------------------------------------------------------------
// CÁC TEMPLATE EMAIL CHUYÊN NGHIỆP CỦA GÓC NHÀ ĐẸP
// -------------------------------------------------------------

// SendTestEmail gửi email kiểm tra cấu hình SMTP
func (s *MailService) SendTestEmail(toEmail string) error {
	nowStr := time.Now().Format("15:04:05 02/01/2006")
	subject := "Xác nhận kết nối SMTP thành công - Góc Nhà Đẹp"

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#78350f,#451a03);padding:32px 24px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;font-size:24px;letter-spacing:1px;font-weight:800;">GÓC NHÀ ĐẸP</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#fde68a;">Cấu hình máy chủ gửi Email SMTP Google</p>
    </div>
    <div style="padding:32px 24px;">
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin-bottom:24px;color:#065f46;">
        <h3 style="margin:0 0 4px;font-size:15px;font-weight:700;">✅ Kết nối Gmail SMTP thành công 100%%!</h3>
        <p style="margin:0;font-size:13px;">Hệ thống gửi thư điện tử tự động của Nội Thất Góc Nhà Đẹp đã sẵn sàng hoạt động.</p>
      </div>
      <table style="width:100%%;font-size:13px;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#78716c;">Thời gian kiểm tra:</td><td style="padding:8px 0;font-weight:600;text-align:right;">%s</td></tr>
        <tr><td style="padding:8px 0;color:#78716c;">Máy chủ SMTP:</td><td style="padding:8px 0;font-weight:600;text-align:right;">%s:%d</td></tr>
        <tr><td style="padding:8px 0;color:#78716c;">Tài khoản gửi:</td><td style="padding:8px 0;font-weight:600;text-align:right;">%s</td></tr>
        <tr><td style="padding:8px 0;color:#78716c;">Hộp thư nhận:</td><td style="padding:8px 0;font-weight:600;text-align:right;">%s</td></tr>
      </table>
      <div style="border-top:1px solid #f5f5f4;padding-top:20px;text-align:center;color:#a8a29e;font-size:12px;">
        Nội Thất Góc Nhà Đẹp &copy; %d. Hotline hỗ trợ: 0931.883.988
      </div>
    </div>
  </div>
</body>
</html>`, nowStr, s.Host, s.Port, s.Username, toEmail, time.Now().Year())

	return s.SendMail([]string{toEmail}, subject, html)
}

// SendPasswordResetOTP gửi mã OTP 6 số để khôi phục mật khẩu
func (s *MailService) SendPasswordResetOTP(toEmail, fullName, otpCode string) {
	subject := fmt.Sprintf("[%s] Mã xác thực đặt lại mật khẩu của bạn", otpCode)

	name := fullName
	if name == "" {
		name = "Quý khách"
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#78350f,#451a03);padding:28px 24px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;">GÓC NHÀ ĐẸP</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#fde68a;">Yêu cầu cấp lại mật khẩu tài khoản</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;">Xin chào <strong>%s</strong>,</p>
      <p style="margin:0 0 24px;font-size:13px;color:#57534e;line-height:1.6;">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>%s</strong>. Vui lòng sử dụng mã xác thực bên dưới để hoàn tất:
      </p>

      <div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mã OTP bảo mật của bạn</div>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#78350f;font-family:monospace;">%s</div>
        <div style="font-size:11px;color:#b45309;margin-top:8px;">Hiệu lực trong vòng <strong>10 phút</strong></div>
      </div>

      <p style="margin:0 0 16px;font-size:12px;color:#78716c;line-height:1.5;">
        ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ của Góc Nhà Đẹp. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và tài khoản của bạn vẫn an toàn.
      </p>

      <div style="border-top:1px solid #f5f5f4;margin-top:28px;padding-top:20px;text-align:center;color:#a8a29e;font-size:11px;">
        Hotline hỗ trợ trực tiếp: 0931.883.988 | Email: %s<br>
        Góc Nhà Đẹp - Nội thất sang trọng cho không gian sống hiện đại
      </div>
    </div>
  </div>
</body>
</html>`, name, toEmail, otpCode, s.FromEmail)

	s.SendMailAsync([]string{toEmail}, subject, html)
}

// SendOrderConfirmation gửi email xác nhận đặt hàng chi tiết cho khách hàng
func (s *MailService) SendOrderConfirmation(order *models.Order, customerEmail, customerName string, items []models.OrderItem) {
	if customerEmail == "" {
		return
	}

	subject := fmt.Sprintf("Xác nhận đơn hàng #%s - Góc Nhà Đẹp", order.OrderCode)
	if customerName == "" {
		customerName = order.RecipientName
	}

	// Xây dựng bảng danh sách sản phẩm
	var itemsRows strings.Builder
	for _, it := range items {
		variantStr := it.VariantInfo
		if variantStr != "" {
			variantStr = fmt.Sprintf("<div style='font-size:11px;color:#78716c;margin-top:2px;'>Phân loại: %s</div>", variantStr)
		}
		skuStr := ""
		if it.VariantSKU != "" {
			skuStr = fmt.Sprintf("<span style='font-size:10px;color:#a8a29e;font-family:monospace;'>SKU: %s</span>", it.VariantSKU)
		}

		price := it.Price
		if it.SalePrice != nil && *it.SalePrice > 0 {
			price = *it.SalePrice
		}

		itemsRows.WriteString(fmt.Sprintf(`
        <tr style="border-bottom:1px solid #f5f5f4;">
          <td style="padding:12px 8px;vertical-align:top;">
            <div style="font-weight:600;font-size:13px;color:#1c1917;">%s</div>
            %s
            %s
          </td>
          <td style="padding:12px 8px;vertical-align:top;text-align:center;font-size:13px;color:#44403c;">%d</td>
          <td style="padding:12px 8px;vertical-align:top;text-align:right;font-size:13px;color:#78350f;font-weight:600;">%s</td>
          <td style="padding:12px 8px;vertical-align:top;text-align:right;font-size:13px;color:#1c1917;font-weight:700;">%s</td>
        </tr>`, it.ProductName, variantStr, skuStr, it.Quantity, FormatVND(price), FormatVND(it.SubTotal)))
	}

	// Kiểm tra xem phương thức thanh toán có phải chuyển khoản ngân hàng không
	isBankTransfer := false
	if order.Note != nil && strings.Contains(*order.Note, "Chuyển khoản") {
		isBankTransfer = true
	}

	bankSection := ""
	if isBankTransfer {
		vietQRUrl := fmt.Sprintf("https://img.vietqr.io/image/970422-0931883988-compact2.png?amount=%d&addInfo=%s&accountName=GOC%%20NHA%%20DEP", order.TotalAmount, order.OrderCode)
		bankSection = fmt.Sprintf(`
      <div style="margin:24px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:20px;">
        <h4 style="margin:0 0 10px;font-size:14px;color:#92400e;font-weight:700;">💳 Hướng dẫn thanh toán Chuyển khoản VietQR</h4>
        <div style="font-size:12px;color:#78350f;margin-bottom:16px;line-height:1.5;">
          Đơn hàng của bạn sẽ được kích hoạt giao ngay sau khi hệ thống nhận được chuyển khoản. Quý khách có thể quét mã QR dưới đây:
        </div>
        <div style="text-align:center;margin-bottom:16px;">
          <img src="%s" alt="VietQR" style="max-width:220px;width:100%%;border-radius:12px;border:1px solid #fcd34d;box-shadow:0 2px 4px rgba(0,0,0,0.05);" />
        </div>
        <table style="width:100%%;font-size:12px;color:#44403c;">
          <tr><td style="padding:4px 0;color:#78716c;">Ngân hàng:</td><td style="font-weight:600;text-align:right;">MB Bank (Ngân hàng Quân Đội)</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;">Số tài khoản:</td><td style="font-weight:800;color:#78350f;font-size:14px;text-align:right;">0931883988</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;">Chủ tài khoản:</td><td style="font-weight:600;text-align:right;">GÓC NHÀ ĐẸP</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;">Nội dung CK:</td><td style="font-weight:800;color:#b45309;text-align:right;">%s</td></tr>
        </table>
      </div>`, vietQRUrl, order.OrderCode)
	}

	noteStr := "Không có ghi chú"
	if order.Note != nil && *order.Note != "" {
		noteStr = *order.Note
	}

	discountStr := ""
	if order.DiscountAmount > 0 {
		code := ""
		if order.CouponCode != nil {
			code = fmt.Sprintf(" (Mã: %s)", *order.CouponCode)
		}
		discountStr = fmt.Sprintf(`<tr><td style="padding:6px 0;color:#059669;">Giảm giá%s:</td><td style="padding:6px 0;font-weight:600;text-align:right;color:#059669;">-%s</td></tr>`, code, FormatVND(order.DiscountAmount))
	}

	shippingFeeStr := "Miễn phí"
	if order.ShippingFee > 0 {
		shippingFeeStr = FormatVND(order.ShippingFee)
	}

	orderDate := order.CreatedAt.Format("15:04:05 02/01/2006")

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#78350f,#451a03);padding:32px 24px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;font-size:24px;letter-spacing:1px;font-weight:800;">GÓC NHÀ ĐẸP</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#fde68a;">Cảm ơn bạn đã đặt hàng!</p>
      <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;margin-top:12px;border:1px solid rgba(255,255,255,0.2);">
        Mã đơn hàng: #%s
      </div>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;">Kính chào <strong>%s</strong>,</p>
      <p style="margin:0 0 24px;font-size:13px;color:#57534e;line-height:1.6;">
        Đơn hàng của Quý khách đã được tiếp nhận thành công vào lúc <strong>%s</strong>. Đội ngũ Góc Nhà Đẹp sẽ sớm liên hệ xác nhận và tiến hành đóng gói vận chuyển tới bạn.
      </p>

      <!-- Danh sách sản phẩm -->
      <table style="width:100%%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f5f5f4;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;">
            <th style="padding:10px 8px;border-radius:8px 0 0 8px;">Sản phẩm</th>
            <th style="padding:10px 8px;text-align:center;">SL</th>
            <th style="padding:10px 8px;text-align:right;">Đơn giá</th>
            <th style="padding:10px 8px;text-align:right;border-radius:0 8px 8px 0;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          %s
        </tbody>
      </table>

      <!-- Bảng tính tiền -->
      <div style="background:#fafaf9;border-radius:12px;padding:16px;margin-bottom:24px;">
        <table style="width:100%%;font-size:13px;color:#44403c;">
          <tr><td style="padding:6px 0;color:#78716c;">Tạm tính:</td><td style="padding:6px 0;font-weight:600;text-align:right;">%s</td></tr>
          %s
          <tr><td style="padding:6px 0;color:#78716c;">Phí vận chuyển:</td><td style="padding:6px 0;font-weight:600;text-align:right;">%s</td></tr>
          <tr style="border-top:1px dashed #d6d3d1;">
            <td style="padding:12px 0 4px;font-size:15px;font-weight:800;color:#1c1917;">TỔNG CỘNG THANH TOÁN:</td>
            <td style="padding:12px 0 4px;font-size:18px;font-weight:900;color:#78350f;text-align:right;">%s</td>
          </tr>
        </table>
      </div>

      <!-- Hướng dẫn ngân hàng (nếu có) -->
      %s

      <!-- Thông tin nhận hàng -->
      <div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:16px;margin-bottom:24px;">
        <h4 style="margin:0 0 12px;font-size:13px;color:#1c1917;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">📍 Thông tin giao hàng</h4>
        <table style="width:100%%;font-size:12px;color:#44403c;">
          <tr><td style="padding:4px 0;color:#78716c;width:120px;">Người nhận:</td><td style="font-weight:600;">%s</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;">Số điện thoại:</td><td style="font-weight:600;">%s</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;">Địa chỉ giao:</td><td style="font-weight:600;">%s</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;">Ghi chú đơn hàng:</td><td style="color:#78716c;font-style:italic;">%s</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:32px 0 16px;">
        <a href="http://localhost:4321/orders" style="display:inline-block;background:#78350f;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 28px;border-radius:12px;box-shadow:0 4px 6px rgba(120,53,15,0.2);">
          TRA CỨU TRẠNG THÁI ĐƠN HÀNG
        </a>
      </div>

      <div style="border-top:1px solid #f5f5f4;margin-top:28px;padding-top:20px;text-align:center;color:#a8a29e;font-size:11px;line-height:1.6;">
        Nếu Quý khách có bất kỳ thắc mắc nào, xin vui lòng liên hệ Hotline: <strong>0931.883.988</strong><br>
        Showroom: 123 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP. Hồ Chí Minh<br>
        Góc Nhà Đẹp &copy; %d. Trân trọng cảm ơn Quý khách!
      </div>
    </div>
  </div>
</body>
</html>`, order.OrderCode, customerName, orderDate, itemsRows.String(), FormatVND(order.SubTotal), discountStr, shippingFeeStr, FormatVND(order.TotalAmount), bankSection, order.RecipientName, order.RecipientPhone, order.ShippingAddress, noteStr, time.Now().Year())

	s.SendMailAsync([]string{customerEmail}, subject, html)
}

// SendOrderStatusUpdate gửi thông báo khi Admin cập nhật trạng thái đơn hàng
func (s *MailService) SendOrderStatusUpdate(order *models.Order, customerEmail, customerName, oldStatus, newStatus, note string) {
	if customerEmail == "" {
		return
	}

	statusMap := map[string]string{
		"pending":   "Chờ xác nhận",
		"confirmed": "Đã xác nhận",
		"shipping":  "Đang giao hàng",
		"delivered": "Đã giao hàng thành công",
		"cancelled": "Đã hủy đơn hàng",
	}

	statusColorMap := map[string]string{
		"pending":   "#b45309",
		"confirmed": "#1d4ed8",
		"shipping":  "#7c3aed",
		"delivered": "#059669",
		"cancelled": "#dc2626",
	}

	vnStatus := statusMap[newStatus]
	if vnStatus == "" {
		vnStatus = newStatus
	}

	statusColor := statusColorMap[newStatus]
	if statusColor == "" {
		statusColor = "#78350f"
	}

	subject := fmt.Sprintf("Cập nhật đơn hàng #%s: %s - Góc Nhà Đẹp", order.OrderCode, vnStatus)

	noteSection := ""
	if note != "" {
		noteSection = fmt.Sprintf(`
      <div style="margin:20px 0;background:#fafaf9;border-left:4px solid %s;padding:12px 16px;border-radius:4px;font-size:13px;color:#44403c;">
        <strong>Ghi chú từ quản trị viên:</strong> %s
      </div>`, statusColor, note)
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#78350f,#451a03);padding:28px 24px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;">GÓC NHÀ ĐẸP</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#fde68a;">Thông báo tiến độ đơn hàng #%s</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;">Kính chào <strong>%s</strong>,</p>
      <p style="margin:0 0 20px;font-size:13px;color:#57534e;line-height:1.6;">
        Đơn hàng của Quý khách vừa được cập nhật sang trạng thái:
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;background:%s;color:#ffffff;font-size:15px;font-weight:800;padding:10px 24px;border-radius:24px;letter-spacing:0.5px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          %s
        </span>
      </div>

      %s

      <table style="width:100%%;font-size:12px;color:#44403c;margin-bottom:24px;background:#fafaf9;border-radius:12px;padding:16px;">
        <tr><td style="padding:4px 0;color:#78716c;">Mã đơn:</td><td style="font-weight:700;text-align:right;">#%s</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;">Người nhận:</td><td style="font-weight:600;text-align:right;">%s</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;">Số điện thoại:</td><td style="font-weight:600;text-align:right;">%s</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;">Tổng tiền thanh toán:</td><td style="font-weight:800;color:#78350f;text-align:right;">%s</td></tr>
      </table>

      <div style="text-align:center;margin:28px 0 16px;">
        <a href="http://localhost:4321/orders" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;padding:12px 24px;border-radius:10px;">
          XEM CHI TIẾT ĐƠN HÀNG
        </a>
      </div>

      <div style="border-top:1px solid #f5f5f4;margin-top:24px;padding-top:16px;text-align:center;color:#a8a29e;font-size:11px;">
        Hotline hỗ trợ: 0931.883.988 | Email: %s<br>
        Góc Nhà Đẹp &copy; %d. Trân trọng cảm ơn Quý khách!
      </div>
    </div>
  </div>
</body>
</html>`, order.OrderCode, customerName, statusColor, vnStatus, noteSection, order.OrderCode, order.RecipientName, order.RecipientPhone, FormatVND(order.TotalAmount), s.FromEmail, time.Now().Year())

	s.SendMailAsync([]string{customerEmail}, subject, html)
}

// SendContactNotification gửi thông báo cho Quản trị viên và thư cảm ơn cho khách gửi liên hệ
func (s *MailService) SendContactNotification(contact *models.Contact) {
	adminEmail := s.FromEmail
	nowStr := time.Now().Format("15:04:05 02/01/2006")

	// 1. Gửi email thông báo cho Admin
	adminSubject := fmt.Sprintf("[LIÊN HỆ MỚI] %s - từ %s", contact.Subject, contact.FullName)
	phoneStr := ""
	if contact.Phone != nil {
		phoneStr = *contact.Phone
	}

	adminHtml := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#1c1917;padding:20px;">
  <div style="max-width:540px;margin:0 auto;border:1px solid #e7e5e4;border-radius:12px;padding:24px;background:#ffffff;">
    <h3 style="color:#78350f;margin-top:0;">📩 Khách hàng gửi liên hệ mới</h3>
    <table style="width:100%%;font-size:13px;">
      <tr><td style="color:#78716c;width:110px;padding:6px 0;">Họ tên:</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#78716c;padding:6px 0;">Email:</td><td><a href="mailto:%s">%s</a></td></tr>
      <tr><td style="color:#78716c;padding:6px 0;">Số điện thoại:</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#78716c;padding:6px 0;">Chủ đề:</td><td><strong>%s</strong></td></tr>
      <tr><td style="color:#78716c;padding:6px 0;">Thời gian:</td><td>%s</td></tr>
    </table>
    <div style="margin-top:16px;background:#fafaf9;padding:16px;border-radius:8px;font-size:13px;line-height:1.6;border:1px solid #f5f5f4;">
      <strong>Nội dung:</strong><br>%s
    </div>
  </div>
</body>
</html>`, contact.FullName, contact.Email, contact.Email, phoneStr, contact.Subject, nowStr, contact.Message)

	s.SendMailAsync([]string{adminEmail}, adminSubject, adminHtml)

	// 2. Gửi thư cảm ơn khách hàng
	if contact.Email != "" {
		customerSubject := "Góc Nhà Đẹp đã nhận được thông tin liên hệ của bạn"
		customerHtml := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#1c1917;padding:20px;background:#fafaf9;">
  <div style="max-width:540px;margin:0 auto;border:1px solid #e7e5e4;border-radius:16px;padding:28px;background:#ffffff;">
    <h3 style="color:#78350f;margin-top:0;">GÓC NHÀ ĐẸP</h3>
    <p style="font-size:14px;">Kính chào <strong>%s</strong>,</p>
    <p style="font-size:13px;color:#57534e;line-height:1.6;">
      Cảm ơn Quý khách đã liên hệ với Nội Thất Góc Nhà Đẹp. Chúng tôi đã nhận được thông điệp của bạn với chủ đề <strong>"%s"</strong>.
    </p>
    <p style="font-size:13px;color:#57534e;line-height:1.6;">
      Đội ngũ chăm sóc khách hàng sẽ phản hồi qua email hoặc số điện thoại <strong>%s</strong> của Quý khách trong thời gian sớm nhất (chậm nhất trong vòng 24 giờ).
    </p>
    <div style="border-top:1px solid #f5f5f4;margin-top:24px;padding-top:16px;font-size:11px;color:#a8a29e;text-align:center;">
      Hotline: 0931.883.988 | Website: <a href="http://localhost:4321">Góc Nhà Đẹp</a>
    </div>
  </div>
</body>
</html>`, contact.FullName, contact.Subject, phoneStr)

		s.SendMailAsync([]string{contact.Email}, customerSubject, customerHtml)
	}
}
