package handlers

import (
	"errors"
	"net/http"

	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type BrandHandler struct {
	Service *services.BrandService
}

func NewBrandHandler(s *services.BrandService) *BrandHandler {
	return &BrandHandler{Service: s}
}

// List - GET /api/v1/brands
func (h *BrandHandler) List(c *gin.Context) {
	brands, err := h.Service.List()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách thương hiệu")
		return
	}
	utils.Success(c, http.StatusOK, "OK", brands)
}

// Create - POST /api/v1/admin/brands
func (h *BrandHandler) Create(c *gin.Context) {
	var req struct {
		Name string  `json:"name" binding:"required"`
		Slug string  `json:"slug"`
		Logo *string `json:"logo"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	brand, err := h.Service.Create(req.Name, req.Slug, req.Logo)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(c, http.StatusCreated, "Tạo thương hiệu thành công", brand)
}

// Update - PUT /api/v1/admin/brands/:id
func (h *BrandHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	var req struct {
		Name string  `json:"name" binding:"required"`
		Slug string  `json:"slug"`
		Logo *string `json:"logo"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	brand, err := h.Service.Update(id, req.Name, req.Slug, req.Logo)
	if err != nil {
		if errors.Is(err, services.ErrBrandNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật thương hiệu thành công", brand)
}

// Delete - DELETE /api/v1/admin/brands/:id
func (h *BrandHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	if err := h.Service.Delete(id); err != nil {
		if errors.Is(err, services.ErrBrandNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrBrandHasProducts) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi xóa thương hiệu")
		return
	}
	utils.Success(c, http.StatusOK, "Xóa thương hiệu thành công", nil)
}
