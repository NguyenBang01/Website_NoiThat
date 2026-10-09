package handlers

import (
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type WishlistHandler struct {
	WishlistService *services.WishlistService
}

func NewWishlistHandler(ws *services.WishlistService) *WishlistHandler {
	return &WishlistHandler{WishlistService: ws}
}

func (h *WishlistHandler) ListWishlist(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	page, limit := utils.GetPagination(c)

	items, total, err := h.WishlistService.ListWishlist(userID, page, limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi lấy danh sách yêu thích")
		return
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", items, meta)
}

func (h *WishlistHandler) AddToWishlist(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	
	// Expecting JSON { "product_id": 1 }
	var req struct {
		ProductID uint64 `json:"product_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.WishlistService.AddToWishlist(userID, req.ProductID); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Đã thêm vào danh sách yêu thích", nil)
}

func (h *WishlistHandler) RemoveFromWishlist(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	productID, err := strconv.ParseUint(c.Param("productId"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID sản phẩm không hợp lệ")
		return
	}

	if err := h.WishlistService.RemoveFromWishlist(userID, productID); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã xóa khỏi danh sách yêu thích", nil)
}
