package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	Service *services.ProductService
}

// AdminList - GET /api/v1/admin/products?q=&category_id=&status=&page=&limit=
func (h *ProductHandler) AdminList(c *gin.Context) {
	page, limit := utils.GetPagination(c)

	var categoryID uint64
	if v := c.Query("category_id"); v != "" {
		n, err := strconv.ParseUint(v, 10, 64)
		if err != nil {
			utils.Fail(c, http.StatusBadRequest, "category_id không hợp lệ")
			return
		}
		categoryID = n
	}

	params := services.ProductListParams{
		Page:       page,
		Limit:      limit,
		Q:          strings.TrimSpace(c.Query("q")),
		CategoryID: categoryID,
		Status:     strings.TrimSpace(c.Query("status")),
	}

	items, total, err := h.Service.AdminList(params)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.SuccessWithMeta(c, http.StatusOK, "OK", items, utils.BuildMeta(page, limit, total))
}

// AdminGet - GET /api/v1/admin/products/:id
func (h *ProductHandler) AdminGet(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	p, err := h.Service.GetByID(id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "OK", p)
}

// Create - POST /api/v1/admin/products
func (h *ProductHandler) Create(c *gin.Context) {
	var req dto.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}
	p, err := h.Service.Create(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, "Thêm sản phẩm thành công", p)
}

// Update - PUT /api/v1/admin/products/:id
func (h *ProductHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var req dto.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}
	p, err := h.Service.Update(id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật sản phẩm thành công", p)
}

// Delete - DELETE /api/v1/admin/products/:id (xóa mềm)
func (h *ProductHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	if err := h.Service.Delete(id); err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "Xóa sản phẩm thành công", nil)
}

func (h *ProductHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrProductNotFound):
		utils.Fail(c, http.StatusNotFound, err.Error())
	case errors.Is(err, services.ErrInvalidInput):
		utils.Fail(c, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, services.ErrConflict):
		utils.Fail(c, http.StatusConflict, err.Error())
	case strings.Contains(err.Error(), "Duplicate entry"):
		// Lưới an toàn: database báo trùng khóa duy nhất (SKU, slug, tổ hợp biến thể)
		utils.Fail(c, http.StatusConflict, "Dữ liệu bị trùng (SKU, slug hoặc tổ hợp màu/kích thước/chất liệu)")
	default:
		log.Println("Lỗi sản phẩm:", err)
		utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
	}
}
