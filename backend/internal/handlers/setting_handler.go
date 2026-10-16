package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

type SettingHandler struct {
	Service     *services.SettingService
	MailService *services.MailService
}

func NewSettingHandler(service *services.SettingService, mailService ...*services.MailService) *SettingHandler {
	var ms *services.MailService
	if len(mailService) > 0 {
		ms = mailService[0]
	}
	return &SettingHandler{Service: service, MailService: ms}
}

func (h *SettingHandler) GetAll(c *gin.Context) {
	settings, err := h.Service.GetAll()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy cấu hình")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", settings)
}

func (h *SettingHandler) Update(c *gin.Context) {
	var req dto.SettingUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}
	if err := h.Service.BulkUpdate(req.Settings); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi cập nhật cấu hình")
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật cấu hình thành công", nil)
}

type TestEmailRequest struct {
	ToEmail string `json:"to_email" binding:"required,email"`
}

// TestEmail - POST /api/v1/admin/settings/test-email
func (h *SettingHandler) TestEmail(c *gin.Context) {
	if h.MailService == nil || !h.MailService.IsConfigured() {
		utils.Fail(c, http.StatusBadRequest, "Cấu hình SMTP chưa được thiết lập trong .env")
		return
	}

	var req TestEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.MailService.SendTestEmail(req.ToEmail); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi gửi email: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã gửi email thử nghiệm thành công tới "+req.ToEmail, gin.H{
		"to_email": req.ToEmail,
		"status":   "success",
	})
}
