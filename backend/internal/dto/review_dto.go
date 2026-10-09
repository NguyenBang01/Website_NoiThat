package dto

import "time"

type CreateReviewRequest struct {
	ProductID uint64  `json:"product_id" binding:"required"`
	Rating    int     `json:"rating" binding:"required,min=1,max=5"`
	Comment   *string `json:"comment" binding:"omitempty,max=1000"`
}

type AdminReviewActionRequest struct {
	Status    string  `json:"status" binding:"required,oneof=approved rejected"`
	AdminNote *string `json:"admin_note" binding:"omitempty,max=500"`
}

type ReviewResponse struct {
	ID        uint64    `json:"id"`
	User      UserBasic `json:"user"`
	Rating    int       `json:"rating"`
	Comment   *string   `json:"comment"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type UserBasic struct {
	Name string `json:"name"`
}

type PublicReviewResponse struct {
	ID        uint64    `json:"id"`
	UserName  string    `json:"user_name"`
	Rating    int       `json:"rating"`
	Comment   *string   `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}
