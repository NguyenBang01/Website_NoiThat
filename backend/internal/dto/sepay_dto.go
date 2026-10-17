package dto

// SepayWebhookPayload cấu trúc dữ liệu SePay gửi tới Webhook
type SepayWebhookPayload struct {
	ID              int64   `json:"id"`
	Gateway         string  `json:"gateway"`
	TransactionDate string  `json:"transactionDate"`
	AccountNumber   string  `json:"accountNumber"`
	Code            *string `json:"code"`
	Content         string  `json:"content"`
	TransferType    string  `json:"transferType"`
	TransferAmount  int64   `json:"transferAmount"`
	Accumulated     int64   `json:"accumulated"`
	SubAccount      *string `json:"subAccount"`
	ReferenceCode   *string `json:"referenceCode"`
	Description     *string `json:"description"`
}

// PaymentCheckResponse trả về trạng thái thanh toán của đơn hàng cho frontend
type PaymentCheckResponse struct {
	OrderCode   string `json:"order_code"`
	Status      string `json:"status"`
	IsPaid      bool   `json:"is_paid"`
	TotalAmount int64  `json:"total_amount"`
	PaidAmount  int64  `json:"paid_amount"`
}
