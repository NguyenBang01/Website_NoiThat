package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	ErrFileTooLarge    = errors.New("file quá lớn (tối đa cho phép)")
	ErrInvalidFileType = errors.New("chỉ chấp nhận ảnh (JPG, PNG, WEBP, GIF) hoặc video (MP4, WEBM)")
)

// Các loại file được phép và đuôi file tương ứng
var allowedImageTypes = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/webp":      ".webp",
	"image/gif":       ".gif",
	"video/mp4":       ".mp4",
	"video/webm":      ".webm",
	"video/ogg":       ".ogg",
	"video/quicktime": ".mov",
}

// UploadService lưu ảnh upload vào thư mục trên ổ đĩa
type UploadService struct {
	UploadDir    string
	MaxSizeBytes int64
}

// UploadResult là thông tin trả về sau khi upload thành công
type UploadResult struct {
	URL         string `json:"url"`
	FileName    string `json:"file_name"`
	Size        int64  `json:"size"`
	ContentType string `json:"content_type"`
}

// SaveImage kiểm tra rồi lưu một file ảnh.
// - Kiểm tra dung lượng
// - Kiểm tra loại file bằng NỘI DUNG thật (không tin vào tên file hay đuôi file)
// - Đổi tên ngẫu nhiên để tránh trùng và tránh tên độc hại
func (s *UploadService) SaveImage(fh *multipart.FileHeader) (*UploadResult, error) {
	if fh.Size > s.MaxSizeBytes {
		return nil, ErrFileTooLarge
	}

	src, err := fh.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Đọc 512 byte đầu để nhận diện loại file
	head := make([]byte, 512)
	n, err := src.Read(head)
	if err != nil && err != io.EOF {
		return nil, err
	}
	contentType := http.DetectContentType(head[:n])
	ext, ok := allowedImageTypes[contentType]
	if !ok {
		// Kiểm tra thêm theo phần mở rộng của file nếu contentType là generic (như application/octet-stream)
		lowerExt := strings.ToLower(filepath.Ext(fh.Filename))
		switch lowerExt {
		case ".mp4":
			ext = ".mp4"
			contentType = "video/mp4"
			ok = true
		case ".webm":
			ext = ".webm"
			contentType = "video/webm"
			ok = true
		case ".mov":
			ext = ".mov"
			contentType = "video/quicktime"
			ok = true
		case ".ogg", ".ogv":
			ext = ".ogg"
			contentType = "video/ogg"
			ok = true
		}
	}
	if !ok {
		return nil, ErrInvalidFileType
	}

	// Quay lại đầu file để ghi đầy đủ
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}

	// Lưu vào thư mục theo năm/tháng, ví dụ uploads/2026/10/
	now := time.Now()
	year := now.Format("2006")
	month := now.Format("01")
	dir := filepath.Join(s.UploadDir, year, month)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}

	randomPart, err := randomHex(16)
	if err != nil {
		return nil, err
	}
	fileName := randomPart + ext

	dst, err := os.Create(filepath.Join(dir, fileName))
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	return &UploadResult{
		URL:         "/uploads/" + year + "/" + month + "/" + fileName,
		FileName:    fileName,
		Size:        fh.Size,
		ContentType: contentType,
	}, nil
}

func randomHex(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
