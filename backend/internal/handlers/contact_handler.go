package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type ContactHandler struct {
	Service *services.ContactService
}

func NewContactHandler(service *services.ContactService) *ContactHandler {
	return &ContactHandler{Service: service}
}

func (h *ContactHandler) Submit(c *gin.Context) {
	var req dto.ContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}
	contact, err := h.Service.Submit(req)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi gửi liên hệ")
		return
	}
	utils.Success(c, http.StatusCreated, "Gửi liên hệ thành công", contact)
}

func (h *ContactHandler) List(c *gin.Context) {
	page, limit := utils.GetPagination(c)
	contacts, total, err := h.Service.AdminList(page, limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách liên hệ")
		return
	}
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", contacts, utils.BuildMeta(page, limit, total))
}

func (h *ContactHandler) MarkAsRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}
	if err := h.Service.MarkAsRead(id); err != nil {
		if err.Error() == "contact not found" {
			utils.Fail(c, http.StatusNotFound, "Không tìm thấy liên hệ")
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi đánh dấu đã đọc")
		return
	}
	utils.Success(c, http.StatusOK, "Đánh dấu đã đọc thành công", nil)
}

func (h *ContactHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}
	if err := h.Service.Delete(id); err != nil {
		if err.Error() == "contact not found" {
			utils.Fail(c, http.StatusNotFound, "Không tìm thấy liên hệ")
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi xóa liên hệ")
		return
	}
	utils.Success(c, http.StatusOK, "Xóa liên hệ thành công", nil)
}
