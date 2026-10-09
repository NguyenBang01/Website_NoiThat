package handlers

import (
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/services"
	"furniture-shop/backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ReviewHandler struct {
	ReviewService  *services.ReviewService
	ProductService *services.ProductService
}

func NewReviewHandler(reviewService *services.ReviewService, productService *services.ProductService) *ReviewHandler {
	return &ReviewHandler{
		ReviewService:  reviewService,
		ProductService: productService,
	}
}

func (h *ReviewHandler) ProductReviews(c *gin.Context) {
	slug := c.Param("slug")
	product, err := h.ProductService.PublicDetail(slug)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Sản phẩm không tồn tại")
		return
	}

	page, limit := utils.GetPagination(c)
	reviews, total, err := h.ReviewService.ProductReviews(product.ID, page, limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi lấy danh sách đánh giá")
		return
	}

	var res []dto.PublicReviewResponse
	for _, r := range reviews {
		var userName string
		if r.User != nil {
			userName = r.User.FullName
		}
		res = append(res, dto.PublicReviewResponse{
			ID:        r.ID,
			UserName:  userName,
			Rating:    r.Rating,
			Comment:   r.Comment,
			CreatedAt: r.CreatedAt,
		})
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", res, meta)
}

func (h *ReviewHandler) CreateReview(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	var req dto.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.ReviewService.CreateReview(userID, req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Tạo đánh giá thành công", nil)
}

func (h *ReviewHandler) MyReviews(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	page, limit := utils.GetPagination(c)

	reviews, total, err := h.ReviewService.MyReviews(userID, page, limit)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi lấy danh sách đánh giá")
		return
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", reviews, meta)
}

func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	userID := c.MustGet("user_id").(uint64)
	reviewID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	if err := h.ReviewService.DeleteReview(userID, reviewID); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Xóa đánh giá thành công", nil)
}

func (h *ReviewHandler) AdminListReviews(c *gin.Context) {
	page, limit := utils.GetPagination(c)
	status := c.Query("status")

	reviews, total, err := h.ReviewService.AdminListReviews(page, limit, status)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi khi lấy danh sách đánh giá")
		return
	}

	var res []dto.ReviewResponse
	for _, r := range reviews {
		var userName string
		if r.User != nil {
			userName = r.User.FullName
		}
		res = append(res, dto.ReviewResponse{
			ID: r.ID,
			User: dto.UserBasic{
				Name: userName,
			},
			Rating:    r.Rating,
			Comment:   r.Comment,
			Status:    r.Status,
			CreatedAt: r.CreatedAt,
		})
	}

	meta := utils.BuildMeta(page, limit, total)
	utils.SuccessWithMeta(c, http.StatusOK, "Thành công", res, meta)
}

func (h *ReviewHandler) AdminUpdateReview(c *gin.Context) {
	reviewID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID không hợp lệ")
		return
	}

	var req dto.AdminReviewActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	if err := h.ReviewService.AdminUpdateReview(reviewID, req); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Cập nhật đánh giá thành công", nil)
}
