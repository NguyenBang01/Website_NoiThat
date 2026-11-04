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

type RoleHandler struct {
	Service *services.RoleService
}

func NewRoleHandler(service *services.RoleService) *RoleHandler {
	return &RoleHandler{Service: service}
}

// List - GET /api/v1/admin/roles
func (h *RoleHandler) List(c *gin.Context) {
	roles, err := h.Service.ListRoles()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách vai trò")
		return
	}

	utils.Success(c, http.StatusOK, "Thành công", roles)
}

// Get - GET /api/v1/admin/roles/:id
func (h *RoleHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID vai trò không hợp lệ")
		return
	}

	role, err := h.Service.GetRole(id)
	if err != nil {
		if errors.Is(err, services.ErrRoleNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy thông tin vai trò")
		return
	}

	utils.Success(c, http.StatusOK, "Thành công", role)
}

// Create - POST /api/v1/admin/roles
func (h *RoleHandler) Create(c *gin.Context) {
	var req dto.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	role, err := h.Service.CreateRole(req, actorID, ip, ua)
	if err != nil {
		if errors.Is(err, services.ErrRoleNameExists) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Tạo vai trò thành công", role)
}

// Update - PUT /api/v1/admin/roles/:id
func (h *RoleHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID vai trò không hợp lệ")
		return
	}

	var req dto.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	role, err := h.Service.UpdateRole(id, req, actorID, ip, ua)
	if err != nil {
		if errors.Is(err, services.ErrRoleNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Cập nhật vai trò thành công", role)
}

// Delete - DELETE /api/v1/admin/roles/:id
func (h *RoleHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID vai trò không hợp lệ")
		return
	}

	actorID := c.MustGet("user_id").(uint64)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	if err := h.Service.DeleteRole(id, actorID, ip, ua); err != nil {
		switch {
		case errors.Is(err, services.ErrCannotDeleteSystem),
			errors.Is(err, services.ErrRoleHasActiveUsers):
			utils.Fail(c, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrRoleNotFound):
			utils.Fail(c, http.StatusNotFound, err.Error())
		default:
			utils.Fail(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.Success(c, http.StatusOK, "Xóa vai trò thành công", nil)
}

// ListPermissions - GET /api/v1/admin/permissions
func (h *RoleHandler) ListPermissions(c *gin.Context) {
	grouped, err := h.Service.ListPermissionsGrouped()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách quyền hạn")
		return
	}

	utils.Success(c, http.StatusOK, "Thành công", grouped)
}
