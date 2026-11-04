package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"furniture-shop/backend/internal/dto"
	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrConflictSlug    = errors.New("không thể khôi phục: đường dẫn (slug) đã tồn tại ở bản ghi đang hoạt động")
	ErrConflictSKU     = errors.New("không thể khôi phục: mã SKU của sản phẩm hoặc biến thể đã trùng với sản phẩm đang hoạt động")
	ErrConflictCode    = errors.New("không thể khôi phục: mã giảm giá này đã tồn tại ở bản ghi đang hoạt động")
	ErrConflictEmail   = errors.New("không thể khôi phục: địa chỉ email này đã được sử dụng bởi một nhân viên khác đang hoạt động")
	ErrTrashItemNotFound = errors.New("không tìm thấy bản ghi trong thùng rác")
	ErrInvalidModule   = errors.New("module không hợp lệ (hỗ trợ: product, category, voucher, review, staff)")
)

type TrashService struct {
	DB           *gorm.DB
	AuditService *AuditService
	UploadDir    string
}

func NewTrashService(db *gorm.DB, auditService *AuditService, uploadDir string) *TrashService {
	return &TrashService{
		DB:           db,
		AuditService: auditService,
		UploadDir:    uploadDir,
	}
}

// GetRetentionDays lấy số ngày lưu trữ trong thùng rác từ .env (mặc định 30 ngày)
func (s *TrashService) GetRetentionDays() int {
	daysStr := os.Getenv("TRASH_RETENTION_DAYS")
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			return d
		}
	}
	return 30
}

