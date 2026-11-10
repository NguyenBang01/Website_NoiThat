package services

import (
	"errors"
	"strings"
	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/utils"

	"gorm.io/gorm"
)

type AccountService struct {
	DB             *gorm.DB
	JWTSecret      string
	JWTExpireHours int
}

func NewAccountService(db *gorm.DB, secret string, expire int) *AccountService {
	return &AccountService{
		DB:             db,
		JWTSecret:      secret,
		JWTExpireHours: expire,
	}
}

func (s *AccountService) GetProfile(userID uint64) (*models.User, error) {
	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return nil, err
	}
	// Hide password
	user.PasswordHash = ""
	return &user, nil
}

func (s *AccountService) UpdateProfile(userID uint64, req dto.UpdateProfileRequest) error {
	validName, err := utils.ValidateFullName(req.FullName)
	if err != nil {
		return err
	}
	updates := map[string]interface{}{
		"full_name": validName,
	}
	if req.Phone != nil && strings.TrimSpace(*req.Phone) != "" {
		validPhone, err := utils.NormalizeAndValidateVNPhone(*req.Phone)
		if err != nil {
			return err
		}
		updates["phone"] = validPhone
	} else {
		updates["phone"] = nil
	}
	return s.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error
}

func (s *AccountService) ChangePassword(userID uint64, req dto.ChangePasswordRequest) error {
	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return err
	}

	if !utils.CheckPassword(user.PasswordHash, req.OldPassword) {
		return errors.New("mật khẩu cũ không chính xác")
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	return s.DB.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", newHash).Error
}

func (s *AccountService) RefreshToken(userID uint64, role string) (string, error) {
	return utils.GenerateToken(userID, role, s.JWTSecret, s.JWTExpireHours)
}

func (s *AccountService) Logout() error {
	// Stateless JWT MVP: just return success
	return nil
}

func (s *AccountService) ListAddresses(userID uint64) ([]models.Address, error) {
	var addresses []models.Address
	err := s.DB.Where("user_id = ?", userID).Order("is_default desc, created_at desc").Find(&addresses).Error
	return addresses, err
}

func (s *AccountService) CreateAddress(userID uint64, req dto.AddressRequest) (*models.Address, error) {
	validName, err := utils.ValidateFullName(req.RecipientName)
	if err != nil {
		return nil, err
	}
	validPhone, err := utils.NormalizeAndValidateVNPhone(req.Phone)
	if err != nil {
		return nil, err
	}
	validStreet, err := utils.ValidateAddress(req.Street)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Province) == "" || strings.TrimSpace(req.District) == "" || strings.TrimSpace(req.Ward) == "" {
		return nil, errors.New("vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã")
	}

	isDefault := false
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}

	address := &models.Address{
		UserID:        userID,
		RecipientName: validName,
		Phone:         validPhone,
		Province:      req.Province,
		District:      req.District,
		Ward:          req.Ward,
		Street:        validStreet,
		IsDefault:     isDefault,
	}

	err = s.DB.Transaction(func(tx *gorm.DB) error {
		if isDefault {
			if err := tx.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
				return err
			}
		} else {
			var count int64
			if err := tx.Model(&models.Address{}).Where("user_id = ? AND is_default = ?", userID, true).Count(&count).Error; err != nil {
				return err
			}
			if count == 0 {
				address.IsDefault = true
			}
		}

		if err := tx.Create(address).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return address, nil
}

func (s *AccountService) UpdateAddress(userID uint64, addressID uint64, req dto.AddressRequest) error {
	validName, err := utils.ValidateFullName(req.RecipientName)
	if err != nil {
		return err
	}
	validPhone, err := utils.NormalizeAndValidateVNPhone(req.Phone)
	if err != nil {
		return err
	}
	validStreet, err := utils.ValidateAddress(req.Street)
	if err != nil {
		return err
	}
	if strings.TrimSpace(req.Province) == "" || strings.TrimSpace(req.District) == "" || strings.TrimSpace(req.Ward) == "" {
		return errors.New("vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã")
	}

	isDefault := false
	if req.IsDefault != nil {
		isDefault = *req.IsDefault
	}

	return s.DB.Transaction(func(tx *gorm.DB) error {
		var address models.Address
		if err := tx.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
			return err
		}

		if isDefault && !address.IsDefault {
			if err := tx.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
				return err
			}
		}

		updates := map[string]interface{}{
			"recipient_name": validName,
			"phone":          validPhone,
			"province":       req.Province,
			"district":       req.District,
			"ward":           req.Ward,
			"street":         validStreet,
			"is_default":     isDefault,
		}

		return tx.Model(&address).Updates(updates).Error
	})
}

func (s *AccountService) DeleteAddress(userID uint64, addressID uint64) error {
	return s.DB.Where("id = ? AND user_id = ?", addressID, userID).Delete(&models.Address{}).Error
}

func (s *AccountService) SetDefaultAddress(userID uint64, addressID uint64) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		var address models.Address
		if err := tx.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
			return err
		}

		return tx.Model(&address).Update("is_default", true).Error
	})
}
