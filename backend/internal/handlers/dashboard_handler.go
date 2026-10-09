package handlers

import (
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	Service *services.DashboardService
}

func NewDashboardHandler(service *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{Service: service}
}

func (h *DashboardHandler) Overview(c *gin.Context) {
	overview, err := h.Service.GetOverview()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy dữ liệu tổng quan")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", overview)
}

func (h *DashboardHandler) RevenueByDay(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "30")
	days, _ := strconv.Atoi(daysStr)
	data, err := h.Service.GetRevenueByDay(days)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy dữ liệu doanh thu theo ngày")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", data)
}

func (h *DashboardHandler) RevenueByMonth(c *gin.Context) {
	monthsStr := c.DefaultQuery("months", "12")
	months, _ := strconv.Atoi(monthsStr)
	data, err := h.Service.GetRevenueByMonth(months)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy dữ liệu doanh thu theo tháng")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", data)
}

func (h *DashboardHandler) TopProducts(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)
	data, err := h.Service.GetTopProducts(limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy dữ liệu sản phẩm bán chạy")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", data)
}

func (h *DashboardHandler) RecentOrders(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)
	data, err := h.Service.GetRecentOrders(limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy dữ liệu đơn hàng gần đây")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", data)
}

func (h *DashboardHandler) LowStock(c *gin.Context) {
	thresholdStr := c.DefaultQuery("threshold", "10")
	threshold, _ := strconv.Atoi(thresholdStr)
	data, err := h.Service.GetLowStockItems(threshold)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy dữ liệu sản phẩm sắp hết hàng")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", data)
}
