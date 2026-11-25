package middleware

import (
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// CORS cho phép client từ browser hoặc frontend gửi request tới backend với whitelist an toàn
func CORS(customOrigins ...string) gin.HandlerFunc {
	allowedMap := map[string]bool{
		"http://localhost:4321":  true,
		"https://localhost:4321": true,
		"http://localhost:1234":  true,
		"https://localhost:1234": true,
		"http://127.0.0.1:4321":  true,
		"http://127.0.0.1:1234":  true,
		"http://localhost:3000":  true,
		"http://localhost:5173":  true,
	}

	for _, o := range customOrigins {
		trimmed := strings.TrimSpace(o)
		if trimmed != "" {
			allowedMap[trimmed] = true
		}
	}

	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		for _, o := range strings.Split(envOrigins, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				allowedMap[trimmed] = true
			}
		}
	}

	return func(c *gin.Context) {
		origin := strings.TrimSpace(c.Request.Header.Get("Origin"))
		isAllowed := false

		if origin != "" {
			if allowedMap[origin] {
				isAllowed = true
			} else {
				for allowed := range allowedMap {
					if strings.EqualFold(allowed, origin) {
						isAllowed = true
						break
					}
				}
			}
		}

		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Vary", "Origin")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		}

		if c.Request.Method == "OPTIONS" {
			if isAllowed || origin == "" {
				c.AbortWithStatus(http.StatusNoContent)
			} else {
				c.AbortWithStatus(http.StatusForbidden)
			}
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

const maxLoginTrackerEntries = 10000

var (
	loginAttempts = make(map[string]*clientLoginTracker)
	loginMu       sync.Mutex
)

func cleanupExpiredLoginTrackers() {
	loginMu.Lock()
	defer loginMu.Unlock()
	now := time.Now()
	for ip, tracker := range loginAttempts {
		if (!tracker.lockTime.IsZero() && now.After(tracker.lockTime)) || tracker.attempts == 0 {
			delete(loginAttempts, ip)
		}
	}
}

func init() {
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		for range ticker.C {
			cleanupExpiredLoginTrackers()
		}
	}()
}

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
				utils.Fail(c, http.StatusTooManyRequests, "Bạn đã thực hiện thao tác sai quá nhiều lần. Vui lòng thử lại sau "+strconv.Itoa(remaining)+" giây.")
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

		// Sau khi xử lý request: nếu HTTP 401 hoặc 400 (sai mật khẩu/OTP thất bại) thì tăng bộ đếm
		status := c.Writer.Status()
		if status == http.StatusUnauthorized || status == http.StatusBadRequest {
			loginMu.Lock()
			if len(loginAttempts) >= maxLoginTrackerEntries {
				now := time.Now()
				for k, v := range loginAttempts {
					if (!v.lockTime.IsZero() && now.After(v.lockTime)) || v.attempts == 0 {
						delete(loginAttempts, k)
					}
				}
				if len(loginAttempts) >= maxLoginTrackerEntries {
					loginAttempts = make(map[string]*clientLoginTracker)
				}
			}
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
		} else if status == http.StatusOK {
			// Thao tác thành công -> xóa theo dõi
			loginMu.Lock()
			delete(loginAttempts, ip)
			loginMu.Unlock()
		}
	}
}
