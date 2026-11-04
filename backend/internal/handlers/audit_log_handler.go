package handlers

import (
	"net/http"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuditLogHandler struct {
	Service *services.AuditService
}

func NewAuditLogHandler(service *services.AuditService) *AuditLogHandler {
	return &AuditLogHandler{Service: service}
}

// List - GET /api/v1/admin/audit-logs
func (h *AuditLogHandler) List(c *gin.Context) {
	var q dto.AuditLogQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	filter := services.AuditLogFilter{
		Page:      q.Page,
		Limit:     q.Limit,
		Action:    q.Action,
		UserID:    q.UserID,
		StartDate: q.StartDate,
		EndDate:   q.EndDate,
	}

	logs, total, err := h.Service.List(filter)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách nhật ký hoạt động")
		return
	}

	meta := utils.BuildMeta(q.Page, q.Limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", logs, meta)
}
