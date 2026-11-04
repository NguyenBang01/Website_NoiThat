package models

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	ID        uint64         `gorm:"primaryKey" json:"id"`
	UserID    uint64         `gorm:"uniqueIndex:idx_user_product" json:"user_id"`
	ProductID uint64         `gorm:"uniqueIndex:idx_user_product" json:"product_id"`
	Rating    int            `json:"rating"`
	Comment   *string        `json:"comment"`
	Status    string         `gorm:"type:varchar(20);default:'pending'" json:"status"`
	AdminNote *string        `json:"admin_note"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	DeletedBy *uint64        `gorm:"index" json:"deleted_by,omitempty"`

	User          *User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Product       *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	DeletedByUser *User    `gorm:"foreignKey:DeletedBy" json:"deleted_by_user,omitempty"`
}

func (Review) TableName() string {
	return "reviews"
}
