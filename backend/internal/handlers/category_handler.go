package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	Service *services.CategoryService
}

// List - GET /api/v1/categories
// Mặc định trả dạng cây. Thêm ?flat=true để lấy danh sách phẳng.
func (h *CategoryHandler) List(c *gin.Context) {
	if c.Query("flat") == "true" {
		cats, err := h.Service.ListFlat(true)
		if err != nil {
			h.handleError(c, err)
			return
		}
		utils.Success(c, http.StatusOK, "OK", cats)
		return
	}

	tree, err := h.Service.ListTree()
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "OK", tree)
}

// AdminList - GET /api/v1/admin/categories (gồm cả danh mục đang ẩn)
func (h *CategoryHandler) AdminList(c *gin.Context) {
	cats, err := h.Service.ListFlat(false)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "OK", cats)
}

// Create - POST /api/v1/admin/categories
func (h *CategoryHandler) Create(c *gin.Context) {
	var req dto.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	cat, err := h.Service.Create(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, "Thêm danh mục thành công", cat)
}

// Update - PUT /api/v1/admin/categories/:id
func (h *CategoryHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	var req dto.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	cat, err := h.Service.Update(id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật danh mục thành công", cat)
}

// Delete - DELETE /api/v1/admin/categories/:id
func (h *CategoryHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	if err := h.Service.Delete(id); err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "Xóa danh mục thành công", nil)
}

// handleError đổi lỗi nghiệp vụ thành mã HTTP phù hợp
func (h *CategoryHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrCategoryNotFound):
		utils.Fail(c, http.StatusNotFound, err.Error())
	case errors.Is(err, services.ErrSlugExists),
		errors.Is(err, services.ErrCategoryHasChildren),
		errors.Is(err, services.ErrCategoryHasProducts):
		utils.Fail(c, http.StatusConflict, err.Error())
	case errors.Is(err, services.ErrInvalidSlug),
		errors.Is(err, services.ErrInvalidParent):
		utils.Fail(c, http.StatusUnprocessableEntity, err.Error())
	default:
		log.Println("Lỗi danh mục:", err)
		utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
	}
}

// parseID đọc :id từ đường dẫn
func parseID(c *gin.Context) (uint64, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return 0, false
	}
	return id, true
}
