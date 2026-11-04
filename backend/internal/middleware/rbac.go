package middleware

import (
	"errors"
	"net/http"

	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// RequirePermission yêu cầu người dùng phải có quyền cụ thể (ví dụ: "product.create")
func RequirePermission(rbac *services.RBACService, permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			utils.Fail(c, http.StatusUnauthorized, "Yêu cầu đăng nhập")
			c.Abort()
			return
		}

		userID, ok := userIDVal.(uint64)
		if !ok {
			utils.Fail(c, http.StatusUnauthorized, "Phiên đăng nhập không hợp lệ")
			c.Abort()
			return
		}

		allowed, err := rbac.CheckUserPermission(userID, permission)
		if err != nil {
			if errors.Is(err, services.ErrAccountBlocked) {
				utils.Fail(c, http.StatusForbidden, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.")
				c.Abort()
				return
			}
			utils.Fail(c, http.StatusInternalServerError, "Lỗi kiểm tra quyền truy cập")
			c.Abort()
			return
		}

		if !allowed {
			utils.Fail(c, http.StatusForbidden, "Bạn không có quyền thực hiện thao tác này ("+permission+")")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission cho phép người dùng nếu sở hữu ít nhất một trong các quyền truyền vào
func RequireAnyPermission(rbac *services.RBACService, permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			utils.Fail(c, http.StatusUnauthorized, "Yêu cầu đăng nhập")
			c.Abort()
			return
		}

		userID, ok := userIDVal.(uint64)
		if !ok {
			utils.Fail(c, http.StatusUnauthorized, "Phiên đăng nhập không hợp lệ")
			c.Abort()
			return
		}

		allowed, err := rbac.CheckUserAnyPermission(userID, permissions...)
		if err != nil {
			if errors.Is(err, services.ErrAccountBlocked) {
				utils.Fail(c, http.StatusForbidden, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.")
				c.Abort()
				return
			}
			utils.Fail(c, http.StatusInternalServerError, "Lỗi kiểm tra quyền truy cập")
			c.Abort()
			return
		}

		if !allowed {
			utils.Fail(c, http.StatusForbidden, "Bạn không có quyền thực hiện thao tác này")
			c.Abort()
			return
		}

		c.Next()
	}
}
