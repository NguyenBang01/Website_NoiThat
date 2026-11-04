package services

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

const MaxExportRows = 10000

type ExportService struct {
	DB           *gorm.DB
	AuditService *AuditService
}

func NewExportService(db *gorm.DB, auditService *AuditService) *ExportService {
	return &ExportService{
		DB:           db,
		AuditService: auditService,
	}
}

// ExportProducts xuất danh sách sản phẩm ra file Excel
func (s *ExportService) ExportProducts(q string, categoryID uint64, status string, ids []uint64, actorID uint64, ip, ua string) (*excelize.File, string, error) {
	var products []models.Product
	dbQuery := s.DB.Model(&models.Product{}).
		Preload("Category").
		Preload("Brand").
		Preload("Variants")

	if len(ids) > 0 {
		dbQuery = dbQuery.Where("id IN ?", ids)
	} else {
		if q != "" {
			term := "%" + q + "%"
			dbQuery = dbQuery.Where("name LIKE ? OR sku LIKE ? OR slug LIKE ?", term, term, term)
		}
		if categoryID > 0 {
			dbQuery = dbQuery.Where("category_id = ?", categoryID)
		}
		if status != "" {
			dbQuery = dbQuery.Where("status = ?", status)
		}
	}

	if err := dbQuery.Order("id DESC").Limit(MaxExportRows).Find(&products).Error; err != nil {
		return nil, "", err
	}

	f := excelize.NewFile()
	sheet := "Sản phẩm"
	f.SetSheetName("Sheet1", sheet)

	headerStyle, _ := utils.CreateHeaderStyle(f)
	dataStyle, _ := utils.CreateDataStyle(f, "left")
	centerStyle, _ := utils.CreateDataStyle(f, "center")
	currStyle, _ := utils.CreateCurrencyStyle(f)

	headers := []string{
		"ID", "Tên sản phẩm", "Mã SKU", "Danh mục", "Thương hiệu",
		"Giá gốc (VNĐ)", "Giá khuyến mãi (VNĐ)", "Số biến thể", "Tổng tồn kho", "Trạng thái", "Ngày tạo",
	}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	for rowIdx, p := range products {
		row := rowIdx + 2
		catName := ""
		if p.Category != nil {
			catName = p.Category.Name
		}
		brandName := ""
		if p.Brand != nil {
			brandName = p.Brand.Name
		}

		totalStock := 0
		for _, v := range p.Variants {
			totalStock += v.StockQuantity
		}

		statusVN := "Đang bán"
		switch p.Status {
		case "draft":
			statusVN = "Bản nháp"
		case "hidden":
			statusVN = "Đã ẩn"
		}

		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", row), p.ID)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", row), utils.SanitizeExcelCell(p.Name))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", row), utils.SanitizeExcelCell(p.SKU))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("D%d", row), utils.SanitizeExcelCell(catName))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("E%d", row), utils.SanitizeExcelCell(brandName))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", row), p.BasePrice)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), currStyle)

		if p.SalePrice != nil {
			_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", row), *p.SalePrice)
			_ = f.SetCellStyle(sheet, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), currStyle)
		} else {
			_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", row), "-")
			_ = f.SetCellStyle(sheet, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), centerStyle)
		}

		_ = f.SetCellValue(sheet, fmt.Sprintf("H%d", row), len(p.Variants))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("I%d", row), totalStock)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("I%d", row), fmt.Sprintf("I%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("J%d", row), statusVN)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("J%d", row), fmt.Sprintf("J%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("K%d", row), p.CreatedAt.Format("02/01/2006 15:04"))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("K%d", row), fmt.Sprintf("K%d", row), centerStyle)

		_ = f.SetRowHeight(sheet, row, 20)
	}

	utils.FormatSheetView(f, sheet, "K", len(products)+1)
	utils.AutoFitColumns(f, sheet, 1, 11, 15)
	_ = f.SetColWidth(sheet, "B", "B", 35) // Tên sản phẩm rộng hơn

	filename := fmt.Sprintf("san_pham_%s.xlsx", time.Now().Format("20060102_150405"))
	s.AuditService.Record(actorID, "export.product", "Sản phẩm",
		fmt.Sprintf("Xuất Excel %d sản phẩm", len(products)), ip, ua)

	return f, filename, nil
}

