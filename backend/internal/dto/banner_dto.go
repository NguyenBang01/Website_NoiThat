package dto

type BannerRequest struct {
	Title     string  `json:"title" binding:"required,max=255"`
	Subtitle  *string `json:"subtitle" binding:"omitempty,max=255"`
	Image     string  `json:"image" binding:"required,max=255"`
	MediaType string  `json:"media_type" binding:"omitempty,max=20"`
	Link      *string `json:"link" binding:"omitempty,max=255"`
	SortOrder int     `json:"sort_order"`
	IsActive  bool    `json:"is_active"`
}
