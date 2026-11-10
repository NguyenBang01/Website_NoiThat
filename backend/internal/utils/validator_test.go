package utils

import (
	"testing"
)

func TestNormalizeAndValidateVNPhone(t *testing.T) {
	validCases := []struct {
		input    string
		expected string
	}{
		{"0912345678", "0912345678"},
		{"+84912345678", "0912345678"},
		{"84912345678", "0912345678"},
		{"038 123 4567", "0381234567"},
		{"079-123-4567", "0791234567"},
		{"(84) 086 123 4567", "0861234567"},
	}

	for _, tc := range validCases {
		res, err := NormalizeAndValidateVNPhone(tc.input)
		if err != nil {
			t.Errorf("Mong đợi hợp lệ cho %s nhưng nhận lỗi: %v", tc.input, err)
		}
		if res != tc.expected {
			t.Errorf("Mong đợi kết quả %s cho %s nhưng nhận %s", tc.expected, tc.input, res)
		}
	}

	invalidCases := []string{
		"",
		"123456",
		"0123456789", // Đầu 01 không còn là đầu số di động 10 số hợp lệ
		"0012345678",
		"091234567",   // 9 số
		"09123456789", // 11 số
		"abcdefghij",
	}

	for _, input := range invalidCases {
		_, err := NormalizeAndValidateVNPhone(input)
		if err == nil {
			t.Errorf("Mong đợi lỗi cho SĐT không hợp lệ %s nhưng không có lỗi", input)
		}
	}
}

func TestValidateFullName(t *testing.T) {
	validNames := []string{
		"Nguyễn Văn A",
		"Trần Thị Mỹ Duyên",
		"Lê Hoàng",
		"Đỗ Nam",
	}
	for _, n := range validNames {
		formatted, err := ValidateFullName(n)
		if err != nil {
			t.Errorf("Mong đợi tên hợp lệ: %s, lỗi: %v", n, err)
		}
		if len(formatted) == 0 {
			t.Errorf("Kết quả định dạng rỗng cho: %s", n)
		}
	}

	invalidNames := []string{
		"",
		"   ",
		"Nguyễn",     // Chỉ 1 từ
		"Nguyen123",  // Chứa số
		"A @ B",      // Chứa ký tự đặc biệt
	}
	for _, n := range invalidNames {
		_, err := ValidateFullName(n)
		if err == nil {
			t.Errorf("Mong đợi lỗi cho tên không hợp lệ: %s", n)
		}
	}
}

func TestValidateAddress(t *testing.T) {
	validAddresses := []string{
		"123 Đường Nguyễn Huệ, Phường Bến Nghé",
		"Số 45/12 ngõ 99 Định Công Hạ",
	}
	for _, a := range validAddresses {
		res, err := ValidateAddress(a)
		if err != nil || len(res) == 0 {
			t.Errorf("Mong đợi địa chỉ hợp lệ: %s, lỗi: %v", a, err)
		}
	}

	invalidAddresses := []string{
		"",
		"   ",
		"abc", // Quá ngắn (< 5 ký tự)
	}
	for _, a := range invalidAddresses {
		_, err := ValidateAddress(a)
		if err == nil {
			t.Errorf("Mong đợi lỗi cho địa chỉ không hợp lệ: %s", a)
		}
	}
}