// ExportOrders xuất đơn hàng ra 2 Sheets: Tổng quan đơn hàng + Chi tiết sản phẩm
func (s *ExportService) ExportOrders(q, status, paymentMethod, paymentStatus, startDate, endDate string, ids []uint64, actorID uint64, ip, ua string) (*excelize.File, string, error) {
	var orders []models.Order
	dbQuery := s.DB.Model(&models.Order{}).
		Preload("User").
		Preload("Items")

	if len(ids) > 0 {
		dbQuery = dbQuery.Where("id IN ?", ids)
	} else {
		if q != "" {
			term := "%" + q + "%"
			dbQuery = dbQuery.Where("order_number LIKE ? OR recipient_name LIKE ? OR recipient_phone LIKE ?", term, term, term)
		}
		if status != "" {
			dbQuery = dbQuery.Where("status = ?", status)
		}
		if paymentMethod != "" {
			dbQuery = dbQuery.Where("payment_method = ?", paymentMethod)
		}
		if paymentStatus != "" {
			dbQuery = dbQuery.Where("payment_status = ?", paymentStatus)
		}
		if startDate != "" {
			dbQuery = dbQuery.Where("created_at >= ?", startDate+" 00:00:00")
		}
		if endDate != "" {
			dbQuery = dbQuery.Where("created_at <= ?", endDate+" 23:59:59")
		}
	}

	if err := dbQuery.Order("id DESC").Limit(MaxExportRows).Find(&orders).Error; err != nil {
		return nil, "", err
	}

	f := excelize.NewFile()

	headerStyle, _ := utils.CreateHeaderStyle(f)
	dataStyle, _ := utils.CreateDataStyle(f, "left")
	centerStyle, _ := utils.CreateDataStyle(f, "center")
	currStyle, _ := utils.CreateCurrencyStyle(f)

	// ==========================================
	// Sheet 1: Tổng quan đơn hàng
	// ==========================================
	sheetOverview := "Tổng quan đơn hàng"
	f.SetSheetName("Sheet1", sheetOverview)

	overviewHeaders := []string{
		"Mã đơn hàng", "Ngày đặt", "Người nhận", "Số điện thoại", "Địa chỉ giao hàng",
		"Phương thức TT", "Trạng thái TT", "Trạng thái đơn",
		"Phí ship (VNĐ)", "Giảm giá (VNĐ)", "Tổng thanh toán (VNĐ)",
	}

	for colIdx, h := range overviewHeaders {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheetOverview, cell, h)
		_ = f.SetCellStyle(sheetOverview, cell, cell, headerStyle)
	}

	for rowIdx, o := range orders {
		row := rowIdx + 2

		paymentMethodVN := o.PaymentMethod
		switch strings.ToLower(o.PaymentMethod) {
		case "cod":
			paymentMethodVN = "Thanh toán khi nhận (COD)"
		case "banking", "sepay", "bank_transfer":
			paymentMethodVN = "Chuyển khoản SePay QR"
		}

		paymentStatusVN := "Chưa thanh toán"
		if strings.ToLower(o.PaymentMethod) == "cod" {
			if o.Status == "delivered" {
				paymentStatusVN = "Đã thu tiền khi nhận"
			} else {
				paymentStatusVN = "Thu tiền khi giao hàng"
			}
		} else {
			if o.Status != "awaiting_payment" && o.Status != "cancelled" {
				paymentStatusVN = "Đã thanh toán (SePay/CK)"
			}
		}

		statusVN := o.Status
		switch o.Status {
		case "pending":
			statusVN = "Chờ xác nhận"
		case "confirmed":
			statusVN = "Đã xác nhận"
		case "shipping":
			statusVN = "Đang giao hàng"
		case "delivered":
			statusVN = "Giao thành công"
		case "cancelled":
			statusVN = "Đã hủy"
		}

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("A%d", row), utils.SanitizeExcelCell(o.OrderNumber))
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), centerStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("B%d", row), o.CreatedAt.Format("02/01/2006 15:04"))
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), centerStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("C%d", row), utils.SanitizeExcelCell(o.RecipientName))
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), dataStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("D%d", row), utils.SanitizeExcelCell(o.RecipientPhone))
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), centerStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("E%d", row), utils.SanitizeExcelCell(o.ShippingAddress))
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), dataStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("F%d", row), paymentMethodVN)
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), centerStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("G%d", row), paymentStatusVN)
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), centerStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("H%d", row), statusVN)
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), centerStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("I%d", row), o.ShippingFee)
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("I%d", row), fmt.Sprintf("I%d", row), currStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("J%d", row), o.DiscountAmount)
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("J%d", row), fmt.Sprintf("J%d", row), currStyle)

		_ = f.SetCellValue(sheetOverview, fmt.Sprintf("K%d", row), o.TotalAmount)
		_ = f.SetCellStyle(sheetOverview, fmt.Sprintf("K%d", row), fmt.Sprintf("K%d", row), currStyle)

		_ = f.SetRowHeight(sheetOverview, row, 20)
	}

	utils.FormatSheetView(f, sheetOverview, "K", len(orders)+1)
	utils.AutoFitColumns(f, sheetOverview, 1, 11, 16)
	_ = f.SetColWidth(sheetOverview, "E", "E", 35) // Địa chỉ

	// ==========================================
	// Sheet 2: Chi tiết sản phẩm trong đơn
	// ==========================================
	sheetDetails := "Chi tiết sản phẩm"
	_, _ = f.NewSheet(sheetDetails)

	detailHeaders := []string{
		"Mã đơn hàng", "Tên sản phẩm", "Biến thể / Thuộc tính", "Mã SKU",
		"Đơn giá (VNĐ)", "Số lượng", "Thành tiền (VNĐ)",
	}

	for colIdx, h := range detailHeaders {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheetDetails, cell, h)
		_ = f.SetCellStyle(sheetDetails, cell, cell, headerStyle)
	}

	itemRow := 2
	for _, o := range orders {
		for _, it := range o.Items {
			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("A%d", itemRow), utils.SanitizeExcelCell(o.OrderNumber))
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("A%d", itemRow), fmt.Sprintf("A%d", itemRow), centerStyle)

			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("B%d", itemRow), utils.SanitizeExcelCell(it.ProductName))
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("B%d", itemRow), fmt.Sprintf("B%d", itemRow), dataStyle)

			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("C%d", itemRow), utils.SanitizeExcelCell(it.VariantInfo))
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("C%d", itemRow), fmt.Sprintf("C%d", itemRow), dataStyle)

			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("D%d", itemRow), utils.SanitizeExcelCell(it.VariantSKU))
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("D%d", itemRow), fmt.Sprintf("D%d", itemRow), centerStyle)

			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("E%d", itemRow), it.Price)
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("E%d", itemRow), fmt.Sprintf("E%d", itemRow), currStyle)

			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("F%d", itemRow), it.Quantity)
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("F%d", itemRow), fmt.Sprintf("F%d", itemRow), centerStyle)

			_ = f.SetCellValue(sheetDetails, fmt.Sprintf("G%d", itemRow), it.SubTotal)
			_ = f.SetCellStyle(sheetDetails, fmt.Sprintf("G%d", itemRow), fmt.Sprintf("G%d", itemRow), currStyle)

			_ = f.SetRowHeight(sheetDetails, itemRow, 20)
			itemRow++
		}
	}

	utils.FormatSheetView(f, sheetDetails, "G", itemRow-1)
	utils.AutoFitColumns(f, sheetDetails, 1, 7, 16)
	_ = f.SetColWidth(sheetDetails, "B", "B", 35)

	filename := fmt.Sprintf("don_hang_%s.xlsx", time.Now().Format("20060102_150405"))
	s.AuditService.Record(actorID, "export.order", "Đơn hàng",
		fmt.Sprintf("Xuất Excel %d đơn hàng (2 sheets)", len(orders)), ip, ua)

	return f, filename, nil
}

