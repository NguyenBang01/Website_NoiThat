package models

import "time"

type Review struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	UserID    uint64    `gorm:"uniqueIndex:idx_user_product" json:"user_id"`
	ProductID uint64    `gorm:"uniqueIndex:idx_user_product" json:"product_id"`
	Rating    int       `json:"rating"`
	Comment   *string   `json:"comment"`
	Status    string    `gorm:"type:varchar(20);default:'pending'" json:"status"`
	AdminNote *string   `json:"admin_note"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User    *User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

func (Review) TableName() string {
	return "reviews"
}
