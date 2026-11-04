package database

import (
	"log"

	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

// SeedRBAC tự động khởi tạo danh sách Permissions, Roles và gán quyền mặc định
func SeedRBAC(db *gorm.DB) error {
	// 1. Danh sách Permissions đầy đủ theo chuẩn module.action
	permissions := []models.Permission{
		// Dashboard
		{Code: "dashboard.view", Name: "Xem tổng quan Dashboard", Module: "dashboard", Description: "Xem số liệu thống kê tổng quát trên trang chủ admin"},

		// Sản phẩm
		{Code: "product.view", Name: "Xem sản phẩm", Module: "product", Description: "Xem danh sách và chi tiết sản phẩm"},
		{Code: "product.create", Name: "Thêm sản phẩm", Module: "product", Description: "Tạo sản phẩm và các biến thể mới"},
		{Code: "product.update", Name: "Sửa sản phẩm", Module: "product", Description: "Cập nhật thông tin, giá bán, hình ảnh sản phẩm"},
		{Code: "product.delete", Name: "Xóa sản phẩm", Module: "product", Description: "Xóa sản phẩm khỏi hệ thống"},

		// Danh mục
		{Code: "category.view", Name: "Xem danh mục", Module: "category", Description: "Xem cây danh mục sản phẩm"},
		{Code: "category.create", Name: "Thêm danh mục", Module: "category", Description: "Tạo danh mục sản phẩm mới"},
		{Code: "category.update", Name: "Sửa danh mục", Module: "category", Description: "Cập nhật tên, icon, ảnh danh mục"},
		{Code: "category.delete", Name: "Xóa danh mục", Module: "category", Description: "Xóa danh mục sản phẩm"},

		// Thương hiệu
		{Code: "brand.view", Name: "Xem thương hiệu", Module: "brand", Description: "Xem danh sách các hãng sản xuất"},
		{Code: "brand.create", Name: "Thêm thương hiệu", Module: "brand", Description: "Tạo thương hiệu mới"},
		{Code: "brand.update", Name: "Sửa thương hiệu", Module: "brand", Description: "Cập nhật tên, logo thương hiệu"},
		{Code: "brand.delete", Name: "Xóa thương hiệu", Module: "brand", Description: "Xóa thương hiệu"},

		// Kho & Tồn kho
		{Code: "inventory.view", Name: "Xem tồn kho", Module: "inventory", Description: "Xem số lượng tồn kho và cảnh báo hết hàng"},
		{Code: "inventory.update", Name: "Cập nhật kho", Module: "inventory", Description: "Cập nhật số lượng tồn kho biến thể sản phẩm"},

		// Đơn hàng
		{Code: "order.view", Name: "Xem đơn hàng", Module: "order", Description: "Xem danh sách và thông tin chi tiết đơn hàng"},
		{Code: "order.update_status", Name: "Xử lý đơn hàng", Module: "order", Description: "Chuyển trạng thái xác nhận, giao hàng, hoàn thành đơn"},
		{Code: "order.cancel", Name: "Hủy đơn hàng", Module: "order", Description: "Hủy đơn hàng của khách"},

		// Mã giảm giá (Vouchers / Coupons)
		{Code: "voucher.view", Name: "Xem mã giảm giá", Module: "voucher", Description: "Xem danh sách mã khuyến mãi"},
		{Code: "voucher.create", Name: "Tạo mã giảm giá", Module: "voucher", Description: "Tạo voucher khuyến mãi mới"},
		{Code: "voucher.update", Name: "Sửa mã giảm giá", Module: "voucher", Description: "Cập nhật điều kiện, thời hạn voucher"},
		{Code: "voucher.delete", Name: "Xóa mã giảm giá", Module: "voucher", Description: "Xóa voucher khuyến mãi"},

		// Đánh giá
		{Code: "review.view", Name: "Xem đánh giá", Module: "review", Description: "Xem nhận xét và đánh giá sao của khách"},
		{Code: "review.moderate", Name: "Duyệt đánh giá", Module: "review", Description: "Duyệt hiển thị, từ chối hoặc phản hồi đánh giá"},

		// Khách hàng
		{Code: "customer.view", Name: "Xem khách hàng", Module: "customer", Description: "Xem danh sách khách hàng và lịch sử mua"},
		{Code: "customer.update", Name: "Khóa / Mở tài khoản khách", Module: "customer", Description: "Khóa hoặc mở lại tài khoản khách hàng"},

		// Liên hệ
		{Code: "contact.view", Name: "Xem liên hệ", Module: "contact", Description: "Xem tin nhắn góp ý, liên hệ từ khách hàng"},
		{Code: "contact.manage", Name: "Xử lý liên hệ", Module: "contact", Description: "Đánh dấu đã đọc hoặc xóa liên hệ"},

		// Banner & Quảng cáo
		{Code: "banner.view", Name: "Xem banner", Module: "banner", Description: "Xem danh sách banner trang chủ"},
		{Code: "banner.manage", Name: "Quản lý banner", Module: "banner", Description: "Thêm, sửa, sắp xếp, xóa banner"},

		// Báo cáo & Doanh thu
		{Code: "report.view", Name: "Xem báo cáo doanh thu", Module: "report", Description: "Xem biểu đồ doanh thu, báo cáo tài chính và giao dịch SePay"},

		// Quản lý nhân viên
		{Code: "staff.view", Name: "Xem nhân viên", Module: "staff", Description: "Xem danh sách nhân viên nội bộ"},
		{Code: "staff.manage", Name: "Quản lý nhân viên", Module: "staff", Description: "Thêm nhân viên, đổi vai trò, khóa tài khoản, reset mật khẩu"},

		// Quản lý vai trò & quyền
		{Code: "role.view", Name: "Xem vai trò & quyền", Module: "role", Description: "Xem danh sách vai trò và phân quyền"},
		{Code: "role.manage", Name: "Quản lý vai trò", Module: "role", Description: "Tạo, sửa vai trò và ma trận phân quyền"},

		// Cài đặt hệ thống
		{Code: "setting.view", Name: "Xem cài đặt", Module: "setting", Description: "Xem cấu hình chung của cửa hàng"},
		{Code: "setting.manage", Name: "Quản lý cài đặt", Module: "setting", Description: "Lưu cấu hình cửa hàng, gửi email thử nghiệm"},

		// Cấu hình vận chuyển
		{Code: "shipping.view", Name: "Xem cấu hình vận chuyển", Module: "shipping", Description: "Xem bảng giá, bậc thang và cài đặt vận chuyển theo khoảng cách"},
		{Code: "shipping.manage", Name: "Quản lý cấu hình vận chuyển", Module: "shipping", Description: "Cập nhật tọa độ kho, bậc thang cước phí, phụ phí cồng kềnh và ngưỡng freeship"},

		// Nhật ký hoạt động (Audit Logs)
		{Code: "audit_log.view", Name: "Xem nhật ký hoạt động", Module: "audit_log", Description: "Xem lịch sử thay đổi quyền, khóa tài khoản và thao tác quản trị"},

		// Thùng rác & Khôi phục
		{Code: "trash.view", Name: "Xem thùng rác", Module: "trash", Description: "Xem danh sách các mục đã xóa tạm thời trong thùng rác"},
		{Code: "trash.restore", Name: "Khôi phục thùng rác", Module: "trash", Description: "Khôi phục sản phẩm, danh mục, mã giảm giá, đánh giá hoặc nhân viên"},
		{Code: "trash.purge", Name: "Xóa vĩnh viễn thùng rác", Module: "trash", Description: "Xóa vĩnh viễn dữ liệu khỏi hệ thống và dọn dẹp file media"},

		// Xuất dữ liệu Excel
		{Code: "export.product", Name: "Xuất Excel sản phẩm", Module: "export", Description: "Xuất danh sách sản phẩm và biến thể ra file Excel"},
		{Code: "export.order", Name: "Xuất Excel đơn hàng", Module: "export", Description: "Xuất danh sách và chi tiết đơn hàng ra file Excel"},
		{Code: "export.inventory", Name: "Xuất Excel kho hàng", Module: "export", Description: "Xuất dữ liệu tồn kho sản phẩm ra file Excel"},
		{Code: "export.customer", Name: "Xuất Excel khách hàng", Module: "export", Description: "Xuất danh sách khách hàng ra file Excel"},
		{Code: "export.voucher", Name: "Xuất Excel mã giảm giá", Module: "export", Description: "Xuất danh sách mã khuyến mãi ra file Excel"},
		{Code: "export.revenue", Name: "Xuất Excel doanh thu", Module: "export", Description: "Xuất báo cáo tài chính và doanh thu ra file Excel"},
	}

	// 2. Chèn hoặc cập nhật Permissions
	permMap := make(map[string]models.Permission)
	for _, p := range permissions {
		var existing models.Permission
		if err := db.Where("code = ?", p.Code).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&p).Error; err == nil {
					permMap[p.Code] = p
				}
			}
		} else {
			// Cập nhật tên, mô tả nếu có thay đổi
			existing.Name = p.Name
			existing.Module = p.Module
			existing.Description = p.Description
			db.Save(&existing)
			permMap[p.Code] = existing
		}
	}

	// Nạp lại toàn bộ permissions từ DB để lấy đúng ID
	var allPerms []models.Permission
	db.Find(&allPerms)
	for _, p := range allPerms {
		permMap[p.Code] = p
	}

	// 3. Khởi tạo 5 vai trò mặc định
	type roleSeed struct {
		Name        string
		DisplayName string
		Description string
		IsSystem    bool
		PermCodes   []string
	}

	// Thu thập tất cả perm codes
	allPermCodes := make([]string, 0, len(allPerms))
	for _, p := range allPerms {
		allPermCodes = append(allPermCodes, p.Code)
	}

	// Manager: tất cả ngoại trừ staff.manage và role.manage
	managerPermCodes := make([]string, 0)
	for _, c := range allPermCodes {
		if c != "staff.manage" && c != "role.manage" {
			managerPermCodes = append(managerPermCodes, c)
		}
	}

	defaultRoles := []roleSeed{
		{
			Name:        "super_admin",
			DisplayName: "Quản trị viên tối cao",
			Description: "Toàn quyền quản trị toàn bộ hệ thống, không thể xóa hoặc thu hồi",
			IsSystem:    true,
			PermCodes:   allPermCodes,
		},
		{
			Name:        "manager",
			DisplayName: "Quản lý cửa hàng",
			Description: "Quản lý toàn diện sản phẩm, đơn hàng, khách hàng, thống kê (không quản lý nhân sự)",
			IsSystem:    true,
			PermCodes:   managerPermCodes,
		},
		{
			Name:        "sales",
			DisplayName: "Nhân viên bán hàng",
			Description: "Tiếp nhận và xử lý đơn hàng, duyệt đánh giá, chăm sóc khách hàng",
			IsSystem:    true,
			PermCodes: []string{
				"dashboard.view",
				"product.view",
				"order.view",
				"order.update_status",
				"order.cancel",
				"customer.view",
				"review.view",
				"review.moderate",
				"voucher.view",
				"contact.view",
				"export.order",
				"export.customer",
				"export.voucher",
			},
		},
		{
			Name:        "warehouse",
			DisplayName: "Nhân viên kho",
			Description: "Quản lý kho hàng, nhập xuất tồn kho và theo dõi sản phẩm (không xem doanh thu)",
			IsSystem:    true,
			PermCodes: []string{
				"dashboard.view",
				"product.view",
				"product.update",
				"inventory.view",
				"inventory.update",
				"category.view",
				"brand.view",
				"export.inventory",
				"export.product",
			},
		},
		{
			Name:        "content",
			DisplayName: "Nhân viên nội dung",
			Description: "Biên tập danh mục, bài viết, hình ảnh, thông số sản phẩm và banner",
			IsSystem:    true,
			PermCodes: []string{
				"dashboard.view",
				"product.view",
				"product.create",
				"product.update",
				"category.view",
				"category.create",
				"category.update",
				"brand.view",
				"brand.create",
				"brand.update",
				"banner.view",
				"banner.manage",
				"export.product",
			},
		},
	}

	for _, rSeed := range defaultRoles {
		var role models.Role
		err := db.Where("name = ?", rSeed.Name).First(&role).Error
		if err == gorm.ErrRecordNotFound {
			role = models.Role{
				Name:        rSeed.Name,
				DisplayName: rSeed.DisplayName,
				Description: rSeed.Description,
				IsSystem:    rSeed.IsSystem,
			}
			if err := db.Create(&role).Error; err != nil {
				log.Printf("[LỖI] Không thể tạo vai trò %s: %v", rSeed.Name, err)
				continue
			}
			log.Printf("[INFO] Đã tạo vai trò mặc định: %s (%s)", role.DisplayName, role.Name)
		} else if err == nil {
			// Cập nhật thông tin mô tả / is_system
			role.DisplayName = rSeed.DisplayName
			role.Description = rSeed.Description
			role.IsSystem = rSeed.IsSystem
			db.Save(&role)
		}

		// Gán quyền cho vai trò
		var targetPerms []models.Permission
		for _, code := range rSeed.PermCodes {
			if p, ok := permMap[code]; ok {
				targetPerms = append(targetPerms, p)
			}
		}

		// Nếu vai trò chưa có quyền hoặc là super_admin thì đồng bộ quyền
		var countPerms int64
		db.Model(&role).Association("Permissions").Count()
		if role.Name == "super_admin" || countPerms == 0 {
			if err := db.Model(&role).Association("Permissions").Replace(&targetPerms); err != nil {
				log.Printf("[LỖI] Gán quyền cho vai trò %s thất bại: %v", role.Name, err)
			}
		}
	}

	// 4. Đảm bảo tài khoản admin hiện tại được gán vai trò super_admin
	var superAdminRole models.Role
	if err := db.Where("name = 'super_admin'").First(&superAdminRole).Error; err == nil {
		var adminUsers []models.User
		db.Where("role = 'admin' AND (role_id IS NULL OR role_id = 0)").Find(&adminUsers)
		for _, u := range adminUsers {
			db.Model(&u).Updates(map[string]interface{}{
				"role_id": superAdminRole.ID,
				"status":  "active",
			})
			log.Printf("[INFO] Đã gán vai trò super_admin cho tài khoản: %s (ID: %d)", u.Email, u.ID)
		}
	}

	return nil
}
