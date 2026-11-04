package dto

type AuditLogQuery struct {
	Page      int    `form:"page,default=1"`
	Limit     int    `form:"limit,default=20"`
	Action    string `form:"action"`
	UserID    uint64 `form:"user_id"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}
