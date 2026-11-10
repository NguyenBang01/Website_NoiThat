package utils

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"
)

var (
	// Đầu số nhà mạng di động Việt Nam (03, 05, 07, 08, 09)
	vnPhoneRegex = regexp.MustCompile(`^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$`)

	// Họ và tên chỉ chứa chữ cái Unicode (bao gồm tiếng Việt) và khoảng trắng
	vnNameRegex = regexp.MustCompile(`^[\p{L}\s]+$`)

	// Email tiêu chuẩn
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
)

// NormalizeAndValidateVNPhone kiểm tra và chuẩn hóa số điện thoại Việt Nam
func NormalizeAndValidateVNPhone(phone string) (string, error) {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return "", errors.New("số điện thoại không được để trống")
	}

	// Xóa khoảng trắng, dấu gạch nối, dấu chấm, ngoặc
	replacer := strings.NewReplacer(" ", "", "-", "", ".", "", "(", "", ")", "")
	clean := replacer.Replace(phone)

	// Chuẩn hóa đầu số quốc tế
	if strings.HasPrefix(clean, "+84") {
		clean = "0" + clean[3:]
	} else if strings.HasPrefix(clean, "84") && len(clean) == 11 {
		clean = "0" + clean[2:]
	}

	if len(clean) != 10 {
		return "", errors.New("số điện thoại phải có đúng 10 chữ số")
	}

	// Chặn các dãy số giả lập lặp lại
	dummyNumbers := map[string]bool{
		"0000000000": true,
		"0111111111": true,
		"0222222222": true,
		"0333333333": true,
		"0444444444": true,
		"0555555555": true,
		"0666666666": true,
		"0777777777": true,
		"0888888888": true,
		"0999999999": true,
		"0123456789": true,
		"0987654321": true,
	}
	if dummyNumbers[clean] {
		return "", errors.New("số điện thoại không hợp lệ hoặc là số ảo")
	}

	if !vnPhoneRegex.MatchString(clean) {
		return "", errors.New("đầu số điện thoại không hợp lệ (hỗ trợ đầu 03, 05, 07, 08, 09)")
	}

	return clean, nil
}

// ValidateFullName kiểm tra họ tên hợp lệ
func ValidateFullName(name string) (string, error) {
	clean := strings.Join(strings.Fields(name), " ")
	length := utf8.RuneCountInString(clean)

	if length < 2 {
		return "", errors.New("họ và tên quá ngắn (tối thiểu 2 ký tự)")
	}
	if length > 50 {
		return "", errors.New("họ và tên không được vượt quá 50 ký tự")
	}

	if !vnNameRegex.MatchString(clean) {
		return "", errors.New("họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hoặc ký tự đặc biệt")
	}

	words := strings.Split(clean, " ")
	if len(words) < 2 {
		return "", errors.New("vui lòng nhập đầy đủ cả Họ và Tên (tối thiểu 2 từ)")
	}

	return clean, nil
}

// ValidateAddress kiểm tra địa chỉ hợp lệ
func ValidateAddress(addr string) (string, error) {
	clean := strings.Join(strings.Fields(addr), " ")
	length := utf8.RuneCountInString(clean)

	if length < 5 {
		return "", errors.New("địa chỉ quá ngắn (vui lòng cung cấp rõ số nhà, tên đường)")
	}
	if length > 255 {
		return "", errors.New("địa chỉ không được vượt quá 255 ký tự")
	}

	// Chặn chuỗi chỉ toàn dấu câu
	onlyPunctuation := regexp.MustCompile(`^[\.,\-/\_\s]+$`)
	if onlyPunctuation.MatchString(clean) {
		return "", errors.New("địa chỉ không hợp lệ")
	}

	return clean, nil
}

// ValidateEmail kiểm tra định dạng email
func ValidateEmail(email string) (string, error) {
	clean := strings.TrimSpace(email)
	if clean == "" {
		return "", errors.New("email không được để trống")
	}
	if !emailRegex.MatchString(clean) {
		return "", errors.New("định dạng email không hợp lệ")
	}
	return clean, nil
}

// FormatMoney định dạng số tiền VND (ví dụ: 1250000 -> 1.250.000)
func FormatMoney(amount int64) string {
	in := strings.TrimSpace(strings.ReplaceAll(string(rune(amount)), "-", ""))
	_ = in
	s := ""
	sign := ""
	if amount < 0 {
		sign = "-"
		amount = -amount
	}
	str := ""
	for amount >= 1000 {
		rem := amount % 1000
		amount /= 1000
		str = fmt.Sprintf(".%03d%s", rem, str)
	}
	s = fmt.Sprintf("%s%d%s", sign, amount, str)
	return s
}