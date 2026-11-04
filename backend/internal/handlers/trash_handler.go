package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type TrashHandler struct {
	Service *services.TrashService
}

func NewTrashHandler(service *services.TrashService) *TrashHandler {
	return &TrashHandler{Service: service}
}

// List - GET /api/v1/admin/trash
// Lấy danh sách các mục trong thùng rác theo module
func (h *TrashHandler) List(c *gin.Context) {
	module := c.DefaultQuery("module", "product")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	deletedBy, _ := strconv.ParseUint(c.Query("deleted_by"), 10, 64)

	items, total, err := h.Service.List(module, page, limit, search, startDate, endDate, deletedBy)
	if err != nil {
		if errors.Is(err, services.ErrInvalidModule) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi lấy dữ liệu thùng rác: "+err.Error())
		return
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Lấy danh sách thùng rác thành công", items, meta)
}

// Restore - POST /api/v1/admin/trash/:module/:id/restore
// Khôi phục một bản ghi cụ thể từ thùng rác
func (h *TrashHandler) Restore(c *gin.Context) {
	module := c.Param("module")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.Service.Restore(module, id, actorID, ip, ua); err != nil {
		switch {
		case errors.Is(err, services.ErrTrashItemNotFound):
			utils.Fail(c, http.StatusNotFound, err.Error())
		case errors.Is(err, services.ErrConflictSlug),
			errors.Is(err, services.ErrConflictSKU),
			errors.Is(err, services.ErrConflictCode),
			errors.Is(err, services.ErrConflictEmail):
			utils.Fail(c, http.StatusConflict, err.Error())
		case errors.Is(err, services.ErrInvalidModule):
			utils.Fail(c, http.StatusBadRequest, err.Error())
		default:
			utils.Fail(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.Success(c, http.StatusOK, "Khôi phục thành công", nil)
}

// RestoreBatch - POST /api/v1/admin/trash/:module/restore-batch
// Khôi phục hàng loạt bản ghi
func (h *TrashHandler) RestoreBatch(c *gin.Context) {
	module := c.Param("module")
	var req dto.RestoreBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ")
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	res, err := h.Service.RestoreBatch(module, req.IDs, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Hoàn tất khôi phục hàng loạt", res)
}

// Purge - DELETE /api/v1/admin/trash/:module/:id
// Xóa vĩnh viễn 1 bản ghi khỏi hệ thống
func (h *TrashHandler) Purge(c *gin.Context) {
	module := c.Param("module")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.Service.Purge(module, id, actorID, ip, ua); err != nil {
		if errors.Is(err, services.ErrTrashItemNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi xóa vĩnh viễn: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã xóa vĩnh viễn dữ liệu", nil)
}

// Empty - DELETE /api/v1/admin/trash/:module/empty
// Dọn sạch toàn bộ thùng rác của module
func (h *TrashHandler) Empty(c *gin.Context) {
	module := c.Param("module")
	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	count, err := h.Service.Empty(module, actorID, ip, ua)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi dọn thùng rác: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã dọn sạch thùng rác", gin.H{
		"deleted_count": count,
	})
}
