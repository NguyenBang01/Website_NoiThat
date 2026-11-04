package utils

import (
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
)

// SanitizeExcelCell chống Excel Formula Injection:
// Nếu ô văn bản bắt đầu bằng =, +, -, @, thêm dấu ' (nháy đơn) ở đầu để Excel hiển thị như chuỗi thông thường
func SanitizeExcelCell(val string) string {
	trimmed := strings.TrimSpace(val)
	if trimmed == "" {
		return ""
	}
	firstChar := trimmed[0]
	if firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r' {
		return "'" + val
	}
	return val
}

// CreateHeaderStyle tạo style cho dòng tiêu đề: nền Emerald, chữ trắng in đậm, căn giữa, viền
func CreateHeaderStyle(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:   true,
			Color:  "FFFFFF",
			Size:   11,
			Family: "Arial",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"0F766E"}, // Emerald-700
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
			WrapText:   false,
		},
		Border: []excelize.Border{
			{Type: "left", Color: "D1D5DB", Style: 1},
			{Type: "right", Color: "D1D5DB", Style: 1},
			{Type: "top", Color: "D1D5DB", Style: 1},
			{Type: "bottom", Color: "047857", Style: 2},
		},
	})
}

// CreateDataStyle tạo style cơ bản cho dòng dữ liệu
func CreateDataStyle(f *excelize.File, align string) (int, error) {
	if align == "" {
		align = "left"
	}
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Size:   10,
			Family: "Arial",
		},
		Alignment: &excelize.Alignment{
			Horizontal: align,
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Color: "E5E7EB", Style: 1},
			{Type: "right", Color: "E5E7EB", Style: 1},
			{Type: "top", Color: "E5E7EB", Style: 1},
			{Type: "bottom", Color: "E5E7EB", Style: 1},
		},
	})
}

// CreateCurrencyStyle tạo style định dạng tiền tệ #,##0 ₫
func CreateCurrencyStyle(f *excelize.File) (int, error) {
	// Custom number format: #,##0 "₫"
	numFmt := 3 // #,##0
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Size:   10,
			Family: "Arial",
		},
		CustomNumFmt: &[]string{`#,##0" ₫"`}[0],
		NumFmt:       numFmt,
		Alignment: &excelize.Alignment{
			Horizontal: "right",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "left", Color: "E5E7EB", Style: 1},
			{Type: "right", Color: "E5E7EB", Style: 1},
			{Type: "top", Color: "E5E7EB", Style: 1},
			{Type: "bottom", Color: "E5E7EB", Style: 1},
		},
	})
}

// FormatSheetView đóng băng dòng tiêu đề và bật bộ lọc tự động (AutoFilter)
func FormatSheetView(f *excelize.File, sheet string, maxColName string, totalRows int) {
	// 1. Đóng băng dòng 1 (Freeze Panes)
	_ = f.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      1,
		TopLeftCell: "A2",
		ActivePane:  "bottomLeft",
	})

	// 2. Thiết lập độ cao hàng header
	_ = f.SetRowHeight(sheet, 1, 28)

	// 3. Tự động bật Filter cho vùng dữ liệu
	if totalRows > 1 && maxColName != "" {
		filterRange := fmt.Sprintf("A1:%s%d", maxColName, totalRows)
		_ = f.AutoFilter(sheet, filterRange, []excelize.AutoFilterOptions{})
	}
}

// AutoFitColumns tự động tính toán và đặt độ rộng cột phù hợp
func AutoFitColumns(f *excelize.File, sheet string, minCol, maxCol int, minWidth float64) {
	for col := minCol; col <= maxCol; col++ {
		colName, err := excelize.ColumnNumberToName(col)
		if err != nil {
			continue
		}
		_ = f.SetColWidth(sheet, colName, colName, minWidth)
	}
}
