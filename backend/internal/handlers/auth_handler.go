package handlers

import (
	"errors"
	"log"
	"net/http"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Service *services.AuthService
}

// Register - POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	res, err := h.Service.Register(req)
	if err != nil {
		if errors.Is(err, services.ErrEmailExists) {
			utils.Fail(c, http.StatusConflict, err.Error())
			return
		}
		log.Println("Lỗi đăng ký:", err)
		utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
		return
	}

	utils.Success(c, http.StatusCreated, "Đăng ký thành công", res)
}

// Login - POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	res, err := h.Service.Login(req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCredentials):
			utils.Fail(c, http.StatusUnauthorized, err.Error())
		case errors.Is(err, services.ErrAccountBlocked):
			utils.Fail(c, http.StatusForbidden, err.Error())
		default:
			log.Println("Lỗi đăng nhập:", err)
			utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
		}
		return
	}

	utils.Success(c, http.StatusOK, "Đăng nhập thành công", res)
}

// Me - GET /api/v1/auth/me (cần đăng nhập)
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)

	user, err := h.Service.GetUser(userID)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		log.Println("Lỗi lấy thông tin tài khoản:", err)
		utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
		return
	}

	utils.Success(c, http.StatusOK, "OK", user)
}