// List lấy danh sách bản ghi trong thùng rác theo module
func (s *TrashService) List(module string, page, limit int, search, startDate, endDate string, deletedBy uint64) ([]dto.TrashItemResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	retentionDays := s.GetRetentionDays()

	var items []dto.TrashItemResponse
	var total int64

	switch module {
	case "product":
		var products []models.Product
		q := s.DB.Unscoped().Model(&models.Product{}).
			Preload("DeletedByUser").
			Preload("Category").
			Preload("Images").
			Where("deleted_at IS NOT NULL")

		if search != "" {
			term := "%" + search + "%"
			q = q.Where("name LIKE ? OR sku LIKE ? OR slug LIKE ?", term, term, term)
		}
		if startDate != "" {
			q = q.Where("deleted_at >= ?", startDate+" 00:00:00")
		}
		if endDate != "" {
			q = q.Where("deleted_at <= ?", endDate+" 23:59:59")
		}
		if deletedBy > 0 {
			q = q.Where("deleted_by = ?", deletedBy)
		}

		if err := q.Count(&total).Error; err != nil {
			return nil, 0, err
		}
		if err := q.Order("deleted_at DESC").Offset(offset).Limit(limit).Find(&products).Error; err != nil {
			return nil, 0, err
		}

		for _, p := range products {
			dName, dEmail := s.extractUserDeletedInfo(p.DeletedByUser)
			var imgURL string
			if len(p.Images) > 0 {
				imgURL = p.Images[0].URL
			}
			catName := ""
			if p.Category != nil {
				catName = p.Category.Name
			}

			item := dto.TrashItemResponse{
				ID:             p.ID,
				Module:         "product",
				Title:          p.Name,
				Code:           p.SKU,
				DeletedAt:      p.DeletedAt.Time,
				DeletedBy:      p.DeletedBy,
				DeletedByName:  dName,
				DeletedByEmail: dEmail,
				DaysRemaining:  s.calculateDaysRemaining(p.DeletedAt.Time, retentionDays),
				Extra: map[string]interface{}{
					"slug":          p.Slug,
					"base_price":    p.BasePrice,
					"category_name": catName,
					"image":         imgURL,
				},
			}
			items = append(items, item)
		}

	case "category":
		var categories []models.Category
		q := s.DB.Unscoped().Model(&models.Category{}).
			Preload("DeletedByUser").
			Where("deleted_at IS NOT NULL")

		if search != "" {
			term := "%" + search + "%"
			q = q.Where("name LIKE ? OR slug LIKE ?", term, term)
		}
		if startDate != "" {
			q = q.Where("deleted_at >= ?", startDate+" 00:00:00")
		}
		if endDate != "" {
			q = q.Where("deleted_at <= ?", endDate+" 23:59:59")
		}
		if deletedBy > 0 {
			q = q.Where("deleted_by = ?", deletedBy)
		}

		if err := q.Count(&total).Error; err != nil {
			return nil, 0, err
		}
		if err := q.Order("deleted_at DESC").Offset(offset).Limit(limit).Find(&categories).Error; err != nil {
			return nil, 0, err
		}

		for _, c := range categories {
			dName, dEmail := s.extractUserDeletedInfo(c.DeletedByUser)
			item := dto.TrashItemResponse{
				ID:             c.ID,
				Module:         "category",
				Title:          c.Name,
				Code:           c.Slug,
				DeletedAt:      c.DeletedAt.Time,
				DeletedBy:      c.DeletedBy,
				DeletedByName:  dName,
				DeletedByEmail: dEmail,
				DaysRemaining:  s.calculateDaysRemaining(c.DeletedAt.Time, retentionDays),
				Extra: map[string]interface{}{
					"image": c.Image,
				},
			}
			items = append(items, item)
		}

	case "voucher", "coupon":
		var coupons []models.Coupon
		q := s.DB.Unscoped().Model(&models.Coupon{}).
			Preload("DeletedByUser").
			Where("deleted_at IS NOT NULL")

		if search != "" {
			term := "%" + search + "%"
			q = q.Where("code LIKE ? OR description LIKE ?", term, term)
		}
		if startDate != "" {
			q = q.Where("deleted_at >= ?", startDate+" 00:00:00")
		}
		if endDate != "" {
			q = q.Where("deleted_at <= ?", endDate+" 23:59:59")
		}
		if deletedBy > 0 {
			q = q.Where("deleted_by = ?", deletedBy)
		}

		if err := q.Count(&total).Error; err != nil {
			return nil, 0, err
		}
		if err := q.Order("deleted_at DESC").Offset(offset).Limit(limit).Find(&coupons).Error; err != nil {
			return nil, 0, err
		}

		for _, cp := range coupons {
			dName, dEmail := s.extractUserDeletedInfo(cp.DeletedByUser)
			item := dto.TrashItemResponse{
				ID:             cp.ID,
				Module:         "voucher",
				Title:          cp.Code,
				Code:           cp.Code,
				DeletedAt:      cp.DeletedAt.Time,
				DeletedBy:      cp.DeletedBy,
				DeletedByName:  dName,
				DeletedByEmail: dEmail,
				DaysRemaining:  s.calculateDaysRemaining(cp.DeletedAt.Time, retentionDays),
				Extra: map[string]interface{}{
					"discount_type":  cp.DiscountType,
					"discount_value": cp.DiscountValue,
					"description":    cp.Description,
				},
			}
			items = append(items, item)
		}

	case "review":
		var reviews []models.Review
		q := s.DB.Unscoped().Model(&models.Review{}).
			Preload("DeletedByUser").
			Preload("User").
			Preload("Product").
			Where("deleted_at IS NOT NULL")

		if search != "" {
			term := "%" + search + "%"
			q = q.Where("comment LIKE ?", term)
		}
		if startDate != "" {
			q = q.Where("deleted_at >= ?", startDate+" 00:00:00")
		}
		if endDate != "" {
			q = q.Where("deleted_at <= ?", endDate+" 23:59:59")
		}
		if deletedBy > 0 {
			q = q.Where("deleted_by = ?", deletedBy)
		}

		if err := q.Count(&total).Error; err != nil {
			return nil, 0, err
		}
		if err := q.Order("deleted_at DESC").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
			return nil, 0, err
		}

		for _, r := range reviews {
			dName, dEmail := s.extractUserDeletedInfo(r.DeletedByUser)
			prodName := ""
			if r.Product != nil {
				prodName = r.Product.Name
			}
			customerName := ""
			if r.User != nil {
				customerName = r.User.FullName
			}

			title := fmt.Sprintf("Đánh giá của %s (%d sao)", customerName, r.Rating)
			if prodName != "" {
				title += " cho " + prodName
			}

			item := dto.TrashItemResponse{
				ID:             r.ID,
				Module:         "review",
				Title:          title,
				Code:           fmt.Sprintf("REV#%d", r.ID),
				DeletedAt:      r.DeletedAt.Time,
				DeletedBy:      r.DeletedBy,
				DeletedByName:  dName,
				DeletedByEmail: dEmail,
				DaysRemaining:  s.calculateDaysRemaining(r.DeletedAt.Time, retentionDays),
				Extra: map[string]interface{}{
					"rating":        r.Rating,
					"comment":       r.Comment,
					"product_name":  prodName,
					"customer_name": customerName,
				},
			}
			items = append(items, item)
		}

	case "staff":
		var staffUsers []models.User
		q := s.DB.Unscoped().Model(&models.User{}).
			Preload("DeletedByUser").
			Preload("RoleModel").
			Where("deleted_at IS NOT NULL AND role != 'customer'")

		if search != "" {
			term := "%" + search + "%"
			q = q.Where("full_name LIKE ? OR email LIKE ? OR phone LIKE ?", term, term, term)
		}
		if startDate != "" {
			q = q.Where("deleted_at >= ?", startDate+" 00:00:00")
		}
		if endDate != "" {
			q = q.Where("deleted_at <= ?", endDate+" 23:59:59")
		}
		if deletedBy > 0 {
			q = q.Where("deleted_by = ?", deletedBy)
		}

		if err := q.Count(&total).Error; err != nil {
			return nil, 0, err
		}
		if err := q.Order("deleted_at DESC").Offset(offset).Limit(limit).Find(&staffUsers).Error; err != nil {
			return nil, 0, err
		}

		for _, u := range staffUsers {
			dName, dEmail := s.extractUserDeletedInfo(u.DeletedByUser)
			roleName := u.Role
			if u.RoleModel != nil {
				roleName = u.RoleModel.DisplayName
			}
			item := dto.TrashItemResponse{
				ID:             u.ID,
				Module:         "staff",
				Title:          u.FullName,
				Code:           u.Email,
				DeletedAt:      u.DeletedAt.Time,
				DeletedBy:      u.DeletedBy,
				DeletedByName:  dName,
				DeletedByEmail: dEmail,
				DaysRemaining:  s.calculateDaysRemaining(u.DeletedAt.Time, retentionDays),
				Extra: map[string]interface{}{
					"email":     u.Email,
					"phone":     u.Phone,
					"role_name": roleName,
				},
			}
			items = append(items, item)
		}

	default:
		return nil, 0, ErrInvalidModule
	}

	if items == nil {
		items = []dto.TrashItemResponse{}
	}

	return items, total, nil
}

