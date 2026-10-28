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
	Host          string
	Port          int
	Username      string
	Password      string
	FromEmail     string
	FromName      string
	StorefrontURL string
	BackendURL    string
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
	storefrontURL := cfg.StorefrontURL
	if storefrontURL == "" {
		storefrontURL = "http://localhost:4321"
	}
	backendURL := cfg.BackendURL
	if backendURL == "" {
		backendURL = "https://shrug-guidance-captive.ngrok-free.dev"
	}

	return &MailService{
		Host:          cfg.SMTPHost,
		Port:          cfg.SMTPPort,
		Username:      cfg.SMTPUsername,
		Password:      cfg.SMTPPassword,
		FromEmail:     fromEmail,
		FromName:      fromName,
		StorefrontURL: storefrontURL,
		BackendURL:    backendURL,
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
    <div style="background:linear-gradient(135deg,#14532d,#166534);padding:28px 24px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;width:38px;height:38px;line-height:38px;background:#ffffff;color:#15803d;border-radius:10px;font-family:serif;font-weight:900;font-size:20px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        G
      </div>
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;text-transform:uppercase;">GÓC NHÀ ĐẸP</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#bbf7d0;">Yêu cầu cấp lại mật khẩu tài khoản</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;">Xin chào <strong>%s</strong>,</p>
      <p style="margin:0 0 24px;font-size:13px;color:#57534e;line-height:1.6;">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>%s</strong>. Vui lòng sử dụng mã xác thực bên dưới để hoàn tất:
      </p>

      <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mã OTP bảo mật của bạn</div>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#14532d;font-family:monospace;">%s</div>
        <div style="font-size:11px;color:#15803d;margin-top:8px;">Hiệu lực trong vòng <strong>10 phút</strong></div>
      </div>

      <p style="margin:0 0 16px;font-size:12px;color:#78716c;line-height:1.5;">
        ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ của Góc Nhà Đẹp. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và tài khoản của bạn vẫn an toàn.
      </p>

      <div style="border-top:1px solid #e7e5e4;margin-top:28px;padding-top:20px;text-align:center;color:#78716c;font-size:12px;line-height:1.7;">
        <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:4px;">HỆ THỐNG SHOWROOM GÓC NHÀ ĐẸP</div>
        <div><strong>Showroom 1:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM</div>
        <div><strong>Showroom 2:</strong> 295 Tây Thạnh, Phường Tây Thạnh, Quận Tân Phú, TP. HCM</div>
        <div style="margin-top:4px;">Hotline tư vấn & hỗ trợ: <a href="tel:0931883988" style="color:#15803d;font-weight:700;text-decoration:none;">0931.883.988</a></div>
      </div>
    </div>
  </div>
</body>
</html>`, name, toEmail, otpCode, s.FromEmail)

	s.SendMailAsync([]string{toEmail}, subject, html)
}

// SendLoginAlert gửi thông báo đăng nhập khi đăng nhập từ thiết bị mới / IP mới hoặc đăng nhập lần đầu
func (s *MailService) SendLoginAlert(toEmail, fullName, ip, device, location string, loginTime time.Time, isFirstLogin bool) {
	if toEmail == "" {
		return
	}

	loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		loc = time.FixedZone("ICT", 7*3600)
	}
	timeFormatted := loginTime.In(loc).Format("15:04:05 - 02/01/2006 (Giờ Việt Nam)")

	name := fullName
	if name == "" {
		name = "Quý khách"
	}
	if device == "" {
		device = "Trình duyệt Web tiêu chuẩn"
	}
	if location == "" {
		location = "Việt Nam (Ước tính theo mạng)"
	}
	if ip == "" {
		ip = "Không xác định"
	}

	subject := fmt.Sprintf("Thông báo đăng nhập vào tài khoản %s", s.FromName)
	badgeText := "THIẾT BỊ MỚI ĐĂNG NHẬP"
	badgeBg := "#fef2f2"
	badgeColor := "#b91c1c"
	badgeBorder := "#fecaca"
	bannerDesc := "Phát hiện phiên truy cập từ thiết bị mới"
	introText := fmt.Sprintf("Hệ thống bảo mật ghi nhận tài khoản liên kết với địa chỉ <strong>%s</strong> vừa đăng nhập thành công từ một thiết bị hoặc địa chỉ mạng mới:", toEmail)

	if isFirstLogin {
		subject = fmt.Sprintf("Chào mừng bạn đến với %s & Thông báo bảo mật tài khoản", s.FromName)
		badgeText = "ĐĂNG NHẬP LẦN ĐẦU THÀNH CÔNG"
		badgeBg = "#ecfdf5"
		badgeColor = "#047857"
		badgeBorder = "#a7f3d0"
		bannerDesc = "Chào mừng thành viên mới"
		introText = fmt.Sprintf("Nội Thất %s xin gửi lời chào trân trọng nhất tới Quý khách! Dưới đây là thông tin thiết bị và phiên đăng nhập đầu tiên của bạn:", s.FromName)
	}

	storeURL := s.StorefrontURL
	if storeURL == "" {
		storeURL = "http://localhost:4321"
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 12px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06);">
    <!-- Header thương hiệu xanh ngọc sang trọng đồng bộ website -->
    <div style="background:linear-gradient(135deg,#14532d,#166534);padding:32px 24px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;width:44px;height:44px;line-height:44px;background:#ffffff;color:#15803d;border-radius:12px;font-family:serif;font-weight:900;font-size:22px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        G
      </div>
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;color:#ffffff;text-transform:uppercase;">%s</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#bbf7d0;letter-spacing:0.5px;">%s</p>
    </div>

    <!-- Thân thư -->
    <div style="padding:32px 24px;">
      <div style="display:inline-block;background:%s;color:%s;border:1px solid %s;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px;margin-bottom:16px;">
        %s
      </div>

      <p style="margin:0 0 14px;font-size:15px;color:#1c1917;font-weight:600;">Xin chào %s,</p>
      <p style="margin:0 0 24px;font-size:13px;color:#57534e;line-height:1.6;">
        %s
      </p>

      <!-- Khối chi tiết đăng nhập -->
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <table style="width:100%%;font-size:13px;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#78716c;width:140px;vertical-align:top;">🕒 Thời gian đăng nhập:</td>
            <td style="padding:8px 0;font-weight:600;color:#1c1917;text-align:right;">%s</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#78716c;vertical-align:top;border-top:1px dashed #e7e5e4;">💻 Thiết bị / Trình duyệt:</td>
            <td style="padding:8px 0;font-weight:600;color:#1c1917;text-align:right;border-top:1px dashed #e7e5e4;">%s</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#78716c;vertical-align:top;border-top:1px dashed #e7e5e4;">🌐 Địa chỉ IP mạng:</td>
            <td style="padding:8px 0;font-family:monospace;font-weight:600;color:#15803d;text-align:right;border-top:1px dashed #e7e5e4;">%s</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#78716c;vertical-align:top;border-top:1px dashed #e7e5e4;">📍 Vị trí ước tính:</td>
            <td style="padding:8px 0;font-weight:600;color:#1c1917;text-align:right;border-top:1px dashed #e7e5e4;">%s</td>
          </tr>
        </table>
      </div>

      <!-- Cảnh báo bảo mật quan trọng -->
      <div style="background:#fff7ed;border-left:4px solid #ea580c;border-radius:6px;padding:14px 16px;margin-bottom:28px;">
        <div style="font-size:13px;font-weight:700;color:#9a3412;margin-bottom:4px;">⚠️ Lưu ý an toàn tài khoản:</div>
        <div style="font-size:12px;color:#7c2d12;line-height:1.55;">
          Nếu chính Quý khách vừa đăng nhập, bạn có thể hoàn toàn an tâm tiếp tục mua sắm.<br>
          <strong>Nếu KHÔNG PHẢI BẠN</strong>, hãy đổi mật khẩu tài khoản Google (hoặc mật khẩu web) ngay lập tức và liên hệ với chúng tôi để được trợ giúp bảo vệ tài khoản kịp thời.
        </div>
      </div>

      <!-- Nút hành động -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="%s" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:12px;box-shadow:0 4px 6px -1px rgba(21,128,61,0.25);">
          TRUY CẬP WEBSITE & BẢO VỆ TÀI KHOẢN
        </a>
      </div>

      <!-- Hotline hỗ trợ -->
      <div style="text-align:center;margin-bottom:20px;font-size:12px;color:#78716c;">
        Cần trợ giúp bảo mật khẩn cấp? Hotline: <a href="tel:0931883988" style="color:#15803d;font-weight:700;text-decoration:none;">0931.883.988</a> (Zalo/Call 24/7)
      </div>

      <!-- Chân trang Showroom -->
      <div style="border-top:1px solid #e7e5e4;padding-top:20px;text-align:center;color:#78716c;font-size:12px;line-height:1.7;">
        <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:6px;">HỆ THỐNG SHOWROOM NỘI THẤT GÓC NHÀ ĐẸP</div>
        <div><strong>Showroom 1:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM</div>
        <div><strong>Showroom 2:</strong> 295 Tây Thạnh, Phường Tây Thạnh, Quận Tân Phú, TP. HCM</div>
        <div style="margin-top:4px;">Hotline tư vấn thiết kế & hỗ trợ: <a href="tel:0931883988" style="color:#15803d;font-weight:700;text-decoration:none;">0931.883.988</a> (24/7)</div>
        <div style="color:#a8a29e;font-size:11px;margin-top:8px;">%s &copy; %d. Trân trọng cảm ơn Quý khách!</div>
      </div>
    </div>
  </div>
</body>
</html>`, s.FromName, bannerDesc, badgeBg, badgeColor, badgeBorder, badgeText, name, introText, timeFormatted, device, ip, location, storeURL, s.FromName, time.Now().Year())

	s.SendMailAsync([]string{toEmail}, subject, html)
}

