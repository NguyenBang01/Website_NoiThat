package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type ExportHandler struct {
	Service *services.ExportService
}

func NewExportHandler(service *services.ExportService) *ExportHandler {
	return &ExportHandler{Service: service}
}

// ExportProducts - GET /api/v1/admin/products/export
func (h *ExportHandler) ExportProducts(c *gin.Context) {
	q := c.Query("q")
	categoryID, _ := strconv.ParseUint(c.Query("category_id"), 10, 64)
	status := c.Query("status")
	ids := parseIDs(c.Query("ids"))

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	f, filename, err := h.Service.ExportProducts(q, categoryID, status, ids, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xuất Excel sản phẩm: "+err.Error())
		return
	}
	sendExcel(c, f, filename)
}

// ExportOrders - GET /api/v1/admin/orders/export
func (h *ExportHandler) ExportOrders(c *gin.Context) {
	q := c.Query("q")
	status := c.Query("status")
	paymentMethod := c.Query("payment_method")
	paymentStatus := c.Query("payment_status")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	ids := parseIDs(c.Query("ids"))

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	f, filename, err := h.Service.ExportOrders(q, status, paymentMethod, paymentStatus, startDate, endDate, ids, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xuất Excel đơn hàng: "+err.Error())
		return
	}
	sendExcel(c, f, filename)
}

// ExportInventory - GET /api/v1/admin/inventory/export
func (h *ExportHandler) ExportInventory(c *gin.Context) {
	threshold, _ := strconv.Atoi(c.DefaultQuery("threshold", "1000000"))
	categoryID, _ := strconv.ParseUint(c.Query("category_id"), 10, 64)
	ids := parseIDs(c.Query("ids"))

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	f, filename, err := h.Service.ExportInventory(threshold, categoryID, ids, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xuất Excel tồn kho: "+err.Error())
		return
	}
	sendExcel(c, f, filename)
}

// ExportCustomers - GET /api/v1/admin/customers/export
func (h *ExportHandler) ExportCustomers(c *gin.Context) {
	q := c.Query("q")
	status := c.Query("status")
	ids := parseIDs(c.Query("ids"))

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	f, filename, err := h.Service.ExportCustomers(q, status, ids, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xuất Excel khách hàng: "+err.Error())
		return
	}
	sendExcel(c, f, filename)
}

// ExportVouchers - GET /api/v1/admin/vouchers/export
func (h *ExportHandler) ExportVouchers(c *gin.Context) {
	q := c.Query("q")
	discountType := c.Query("discount_type")
	isActive := c.Query("is_active")
	ids := parseIDs(c.Query("ids"))

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	f, filename, err := h.Service.ExportVouchers(q, discountType, isActive, ids, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xuất Excel mã giảm giá: "+err.Error())
		return
	}
	sendExcel(c, f, filename)
}

// ExportRevenue - GET /api/v1/admin/reports/revenue/export
func (h *ExportHandler) ExportRevenue(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	f, filename, err := h.Service.ExportRevenue(days, startDate, endDate, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xuất Excel doanh thu: "+err.Error())
		return
	}
	sendExcel(c, f, filename)
}

func sendExcel(c *gin.Context, f *excelize.File, filename string) {
	defer f.Close()
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Access-Control-Expose-Headers", "Content-Disposition")
	if err := f.Write(c.Writer); err != nil {
		_ = c.Error(err)
	}
}

func parseIDs(idsParam string) []uint64 {
	if idsParam == "" {
		return nil
	}
	parts := strings.Split(idsParam, ",")
	var res []uint64
	for _, p := range parts {
		if id, err := strconv.ParseUint(strings.TrimSpace(p), 10, 64); err == nil && id > 0 {
			res = append(res, id)
		}
	}
	return res
}
