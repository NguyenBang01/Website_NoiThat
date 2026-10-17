package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type SepayHandler struct {
	Service *services.SepayService
	APIKey  string
}

func NewSepayHandler(service *services.SepayService, apiKey string) *SepayHandler {
	return &SepayHandler{
		Service: service,
		APIKey:  strings.TrimSpace(apiKey),
	}
}

// Webhook xử lý thông báo biến động số dư từ SePay
// POST /api/v1/payment/sepay/webhook
func (h *SepayHandler) Webhook(c *gin.Context) {
	// Kiểm tra xác thực qua header Authorization nếu APIKey được cài đặt
	if h.APIKey != "" {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		expectedApikey := "Apikey " + h.APIKey
		expectedBearer := "Bearer " + h.APIKey

		if authHeader != h.APIKey && authHeader != expectedApikey && authHeader != expectedBearer {
			log.Printf("[SePay] Từ chối webhook: API Key không khớp (nhận được: '%s')", authHeader)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized: API Key không hợp lệ",
			})
			return
		}
	}

	var payload dto.SepayWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("[SePay] Lỗi parse JSON payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Dữ liệu webhook không hợp lệ: " + err.Error(),
		})
		return
	}

	txRecord, err := h.Service.ProcessWebhook(payload)
	if err != nil {
		log.Printf("[SePay] Lỗi xử lý giao dịch: %v", err)
		// Trả về 200 hoặc 500 tùy nhu cầu, trả về 200 kèm success:false để SePay ghi log rõ ràng
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Lỗi nội bộ khi lưu giao dịch: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Xử lý webhook SePay thành công",
		"data":    txRecord,
	})
}

// CheckStatus kiểm tra trạng thái thanh toán của đơn hàng (dùng cho frontend thăm dò polling)
// GET /api/v1/payment/check/:orderCode
func (h *SepayHandler) CheckStatus(c *gin.Context) {
	orderCode := c.Param("orderCode")
	if orderCode == "" {
		utils.Fail(c, http.StatusBadRequest, "Mã đơn hàng không được để trống")
		return
	}

	res, err := h.Service.CheckPaymentStatus(orderCode)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "OK", res)
}

// CancelUnpaid hủy đơn hàng đang chờ chuyển khoản
// POST /api/v1/payment/cancel/:orderCode
func (h *SepayHandler) CancelUnpaid(c *gin.Context) {
	orderCode := c.Param("orderCode")
	if orderCode == "" {
		utils.Fail(c, http.StatusBadRequest, "Mã đơn hàng không được để trống")
		return
	}

	if err := h.Service.CancelUnpaidOrder(orderCode); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã hủy đơn hàng chưa thanh toán thành công", nil)
}

// ListTransactions danh sách giao dịch SePay (Dành cho Admin)
// GET /api/v1/admin/payment/sepay/transactions
func (h *SepayHandler) ListTransactions(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	list, err := h.Service.ListTransactions(limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách giao dịch: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "OK", list)
}
