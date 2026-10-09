package services

import (
	"errors"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrCartItemNotFound = errors.New("không tìm thấy sản phẩm trong giỏ hàng")
	ErrVariantNotFound  = errors.New("không tìm thấy biến thể sản phẩm")
	ErrVariantInactive  = errors.New("sản phẩm ngừng kinh doanh")
	ErrNotEnoughStock   = errors.New("số lượng tồn kho không đủ")
)

type CartService struct {
	DB *gorm.DB
}

func NewCartService(db *gorm.DB) *CartService {
	return &CartService{DB: db}
}

func (s *CartService) GetOrCreateCart(userID uint64) (*models.Cart, error) {
	var cart models.Cart
	err := s.DB.Where("user_id = ?", userID).First(&cart).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		cart = models.Cart{UserID: userID}
		err = s.DB.Create(&cart).Error
	}
	return &cart, err
}

func (s *CartService) GetCart(userID uint64) (*dto.CartResponse, error) {
	cart, err := s.GetOrCreateCart(userID)
	if err != nil {
		return nil, err
	}

	var items []models.CartItem
	if err := s.DB.Where("cart_id = ?", cart.ID).
		Preload("Variant").
		Preload("Variant.Product").
		Preload("Variant.Product.Images").
		Find(&items).Error; err != nil {
		return nil, err
	}

	resp := &dto.CartResponse{
		Items: make([]dto.CartItemResponse, 0, len(items)),
		Total: 0,
	}

	for _, item := range items {
		v := item.Variant
		if v == nil {
			continue
		}
		p := v.Product
		if p == nil {
			continue
		}

		effectivePrice := v.Price
		if v.SalePrice != nil {
			effectivePrice = *v.SalePrice
		}
		subtotal := int64(item.Quantity) * effectivePrice

		var image string
		if len(p.Images) > 0 {
			image = p.Images[0].URL
		}

		itemResp := dto.CartItemResponse{
			ID:           item.ID,
			VariantID:    v.ID,
			ProductID:    p.ID,
			ProductName:  p.Name,
			ProductSlug:  p.Slug,
			ProductImage: image,
			VariantSKU:   v.SKU,
			Color:        v.Color,
			Size:         v.Size,
			Material:     v.Material,
			Price:        v.Price,
			SalePrice:    v.SalePrice,
			Quantity:     item.Quantity,
			Subtotal:     subtotal,
			InStock:      v.StockQuantity,
		}
		resp.Items = append(resp.Items, itemResp)
		resp.Total += subtotal
	}

	return resp, nil
}

func (s *CartService) AddItem(userID uint64, req dto.AddToCartRequest) error {
	cart, err := s.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	var variant models.ProductVariant
	if err := s.DB.First(&variant, req.VariantID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrVariantNotFound
		}
		return err
	}

	if !variant.IsActive {
		return ErrVariantInactive
	}

	var existingItem models.CartItem
	err = s.DB.Where("cart_id = ? AND variant_id = ?", cart.ID, req.VariantID).First(&existingItem).Error

	newQuantity := req.Quantity
	if err == nil {
		newQuantity += existingItem.Quantity
	}

	if variant.StockQuantity < newQuantity {
		return ErrNotEnoughStock
	}

	if err == nil {
		existingItem.Quantity = newQuantity
		return s.DB.Save(&existingItem).Error
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		newItem := models.CartItem{
			CartID:    cart.ID,
			VariantID: req.VariantID,
			Quantity:  req.Quantity,
		}
		return s.DB.Create(&newItem).Error
	}

	return err
}

func (s *CartService) UpdateItem(userID uint64, itemID uint64, req dto.UpdateCartItemRequest) error {
	cart, err := s.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	var item models.CartItem
	if err := s.DB.Where("id = ? AND cart_id = ?", itemID, cart.ID).First(&item).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCartItemNotFound
		}
		return err
	}

	var variant models.ProductVariant
	if err := s.DB.First(&variant, item.VariantID).Error; err != nil {
		return err
	}

	if variant.StockQuantity < req.Quantity {
		return ErrNotEnoughStock
	}

	item.Quantity = req.Quantity
	return s.DB.Save(&item).Error
}

func (s *CartService) RemoveItem(userID uint64, itemID uint64) error {
	cart, err := s.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	res := s.DB.Where("id = ? AND cart_id = ?", itemID, cart.ID).Delete(&models.CartItem{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrCartItemNotFound
	}
	return nil
}

func (s *CartService) ClearCart(userID uint64) error {
	cart, err := s.GetOrCreateCart(userID)
	if err != nil {
		return err
	}

	return s.DB.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{}).Error
}