// ExportInventory xuất danh sách tồn kho và cảnh báo hết hàng
func (s *ExportService) ExportInventory(threshold int, categoryID uint64, ids []uint64, actorID uint64, ip, ua string) (*excelize.File, string, error) {
	if threshold <= 0 {
		threshold = 1000000 // nếu không giới hạn threshold
	}

	var variants []models.ProductVariant
	dbQuery := s.DB.Model(&models.ProductVariant{}).
		Preload("Product").
		Preload("Product.Category").
		Where("stock_quantity <= ?", threshold)

	if len(ids) > 0 {
		dbQuery = dbQuery.Where("id IN ?", ids)
	} else if categoryID > 0 {
		dbQuery = dbQuery.Joins("JOIN products ON products.id = product_variants.product_id").
			Where("products.category_id = ?", categoryID)
	}

	if err := dbQuery.Order("stock_quantity ASC").Limit(MaxExportRows).Find(&variants).Error; err != nil {
		return nil, "", err
	}

	f := excelize.NewFile()
	sheet := "Tồn kho"
	f.SetSheetName("Sheet1", sheet)

	headerStyle, _ := utils.CreateHeaderStyle(f)
	dataStyle, _ := utils.CreateDataStyle(f, "left")
	centerStyle, _ := utils.CreateDataStyle(f, "center")
	currStyle, _ := utils.CreateCurrencyStyle(f)

	headers := []string{
		"ID Biến thể", "Tên sản phẩm", "Mã SKU", "Danh mục", "Màu sắc", "Kích thước", "Chất liệu",
		"Giá bán (VNĐ)", "Tồn kho", "Cảnh báo tồn",
	}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	for rowIdx, v := range variants {
		row := rowIdx + 2
		prodName := ""
		catName := ""
		if v.Product != nil {
			prodName = v.Product.Name
			if v.Product.Category != nil {
				catName = v.Product.Category.Name
			}
		}

		color := "-"
		if v.Color != nil {
			color = *v.Color
		}
		size := "-"
		if v.Size != nil {
			size = *v.Size
		}
		mat := "-"
		if v.Material != nil {
			mat = *v.Material
		}

		warningStatus := "Còn hàng"
		if v.StockQuantity == 0 {
			warningStatus = "HẾT HÀNG (0)"
		} else if v.StockQuantity <= 5 {
			warningStatus = "Sắp hết hàng"
		}

		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", row), v.ID)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", row), utils.SanitizeExcelCell(prodName))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", row), utils.SanitizeExcelCell(v.SKU))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("D%d", row), utils.SanitizeExcelCell(catName))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("E%d", row), utils.SanitizeExcelCell(color))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", row), utils.SanitizeExcelCell(size))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", row), utils.SanitizeExcelCell(mat))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("H%d", row), v.Price)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), currStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("I%d", row), v.StockQuantity)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("I%d", row), fmt.Sprintf("I%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("J%d", row), warningStatus)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("J%d", row), fmt.Sprintf("J%d", row), centerStyle)

		_ = f.SetRowHeight(sheet, row, 20)
	}

	utils.FormatSheetView(f, sheet, "J", len(variants)+1)
	utils.AutoFitColumns(f, sheet, 1, 10, 15)
	_ = f.SetColWidth(sheet, "B", "B", 35)

	filename := fmt.Sprintf("ton_kho_%s.xlsx", time.Now().Format("20060102_150405"))
	s.AuditService.Record(actorID, "export.inventory", "Kho hàng",
		fmt.Sprintf("Xuất Excel tồn kho %d biến thể", len(variants)), ip, ua)

	return f, filename, nil
}

