package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// RoutingService interface cho dịch vụ tính khoảng cách đường đi thực tế giữa 2 tọa độ
type RoutingService interface {
	CalculateDistance(ctx context.Context, fromLat, fromLng, toLat, toLng float64, fallbackMultiplier float64) (distanceKm float64, durationMinutes float64, source string, err error)
}

type cachedRoute struct {
	DistanceKM      float64
	DurationMinutes float64
	Source          string
	CachedAt        time.Time
}

// OSRMRoutingService tính khoảng cách đường xe chạy bằng OSRM (Open Source Routing Machine)
type OSRMRoutingService struct {
	BaseURL    string
	HTTPClient *http.Client
	cache      map[string]cachedRoute
	cacheMu    sync.RWMutex
}

func NewOSRMRoutingService() *OSRMRoutingService {
	baseURL := os.Getenv("OSRM_URL")
	if baseURL == "" {
		baseURL = "http://router.project-osrm.org"
	}
	baseURL = strings.TrimRight(baseURL, "/")

	timeoutSec := 4
	if envTimeout := os.Getenv("SHIPPING_HTTP_TIMEOUT"); envTimeout != "" {
		if t, err := strconv.Atoi(envTimeout); err == nil && t > 0 {
			timeoutSec = t
		}
	}

	return &OSRMRoutingService{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{Timeout: time.Duration(timeoutSec) * time.Second},
		cache:      make(map[string]cachedRoute),
	}
}

type osrmRoute struct {
	Distance float64 `json:"distance"` // mét
	Duration float64 `json:"duration"` // giây
}

type osrmResponse struct {
	Code   string      `json:"code"`
	Routes []osrmRoute `json:"routes"`
}

// CalculateDistance tính khoảng cách thực tế giữa điểm đi và điểm đến.
// Nếu OSRM timeout hoặc gặp lỗi, tự động chuyển sang công thức Haversine x hệ số dự phòng.
func (s *OSRMRoutingService) CalculateDistance(ctx context.Context, fromLat, fromLng, toLat, toLng float64, fallbackMultiplier float64) (float64, float64, string, error) {
	if fallbackMultiplier <= 0 {
		fallbackMultiplier = 1.30
	}

	// Làm tròn tọa độ 4 số thập phân (~11m) để tối ưu hóa cache
	cacheKey := fmt.Sprintf("%.4f,%.4f->%.4f,%.4f", fromLat, fromLng, toLat, toLng)

	s.cacheMu.RLock()
	cached, found := s.cache[cacheKey]
	s.cacheMu.RUnlock()
	if found && time.Since(cached.CachedAt) < 24*time.Hour {
		return cached.DistanceKM, cached.DurationMinutes, cached.Source, nil
	}

	// Thử gọi OSRM API (Định dạng OSRM: /route/v1/driving/{lng},{lat};{lng},{lat}?overview=false)
	osrmURL := fmt.Sprintf("%s/route/v1/driving/%.6f,%.6f;%.6f,%.6f?overview=false", s.BaseURL, fromLng, fromLat, toLng, toLat)

	req, err := http.NewRequestWithContext(ctx, "GET", osrmURL, nil)
	if err == nil {
		req.Header.Set("User-Agent", "GocNhaDep-OSRM-Client/1.0")
		resp, httpErr := s.HTTPClient.Do(req)
		if httpErr == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			var osrmResp osrmResponse
			if decodeErr := json.NewDecoder(resp.Body).Decode(&osrmResp); decodeErr == nil && osrmResp.Code == "Ok" && len(osrmResp.Routes) > 0 {
				route := osrmResp.Routes[0]
				distKm := math.Round((route.Distance/1000.0)*100) / 100
				durMin := math.Round((route.Duration/60.0)*10) / 10

				s.cacheMu.Lock()
				s.cache[cacheKey] = cachedRoute{
					DistanceKM:      distKm,
					DurationMinutes: durMin,
					Source:          "osrm",
					CachedAt:        time.Now(),
				}
				s.cacheMu.Unlock()

				return distKm, durMin, "osrm", nil
			}
		} else if resp != nil {
			_ = resp.Body.Close()
		}
	}

	// DỰ PHÒNG: Haversine x FallbackMultiplier
	airDistanceKm := CalculateHaversineDistance(fromLat, fromLng, toLat, toLng)
	roadDistanceKm := math.Round((airDistanceKm*fallbackMultiplier)*100) / 100
	// Ước tính vận tốc trung bình giao hàng đô thị: 30 km/h
	estMinutes := math.Round(((roadDistanceKm/30.0)*60.0)*10) / 10

	s.cacheMu.Lock()
	s.cache[cacheKey] = cachedRoute{
		DistanceKM:      roadDistanceKm,
		DurationMinutes: estMinutes,
		Source:          "haversine_fallback",
		CachedAt:        time.Now(),
	}
	s.cacheMu.Unlock()

	return roadDistanceKm, estMinutes, "haversine_fallback", nil
}

// CalculateHaversineDistance tính khoảng cách chim bay theo mặt cầu Trái Đất (bán kính R = 6371 km)
func CalculateHaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0 // km

	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	rLat1 := lat1 * (math.Pi / 180.0)
	rLat2 := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rLat1)*math.Cos(rLat2)*math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}
