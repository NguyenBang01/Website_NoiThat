package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	OrderService *services.OrderService
}

func NewOrderHandler(s *services.OrderService) *OrderHandler {
	return &OrderHandler{OrderService: s}
}

// Customer: Create Order
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	var req dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	order, err := h.OrderService.CreateOrder(userID, req)
	if err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}
	utils.Success(c, 201, "Đặt hàng thành công", order)
}

// Customer: List Orders
func (h *OrderHandler) MyOrders(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	page, limit := utils.GetPagination(c)

	orders, total, err := h.OrderService.CustomerOrders(userID, page, limit)
	if err != nil {
		utils.Fail(c, 500, err.Error())
		return
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, 200, "Thành công", orders, meta)
}

// Customer: Order Detail
func (h *OrderHandler) MyOrderDetail(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	orderIDStr := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	order, err := h.OrderService.CustomerOrderDetail(userID, orderID)
	if err != nil {
		utils.Fail(c, 404, err.Error())
		return
	}
	utils.Success(c, 200, "Thành công", order)
}

// Customer: Cancel Order
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	orderIDStr := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	var req dto.CancelOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.OrderService.CancelOrder(userID, orderID, req.Reason); err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}

	utils.Success(c, 200, "Hủy đơn hàng thành công", nil)
}

// Admin: List Orders
func (h *OrderHandler) AdminOrders(c *gin.Context) {
	page, limit := utils.GetPagination(c)
	status := c.Query("status")
	q := c.Query("q")

	orders, total, err := h.OrderService.AdminOrders(page, limit, status, q)
	if err != nil {
		utils.Fail(c, 500, err.Error())
		return
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, 200, "Thành công", orders, meta)
}

// Admin: Order Detail
func (h *OrderHandler) AdminOrderDetail(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	order, err := h.OrderService.AdminOrderDetail(orderID)
	if err != nil {
		utils.Fail(c, 404, err.Error())
		return
	}
	utils.Success(c, 200, "Thành công", order)
}

// Admin: Update Status
func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	adminID := c.MustGet("user_id").(uint64)
	orderIDStr := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	var req dto.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.OrderService.UpdateStatus(orderID, adminID, req); err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}

	utils.Success(c, 200, "Cập nhật trạng thái thành công", nil)
}
