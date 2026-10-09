package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AccountHandler struct {
	Service *services.AccountService
}

func NewAccountHandler(s *services.AccountService) *AccountHandler {
	return &AccountHandler{Service: s}
}

func (h *AccountHandler) GetProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	user, err := h.Service.GetProfile(userID)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Không tìm thấy người dùng")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", user)
}

func (h *AccountHandler) UpdateProfile(c *gin.Context) {
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	userID := c.MustGet("user_id").(uint64)
	if err := h.Service.UpdateProfile(userID, req); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi cập nhật hồ sơ")
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật hồ sơ thành công", nil)
}

func (h *AccountHandler) ChangePassword(c *gin.Context) {
	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	userID := c.MustGet("user_id").(uint64)
	if err := h.Service.ChangePassword(userID, req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(c, http.StatusOK, "Đổi mật khẩu thành công", nil)
}

func (h *AccountHandler) RefreshToken(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	role := c.MustGet("role").(string)

	token, err := h.Service.RefreshToken(userID, role)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi tạo token mới")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", gin.H{"token": token})
}

func (h *AccountHandler) Logout(c *gin.Context) {
	if err := h.Service.Logout(); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi đăng xuất")
		return
	}
	utils.Success(c, http.StatusOK, "Đăng xuất thành công", nil)
}

func (h *AccountHandler) ListAddresses(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	addresses, err := h.Service.ListAddresses(userID)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách địa chỉ")
		return
	}
	utils.Success(c, http.StatusOK, "Thành công", addresses)
}

func (h *AccountHandler) CreateAddress(c *gin.Context) {
	var req dto.AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	userID := c.MustGet("user_id").(uint64)
	address, err := h.Service.CreateAddress(userID, req)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi thêm địa chỉ")
		return
	}
	utils.Success(c, http.StatusCreated, "Thêm địa chỉ thành công", address)
}

func (h *AccountHandler) UpdateAddress(c *gin.Context) {
	addressIDStr := c.Param("id")
	addressID, err := strconv.ParseUint(addressIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	var req dto.AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	userID := c.MustGet("user_id").(uint64)
	if err := h.Service.UpdateAddress(userID, addressID, req); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi cập nhật địa chỉ")
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật địa chỉ thành công", nil)
}

func (h *AccountHandler) DeleteAddress(c *gin.Context) {
	addressIDStr := c.Param("id")
	addressID, err := strconv.ParseUint(addressIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	userID := c.MustGet("user_id").(uint64)
	if err := h.Service.DeleteAddress(userID, addressID); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi xóa địa chỉ")
		return
	}
	utils.Success(c, http.StatusOK, "Xóa địa chỉ thành công", nil)
}

func (h *AccountHandler) SetDefaultAddress(c *gin.Context) {
	addressIDStr := c.Param("id")
	addressID, err := strconv.ParseUint(addressIDStr, 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	userID := c.MustGet("user_id").(uint64)
	if err := h.Service.SetDefaultAddress(userID, addressID); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi thiết lập địa chỉ mặc định")
		return
	}
	utils.Success(c, http.StatusOK, "Thiết lập địa chỉ mặc định thành công", nil)
}
