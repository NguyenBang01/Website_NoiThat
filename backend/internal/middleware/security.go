package middleware

import (
	"net/http"
	"sync"
	"time"

	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// CORS cho phép client từ browser hoặc frontend gửi request tới backend
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// clientLoginTracker lưu số lần đăng nhập sai theo IP
type clientLoginTracker struct {
	attempts int
	lockTime time.Time
}

var (
	loginAttempts = make(map[string]*clientLoginTracker)
	loginMu       sync.Mutex
)

// LoginRateLimiter giới hạn số lần thử đăng nhập sai liên tiếp
// maxAttempts: số lần tối đa, lockDuration: thời gian khóa tạm thời
func LoginRateLimiter(maxAttempts int, lockDuration time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		loginMu.Lock()
		tracker, exists := loginAttempts[ip]
		if exists {
			if time.Now().Before(tracker.lockTime) {
				loginMu.Unlock()
				remaining := int(time.Until(tracker.lockTime).Seconds())
				utils.Fail(c, http.StatusTooManyRequests, "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau "+string(rune(remaining))+" giây.")
				c.Abort()
				return
			}
			// Đã qua thời gian lock -> reset
			if !tracker.lockTime.IsZero() && time.Now().After(tracker.lockTime) {
				tracker.attempts = 0
				tracker.lockTime = time.Time{}
			}
		}
		loginMu.Unlock()

		c.Next()

		// Sau khi xử lý request: nếu HTTP 401 (sai mật khẩu) thì tăng bộ đếm
		if c.Writer.Status() == http.StatusUnauthorized {
			loginMu.Lock()
			tracker, exists := loginAttempts[ip]
			if !exists {
				tracker = &clientLoginTracker{}
				loginAttempts[ip] = tracker
			}
			tracker.attempts++
			if tracker.attempts >= maxAttempts {
				tracker.lockTime = time.Now().Add(lockDuration)
			}
			loginMu.Unlock()
		} else if c.Writer.Status() == http.StatusOK {
			// Đăng nhập thành công -> xóa theo dõi
			loginMu.Lock()
			delete(loginAttempts, ip)
			loginMu.Unlock()
		}
	}
}
