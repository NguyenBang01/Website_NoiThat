package services_test

import (
	"testing"
	"time"

	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"gorm.io/gorm"
)

// TestExcelFormulaInjection kiểm tra chống Formula Injection
func TestExcelFormulaInjection(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"=SUM(A1:A10)", "'=SUM(A1:A10)"},
		{"+123456789", "'+123456789"},
		{"-99999", "'-99999"},
		{"@SUM(1,2)", "'@SUM(1,2)"},
		{"=cmd|' /C calc'!A0", "'=cmd|' /C calc'!A0"},
		{"\t=malicious", "'\t=malicious"},
		{"Sản phẩm nội thất Góc Nhà Đẹp", "Sản phẩm nội thất Góc Nhà Đẹp"},
		{"Bàn trà sofa gỗ sồi tự nhiên", "Bàn trà sofa gỗ sồi tự nhiên"},
		{"", ""},
	}

	for _, tc := range testCases {
		res := utils.SanitizeExcelCell(tc.input)
		if res != tc.expected {
			t.Errorf("SanitizeExcelCell(%q) = %q; kỳ vọng %q", tc.input, res, tc.expected)
		}
	}
}

// TestTrashItemNotFound kiểm tra xử lý khi ID trong thùng rác không tồn tại
func TestTrashItemNotFound(t *testing.T) {
	db := setupTestDB(t)
	auditService := services.NewAuditService(db)
	trashService := services.NewTrashService(db, auditService, "")

	err := trashService.Restore("product", 999999999, 1, "127.0.0.1", "Test")
	if err == nil || err != services.ErrTrashItemNotFound {
		t.Errorf("Kỳ vọng ErrTrashItemNotFound, nhận được: %v", err)
	}

	err = trashService.Restore("invalid_module", 1, 1, "127.0.0.1", "Test")
	if err == nil || err != services.ErrInvalidModule {
		t.Errorf("Kỳ vọng ErrInvalidModule, nhận được: %v", err)
	}
}

// TestSoftDeleteAndRestoreProduct kiểm tra quy trình Xóa mềm -> Thùng rác -> Khôi phục
func TestSoftDeleteAndRestoreProduct(t *testing.T) {
	db := setupTestDB(t)

	// Lấy 1 category hợp lệ
	var cat models.Category
	if err := db.First(&cat).Error; err != nil {
		t.Skip("Bỏ qua vì chưa có category trong DB")
	}

	productService := &services.ProductService{DB: db}
	auditService := services.NewAuditService(db)
	trashService := services.NewTrashService(db, auditService, "")

	// 1. Tạo sản phẩm test
	testSKU := "TEST-SKU-TRASH-" + time.Now().Format("150405")
	testSlug := "test-slug-trash-" + time.Now().Format("150405")
	prod := models.Product{
		CategoryID: cat.ID,
		Name:       "Sản phẩm Test Thùng Rác",
		Slug:       testSlug,
		SKU:        testSKU,
		BasePrice:  1500000,
		Status:     "active",
	}
	if err := db.Create(&prod).Error; err != nil {
		t.Fatalf("Không thể tạo sản phẩm test: %v", err)
	}
	defer db.Unscoped().Delete(&prod)

	// Tạo 1 biến thể
	variant := models.ProductVariant{
		ProductID:     prod.ID,
		SKU:           testSKU + "-V1",
		Price:         1500000,
		StockQuantity: 10,
	}
	db.Create(&variant)
	defer db.Unscoped().Delete(&variant)

	// 2. Xóa mềm sản phẩm
	err := productService.Delete(prod.ID, 1)
	if err != nil {
		t.Fatalf("Lỗi xóa mềm sản phẩm: %v", err)
	}

	// Kiểm tra sản phẩm bị ẩn khỏi query thông thường
	var checkProd models.Product
	err = db.First(&checkProd, prod.ID).Error
	if err != gorm.ErrRecordNotFound {
		t.Errorf("Kỳ vọng không tìm thấy sản phẩm sau khi xóa mềm, nhưng lại thấy: %v", err)
	}

	// Kiểm tra biến thể cũng bị xóa mềm
	var checkVar models.ProductVariant
	err = db.Where("product_id = ?", prod.ID).First(&checkVar).Error
	if err != gorm.ErrRecordNotFound {
		t.Errorf("Kỳ vọng biến thể bị xóa mềm theo sản phẩm, nhưng lại thấy: %v", err)
	}

	// 3. Kiểm tra sản phẩm xuất hiện trong thùng rác
	items, total, err := trashService.List("product", 1, 20, testSKU, "", "", 0)
	if err != nil {
		t.Fatalf("Lỗi lấy danh sách thùng rác: %v", err)
	}
	if total == 0 || len(items) == 0 {
		t.Errorf("Kỳ vọng tìm thấy sản phẩm trong thùng rác, nhưng total = %d", total)
	}

	// 4. Khôi phục sản phẩm từ thùng rác
	err = trashService.Restore("product", prod.ID, 1, "127.0.0.1", "UnitTest")
	if err != nil {
		t.Fatalf("Lỗi khôi phục sản phẩm: %v", err)
	}

	// Kiểm tra sản phẩm đã hoạt động trở lại
	err = db.First(&checkProd, prod.ID).Error
	if err != nil {
		t.Errorf("Kỳ vọng tìm thấy sản phẩm sau khi khôi phục, nhận lỗi: %v", err)
	}

	// Kiểm tra biến thể cũng đã được khôi phục
	err = db.Where("product_id = ?", prod.ID).First(&checkVar).Error
	if err != nil {
		t.Errorf("Kỳ vọng biến thể được khôi phục, nhận lỗi: %v", err)
	}
}

