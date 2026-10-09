package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

type SettingHandler struct {
	Service *services.SettingService
}

func NewSettingHandler(service *services.SettingService) *SettingHandler {
	return &SettingHandler{Service: service}
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