// ExportCustomers xuất danh sách khách hàng (bảo mật: không xuất hash mật khẩu)
func (s *ExportService) ExportCustomers(q, status string, ids []uint64, actorID uint64, ip, ua string) (*excelize.File, string, error) {
	var users []models.User
	dbQuery := s.DB.Model(&models.User{}).Where("role = 'customer'")

	if len(ids) > 0 {
		dbQuery = dbQuery.Where("id IN ?", ids)
	} else {
		if q != "" {
			term := "%" + q + "%"
			dbQuery = dbQuery.Where("full_name LIKE ? OR email LIKE ? OR phone LIKE ?", term, term, term)
		}
		if status != "" {
			dbQuery = dbQuery.Where("status = ?", status)
		}
	}

	if err := dbQuery.Order("id DESC").Limit(MaxExportRows).Find(&users).Error; err != nil {
		return nil, "", err
	}

	// Lấy thống kê số đơn hàng & tổng chi tiêu theo từng user
	type UserStat struct {
		UserID     uint64 `gorm:"column:user_id"`
		OrderCount int    `gorm:"column:order_count"`
		TotalSpent int64  `gorm:"column:total_spent"`
	}
	var stats []UserStat
	s.DB.Table("orders").
		Select("user_id, COUNT(id) as order_count, COALESCE(SUM(total_amount), 0) as total_spent").
		Where("status != 'cancelled'").
		Group("user_id").
		Find(&stats)

	statsMap := make(map[uint64]UserStat)
	for _, st := range stats {
		statsMap[st.UserID] = st
	}

	f := excelize.NewFile()
	sheet := "Khách hàng"
	f.SetSheetName("Sheet1", sheet)

	headerStyle, _ := utils.CreateHeaderStyle(f)
	dataStyle, _ := utils.CreateDataStyle(f, "left")
	centerStyle, _ := utils.CreateDataStyle(f, "center")
	currStyle, _ := utils.CreateCurrencyStyle(f)

	headers := []string{
		"ID", "Họ và tên", "Email", "Số điện thoại", "Trạng thái",
		"Số đơn đã đặt", "Tổng chi tiêu (VNĐ)", "Ngày đăng ký",
	}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	for rowIdx, u := range users {
		row := rowIdx + 2
		phone := "-"
		if u.Phone != nil {
			phone = *u.Phone
		}

		statusVN := "Hoạt động"
		if u.Status == "locked" || u.Status == "blocked" {
			statusVN = "Bị khóa"
		}

		st := statsMap[u.ID]

		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", row), u.ID)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", row), utils.SanitizeExcelCell(u.FullName))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", row), utils.SanitizeExcelCell(u.Email))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("D%d", row), utils.SanitizeExcelCell(phone))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("E%d", row), statusVN)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", row), st.OrderCount)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", row), st.TotalSpent)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), currStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("H%d", row), u.CreatedAt.Format("02/01/2006 15:04"))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), centerStyle)

		_ = f.SetRowHeight(sheet, row, 20)
	}

	utils.FormatSheetView(f, sheet, "H", len(users)+1)
	utils.AutoFitColumns(f, sheet, 1, 8, 16)
	_ = f.SetColWidth(sheet, "B", "B", 25)
	_ = f.SetColWidth(sheet, "C", "C", 30)

	filename := fmt.Sprintf("khach_hang_%s.xlsx", time.Now().Format("20060102_150405"))
	s.AuditService.Record(actorID, "export.customer", "Khách hàng",
		fmt.Sprintf("Xuất Excel %d khách hàng", len(users)), ip, ua)

	return f, filename, nil
}

