package handlers

import (
	"net/http"
	"strconv"

	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	Service *services.NotificationService
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{Service: service}
}

// List lấy danh sách thông báo của người dùng hoặc quản trị viên
func (h *NotificationHandler) List(c *gin.Context) {
	var userID uint64
	if val, exists := c.Get("user_id"); exists {
		if uid, ok := val.(uint64); ok {
			userID = uid
		}
	}

	role := c.GetString("role")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, total, unreadCount, err := h.Service.List(userID, role, page, limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Không thể tải danh sách thông báo")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "OK",
		"data":    items,
		"meta": gin.H{
			"page":         page,
			"limit":        limit,
			"total":        total,
			"unread_count": unreadCount,
		},
	})
}

// MarkRead đánh dấu 1 thông báo là đã đọc
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID thông báo không hợp lệ")
		return
	}

	var userID uint64
	if val, exists := c.Get("user_id"); exists {
		if uid, ok := val.(uint64); ok {
			userID = uid
		}
	}
	role := c.GetString("role")

	if err := h.Service.MarkRead(id, userID, role); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Không thể cập nhật trạng thái thông báo")
		return
	}

	utils.Success(c, http.StatusOK, "Đã đánh dấu thông báo là đã đọc", nil)
}

// MarkAllRead đánh dấu toàn bộ thông báo là đã đọc
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	var userID uint64
	if val, exists := c.Get("user_id"); exists {
		if uid, ok := val.(uint64); ok {
			userID = uid
		}
	}
	role := c.GetString("role")

	if err := h.Service.MarkAllRead(userID, role); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Không thể cập nhật thông báo")
		return
	}

	utils.Success(c, http.StatusOK, "Đã đánh dấu tất cả thông báo là đã đọc", nil)
}

// Broadcast gửi thông báo tới nhóm đối tượng (mặc định là khách hàng: customer hoặc all)
func (h *NotificationHandler) Broadcast(c *gin.Context) {
	var req struct {
		Title      string `json:"title" binding:"required"`
		Message    string `json:"message" binding:"required"`
		Link       string `json:"link"`
		Type       string `json:"type"`
		TargetRole string `json:"target_role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu không hợp lệ")
		return
	}

	if req.TargetRole == "" {
		req.TargetRole = "customer"
	}
	if req.Type == "" {
		req.Type = "promo"
	}

	notif, err := h.Service.Create(nil, req.TargetRole, req.Title, req.Message, req.Type, req.Link)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Không thể gửi thông báo: "+err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Phát thông báo thành công đến khách hàng", notif)
}

