package dto

type SettingUpdateRequest struct {
	Settings []SettingItem `json:"settings" binding:"required,dive"`
}

type SettingItem struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value" binding:"required"`
}