// ExportVouchers xuất danh sách mã giảm giá ra file Excel
func (s *ExportService) ExportVouchers(q, discountType, isActive string, ids []uint64, actorID uint64, ip, ua string) (*excelize.File, string, error) {
	var coupons []models.Coupon
	dbQuery := s.DB.Model(&models.Coupon{})

	if len(ids) > 0 {
		dbQuery = dbQuery.Where("id IN ?", ids)
	} else {
		if q != "" {
			term := "%" + q + "%"
			dbQuery = dbQuery.Where("code LIKE ? OR description LIKE ?", term, term)
		}
		if discountType != "" {
			dbQuery = dbQuery.Where("discount_type = ?", discountType)
		}
		if isActive != "" {
			activeBool := isActive == "true" || isActive == "1"
			dbQuery = dbQuery.Where("is_active = ?", activeBool)
		}
	}

	if err := dbQuery.Order("id DESC").Limit(MaxExportRows).Find(&coupons).Error; err != nil {
		return nil, "", err
	}

	f := excelize.NewFile()
	sheet := "Mã giảm giá"
	f.SetSheetName("Sheet1", sheet)

	headerStyle, _ := utils.CreateHeaderStyle(f)
	dataStyle, _ := utils.CreateDataStyle(f, "left")
	centerStyle, _ := utils.CreateDataStyle(f, "center")
	currStyle, _ := utils.CreateCurrencyStyle(f)

	headers := []string{
		"ID", "Mã Voucher", "Mô tả", "Loại giảm", "Giá trị giảm",
		"Đơn tối thiểu (VNĐ)", "Giảm tối đa (VNĐ)", "Giới hạn dùng", "Đã dùng",
		"Ngày bắt đầu", "Ngày kết thúc", "Trạng thái",
	}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	for rowIdx, c := range coupons {
		row := rowIdx + 2
		desc := ""
		if c.Description != nil {
			desc = *c.Description
		}

		typeVN := "Giảm %"
		valStr := fmt.Sprintf("%d%%", c.DiscountValue)
		if c.DiscountType == "fixed" {
			typeVN = "Số tiền cố định"
			valStr = fmt.Sprintf("%d VNĐ", c.DiscountValue)
		}

		startDateStr := "-"
		if c.StartDate != nil {
			startDateStr = c.StartDate.Format("02/01/2006")
		}
		endDateStr := "Vô thời hạn"
		if c.EndDate != nil {
			endDateStr = c.EndDate.Format("02/01/2006")
		}

		statusVN := "Kích hoạt"
		if !c.IsActive {
			statusVN = "Tạm dừng"
		} else if c.EndDate != nil && c.EndDate.Before(time.Now()) {
			statusVN = "Đã hết hạn"
		}

		limitStr := "Không giới hạn"
		if c.UsageLimit > 0 {
			limitStr = strconv.Itoa(c.UsageLimit)
		}

		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", row), c.ID)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", row), utils.SanitizeExcelCell(c.Code))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", row), utils.SanitizeExcelCell(desc))
		_ = f.SetCellStyle(sheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), dataStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("D%d", row), typeVN)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("E%d", row), valStr)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", row), c.MinOrderAmount)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), currStyle)

		if c.MaxDiscount != nil {
			_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", row), *c.MaxDiscount)
			_ = f.SetCellStyle(sheet, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), currStyle)
		} else {
			_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", row), "-")
			_ = f.SetCellStyle(sheet, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), centerStyle)
		}

		_ = f.SetCellValue(sheet, fmt.Sprintf("H%d", row), limitStr)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("I%d", row), c.UsedCount)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("I%d", row), fmt.Sprintf("I%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("J%d", row), startDateStr)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("J%d", row), fmt.Sprintf("J%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("K%d", row), endDateStr)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("K%d", row), fmt.Sprintf("K%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("L%d", row), statusVN)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("L%d", row), fmt.Sprintf("L%d", row), centerStyle)

		_ = f.SetRowHeight(sheet, row, 20)
	}

	utils.FormatSheetView(f, sheet, "L", len(coupons)+1)
	utils.AutoFitColumns(f, sheet, 1, 12, 16)
	_ = f.SetColWidth(sheet, "C", "C", 30)

	filename := fmt.Sprintf("ma_giam_gia_%s.xlsx", time.Now().Format("20060102_150405"))
	s.AuditService.Record(actorID, "export.voucher", "Mã giảm giá",
		fmt.Sprintf("Xuất Excel %d mã voucher", len(coupons)), ip, ua)

	return f, filename, nil
}

