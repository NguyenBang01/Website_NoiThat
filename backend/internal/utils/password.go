package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword mã hóa mật khẩu bằng bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword so sánh mật khẩu người dùng nhập với bản đã mã hóa
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
