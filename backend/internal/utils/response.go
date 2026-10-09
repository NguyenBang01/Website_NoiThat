package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Success trả về JSON thành công theo định dạng chung của dự án
func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

// SuccessWithMeta giống Success nhưng kèm thông tin phân trang
func SuccessWithMeta(c *gin.Context, status int, message string, data interface{}, meta interface{}) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
		"meta":    meta,
	})
}

// Fail trả về JSON lỗi theo định dạng chung của dự án
func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
	})
}

// ValidationFail trả về lỗi khi dữ liệu gửi lên không hợp lệ (HTTP 422)
func ValidationFail(c *gin.Context, err error) {
	c.JSON(http.StatusUnprocessableEntity, gin.H{
		"success": false,
		"message": "Dữ liệu gửi lên không hợp lệ",
		"detail":  err.Error(),
	})
}
