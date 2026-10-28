package handlers

import (
	"errors"
	"log"
	"net/http"

	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	Service *services.UploadService
}

// Upload - POST /api/v1/admin/uploads
// Gửi dạng multipart/form-data, trường tên "file"
func (h *UploadHandler) Upload(c *gin.Context) {
	// Giới hạn tổng dung lượng request (dư thêm 1MB cho phần đầu form)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.Service.MaxSizeBytes+(1<<20))

	fh, err := c.FormFile("file")
	if err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			utils.Fail(c, http.StatusRequestEntityTooLarge, services.ErrFileTooLarge.Error())
			return
		}
		utils.Fail(c, http.StatusBadRequest, "Vui lòng chọn file tải lên (ảnh hoặc video)")
		return
	}

	result, err := h.Service.SaveImage(fh)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrFileTooLarge):
			utils.Fail(c, http.StatusRequestEntityTooLarge, err.Error())
		case errors.Is(err, services.ErrInvalidFileType):
			utils.Fail(c, http.StatusUnsupportedMediaType, err.Error())
		default:
			log.Println("Lỗi upload ảnh:", err)
			utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
		}
		return
	}

	utils.Success(c, http.StatusCreated, "Upload ảnh thành công", result)
}
