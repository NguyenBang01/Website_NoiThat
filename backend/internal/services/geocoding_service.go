package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// GeocodingService interface cho dịch vụ chuyển đổi địa chỉ thành tọa độ (lat, lng)
type GeocodingService interface {
	Geocode(ctx context.Context, address string) (lat, lng float64, displayName string, err error)
}

type cachedGeocode struct {
	Lat         float64
	Lng         float64
	DisplayName string
	CachedAt    time.Time
}

// NominatimGeocodingService chuyển đổi địa chỉ qua OpenStreetMap Nominatim API (miễn phí)
type NominatimGeocodingService struct {
	BaseURL     string
	UserAgent   string
	HTTPClient  *http.Client
	cache       map[string]cachedGeocode
	cacheMu     sync.RWMutex
	rateLimitMu sync.Mutex
	lastRequest time.Time
}

func NewNominatimGeocodingService() *NominatimGeocodingService {
	baseURL := os.Getenv("NOMINATIM_URL")
	if baseURL == "" {
		baseURL = "https://nominatim.openstreetmap.org"
	}
	baseURL = strings.TrimRight(baseURL, "/")

	ua := os.Getenv("SHOP_NAME_UA")
	if ua == "" {
		ua = "GocNhaDep-FurnitureShop/1.0 (contact@gocnhadep.vn)"
	}

	timeoutSec := 4
	if envTimeout := os.Getenv("SHIPPING_HTTP_TIMEOUT"); envTimeout != "" {
		if t, err := strconv.Atoi(envTimeout); err == nil && t > 0 {
			timeoutSec = t
		}
	}

	return &NominatimGeocodingService{
		BaseURL:    baseURL,
		UserAgent:  ua,
		HTTPClient: &http.Client{Timeout: time.Duration(timeoutSec) * time.Second},
		cache:      make(map[string]cachedGeocode),
	}
}

type nominatimResult struct {
	PlaceID     int64   `json:"place_id"`
	Lat         string  `json:"lat"`
	Lon         string  `json:"lon"`
	DisplayName string  `json:"display_name"`
	Importance  float64 `json:"importance"`
}

const maxGeocodeCacheEntries = 5000

func (s *NominatimGeocodingService) pruneCacheIfNeeded() {
	if len(s.cache) <= maxGeocodeCacheEntries {
		return
	}
	now := time.Now()
	for k, item := range s.cache {
		if now.Sub(item.CachedAt) > 7*24*time.Hour {
			delete(s.cache, k)
		}
	}
	if len(s.cache) > maxGeocodeCacheEntries {
		count := 0
		for k := range s.cache {
			delete(s.cache, k)
			count++
			if count > maxGeocodeCacheEntries/2 {
				break
			}
		}
	}
}

// Geocode chuyển địa chỉ chữ thành tọa độ GPS. Có cache và tuân thủ rate limit 1 req/s
func (s *NominatimGeocodingService) Geocode(ctx context.Context, address string) (float64, float64, string, error) {
	trimmed := strings.TrimSpace(address)
	if trimmed == "" {
		return 0, 0, "", errors.New("địa chỉ không được để trống")
	}

	normKey := strings.ToLower(trimmed)

	// 1. Kiểm tra cache
	s.cacheMu.RLock()
	item, found := s.cache[normKey]
	s.cacheMu.RUnlock()
	if found && time.Since(item.CachedAt) < 7*24*time.Hour {
		return item.Lat, item.Lng, item.DisplayName, nil
	}

	// 2. Tuân thủ rate limit của Nominatim (1.1s giữa các request thực tế)
	// Tính toán thời điểm slot tiếp theo dưới lock, sau đó sleep ngoài lock và tôn trọng ctx.Done()
	s.rateLimitMu.Lock()
	now := time.Now()
	var waitDuration time.Duration
	if s.lastRequest.IsZero() {
		s.lastRequest = now
	} else {
		target := s.lastRequest.Add(1100 * time.Millisecond)
		if target.After(now) {
			waitDuration = target.Sub(now)
			s.lastRequest = target
		} else {
			s.lastRequest = now
		}
	}
	s.rateLimitMu.Unlock()

	if waitDuration > 0 {
		timer := time.NewTimer(waitDuration)
		defer timer.Stop()
		select {
		case <-ctx.Done():
			return 0, 0, "", ctx.Err()
		case <-timer.C:
		}
	}

	// 3. Chuẩn hóa chuỗi truy vấn (thêm Việt Nam nếu địa chỉ chưa có để tăng độ chính xác)
	query := trimmed
	lowerQ := strings.ToLower(query)
	if !strings.Contains(lowerQ, "việt nam") && !strings.Contains(lowerQ, "vietnam") {
		query += ", Việt Nam"
	}

	reqURL := fmt.Sprintf("%s/search?format=json&q=%s&limit=1&addressdetails=1", s.BaseURL, url.QueryEscape(query))

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return 0, 0, "", fmt.Errorf("lỗi khởi tạo request geocode: %w", err)
	}

	req.Header.Set("User-Agent", s.UserAgent)
	req.Header.Set("Accept-Language", "vi,en;q=0.8")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return 0, 0, "", fmt.Errorf("không thể kết nối tới dịch vụ Geocoding Nominatim: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, "", fmt.Errorf("dịch vụ geocoding phản hồi mã lỗi HTTP: %d", resp.StatusCode)
	}

	var results []nominatimResult
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return 0, 0, "", fmt.Errorf("lỗi phân tích phản hồi geocode: %w", err)
	}

	if len(results) == 0 {
		return 0, 0, "", fmt.Errorf("không tìm thấy tọa độ địa chỉ '%s' trên bản đồ", trimmed)
	}

	lat, err := strconv.ParseFloat(results[0].Lat, 64)
	if err != nil {
		return 0, 0, "", errors.New("tọa độ vĩ độ không hợp lệ")
	}

	lng, err := strconv.ParseFloat(results[0].Lon, 64)
	if err != nil {
		return 0, 0, "", errors.New("tọa độ kinh độ không hợp lệ")
	}

	displayName := results[0].DisplayName

	// Lưu cache kèm kiểm soát kích thước bộ nhớ
	s.cacheMu.Lock()
	s.pruneCacheIfNeeded()
	s.cache[normKey] = cachedGeocode{
		Lat:         lat,
		Lng:         lng,
		DisplayName: displayName,
		CachedAt:    time.Now(),
	}
	s.cacheMu.Unlock()

	return lat, lng, displayName, nil
}
