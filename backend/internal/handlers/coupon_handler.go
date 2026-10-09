package handlers

import (
	"strconv"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type CouponHandler struct {
	Service *services.CouponService
}

func NewCouponHandler(service *services.CouponService) *CouponHandler {
	return &CouponHandler{Service: service}
}

func (h *CouponHandler) List(c *gin.Context) {
	page, limit := utils.GetPagination(c)
	q := c.Query("q")

	coupons, total, err := h.Service.AdminList(page, limit, q)
	if err != nil {
		utils.Fail(c, 500, "Lỗi khi lấy danh sách mã giảm giá")
		return
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, 200, "Thành công", coupons, meta)
}

func (h *CouponHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	coupon, err := h.Service.AdminGet(id)
	if err != nil {
		utils.Fail(c, 404, "Không tìm thấy mã giảm giá")
		return
	}

	utils.Success(c, 200, "Thành công", coupon)
}

func (h *CouponHandler) Create(c *gin.Context) {
	var req dto.CouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	coupon, err := h.Service.Create(&req)
	if err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}

	utils.Success(c, 201, "Tạo mã giảm giá thành công", coupon)
}

func (h *CouponHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	var req dto.CouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	coupon, err := h.Service.Update(id, &req)
	if err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}

	utils.Success(c, 200, "Cập nhật mã giảm giá thành công", coupon)
}

func (h *CouponHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, 400, "ID không hợp lệ")
		return
	}

	if err := h.Service.Delete(id); err != nil {
		utils.Fail(c, 400, err.Error())
		return
	}

	utils.Success(c, 200, "Xóa mã giảm giá thành công", nil)
}

func (h *CouponHandler) Validate(c *gin.Context) {
	var req dto.ApplyCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	res, err := h.Service.ValidateCoupon(req.Code, req.OrderTotal)
	if err != nil {
		utils.Fail(c, 500, "Lỗi khi kiểm tra mã giảm giá")
		return
	}

	utils.Success(c, 200, "Thành công", res)
}
