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

type StaffHandler struct {
	Service *services.StaffService
}

func NewStaffHandler(service *services.StaffService) *StaffHandler {
	return &StaffHandler{Service: service}
}

// List - GET /api/v1/admin/staff
func (h *StaffHandler) List(c *gin.Context) {
	var q dto.StaffQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	staffList, total, err := h.Service.ListStaff(q)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách nhân viên")
		return
	}

	meta := utils.BuildMeta(q.Page, q.Limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", staffList, meta)
}

// Get - GET /api/v1/admin/staff/:id
func (h *StaffHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID nhân viên không hợp lệ")
		return
	}

	staff, err := h.Service.GetStaff(id)
	if err != nil {
		if errors.Is(err, services.ErrStaffNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy thông tin nhân viên")
		return
	}

	utils.Success(c, http.StatusOK, "Thành công", staff)
}

// Create - POST /api/v1/admin/staff
func (h *StaffHandler) Create(c *gin.Context) {
	var req dto.CreateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	staff, err := h.Service.CreateStaff(req, actorID, ip, ua)
	if err != nil {
		if errors.Is(err, services.ErrRoleNotFound) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Tạo nhân viên thành công", staff)
}

// Update - PUT /api/v1/admin/staff/:id
func (h *StaffHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID nhân viên không hợp lệ")
		return
	}

	var req dto.UpdateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	staff, err := h.Service.UpdateStaff(id, req, actorID, ip, ua)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrCannotSelfDemote),
			errors.Is(err, services.ErrCannotDeleteLastAdmin),
			errors.Is(err, services.ErrRoleNotFound):
			utils.Fail(c, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrStaffNotFound):
			utils.Fail(c, http.StatusNotFound, err.Error())
		default:
			utils.Fail(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.Success(c, http.StatusOK, "Cập nhật nhân viên thành công", staff)
}

// ChangeStatus - PATCH /api/v1/admin/staff/:id/status
func (h *StaffHandler) ChangeStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID nhân viên không hợp lệ")
		return
	}

	var req dto.ChangeStaffStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.Service.ChangeStaffStatus(id, req.Status, actorID, ip, ua); err != nil {
		switch {
		case errors.Is(err, services.ErrCannotSelfLock),
			errors.Is(err, services.ErrCannotDeleteLastAdmin):
			utils.Fail(c, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrStaffNotFound):
			utils.Fail(c, http.StatusNotFound, err.Error())
		default:
			utils.Fail(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	msg := "Khóa tài khoản nhân viên thành công"
	if req.Status == "active" {
		msg = "Mở khóa tài khoản nhân viên thành công"
	}
	utils.Success(c, http.StatusOK, msg, nil)
}

// ResetPassword - POST /api/v1/admin/staff/:id/reset-password
func (h *StaffHandler) ResetPassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID nhân viên không hợp lệ")
		return
	}

	var req dto.ResetStaffPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.Service.ResetStaffPassword(id, req.NewPassword, actorID, ip, ua); err != nil {
		if errors.Is(err, services.ErrStaffNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đặt lại mật khẩu nhân viên thành công", nil)
}

// Delete - DELETE /api/v1/admin/staff/:id
func (h *StaffHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID nhân viên không hợp lệ")
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.Service.DeleteStaff(id, actorID, ip, ua); err != nil {
		switch {
		case errors.Is(err, services.ErrCannotSelfDelete),
			errors.Is(err, services.ErrCannotDeleteLastAdmin):
			utils.Fail(c, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrStaffNotFound):
			utils.Fail(c, http.StatusNotFound, err.Error())
		default:
			utils.Fail(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.Success(c, http.StatusOK, "Xóa nhân viên thành công", nil)
}
