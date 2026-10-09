package middleware

import (
	"net/http"
	"strings"

	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// AuthRequired bắt buộc request phải có token hợp lệ trong header:
//   Authorization: Bearer <token>
func AuthRequired(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			utils.Fail(c, http.StatusUnauthorized, "Thiếu token đăng nhập")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		claims, err := utils.ParseToken(tokenString, secret)
		if err != nil {
			utils.Fail(c, http.StatusUnauthorized, "Token không hợp lệ hoặc đã hết hạn")
			c.Abort()
			return
		}

		// Lưu thông tin người dùng để các handler phía sau dùng
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// RoleRequired chỉ cho phép các vai trò được liệt kê đi tiếp (ví dụ: "admin")
func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		for _, r := range roles {
			if r == role {
				c.Next()
				return
			}
		}
		utils.Fail(c, http.StatusForbidden, "Bạn không có quyền truy cập")
		c.Abort()
	}
}
