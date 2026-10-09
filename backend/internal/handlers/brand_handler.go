package handlers

import (
	"log"
	"net/http"

	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BrandHandler struct {
	DB *gorm.DB
}

// List - GET /api/v1/brands
func (h *BrandHandler) List(c *gin.Context) {
	brands := []models.Brand{}
	if err := h.DB.Order("name ASC").Find(&brands).Error; err != nil {
		log.Println("Lỗi thương hiệu:", err)
		utils.Fail(c, http.StatusInternalServerError, "Lỗi hệ thống")
		return
	}
	utils.Success(c, http.StatusOK, "OK", brands)
}

// Create - POST /api/v1/admin/brands
func (h *BrandHandler) Create(c *gin.Context) {
	var req struct {
		Name string  `json:"name" binding:"required"`
		Slug string  `json:"slug"`
		Logo *string `json:"logo"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = utils.Slugify(req.Name)
	}

	brand := models.Brand{
		Name: req.Name,
		Slug: slug,
		Logo: req.Logo,
	}
	if err := h.DB.Create(&brand).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, "Không tạo được thương hiệu (có thể trùng slug)")
		return
	}
	utils.Success(c, http.StatusCreated, "Tạo thương hiệu thành công", brand)
}

// Update - PUT /api/v1/admin/brands/:id
func (h *BrandHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var brand models.Brand
	if err := h.DB.First(&brand, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Không tìm thấy thương hiệu")
		return
	}

	var req struct {
		Name string  `json:"name" binding:"required"`
		Slug string  `json:"slug"`
		Logo *string `json:"logo"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationFail(c, err)
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = utils.Slugify(req.Name)
	}

	brand.Name = req.Name
	brand.Slug = slug
	brand.Logo = req.Logo

	if err := h.DB.Save(&brand).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, "Không cập nhật được thương hiệu")
		return
	}
	utils.Success(c, http.StatusOK, "Cập nhật thương hiệu thành công", brand)
}

// Delete - DELETE /api/v1/admin/brands/:id
func (h *BrandHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	if err := h.DB.Delete(&models.Brand{}, id).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Lỗi xóa thương hiệu")
		return
	}
	utils.Success(c, http.StatusOK, "Xóa thương hiệu thành công", nil)
}
