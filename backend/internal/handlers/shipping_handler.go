package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type ShippingHandler struct {
	Service      *services.ShippingService
	AuditService *services.AuditService
}

func NewShippingHandler(service *services.ShippingService, auditService *services.AuditService) *ShippingHandler {
	return &ShippingHandler{
		Service:      service,
		AuditService: auditService,
	}
}

// EstimateShipping ước tính phí vận chuyển theo khoảng cách cho storefront hoặc admin
func (h *ShippingHandler) EstimateShipping(c *gin.Context) {
	var req dto.ShippingEstimateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu yêu cầu không hợp lệ: "+err.Error())
		return
	}

	resp, err := h.Service.EstimateShipping(c.Request.Context(), req)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi ước tính phí vận chuyển: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Ước tính phí vận chuyển thành công", resp)
}

// GetSettings lấy cấu hình vận chuyển tổng quan và các bậc thang
func (h *ShippingHandler) GetSettings(c *gin.Context) {
	settings, err := h.Service.GetSettings()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy cấu hình vận chuyển: "+err.Error())
		return
	}

	tiers, err := h.Service.ListTiers()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách bậc thang: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Lấy cấu hình vận chuyển thành công", gin.H{
		"settings":                      *settings,
		"tiers":                         tiers,
		"id":                            settings.ID,
		"warehouse_name":                settings.WarehouseName,
		"warehouse_address":             settings.WarehouseAddress,
		"warehouse_lat":                 settings.WarehouseLat,
		"warehouse_lng":                 settings.WarehouseLng,
		"max_distance_km":               settings.MaxDistanceKM,
		"min_shipping_fee":              settings.MinShippingFee,
		"free_shipping_threshold":       settings.FreeShippingThreshold,
		"free_shipping_max_distance_km": settings.FreeShippingMaxDistanceKM,
		"enable_bulky_surcharge":        settings.EnableBulkySurcharge,
		"bulky_surcharge_fee":           settings.BulkySurchargeFee,
		"bulky_weight_threshold":        settings.BulkyWeightThreshold,
		"enable_floor_surcharge":        settings.EnableFloorSurcharge,
		"floor_surcharge_per_floor":     settings.FloorSurchargePerFloor,
		"enable_assembly_fee":           settings.EnableAssemblyFee,
		"assembly_fee":                  settings.AssemblyFee,
		"fallback_multiplier":           settings.FallbackMultiplier,
		"updated_at":                    settings.UpdatedAt,
	})
}

// UpdateSettings cập nhật cấu hình vận chuyển
func (h *ShippingHandler) UpdateSettings(c *gin.Context) {
	var req dto.UpdateShippingSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu cài đặt không hợp lệ: "+err.Error())
		return
	}

	updated, err := h.Service.UpdateSettings(req)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi cập nhật cài đặt vận chuyển: "+err.Error())
		return
	}

	if actorIDVal, exists := c.Get("user_id"); exists {
		if actorID, ok := actorIDVal.(uint64); ok && h.AuditService != nil {
			h.AuditService.Record(actorID, "update", "shipping_setting", "Cập nhật cấu hình vận chuyển theo khoảng cách", c.ClientIP(), c.Request.UserAgent())
		}
	}

	utils.Success(c, http.StatusOK, "Cập nhật cấu hình vận chuyển thành công", updated)
}

// ListTiers lấy danh sách bậc thang vận chuyển
func (h *ShippingHandler) ListTiers(c *gin.Context) {
	tiers, err := h.Service.ListTiers()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy bậc thang vận chuyển: "+err.Error())
		return
	}
	utils.Success(c, http.StatusOK, "Lấy danh sách bậc thang thành công", tiers)
}

// CreateTier tạo bậc thang vận chuyển mới
func (h *ShippingHandler) CreateTier(c *gin.Context) {
	var req dto.CreateShippingTierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu bậc thang không hợp lệ: "+err.Error())
		return
	}

	tier, err := h.Service.CreateTier(req)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	if actorIDVal, exists := c.Get("user_id"); exists {
		if actorID, ok := actorIDVal.(uint64); ok && h.AuditService != nil {
			h.AuditService.Record(actorID, "create", "shipping_tier", fmt.Sprintf("Tạo bậc thang cước phí %.1f - %.1f km", tier.FromKM, tier.ToKM), c.ClientIP(), c.Request.UserAgent())
		}
	}

	utils.Success(c, http.StatusCreated, "Tạo bậc thang vận chuyển thành công", tier)
}

// UpdateTier sửa thông tin bậc thang vận chuyển
func (h *ShippingHandler) UpdateTier(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID bậc thang không hợp lệ")
		return
	}

	var req dto.UpdateShippingTierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu cập nhật không hợp lệ: "+err.Error())
		return
	}

	tier, err := h.Service.UpdateTier(id, req)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	if actorIDVal, exists := c.Get("user_id"); exists {
		if actorID, ok := actorIDVal.(uint64); ok && h.AuditService != nil {
			h.AuditService.Record(actorID, "update", "shipping_tier", fmt.Sprintf("Cập nhật bậc thang cước phí ID #%d (%.1f - %.1f km)", tier.ID, tier.FromKM, tier.ToKM), c.ClientIP(), c.Request.UserAgent())
		}
	}

	utils.Success(c, http.StatusOK, "Cập nhật bậc thang thành công", tier)
}

// DeleteTier xóa một bậc thang vận chuyển
func (h *ShippingHandler) DeleteTier(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID bậc thang không hợp lệ")
		return
	}

	if err := h.Service.DeleteTier(id); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	if actorIDVal, exists := c.Get("user_id"); exists {
		if actorID, ok := actorIDVal.(uint64); ok && h.AuditService != nil {
			h.AuditService.Record(actorID, "delete", "shipping_tier", fmt.Sprintf("Xóa bậc thang cước phí ID #%d", id), c.ClientIP(), c.Request.UserAgent())
		}
	}

	utils.Success(c, http.StatusOK, "Xóa bậc thang thành công", nil)
}

// ReorderTiers sắp xếp lại thứ tự các bậc thang
func (h *ShippingHandler) ReorderTiers(c *gin.Context) {
	var req dto.ReorderShippingTiersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Dữ liệu sắp xếp không hợp lệ: "+err.Error())
		return
	}

	if err := h.Service.ReorderTiers(req); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi sắp xếp bậc thang: "+err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Cập nhật thứ tự bậc thang thành công", nil)
}

// ValidateTiers kiểm tra tính hợp lệ của toàn bộ bậc thang (chồng lấn, khoảng hở)
func (h *ShippingHandler) ValidateTiers(c *gin.Context) {
	tiers, err := h.Service.ListTiers()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi lấy danh sách bậc thang: "+err.Error())
		return
	}

	validationErrors := h.Service.ValidateTiers(tiers)
	utils.Success(c, http.StatusOK, "Kiểm tra cấu hình bậc thang hoàn tất", dto.ValidateTiersResponse{
		IsValid: len(validationErrors) == 0,
		Errors:  validationErrors,
	})
}
