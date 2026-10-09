package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetPagination đọc ?page=1&limit=20 từ đường dẫn.
// Mặc định page=1, limit=20; limit tối đa 100.
func GetPagination(c *gin.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

// BuildMeta tạo thông tin phân trang để trả về cho client
func BuildMeta(page, limit int, total int64) gin.H {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return gin.H{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
	}
}
