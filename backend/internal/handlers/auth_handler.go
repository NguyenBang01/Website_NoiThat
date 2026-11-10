package handlers

import (
	"errors"
	"log"
	"net/http"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Service     *services.AuthService
	RBACService *services.RBACService
}

// Register - POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	clientIP := c.ClientIP()
	userAgent := c.Request.UserAgent()
	res, err := h.Service.Register(req, clientIP, userAgent)
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

	clientIP := c.ClientIP()
	userAgent := c.Request.UserAgent()
	res, err := h.Service.Login(req, clientIP, userAgent)
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

// GoogleLogin - POST /api/v1/auth/google (Xác thực đăng nhập / đăng ký bằng Google)
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	var req dto.GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	token := req.IDToken
	if token == "" {
		token = req.AccessToken
	}
	if token == "" {
		token = req.Token
	}
	if token == "" {
		utils.Fail(c, http.StatusBadRequest, "Mã xác thực Google (id_token hoặc access_token) không được để trống")
		return
	}

	clientIP := c.ClientIP()
	userAgent := c.Request.UserAgent()
	res, err := h.Service.GoogleAuth(token, clientIP, userAgent)
	if err != nil {
		if errors.Is(err, services.ErrAccountBlocked) {
			utils.Fail(c, http.StatusForbidden, err.Error())
			return
		}
		log.Println("Lỗi đăng nhập Google:", err)
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đăng nhập Google thành công", res)
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

	if user.Status != "active" {
		utils.FailWithCode(c, http.StatusForbidden, "ACCOUNT_LOCKED", "Tài khoản của bạn đã bị khóa bởi quản trị viên.")
		return
	}

	var perms []string
	var roleDetail *models.Role
	if h.RBACService != nil {
		perms, roleDetail, _ = h.RBACService.GetUserEffectivePermissions(userID)
	}

	utils.Success(c, http.StatusOK, "OK", gin.H{
		"id":           user.ID,
		"full_name":    user.FullName,
		"email":        user.Email,
		"phone":        user.Phone,
		"role":         user.Role,
		"role_id":      user.RoleID,
		"role_detail":  roleDetail,
		"status":       user.Status,
		"last_login_at": user.LastLoginAt,
		"permissions":  perms,
		"created_at":   user.CreatedAt,
		"updated_at":   user.UpdatedAt,
	})
}

// AdminMe - GET /api/v1/admin/me (trả thông tin + danh sách permission)
func (h *AuthHandler) AdminMe(c *gin.Context) {
	h.Me(c)
}

// ForgotPassword - POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.Service.ForgotPassword(req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả mục Spam).", nil)
}

// ResetPassword - POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.Service.ResetPassword(req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.", nil)
}