// TestExportProductsExcel kiểm tra tạo file Excel sản phẩm hợp lệ
func TestExportProductsExcel(t *testing.T) {
	db := setupTestDB(t)

	auditService := services.NewAuditService(db)
	exportService := services.NewExportService(db, auditService)

	f, filename, err := exportService.ExportProducts("", 0, "", nil, 1, "127.0.0.1", "Test")
	if err != nil {
		t.Fatalf("Lỗi xuất Excel sản phẩm: %v", err)
	}
	defer f.Close()

	if filename == "" {
		t.Errorf("Tên file không được để trống")
	}

	sheetList := f.GetSheetList()
	if len(sheetList) == 0 || sheetList[0] != "Sản phẩm" {
		t.Errorf("Kỳ vọng sheet đầu tiên là 'Sản phẩm', thực tế: %v", sheetList)
	}
}

// TestExportOrdersExcel kiểm tra tạo file Excel đơn hàng gồm đủ 2 Sheet
func TestExportOrdersExcel(t *testing.T) {
	db := setupTestDB(t)

	auditService := services.NewAuditService(db)
	exportService := services.NewExportService(db, auditService)

	f, filename, err := exportService.ExportOrders("", "", "", "", "", "", nil, 1, "127.0.0.1", "Test")
	if err != nil {
		t.Fatalf("Lỗi xuất Excel đơn hàng: %v", err)
	}
	defer f.Close()

	if filename == "" {
		t.Errorf("Tên file không được để trống")
	}

	sheetList := f.GetSheetList()
	if len(sheetList) < 2 {
		t.Fatalf("Kỳ vọng đơn hàng có ít nhất 2 sheets, thực tế có: %v", sheetList)
	}

	hasOverview := false
	hasDetails := false
	for _, s := range sheetList {
		if s == "Tổng quan đơn hàng" {
			hasOverview = true
		}
		if s == "Chi tiết sản phẩm" {
			hasDetails = true
		}
	}

	if !hasOverview || !hasDetails {
		t.Errorf("Kỳ vọng có 2 sheets 'Tổng quan đơn hàng' và 'Chi tiết sản phẩm', thực tế: %v", sheetList)
	}
}