// Restore khôi phục 1 bản ghi từ thùng rác và kiểm tra xung đột dữ liệu
func (s *TrashService) Restore(module string, id uint64, actorID uint64, ip, ua string) error {
	switch module {
	case "product":
		var p models.Product
		if err := s.DB.Unscoped().Preload("Variants").First(&p, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if !p.DeletedAt.Valid {
			return errors.New("sản phẩm này không nằm trong thùng rác")
		}

		// Kiểm tra trùng slug với sản phẩm đang hoạt động
		var count int64
		s.DB.Model(&models.Product{}).Where("slug = ? AND id != ?", p.Slug, id).Count(&count)
		if count > 0 {
			return fmt.Errorf("%w: '%s'", ErrConflictSlug, p.Slug)
		}

		// Kiểm tra trùng SKU chính
		s.DB.Model(&models.Product{}).Where("sku = ? AND id != ?", p.SKU, id).Count(&count)
		if count > 0 {
			return fmt.Errorf("%w: SKU gốc '%s'", ErrConflictSKU, p.SKU)
		}

		// Kiểm tra trùng SKU các biến thể với sản phẩm đang hoạt động
		for _, v := range p.Variants {
			var vCount int64
			s.DB.Model(&models.ProductVariant{}).Where("sku = ? AND id != ?", v.SKU, v.ID).Count(&vCount)
			if vCount > 0 {
				return fmt.Errorf("%w: SKU biến thể '%s'", ErrConflictSKU, v.SKU)
			}
		}

		// Khôi phục Product
		if err := s.DB.Unscoped().Model(&p).Updates(map[string]interface{}{
			"deleted_at": nil,
			"deleted_by": nil,
		}).Error; err != nil {
			return err
		}

		// Khôi phục các biến thể ProductVariant
		s.DB.Unscoped().Model(&models.ProductVariant{}).Where("product_id = ?", id).Updates(map[string]interface{}{
			"deleted_at": nil,
			"deleted_by": nil,
		})

		s.AuditService.Record(actorID, "trash.restore", fmt.Sprintf("Sản phẩm: %s (#%d)", p.Name, p.ID),
			fmt.Sprintf("Khôi phục sản phẩm '%s' từ thùng rác", p.Name), ip, ua)
		return nil

	case "category":
		var c models.Category
		if err := s.DB.Unscoped().First(&c, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if !c.DeletedAt.Valid {
			return errors.New("danh mục này không nằm trong thùng rác")
		}

		// Kiểm tra trùng slug danh mục
		var count int64
		s.DB.Model(&models.Category{}).Where("slug = ? AND id != ?", c.Slug, id).Count(&count)
		if count > 0 {
			return fmt.Errorf("%w: '%s'", ErrConflictSlug, c.Slug)
		}

		if err := s.DB.Unscoped().Model(&c).Updates(map[string]interface{}{
			"deleted_at": nil,
			"deleted_by": nil,
		}).Error; err != nil {
			return err
		}

		s.AuditService.Record(actorID, "trash.restore", fmt.Sprintf("Danh mục: %s (#%d)", c.Name, c.ID),
			fmt.Sprintf("Khôi phục danh mục '%s' từ thùng rác", c.Name), ip, ua)
		return nil

	case "voucher", "coupon":
		var cp models.Coupon
		if err := s.DB.Unscoped().First(&cp, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if !cp.DeletedAt.Valid {
			return errors.New("mã giảm giá này không nằm trong thùng rác")
		}

		// Kiểm tra trùng mã code
		var count int64
		s.DB.Model(&models.Coupon{}).Where("code = ? AND id != ?", cp.Code, id).Count(&count)
		if count > 0 {
			return fmt.Errorf("%w: '%s'", ErrConflictCode, cp.Code)
		}

		if err := s.DB.Unscoped().Model(&cp).Updates(map[string]interface{}{
			"deleted_at": nil,
			"deleted_by": nil,
		}).Error; err != nil {
			return err
		}

		s.AuditService.Record(actorID, "trash.restore", fmt.Sprintf("Mã giảm giá: %s (#%d)", cp.Code, cp.ID),
			fmt.Sprintf("Khôi phục mã giảm giá '%s' từ thùng rác", cp.Code), ip, ua)
		return nil

	case "review":
		var r models.Review
		if err := s.DB.Unscoped().First(&r, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if !r.DeletedAt.Valid {
			return errors.New("đánh giá này không nằm trong thùng rác")
		}

		if err := s.DB.Unscoped().Model(&r).Updates(map[string]interface{}{
			"deleted_at": nil,
			"deleted_by": nil,
		}).Error; err != nil {
			return err
		}

		s.AuditService.Record(actorID, "trash.restore", fmt.Sprintf("Đánh giá #%d", r.ID),
			"Khôi phục đánh giá từ thùng rác", ip, ua)
		return nil

	case "staff":
		var u models.User
		if err := s.DB.Unscoped().First(&u, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if !u.DeletedAt.Valid {
			return errors.New("nhân viên này không nằm trong thùng rác")
		}

		// Kiểm tra trùng email
		var count int64
		s.DB.Model(&models.User{}).Where("email = ? AND id != ?", u.Email, id).Count(&count)
		if count > 0 {
			return fmt.Errorf("%w: '%s'", ErrConflictEmail, u.Email)
		}

		if err := s.DB.Unscoped().Model(&u).Updates(map[string]interface{}{
			"deleted_at": nil,
			"deleted_by": nil,
		}).Error; err != nil {
			return err
		}

		s.AuditService.Record(actorID, "trash.restore", fmt.Sprintf("Nhân viên: %s (#%d)", u.Email, u.ID),
			fmt.Sprintf("Khôi phục tài khoản nhân viên '%s' từ thùng rác", u.FullName), ip, ua)
		return nil

	default:
		return ErrInvalidModule
	}
}

// RestoreBatch khôi phục nhiều bản ghi cùng lúc
func (s *TrashService) RestoreBatch(module string, ids []uint64, actorID uint64, ip, ua string) (*dto.RestoreResponse, error) {
	resp := &dto.RestoreResponse{}
	for _, id := range ids {
		err := s.Restore(module, id, actorID, ip, ua)
		if err != nil {
			resp.FailedCount++
			resp.Errors = append(resp.Errors, fmt.Sprintf("ID %d: %v", id, err))
		} else {
			resp.SuccessCount++
		}
	}
	s.AuditService.Record(actorID, "trash.restore_batch", fmt.Sprintf("Module: %s", module),
		fmt.Sprintf("Khôi phục hàng loạt %s: %d thành công, %d thất bại", module, resp.SuccessCount, resp.FailedCount), ip, ua)
	return resp, nil
}

// Purge xóa vĩnh viễn 1 bản ghi khỏi database (và dọn dẹp file ảnh đối với sản phẩm)
func (s *TrashService) Purge(module string, id uint64, actorID uint64, ip, ua string) error {
	switch module {
	case "product":
		var p models.Product
		if err := s.DB.Unscoped().First(&p, id).Error; err != nil {
			return ErrTrashItemNotFound
		}

		// Dọn file ảnh vật lý trên ổ cứng
		s.deleteProductMediaFiles(id)

		// Xóa vĩnh viễn ảnh, biến thể và sản phẩm khỏi DB
		s.DB.Unscoped().Where("product_id = ?", id).Delete(&models.ProductImage{})
		s.DB.Unscoped().Where("product_id = ?", id).Delete(&models.ProductVariant{})
		if err := s.DB.Unscoped().Delete(&p).Error; err != nil {
			return err
		}

		s.AuditService.Record(actorID, "trash.purge", fmt.Sprintf("Sản phẩm: %s (#%d)", p.Name, p.ID),
			fmt.Sprintf("XÓA VĨNH VIỄN sản phẩm '%s' và dọn dẹp media", p.Name), ip, ua)
		return nil

	case "category":
		var c models.Category
		if err := s.DB.Unscoped().First(&c, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if err := s.DB.Unscoped().Delete(&c).Error; err != nil {
			return err
		}
		s.AuditService.Record(actorID, "trash.purge", fmt.Sprintf("Danh mục: %s (#%d)", c.Name, c.ID),
			fmt.Sprintf("XÓA VĨNH VIỄN danh mục '%s'", c.Name), ip, ua)
		return nil

	case "voucher", "coupon":
		var cp models.Coupon
		if err := s.DB.Unscoped().First(&cp, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if err := s.DB.Unscoped().Delete(&cp).Error; err != nil {
			return err
		}
		s.AuditService.Record(actorID, "trash.purge", fmt.Sprintf("Mã giảm giá: %s (#%d)", cp.Code, cp.ID),
			fmt.Sprintf("XÓA VĨNH VIỄN mã giảm giá '%s'", cp.Code), ip, ua)
		return nil

	case "review":
		var r models.Review
		if err := s.DB.Unscoped().First(&r, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if err := s.DB.Unscoped().Delete(&r).Error; err != nil {
			return err
		}
		s.AuditService.Record(actorID, "trash.purge", fmt.Sprintf("Đánh giá #%d", r.ID),
			"XÓA VĨNH VIỄN đánh giá", ip, ua)
		return nil

	case "staff":
		var u models.User
		if err := s.DB.Unscoped().First(&u, id).Error; err != nil {
			return ErrTrashItemNotFound
		}
		if err := s.DB.Unscoped().Delete(&u).Error; err != nil {
			return err
		}
		s.AuditService.Record(actorID, "trash.purge", fmt.Sprintf("Nhân viên: %s (#%d)", u.Email, u.ID),
			fmt.Sprintf("XÓA VĨNH VIỄN nhân viên '%s'", u.FullName), ip, ua)
		return nil

	default:
		return ErrInvalidModule
	}
}

// Empty dọn sạch toàn bộ thùng rác của một module
func (s *TrashService) Empty(module string, actorID uint64, ip, ua string) (int64, error) {
	var count int64

	switch module {
	case "product":
		var products []models.Product
		s.DB.Unscoped().Where("deleted_at IS NOT NULL").Find(&products)
		count = int64(len(products))
		for _, p := range products {
			_ = s.Purge("product", p.ID, actorID, ip, ua)
		}

	case "category":
		res := s.DB.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Category{})
		count = res.RowsAffected

	case "voucher", "coupon":
		res := s.DB.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Coupon{})
		count = res.RowsAffected

	case "review":
		res := s.DB.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Review{})
		count = res.RowsAffected

	case "staff":
		res := s.DB.Unscoped().Where("deleted_at IS NOT NULL AND role != 'customer'").Delete(&models.User{})
		count = res.RowsAffected

	default:
		return 0, ErrInvalidModule
	}

	s.AuditService.Record(actorID, "trash.empty", fmt.Sprintf("Module: %s", module),
		fmt.Sprintf("Dọn sạch thùng rác module %s (đã xóa vĩnh viễn %d mục)", module, count), ip, ua)
	return count, nil
}

// StartAutoCleanup chạy goroutine định kỳ (24h 1 lần) để dọn các bản ghi quá hạn TRASH_RETENTION_DAYS
func (s *TrashService) StartAutoCleanup(ctx context.Context) {
	go func() {
		// Chạy ngay 1 lần sau khi khởi động 10 giây
		time.Sleep(10 * time.Second)
		s.runCleanupPass()

		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.runCleanupPass()
			}
		}
	}()
}

func (s *TrashService) runCleanupPass() {
	retentionDays := s.GetRetentionDays()
	cutoff := time.Now().AddDate(0, 0, -retentionDays)
	log.Printf("[TRASH CRON] Bắt đầu quét dọn thùng rác (xóa các mục cũ hơn %d ngày, trước %s)...",
		retentionDays, cutoff.Format("2006-01-02 15:04:05"))

	// 1. Dọn sản phẩm
	var expiredProducts []models.Product
	s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deleted_at < ?", cutoff).Find(&expiredProducts)
	for _, p := range expiredProducts {
		_ = s.Purge("product", p.ID, 0, "127.0.0.1", "System Auto-Cleanup Ticker")
	}

	// 2. Dọn danh mục
	s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deleted_at < ?", cutoff).Delete(&models.Category{})

	// 3. Dọn mã giảm giá
	s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deleted_at < ?", cutoff).Delete(&models.Coupon{})

	// 4. Dọn đánh giá
	s.DB.Unscoped().Where("deleted_at IS NOT NULL AND deleted_at < ?", cutoff).Delete(&models.Review{})

	// 5. Dọn nhân viên
	s.DB.Unscoped().Where("deleted_at IS NOT NULL AND role != 'customer' AND deleted_at < ?", cutoff).Delete(&models.User{})

	log.Printf("[TRASH CRON] Hoàn thành dọn dẹp thùng rác tự động.")
}

// deleteProductMediaFiles dọn các file ảnh trên ổ cứng của sản phẩm khi xóa vĩnh viễn
func (s *TrashService) deleteProductMediaFiles(productID uint64) {
	if s.UploadDir == "" {
		return
	}
	var images []models.ProductImage
	s.DB.Unscoped().Where("product_id = ?", productID).Find(&images)

	for _, img := range images {
		if img.URL == "" {
			continue
		}
		// URL dạng: /uploads/2026/10/filename.jpg
		relPath := strings.TrimPrefix(img.URL, "/uploads/")
		relPath = strings.TrimPrefix(relPath, "uploads/")
		fullPath := filepath.Join(s.UploadDir, filepath.FromSlash(relPath))

		if err := os.Remove(fullPath); err == nil {
			log.Printf("[TRASH PURGE] Đã xóa file ảnh: %s", fullPath)
		}
	}
}

func (s *TrashService) calculateDaysRemaining(deletedAt time.Time, retentionDays int) int {
	passedDays := int(time.Since(deletedAt).Hours() / 24)
	remaining := retentionDays - passedDays
	if remaining < 0 {
		return 0
	}
	return remaining
}

func (s *TrashService) extractUserDeletedInfo(user *models.User) (string, string) {
	if user == nil {
		return "Hệ thống", ""
	}
	return user.FullName, user.Email
}
