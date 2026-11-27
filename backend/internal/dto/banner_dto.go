package dto

type BannerRequest struct {
	Title     string  `json:"title" binding:"required,max=255"`
	Subtitle  *string `json:"subtitle" binding:"omitempty,max=500"`
	Image     string  `json:"image" binding:"required,max=500"`
	MediaType string  `json:"media_type" binding:"omitempty,max=20"`
	Position  string  `json:"position" binding:"omitempty,max=50"`
	Link      *string `json:"link" binding:"omitempty,max=255"`
	SortOrder int     `json:"sort_order"`
	IsActive  bool    `json:"is_active"`
}
