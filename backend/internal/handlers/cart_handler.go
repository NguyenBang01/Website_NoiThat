package handlers

import (
	"errors"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	Service *services.CartService
}

func NewCartHandler(service *services.CartService) *CartHandler {
	return &CartHandler{Service: service}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)

	resp, err := h.Service.GetCart(userID)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Thành công", resp)
}

func (h *CartHandler) AddItem(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)

	var req dto.AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	err := h.Service.AddItem(userID, req)
	if err != nil {
		if errors.Is(err, services.ErrVariantNotFound) || errors.Is(err, services.ErrVariantInactive) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrNotEnoughStock) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã thêm vào giỏ hàng", nil)
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	var req dto.UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	err = h.Service.UpdateItem(userID, itemID, req)
	if err != nil {
		if errors.Is(err, services.ErrCartItemNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrNotEnoughStock) {
			utils.Fail(c, http.StatusBadRequest, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã cập nhật giỏ hàng", nil)
}

func (h *CartHandler) RemoveItem(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	err = h.Service.RemoveItem(userID, itemID)
	if err != nil {
		if errors.Is(err, services.ErrCartItemNotFound) {
			utils.Fail(c, http.StatusNotFound, err.Error())
			return
		}
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã xóa sản phẩm khỏi giỏ hàng", nil)
}

func (h *CartHandler) ClearCart(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)

	err := h.Service.ClearCart(userID)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Đã xóa toàn bộ giỏ hàng", nil)
}
