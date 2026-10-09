package dto

type ContactRequest struct {
	FullName string  `json:"full_name" binding:"required,max=150"`
	Email    string  `json:"email" binding:"required,email,max=190"`
	Phone    *string `json:"phone" binding:"omitempty,max=20"`
	Subject  string  `json:"subject" binding:"required,max=255"`
	Message  string  `json:"message" binding:"required,max=2000"`
}
