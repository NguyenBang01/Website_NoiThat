package models

import "time"

// SepayTransaction lưu lại thông tin giao dịch nhận được từ SePay Webhook
type SepayTransaction struct {
	ID              uint64    `gorm:"primaryKey" json:"id"`
	SepayID         int64     `gorm:"uniqueIndex;column:sepay_id" json:"sepay_id"` // ID giao dịch trên sepay.vn
	Gateway         string    `gorm:"type:varchar(50)" json:"gateway"`             // MBBank
	TransactionDate string    `gorm:"type:varchar(50)" json:"transaction_date"`    // Thời gian giao dịch phía ngân hàng
	AccountNumber   string    `gorm:"type:varchar(50)" json:"account_number"`      // Số tài khoản (0931883988)
	SubAccount      *string   `gorm:"type:varchar(50)" json:"sub_account"`
	TransferType    string    `gorm:"type:varchar(20)" json:"transfer_type"`       // in (tiền vào) hoặc out (tiền ra)
	TransferAmount  int64     `json:"transfer_amount"`                             // Số tiền giao dịch
	Accumulated     int64     `json:"accumulated"`                                 // Số dư lũy kế
	Code            *string   `gorm:"type:varchar(50)" json:"code"`
	Content         string    `gorm:"type:text" json:"content"`                    // Nội dung chuyển khoản (chứa mã đơn hàng)
	ReferenceCode   *string   `gorm:"type:varchar(100)" json:"reference_code"`     // Mã tham chiếu ngân hàng
	Description     *string   `gorm:"type:text" json:"description"`                // Toàn bộ tin nhắn SMS / notification
	OrderID         *uint64   `gorm:"index" json:"order_id"`                       // ID đơn hàng nếu khớp thành công
	Status          string    `gorm:"type:varchar(30);default:'matched'" json:"status"` // matched, unmatched, ignored
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	Order *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}

func (SepayTransaction) TableName() string {
	return "sepay_transactions"
}