// SendOrderConfirmation gửi email xác nhận đặt hàng chi tiết cho khách hàng
func (s *MailService) SendOrderConfirmation(order *models.Order, customerEmail, customerName string, items []models.OrderItem, itemImages ...map[uint64]string) {
	if customerEmail == "" {
		return
	}

	subject := fmt.Sprintf("Xác nhận đơn hàng #%s - %s", order.OrderCode, s.FromName)
	if customerName == "" {
		customerName = order.RecipientName
	}
	if customerName == "" {
		customerName = "Quý khách"
	}

	imagesMap := map[uint64]string{}
	if len(itemImages) > 0 && itemImages[0] != nil {
		imagesMap = itemImages[0]
	}

	// Xây dựng bảng danh sách sản phẩm với ảnh thumbnail thật
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

		imgTag := `<div style="width:52px;height:52px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;text-align:center;line-height:52px;font-size:10px;font-weight:700;color:#15803d;">GÓC NHÀ</div>`
		if imgURL, ok := imagesMap[it.VariantID]; ok && imgURL != "" {
			imgTag = fmt.Sprintf(`<img src="%s" alt="%s" style="width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid #e7e5e4;display:block;" />`, imgURL, it.ProductName)
		}

		itemsRows.WriteString(fmt.Sprintf(`
        <tr style="border-bottom:1px solid #f5f5f4;">
          <td style="padding:12px 8px;vertical-align:middle;width:56px;">
            %s
          </td>
          <td style="padding:12px 8px;vertical-align:top;">
            <div style="font-weight:600;font-size:13px;color:#1c1917;">%s</div>
            %s
            %s
          </td>
          <td style="padding:12px 8px;vertical-align:top;text-align:center;font-size:13px;color:#44403c;">%d</td>
          <td style="padding:12px 8px;vertical-align:top;text-align:right;font-size:13px;color:#15803d;font-weight:600;">%s</td>
          <td style="padding:12px 8px;vertical-align:top;text-align:right;font-size:13px;color:#1c1917;font-weight:700;">%s</td>
        </tr>`, imgTag, it.ProductName, variantStr, skuStr, it.Quantity, FormatVND(price), FormatVND(it.SubTotal)))
	}

	// Kiểm tra phương thức thanh toán và trạng thái
	isBankTransfer := (order.PaymentMethod == "bank_transfer") || (order.Note != nil && strings.Contains(*order.Note, "Chuyển khoản"))
	paymentBadgeText := "Thanh toán khi nhận hàng (COD)"
	statusBadgeText := "Chờ xác nhận đơn"
	statusBadgeColor := "#b45309"
	statusBadgeBg := "#fef3c7"

	if isBankTransfer {
		paymentBadgeText = "Chuyển khoản SePay (VietQR)"
		statusBadgeText = "Chờ thanh toán chuyển khoản"
		statusBadgeColor = "#15803d"
		statusBadgeBg = "#dcfce7"
	}

	// Hướng dẫn chuyển khoản ngân hàng (KHÔNG HIỆN MÃ QR THEO YÊU CẦU)
	bankSection := ""
	if isBankTransfer {
		bankSection = fmt.Sprintf(`
      <div style="margin:20px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:18px 20px;">
        <h4 style="margin:0 0 8px;font-size:13px;color:#166534;font-weight:700;">💳 Thông tin chuyển khoản thanh toán (SePay):</h4>
        <div style="font-size:12px;color:#15803d;margin-bottom:14px;line-height:1.5;">
          Đơn hàng của Quý khách sẽ tự động chuyển sang <strong>Đã thanh toán</strong> ngay khi hệ thống nhận được chuyển khoản với nội dung bên dưới:
        </div>
        <table style="width:100%%;font-size:13px;color:#1c1917;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#57534e;">Ngân hàng:</td><td style="font-weight:700;text-align:right;color:#166534;">MB Bank (Ngân hàng Quân Đội)</td></tr>
          <tr><td style="padding:5px 0;color:#57534e;">Số tài khoản:</td><td style="font-weight:800;color:#15803d;font-size:16px;text-align:right;font-family:monospace;">0931883988</td></tr>
          <tr><td style="padding:5px 0;color:#57534e;">Chủ tài khoản:</td><td style="font-weight:700;text-align:right;">GÓC NHÀ ĐẸP</td></tr>
          <tr><td style="padding:5px 0;color:#57534e;">Số tiền thanh toán:</td><td style="font-weight:900;color:#047857;font-size:16px;text-align:right;">%s</td></tr>
          <tr>
            <td style="padding:8px 0 0;color:#57534e;">Nội dung CK:</td>
            <td style="padding:8px 0 0;text-align:right;">
              <span style="font-weight:800;color:#b45309;font-size:14px;background:#fef08a;padding:3px 10px;border-radius:6px;border:1px solid #fde047;font-family:monospace;">%s</span>
            </td>
          </tr>
        </table>
      </div>`, FormatVND(order.TotalAmount), order.OrderCode)
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

	shippingFeeStr := "Miễn phí vận chuyển"
	if order.ShippingFee > 0 {
		shippingFeeStr = FormatVND(order.ShippingFee)
	}

	loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		loc = time.FixedZone("ICT", 7*3600)
	}
	orderDate := order.CreatedAt.In(loc).Format("15:04:05 02/01/2006 (Giờ Việt Nam)")

	storeURL := s.StorefrontURL
	if storeURL == "" {
		storeURL = "http://localhost:4321"
	}
	ordersURL := fmt.Sprintf("%s/orders", storeURL)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 12px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06);">
    <!-- Header màu xanh ngọc đồng bộ thương hiệu web -->
    <div style="background:linear-gradient(135deg,#14532d,#166534);padding:32px 24px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;width:42px;height:42px;line-height:42px;background:#ffffff;color:#15803d;border-radius:12px;font-family:serif;font-weight:900;font-size:22px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        G
      </div>
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;color:#ffffff;text-transform:uppercase;">%s</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#bbf7d0;letter-spacing:0.5px;">Cảm ơn bạn đã đặt hàng!</p>
      <div style="display:inline-block;background:rgba(255,255,255,0.18);padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;margin-top:12px;border:1px solid rgba(255,255,255,0.25);color:#ffffff;">
        Mã đơn hàng: #%s
      </div>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;">Kính chào <strong>%s</strong>,</p>
      <p style="margin:0 0 20px;font-size:13px;color:#57534e;line-height:1.6;">
        Đơn hàng của Quý khách đã được hệ thống tiếp nhận vào lúc <strong>%s</strong>. Đội ngũ %s sẽ kiểm tra và tiến hành đóng gói vận chuyển tới bạn trong thời gian sớm nhất.
      </p>

      <!-- Badge trạng thái đơn -->
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:#78716c;">Trạng thái đơn hàng:</span>
        <span style="background:%s;color:%s;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;">%s</span>
      </div>

      <!-- Danh sách sản phẩm -->
      <table style="width:100%%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f5f5f4;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;">
            <th style="padding:10px 8px;border-radius:8px 0 0 8px;width:56px;">Hình ảnh</th>
            <th style="padding:10px 8px;">Sản phẩm</th>
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
            <td style="padding:12px 0 4px;font-size:14px;font-weight:800;color:#1c1917;">TỔNG CỘNG THANH TOÁN:</td>
            <td style="padding:12px 0 4px;font-size:18px;font-weight:900;color:#15803d;text-align:right;">%s</td>
          </tr>
          <tr>
            <td style="padding:4px 0 0;font-size:12px;color:#78716c;">Phương thức:</td>
            <td style="padding:4px 0 0;font-size:12px;font-weight:600;text-align:right;color:#14532d;">%s</td>
          </tr>
        </table>
      </div>

      <!-- Hướng dẫn chuyển khoản ngân hàng (không hiện mã QR) -->
      %s

      <!-- Thông tin đơn hàng & Nhận hàng -->
      <div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <h4 style="margin:0 0 14px;font-size:13px;color:#14532d;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f5f5f4;padding-bottom:8px;">
          📍 Thông tin đơn hàng & Nhận hàng
        </h4>
        <table style="width:100%%;font-size:12px;color:#44403c;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#78716c;width:140px;">Mã đơn hàng:</td><td style="font-weight:700;color:#15803d;">#%s</td></tr>
          <tr><td style="padding:5px 0;color:#78716c;">Ngày đặt hàng:</td><td style="font-weight:600;">%s</td></tr>
          <tr><td style="padding:5px 0;color:#78716c;">Phương thức thanh toán:</td><td style="font-weight:600;color:#166534;">%s</td></tr>
          <tr><td style="padding:5px 0;color:#78716c;">Trạng thái thanh toán:</td><td><span style="background:%s;color:%s;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">%s</span></td></tr>
          <tr style="border-top:1px dashed #f5f5f4;"><td style="padding:8px 0 5px;color:#78716c;">Người nhận hàng:</td><td style="padding:8px 0 5px;font-weight:600;color:#1c1917;">%s</td></tr>
          <tr><td style="padding:5px 0;color:#78716c;">Số điện thoại:</td><td style="font-weight:700;color:#1c1917;">%s</td></tr>
          <tr><td style="padding:5px 0;color:#78716c;">Địa chỉ giao hàng:</td><td style="font-weight:600;color:#1c1917;line-height:1.5;">%s</td></tr>
          <tr><td style="padding:5px 0;color:#78716c;">Ghi chú đơn hàng:</td><td style="color:#78716c;font-style:italic;">%s</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:32px 0 16px;">
        <a href="%s" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 28px;border-radius:12px;box-shadow:0 4px 6px rgba(21,128,61,0.25);">
          XEM CHI TIẾT ĐƠN HÀNG TRÊN WEBSITE
        </a>
      </div>

      <!-- Chân trang: 2 Showroom có sẵn trên web -->
      <div style="border-top:1px solid #e7e5e4;margin-top:28px;padding-top:20px;text-align:center;color:#78716c;font-size:12px;line-height:1.7;">
        <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:6px;">HỆ THỐNG SHOWROOM NỘI THẤT GÓC NHÀ ĐẸP</div>
        <div><strong>Showroom 1:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM</div>
        <div><strong>Showroom 2:</strong> 295 Tây Thạnh, Phường Tây Thạnh, Quận Tân Phú, TP. HCM</div>
        <div style="margin-top:4px;">Hotline tư vấn thiết kế & giao hàng: <a href="tel:0931883988" style="color:#15803d;font-weight:700;text-decoration:none;">0931.883.988</a> (24/7)</div>
        <div style="color:#a8a29e;font-size:11px;margin-top:8px;">%s &copy; %d. Trân trọng cảm ơn Quý khách!</div>
      </div>
    </div>
  </div>
