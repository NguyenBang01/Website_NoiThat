package middleware

import (
	"net/http"
	"strings"

	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

// RequireActiveUser kiểm tra tức thì trạng thái tài khoản trong Database
// Nếu tài khoản bị Admin khóa ('blocked' hoặc 'locked' hoặc không phải 'active')
// sẽ lập tức từ chối với mã lỗi ACCOUNT_LOCKED (HTTP 403)
func RequireActiveUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.Next()
			return
		}

		userID, ok := userIDVal.(uint64)
		if !ok {
			c.Next()
			return
		}

		var status string
		if err := db.Model(&models.User{}).Select("status").Where("id = ?", userID).Scan(&status).Error; err != nil {
			utils.Fail(c, http.StatusUnauthorized, "Không tìm thấy thông tin tài khoản")
			c.Abort()
			return
		}

		if status != "active" {
			utils.FailWithCode(c, http.StatusForbidden, "ACCOUNT_LOCKED", "Tài khoản của bạn đã bị khóa bởi quản trị viên.")
			c.Abort()
			return
		}

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

// StaffRequired chỉ cho phép người dùng nội bộ (không phải customer)
func StaffRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role == "" || role == "customer" {
			utils.Fail(c, http.StatusForbidden, "Yêu cầu quyền quản trị viên nội bộ")
			c.Abort()
			return
		}
		c.Next()
	}
}
