package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type BannerHandler struct {
	Service *services.BannerService
}

func NewBannerHandler(service *services.BannerService) *BannerHandler {
	return &BannerHandler{Service: service}
}

func (h *BannerHandler) List(c *gin.Context) {
	banners, err := h.Service.PublicList()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách banner")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", banners)
}

func (h *BannerHandler) AdminList(c *gin.Context) {
	page, limit := utils.GetPagination(c)
	banners, total, err := h.Service.AdminList(page, limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách banner")
		return
	}
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", banners, utils.BuildMeta(page, limit, total))
}

func (h *BannerHandler) Create(c *gin.Context) {
	var req dto.BannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}
	banner, err := h.Service.Create(req)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi tạo banner")
		return
	}
	utils.Success(c, http.StatusCreated, "Tạo banner thành công", banner)
}

func (h *BannerHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}
	var req dto.BannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}
	if err := h.Service.Update(id, req); err != nil {
		if err.Error() == "banner not found" {
			utils.Fail(c, http.StatusNotFound, "Không tìm thấy banner")
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi cập nhật banner")
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật banner thành công", nil)
}

func (h *BannerHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}
	if err := h.Service.Delete(id); err != nil {
		if err.Error() == "banner not found" {
			utils.Fail(c, http.StatusNotFound, "Không tìm thấy banner")
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi xóa banner")
		return
	}
	utils.Success(c, http.StatusOK, "Xóa banner thành công", nil)
}