</body>
</html>`, s.FromName, order.OrderCode, customerName, orderDate, s.FromName, statusBadgeBg, statusBadgeColor, statusBadgeText, itemsRows.String(), FormatVND(order.SubTotal), discountStr, shippingFeeStr, FormatVND(order.TotalAmount), paymentBadgeText, bankSection, order.OrderCode, orderDate, paymentBadgeText, statusBadgeBg, statusBadgeColor, statusBadgeText, order.RecipientName, order.RecipientPhone, order.ShippingAddress, noteStr, ordersURL, s.FromName, time.Now().Year())

	s.SendMailAsync([]string{customerEmail}, subject, html)
}

// SendPaymentSuccessConfirmation gửi thư chúc mừng và xác nhận nhận tiền thành công từ SePay
func (s *MailService) SendPaymentSuccessConfirmation(order *models.Order, customerEmail, customerName string, transferAmount int64, gateway, txDate, refCode string) {
	if customerEmail == "" || order == nil {
		return
	}

	subject := fmt.Sprintf("Xác nhận thanh toán thành công đơn hàng #%s - %s", order.OrderCode, s.FromName)
	name := customerName
	if name == "" {
		name = order.RecipientName
	}
	if name == "" {
		name = "Quý khách"
	}

	payDate := txDate
	if payDate == "" {
		loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
		if err != nil {
			loc = time.FixedZone("ICT", 7*3600)
		}
		payDate = time.Now().In(loc).Format("15:04:05 02/01/2006 (Giờ Việt Nam)")
	}

	gw := gateway
	if gw == "" {
		gw = "SePay (VietQR MBBank)"
	}

	ref := refCode
	if ref == "" {
		ref = "Ghi nhận tự động"
	}

	storeURL := s.StorefrontURL
	if storeURL == "" {
		storeURL = "http://localhost:4321"
	}
	ordersURL := fmt.Sprintf("%s/orders", storeURL)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 12px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06);">
    <!-- Header thành công -->
    <div style="background:linear-gradient(135deg,#065f46,#047857);padding:32px 24px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;width:56px;height:56px;line-height:56px;background:rgba(255,255,255,0.2);border-radius:50%%;font-size:30px;margin-bottom:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        ✓
      </div>
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;text-transform:uppercase;">THANH TOÁN THÀNH CÔNG!</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#a7f3d0;">Đã nhận thanh toán cho đơn hàng #%s</p>
    </div>

    <!-- Nội dung chính -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 14px;font-size:15px;color:#1c1917;font-weight:600;">Kính chào Quý khách %s,</p>
      <p style="margin:0 0 24px;font-size:13px;color:#57534e;line-height:1.6;">
        Hệ thống cổng thanh toán tự động của <strong>%s</strong> đã xác nhận giao dịch chuyển khoản thành công của bạn. Đơn hàng hiện đã được kích hoạt thành công và đang được chuẩn bị để giao tới Quý khách!
      </p>

      <!-- Khối chi tiết giao dịch SePay -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Chi tiết giao dịch thanh toán</div>
        <table style="width:100%%;font-size:13px;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#15803d;width:140px;">Mã đơn hàng:</td>
            <td style="padding:6px 0;font-weight:800;color:#14532d;text-align:right;">#%s</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#15803d;">Số tiền đã thanh toán:</td>
            <td style="padding:6px 0;font-weight:900;color:#047857;font-size:18px;text-align:right;">%s</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#15803d;">Cổng thanh toán:</td>
            <td style="padding:6px 0;font-weight:600;color:#14532d;text-align:right;">%s</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#15803d;">Mã tham chiếu GD:</td>
            <td style="padding:6px 0;font-family:monospace;font-weight:600;color:#14532d;text-align:right;">%s</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#15803d;">Thời gian ghi nhận:</td>
            <td style="padding:6px 0;font-weight:600;color:#14532d;text-align:right;">%s</td>
          </tr>
          <tr>
            <td style="padding:8px 0 0;color:#15803d;border-top:1px dashed #bbf7d0;">Trạng thái đơn hàng:</td>
            <td style="padding:8px 0 0;text-align:right;border-top:1px dashed #bbf7d0;">
              <span style="background:#22c55e;color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;">ĐÃ THANH TOÁN (CONFIRMED)</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Thời gian dự kiến giao hàng -->
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#78350f;margin-bottom:6px;">🚚 Thông tin vận chuyển & Dự kiến giao hàng:</div>
        <ul style="margin:0;padding-left:18px;font-size:12px;color:#57534e;line-height:1.7;">
          <li>Thời gian giao hàng dự kiến: <strong>2 - 4 ngày làm việc</strong>.</li>
          <li>Kỹ thuật viên của Góc Nhà Đẹp sẽ gọi điện trước <strong>30 - 60 phút</strong> để hẹn lịch giao và lắp đặt miễn phí tận nhà.</li>
          <li>Người nhận: <strong>%s</strong> (SĐT: <strong>%s</strong>)</li>
          <li>Địa chỉ giao: %s</li>
        </ul>
      </div>

      <!-- Nút theo dõi đơn hàng -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="%s" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 32px;border-radius:12px;box-shadow:0 4px 6px rgba(21,128,61,0.25);">
          THEO DÕI TIẾN ĐỘ ĐƠN HÀNG TRÊN WEB
        </a>
      </div>

      <!-- Hỗ trợ & Chân trang Showroom -->
      <div style="border-top:1px solid #e7e5e4;padding-top:20px;text-align:center;color:#78716c;font-size:12px;line-height:1.7;">
        <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:6px;">HỆ THỐNG SHOWROOM NỘI THẤT GÓC NHÀ ĐẸP</div>
        <div><strong>Showroom 1:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM</div>
        <div><strong>Showroom 2:</strong> 295 Tây Thạnh, Phường Tây Thạnh, Quận Tân Phú, TP. HCM</div>
        <div style="margin-top:4px;">Hotline tư vấn thiết kế & giao hàng: <a href="tel:0931883988" style="color:#15803d;font-weight:700;text-decoration:none;">0931.883.988</a> (24/7)</div>
        <div style="color:#a8a29e;font-size:11px;margin-top:8px;">%s &copy; %d. Trân trọng cảm ơn Quý khách!</div>
      </div>
    </div>
  </div>
</body>
</html>`, order.OrderCode, name, s.FromName, order.OrderCode, FormatVND(transferAmount), gw, ref, payDate, order.RecipientName, order.RecipientPhone, order.ShippingAddress, ordersURL, s.FromName, time.Now().Year())

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
		"confirmed": "#15803d",
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
		statusColor = "#15803d"
	}

	subject := fmt.Sprintf("Cập nhật đơn hàng #%s: %s - %s", order.OrderCode, vnStatus, s.FromName)

	noteSection := ""
	if note != "" {
		noteSection = fmt.Sprintf(`
      <div style="margin:20px 0;background:#fafaf9;border-left:4px solid %s;padding:12px 16px;border-radius:4px;font-size:13px;color:#44403c;">
        <strong>Ghi chú từ quản trị viên:</strong> %s
      </div>`, statusColor, note)
	}

	storeURL := s.StorefrontURL
	if storeURL == "" {
		storeURL = "http://localhost:4321"
	}
	ordersURL := fmt.Sprintf("%s/orders", storeURL)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px 12px;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e7e5e4;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#14532d,#166534);padding:28px 24px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;width:38px;height:38px;line-height:38px;background:#ffffff;color:#15803d;border-radius:10px;font-family:serif;font-weight:900;font-size:20px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        G
      </div>
      <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:800;color:#ffffff;text-transform:uppercase;">GÓC NHÀ ĐẸP</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#bbf7d0;">Thông báo tiến độ đơn hàng #%s</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;">Kính chào <strong>%s</strong>,</p>
      <p style="margin:0 0 20px;font-size:13px;color:#57534e;line-height:1.6;">
        Đơn hàng của Quý khách vừa được cập nhật sang trạng thái mới:
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;background:%s;color:#ffffff;font-size:14px;font-weight:800;padding:8px 20px;border-radius:20px;letter-spacing:0.5px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          %s
        </span>
      </div>

      %s

      <table style="width:100%%;font-size:12px;color:#44403c;margin-bottom:24px;background:#fafaf9;border-radius:12px;padding:16px;">
        <tr><td style="padding:4px 0;color:#78716c;">Mã đơn hàng:</td><td style="font-weight:700;color:#15803d;text-align:right;">#%s</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;">Người nhận:</td><td style="font-weight:600;text-align:right;">%s</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;">Số điện thoại:</td><td style="font-weight:600;text-align:right;">%s</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;">Tổng tiền thanh toán:</td><td style="font-weight:800;color:#15803d;text-align:right;">%s</td></tr>
      </table>

      <div style="text-align:center;margin:28px 0 16px;">
        <a href="%s" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:10px;">
          XEM CHI TIẾT ĐƠN HÀNG
        </a>
      </div>

      <!-- Chân trang Showroom -->
      <div style="border-top:1px solid #e7e5e4;margin-top:24px;padding-top:16px;text-align:center;color:#78716c;font-size:12px;line-height:1.7;">
        <div style="font-size:13px;font-weight:700;color:#14532d;margin-bottom:4px;">HỆ THỐNG SHOWROOM GÓC NHÀ ĐẸP</div>
        <div><strong>Showroom 1:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM</div>
        <div><strong>Showroom 2:</strong> 295 Tây Thạnh, Phường Tây Thạnh, Quận Tân Phú, TP. HCM</div>
        <div style="margin-top:4px;">Hotline hỗ trợ: <a href="tel:0931883988" style="color:#15803d;font-weight:700;text-decoration:none;">0931.883.988</a></div>
        <div style="color:#a8a29e;font-size:11px;margin-top:6px;">Góc Nhà Đẹp &copy; %d. Trân trọng cảm ơn Quý khách!</div>
      </div>
    </div>
  </div>
</body>
</html>`, order.OrderCode, customerName, statusColor, vnStatus, noteSection, order.OrderCode, order.RecipientName, order.RecipientPhone, FormatVND(order.TotalAmount), ordersURL, time.Now().Year())

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
