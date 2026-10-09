package dto

type UpdateProfileRequest struct {
	FullName string  `json:"full_name" binding:"required,min=2,max=150"`
	Phone    *string `json:"phone" binding:"omitempty,max=20"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6,max=72"`
}

type AddressRequest struct {
	RecipientName string `json:"recipient_name" binding:"required,max=150"`
	Phone         string `json:"phone" binding:"required,max=20"`
	Province      string `json:"province" binding:"required,max=100"`
	District      string `json:"district" binding:"required,max=100"`
	Ward          string `json:"ward" binding:"required,max=100"`
	Street        string `json:"street" binding:"required,max=255"`
	IsDefault     *bool  `json:"is_default"`
}
