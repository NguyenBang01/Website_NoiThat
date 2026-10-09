package dto

// CategoryRequest là dữ liệu admin gửi lên khi thêm / sửa danh mục
type CategoryRequest struct {
	Name      string  `json:"name" binding:"required,min=1,max=150"`
	Slug      string  `json:"slug" binding:"omitempty,max=190"` // để trống thì tự tạo từ tên
	ParentID  *uint64 `json:"parent_id"`                        // để trống = danh mục gốc
	Image     string  `json:"image" binding:"omitempty,max=255"`
	SortOrder int     `json:"sort_order"`
	IsActive  *bool   `json:"is_active"` // để trống: thêm mới = true, sửa = giữ nguyên
}