// ExportRevenue xuất báo cáo doanh thu theo ngày ra file Excel
func (s *ExportService) ExportRevenue(days int, startDate, endDate string, actorID uint64, ip, ua string) (*excelize.File, string, error) {
	if days <= 0 {
		days = 30
	}

	type DailyRevenue struct {
		Date       string `gorm:"column:date"`
		OrderCount int    `gorm:"column:order_count"`
		Total      int64  `gorm:"column:total"`
	}

	var results []DailyRevenue
	q := s.DB.Table("orders").
		Select("DATE(created_at) as date, COUNT(id) as order_count, COALESCE(SUM(total_amount), 0) as total").
		Where("status != 'cancelled'")

	if startDate != "" && endDate != "" {
		q = q.Where("DATE(created_at) >= ? AND DATE(created_at) <= ?", startDate, endDate)
	} else {
		cutoff := time.Now().AddDate(0, 0, -days).Format("2006-01-02")
		q = q.Where("DATE(created_at) >= ?", cutoff)
	}

	if err := q.Group("DATE(created_at)").Order("date ASC").Find(&results).Error; err != nil {
		return nil, "", err
	}

	f := excelize.NewFile()
	sheet := "Doanh thu theo ngày"
	f.SetSheetName("Sheet1", sheet)

	headerStyle, _ := utils.CreateHeaderStyle(f)
	centerStyle, _ := utils.CreateDataStyle(f, "center")
	currStyle, _ := utils.CreateCurrencyStyle(f)

	headers := []string{"Ngày", "Số đơn thành công", "Doanh thu (VNĐ)"}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, headerStyle)
	}

	var grandTotal int64
	var grandOrders int

	for rowIdx, item := range results {
		row := rowIdx + 2
		grandTotal += item.Total
		grandOrders += item.OrderCount

		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", row), item.Date)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", row), item.OrderCount)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), centerStyle)

		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", row), item.Total)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), currStyle)

		_ = f.SetRowHeight(sheet, row, 20)
	}

	// Hàng tổng cộng
	totalRow := len(results) + 2
	boldCenter, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 10, Family: "Arial"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"F3F4F6"}, Pattern: 1},
	})
	boldCurr, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Bold: true, Size: 10, Family: "Arial"},
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Fill:         excelize.Fill{Type: "pattern", Color: []string{"F3F4F6"}, Pattern: 1},
		CustomNumFmt: &[]string{`#,##0" ₫"`}[0],
	})

	_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", totalRow), "TỔNG CỘNG")
	_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", totalRow), fmt.Sprintf("A%d", totalRow), boldCenter)

	_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", totalRow), grandOrders)
	_ = f.SetCellStyle(sheet, fmt.Sprintf("B%d", totalRow), fmt.Sprintf("B%d", totalRow), boldCenter)

	_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", totalRow), grandTotal)
	_ = f.SetCellStyle(sheet, fmt.Sprintf("C%d", totalRow), fmt.Sprintf("C%d", totalRow), boldCurr)

	utils.FormatSheetView(f, sheet, "C", totalRow)
	utils.AutoFitColumns(f, sheet, 1, 3, 22)

	filename := fmt.Sprintf("doanh_thu_%s.xlsx", time.Now().Format("20060102_150405"))
	s.AuditService.Record(actorID, "export.revenue", "Báo cáo doanh thu",
		fmt.Sprintf("Xuất Excel doanh thu %d ngày (tổng: %d đ)", len(results), grandTotal), ip, ua)

	return f, filename, nil
}
