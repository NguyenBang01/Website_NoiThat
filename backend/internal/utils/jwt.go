package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims là dữ liệu được lưu bên trong token
type Claims struct {
	UserID uint64 `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken tạo token đăng nhập
func GenerateToken(userID uint64, role, secret string, expireHours int) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expireHours) * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseToken kiểm tra token và trả về dữ liệu bên trong
func ParseToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("thuật toán ký token không hợp lệ")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("token không hợp lệ")
	}
	return claims, nil
}

// ParseTokenAllowExpired giải mã và xác thực chữ ký token ngay cả khi token vừa hết hạn (dùng cho Refresh Token)
func ParseTokenAllowExpired(tokenString, secret string) (*Claims, error) {
	var claims Claims
	token, err := jwt.ParseWithClaims(tokenString, &claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("thuật toán ký token không hợp lệ")
		}
		return []byte(secret), nil
	})
	if err != nil && !errors.Is(err, jwt.ErrTokenExpired) {
		return nil, err
	}
	if token == nil {
		return nil, errors.New("token không hợp lệ")
	}
	// Không cho phép làm mới token đã hết hạn quá 30 ngày (buộc đăng nhập lại hoàn toàn)
	if claims.ExpiresAt != nil && time.Since(claims.ExpiresAt.Time) > 30*24*time.Hour {
		return nil, errors.New("phiên làm việc đã hết hạn quá lâu (trên 30 ngày), vui lòng đăng nhập lại")
	}
	return &claims, nil
}
