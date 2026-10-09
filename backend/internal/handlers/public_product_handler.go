package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// PublicList - GET /api/v1/products
// Tham số: q, category (slug), brand (slug), color (a,b), material (a,b),
//          min_price, max_price, in_stock=true, featured=true,
//          sort = newest | price_asc | price_desc | popular | name_asc,
//          page, limit
func (h *ProductHandler) PublicList(c *gin.Context) {
	page, limit := utils.GetPagination(c)

	minPrice, ok := parseOptionalInt64(c, "min_price")
	if !ok {
		return
	}
	maxPrice, ok := parseOptionalInt64(c, "max_price")
	if !ok {
		return
	}
	if maxPrice > 0 && minPrice > maxPrice {
		utils.Fail(c, http.StatusBadRequest, "min_price không được lớn hơn max_price")
		return
	}

	query := services.PublicProductQuery{
		Page:         page,
		Limit:        limit,
		Q:            strings.TrimSpace(c.Query("q")),
		CategorySlug: strings.TrimSpace(c.Query("category")),
		BrandSlug:    strings.TrimSpace(c.Query("brand")),
		Colors:       splitCSV(c.Query("color")),
		Materials:    splitCSV(c.Query("material")),
		MinPrice:     minPrice,
		MaxPrice:     maxPrice,
		InStock:      c.Query("in_stock") == "true",
		Featured:     c.Query("featured") == "true",
		Sort:         strings.TrimSpace(c.Query("sort")),
	}

	items, total, err := h.Service.PublicList(query)
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.SuccessWithMeta(c, http.StatusOK, "OK", items, utils.BuildMeta(page, limit, total))
}

// PublicDetail - GET /api/v1/products/:slug
func (h *ProductHandler) PublicDetail(c *gin.Context) {
	detail, err := h.Service.PublicDetail(c.Param("slug"))
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "OK", detail)
}

// PublicFilters - GET /api/v1/product-filters?category=sofa
func (h *ProductHandler) PublicFilters(c *gin.Context) {
	filters, err := h.Service.PublicFilters(strings.TrimSpace(c.Query("category")))
	if err != nil {
		h.handleError(c, err)
		return
	}
	utils.Success(c, http.StatusOK, "OK", filters)
}

// parseOptionalInt64 đọc một số nguyên không âm từ query; để trống thì trả 0
func parseOptionalInt64(c *gin.Context, key string) (int64, bool) {
	v := strings.TrimSpace(c.Query(key))
	if v == "" {
		return 0, true
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil || n < 0 {
		utils.Fail(c, http.StatusBadRequest, key+" không hợp lệ")
		return 0, false
	}
	return n, true
}

// splitCSV tách chuỗi "a,b,c" thành danh sách, bỏ phần rỗng
func splitCSV(s string) []string {
	result := []string{}
	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}
