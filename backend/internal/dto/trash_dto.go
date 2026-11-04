package dto

import "time"

// TrashItemResponse đại diện cho một bản ghi trong thùng rác
type TrashItemResponse struct {
	ID             uint64                 `json:"id"`
	Module         string                 `json:"module"`
	Title          string                 `json:"title"`
	Code           string                 `json:"code"`
	DeletedAt      time.Time              `json:"deleted_at"`
	DeletedBy      *uint64                `json:"deleted_by,omitempty"`
	DeletedByName  string                 `json:"deleted_by_name"`
	DeletedByEmail string                 `json:"deleted_by_email"`
	DaysRemaining  int                    `json:"days_remaining"`
	Extra          map[string]interface{} `json:"extra,omitempty"`
}

// RestoreBatchRequest body phục vụ khôi phục nhiều bản ghi cùng lúc
type RestoreBatchRequest struct {
	IDs []uint64 `json:"ids" binding:"required,min=1"`
}

// RestoreResponse kết quả khôi phục
type RestoreResponse struct {
	SuccessCount int      `json:"success_count"`
	FailedCount  int      `json:"failed_count"`
	Errors       []string `json:"errors,omitempty"`
}
