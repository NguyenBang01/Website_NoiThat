package routes

import (
	"context"
	"net/http"
	"time"

	"furniture-shop/backend/internal/config"
	"furniture-shop/backend/internal/handlers"
	"furniture-shop/backend/internal/middleware"
	"furniture-shop/backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Setup khai báo toàn bộ đường dẫn API của hệ thống
func Setup(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// Bật CORS cho toàn bộ server
	r.Use(middleware.CORS())

	// Kiểm tra server còn sống
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Cho phép xem ảnh đã upload: http://localhost:8080/uploads/...
	r.Static("/uploads", cfg.UploadDir)

	// Khởi tạo các services
	mailService := services.NewMailService(cfg)
	telegramService := services.NewTelegramService(cfg)

	// Dịch vụ Phân quyền (RBAC) & Audit Log
	rbacService := services.NewRBACService(db)
	auditService := services.NewAuditService(db)
	staffService := services.NewStaffService(db, auditService, rbacService)
	roleService := services.NewRoleService(db, rbacService, auditService)

	authService := &services.AuthService{
		DB:             db,
		JWTSecret:      cfg.JWTSecret,
		JWTExpireHours: cfg.JWTExpireHours,
		MailService:    mailService,
		GoogleClientID: cfg.GoogleClientID,
		RBACService:    rbacService,
	}
	categoryService := &services.CategoryService{DB: db}
	productService := &services.ProductService{DB: db}
	uploadService := &services.UploadService{
		UploadDir:    cfg.UploadDir,
		MaxSizeBytes: int64(cfg.MaxUploadMB) * 1024 * 1024,
	}
	cartService := services.NewCartService(db)
	couponService := services.NewCouponService(db)
	orderService := services.NewOrderService(db, mailService, telegramService)
	accountService := services.NewAccountService(db, cfg.JWTSecret, cfg.JWTExpireHours)
	reviewService := services.NewReviewService(db)
	wishlistService := services.NewWishlistService(db)
	bannerService := services.NewBannerService(db)
	settingService := services.NewSettingService(db)
	contactService := services.NewContactService(db, mailService)
	customerService := services.NewCustomerService(db)
	dashboardService := services.NewDashboardService(db)
	sepayService := services.NewSepayService(db, cfg.SepayAPIKey, mailService, telegramService)

	// Khởi tạo các handlers
	authHandler := &handlers.AuthHandler{Service: authService, RBACService: rbacService}
	categoryHandler := &handlers.CategoryHandler{Service: categoryService}
	productHandler := &handlers.ProductHandler{Service: productService}
	brandHandler := &handlers.BrandHandler{DB: db}
	uploadHandler := &handlers.UploadHandler{Service: uploadService}
	cartHandler := handlers.NewCartHandler(cartService)
	couponHandler := handlers.NewCouponHandler(couponService)
	orderHandler := handlers.NewOrderHandler(orderService)
	accountHandler := handlers.NewAccountHandler(accountService)
	reviewHandler := handlers.NewReviewHandler(reviewService, productService)
	wishlistHandler := handlers.NewWishlistHandler(wishlistService)
	bannerHandler := handlers.NewBannerHandler(bannerService)
	settingHandler := handlers.NewSettingHandler(settingService, mailService)
	contactHandler := handlers.NewContactHandler(contactService)
	customerHandler := handlers.NewCustomerHandler(customerService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)
	sepayHandler := handlers.NewSepayHandler(sepayService, cfg.SepayAPIKey)

	staffHandler := handlers.NewStaffHandler(staffService)
	roleHandler := handlers.NewRoleHandler(roleService)
	auditLogHandler := handlers.NewAuditLogHandler(auditService)

	trashService := services.NewTrashService(db, auditService, cfg.UploadDir)
	trashService.StartAutoCleanup(context.Background())
	trashHandler := handlers.NewTrashHandler(trashService)

	exportService := services.NewExportService(db, auditService)
	exportHandler := handlers.NewExportHandler(exportService)

	shippingService := services.NewShippingService(db, nil, nil)
	orderService.SetShippingService(shippingService)
	shippingHandler := handlers.NewShippingHandler(shippingService, auditService)

	api := r.Group("/api/v1")

	// ==========================================
	// 0. CỔNG THANH TOÁN (SePay Webhook & Check)
	// ==========================================
	api.POST("/payment/sepay/webhook", sepayHandler.Webhook)
	api.GET("/payment/check/:orderCode", sepayHandler.CheckStatus)
	api.POST("/payment/cancel/:orderCode", sepayHandler.CancelUnpaid)

	// ==========================================
	// 1. PUBLIC API (Không cần đăng nhập)
	// ==========================================
	api.GET("/categories", categoryHandler.List)
	api.GET("/brands", brandHandler.List)
	api.GET("/products", productHandler.PublicList)
	api.GET("/products/:slug", productHandler.PublicDetail)
	api.GET("/product-filters", productHandler.PublicFilters)
	api.GET("/products/:slug/reviews", reviewHandler.ProductReviews)
	api.GET("/banners", bannerHandler.List)
	api.GET("/settings", settingHandler.GetAll)
	api.POST("/contacts", contactHandler.Submit)
	api.POST("/coupons/validate", couponHandler.Validate)
	api.POST("/shipping/estimate", shippingHandler.EstimateShipping)

	// Xác thực (Auth)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", middleware.LoginRateLimiter(5, 5*time.Minute), authHandler.Login)
		auth.POST("/google", authHandler.GoogleLogin)
		auth.POST("/forgot-password", middleware.LoginRateLimiter(5, 5*time.Minute), authHandler.ForgotPassword)
		auth.POST("/reset-password", middleware.LoginRateLimiter(5, 5*time.Minute), authHandler.ResetPassword)
		auth.GET("/me", middleware.AuthRequired(cfg.JWTSecret), authHandler.Me)
	}

	// ==========================================
	// 2. KHÁCH HÀNG ĐÃ ĐĂNG NHẬP (User Auth Protected)
	// ==========================================
	userAuth := api.Group("", middleware.AuthRequired(cfg.JWTSecret))
	{
		account := userAuth.Group("/account")
		{
			account.GET("/profile", accountHandler.GetProfile)
			account.PUT("/profile", accountHandler.UpdateProfile)
			account.POST("/change-password", accountHandler.ChangePassword)
			account.POST("/refresh-token", accountHandler.RefreshToken)
			account.POST("/logout", accountHandler.Logout)

			account.GET("/addresses", accountHandler.ListAddresses)
			account.POST("/addresses", accountHandler.CreateAddress)
			account.PUT("/addresses/:id", accountHandler.UpdateAddress)
			account.DELETE("/addresses/:id", accountHandler.DeleteAddress)
			account.PUT("/addresses/:id/default", accountHandler.SetDefaultAddress)
		}

		cart := userAuth.Group("/cart")
		{
			cart.GET("", cartHandler.GetCart)
			cart.POST("/items", cartHandler.AddItem)
			cart.PUT("/items/:id", cartHandler.UpdateItem)
			cart.DELETE("/items/:id", cartHandler.RemoveItem)
			cart.DELETE("/clear", cartHandler.ClearCart)
		}

		orders := userAuth.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.MyOrders)
			orders.GET("/:id", orderHandler.MyOrderDetail)
			orders.POST("/:id/cancel", orderHandler.CancelOrder)
		}

		reviews := userAuth.Group("/reviews")
		{
			reviews.POST("", reviewHandler.CreateReview)
			reviews.GET("/my", reviewHandler.MyReviews)
		}

		wishlist := userAuth.Group("/wishlist")
		{
			wishlist.GET("", wishlistHandler.ListWishlist)
			wishlist.POST("", wishlistHandler.AddToWishlist)
			wishlist.DELETE("/:productId", wishlistHandler.RemoveFromWishlist)
		}
	}

	// ==========================================
	// 3. QUẢN TRỊ VIÊN & NHÂN VIÊN (Admin Protected với RBAC)
	// ==========================================
	admin := api.Group("/admin",
		middleware.AuthRequired(cfg.JWTSecret),
		middleware.StaffRequired(),
	)
	{
		admin.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"success": true, "message": "Xin chào quản trị viên"})
		})

		// Thông tin nhân viên kèm danh sách quyền
		admin.GET("/me", authHandler.AdminMe)

		// Quản lý danh mục
		admin.GET("/categories", middleware.RequirePermission(rbacService, "category.view"), categoryHandler.AdminList)
		admin.POST("/categories", middleware.RequirePermission(rbacService, "category.create"), categoryHandler.Create)
		admin.PUT("/categories/:id", middleware.RequirePermission(rbacService, "category.update"), categoryHandler.Update)
		admin.DELETE("/categories/:id", middleware.RequirePermission(rbacService, "category.delete"), categoryHandler.Delete)

		// Quản lý thương hiệu
		admin.GET("/brands", middleware.RequirePermission(rbacService, "brand.view"), brandHandler.List)
		admin.POST("/brands", middleware.RequirePermission(rbacService, "brand.create"), brandHandler.Create)
		admin.PUT("/brands/:id", middleware.RequirePermission(rbacService, "brand.update"), brandHandler.Update)
		admin.DELETE("/brands/:id", middleware.RequirePermission(rbacService, "brand.delete"), brandHandler.Delete)

		// Upload file/media
		admin.POST("/uploads", uploadHandler.Upload)

		// Quản lý sản phẩm
		admin.GET("/products", middleware.RequirePermission(rbacService, "product.view"), productHandler.AdminList)
		admin.GET("/products/:id", middleware.RequirePermission(rbacService, "product.view"), productHandler.AdminGet)
		admin.POST("/products", middleware.RequirePermission(rbacService, "product.create"), productHandler.Create)
		admin.PUT("/products/:id", middleware.RequirePermission(rbacService, "product.update"), productHandler.Update)
		admin.DELETE("/products/:id", middleware.RequirePermission(rbacService, "product.delete"), productHandler.Delete)

		// Quản lý mã giảm giá (Vouchers)
		admin.GET("/coupons", middleware.RequirePermission(rbacService, "voucher.view"), couponHandler.List)
		admin.GET("/coupons/:id", middleware.RequirePermission(rbacService, "voucher.view"), couponHandler.Get)
		admin.POST("/coupons", middleware.RequirePermission(rbacService, "voucher.create"), couponHandler.Create)
		admin.PUT("/coupons/:id", middleware.RequirePermission(rbacService, "voucher.update"), couponHandler.Update)
		admin.DELETE("/coupons/:id", middleware.RequirePermission(rbacService, "voucher.delete"), couponHandler.Delete)

		// Quản lý đơn hàng
		admin.GET("/orders", middleware.RequirePermission(rbacService, "order.view"), orderHandler.AdminOrders)
		admin.GET("/orders/:id", middleware.RequirePermission(rbacService, "order.view"), orderHandler.AdminOrderDetail)
		admin.PUT("/orders/:id/status", middleware.RequirePermission(rbacService, "order.update_status"), orderHandler.UpdateStatus)

		// Quản lý đánh giá
		admin.GET("/reviews", middleware.RequirePermission(rbacService, "review.view"), reviewHandler.AdminListReviews)
		admin.PUT("/reviews/:id", middleware.RequirePermission(rbacService, "review.moderate"), reviewHandler.AdminUpdateReview)
		admin.DELETE("/reviews/:id", middleware.RequirePermission(rbacService, "review.moderate"), reviewHandler.AdminDeleteReview)

		// Quản lý banner
		admin.GET("/banners", middleware.RequirePermission(rbacService, "banner.view"), bannerHandler.AdminList)
		admin.POST("/banners", middleware.RequirePermission(rbacService, "banner.manage"), bannerHandler.Create)
		admin.PUT("/banners/:id", middleware.RequirePermission(rbacService, "banner.manage"), bannerHandler.Update)
		admin.DELETE("/banners/:id", middleware.RequirePermission(rbacService, "banner.manage"), bannerHandler.Delete)

		// Cài đặt cửa hàng
		admin.PUT("/settings", middleware.RequirePermission(rbacService, "setting.manage"), settingHandler.Update)
		admin.POST("/settings/test-email", middleware.RequirePermission(rbacService, "setting.manage"), settingHandler.TestEmail)

		// Quản lý liên hệ
		admin.GET("/contacts", middleware.RequirePermission(rbacService, "contact.view"), contactHandler.List)
		admin.PUT("/contacts/:id/read", middleware.RequirePermission(rbacService, "contact.manage"), contactHandler.MarkAsRead)
		admin.DELETE("/contacts/:id", middleware.RequirePermission(rbacService, "contact.manage"), contactHandler.Delete)

		// Quản lý khách hàng
		admin.GET("/customers", middleware.RequirePermission(rbacService, "customer.view"), customerHandler.List)
		admin.GET("/customers/:id", middleware.RequirePermission(rbacService, "customer.view"), customerHandler.Get)
		admin.PUT("/customers/:id/toggle-status", middleware.RequirePermission(rbacService, "customer.update"), customerHandler.ToggleStatus)

		// Thống kê / Dashboard & Báo cáo
		admin.GET("/dashboard/overview", middleware.RequirePermission(rbacService, "dashboard.view"), dashboardHandler.Overview)
		admin.GET("/dashboard/recent-orders", middleware.RequirePermission(rbacService, "order.view"), dashboardHandler.RecentOrders)
		admin.GET("/dashboard/low-stock", middleware.RequirePermission(rbacService, "inventory.view"), dashboardHandler.LowStock)
		admin.GET("/dashboard/revenue-by-day", middleware.RequirePermission(rbacService, "report.view"), dashboardHandler.RevenueByDay)
		admin.GET("/dashboard/revenue-by-month", middleware.RequirePermission(rbacService, "report.view"), dashboardHandler.RevenueByMonth)
		admin.GET("/dashboard/top-products", middleware.RequirePermission(rbacService, "report.view"), dashboardHandler.TopProducts)

		// Lịch sử giao dịch ngân hàng
		admin.GET("/payment/sepay/transactions", middleware.RequirePermission(rbacService, "report.view"), sepayHandler.ListTransactions)

		// ==========================================
		// RBAC: QUẢN LÝ NHÂN VIÊN
		// ==========================================
		admin.GET("/staff", middleware.RequirePermission(rbacService, "staff.view"), staffHandler.List)
		admin.GET("/staff/:id", middleware.RequirePermission(rbacService, "staff.view"), staffHandler.Get)
		admin.POST("/staff", middleware.RequirePermission(rbacService, "staff.manage"), staffHandler.Create)
		admin.PUT("/staff/:id", middleware.RequirePermission(rbacService, "staff.manage"), staffHandler.Update)
		admin.PATCH("/staff/:id/status", middleware.RequirePermission(rbacService, "staff.manage"), staffHandler.ChangeStatus)
		admin.POST("/staff/:id/reset-password", middleware.RequirePermission(rbacService, "staff.manage"), staffHandler.ResetPassword)
		admin.DELETE("/staff/:id", middleware.RequirePermission(rbacService, "staff.manage"), staffHandler.Delete)

		// ==========================================
		// RBAC: QUẢN LÝ VAI TRÒ & PHÂN QUYỀN
		// ==========================================
		admin.GET("/roles", middleware.RequirePermission(rbacService, "role.view"), roleHandler.List)
		admin.GET("/roles/:id", middleware.RequirePermission(rbacService, "role.view"), roleHandler.Get)
		admin.POST("/roles", middleware.RequirePermission(rbacService, "role.manage"), roleHandler.Create)
		admin.PUT("/roles/:id", middleware.RequirePermission(rbacService, "role.manage"), roleHandler.Update)
		admin.DELETE("/roles/:id", middleware.RequirePermission(rbacService, "role.manage"), roleHandler.Delete)
		admin.GET("/permissions", middleware.RequireAnyPermission(rbacService, "role.view", "role.manage"), roleHandler.ListPermissions)

		// ==========================================
		// RBAC: NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS)
		// ==========================================
		admin.GET("/audit-logs", middleware.RequirePermission(rbacService, "audit_log.view"), auditLogHandler.List)

		// ==========================================
		// THÙNG RÁC & KHÔI PHỤC (TRASH)
		// ==========================================
		admin.GET("/trash", middleware.RequirePermission(rbacService, "trash.view"), trashHandler.List)
		admin.POST("/trash/:module/:id/restore", middleware.RequirePermission(rbacService, "trash.restore"), trashHandler.Restore)
		admin.POST("/trash/:module/restore-batch", middleware.RequirePermission(rbacService, "trash.restore"), trashHandler.RestoreBatch)
		admin.DELETE("/trash/:module/:id", middleware.RequirePermission(rbacService, "trash.purge"), trashHandler.Purge)
		admin.DELETE("/trash/:module/empty", middleware.RequirePermission(rbacService, "trash.purge"), trashHandler.Empty)

		// ==========================================
		// XUẤT BÁO CÁO & DỮ LIỆU EXCEL
		// ==========================================
		admin.GET("/products/export", middleware.RequirePermission(rbacService, "export.product"), exportHandler.ExportProducts)
		admin.GET("/orders/export", middleware.RequirePermission(rbacService, "export.order"), exportHandler.ExportOrders)
		admin.GET("/inventory/export", middleware.RequirePermission(rbacService, "export.inventory"), exportHandler.ExportInventory)
		admin.GET("/customers/export", middleware.RequirePermission(rbacService, "export.customer"), exportHandler.ExportCustomers)
		admin.GET("/vouchers/export", middleware.RequirePermission(rbacService, "export.voucher"), exportHandler.ExportVouchers)
		admin.GET("/reports/revenue/export", middleware.RequirePermission(rbacService, "export.revenue"), exportHandler.ExportRevenue)

		// ==========================================
		// CẤU HÌNH VẬN CHUYỂN THEO KHOẢNG CÁCH (SHIPPING)
		// ==========================================
		admin.GET("/shipping/settings", middleware.RequirePermission(rbacService, "shipping.view"), shippingHandler.GetSettings)
		admin.PUT("/shipping/settings", middleware.RequirePermission(rbacService, "shipping.manage"), shippingHandler.UpdateSettings)
		admin.GET("/shipping/tiers", middleware.RequirePermission(rbacService, "shipping.view"), shippingHandler.ListTiers)
		admin.POST("/shipping/tiers", middleware.RequirePermission(rbacService, "shipping.manage"), shippingHandler.CreateTier)
		admin.PUT("/shipping/tiers/:id", middleware.RequirePermission(rbacService, "shipping.manage"), shippingHandler.UpdateTier)
		admin.DELETE("/shipping/tiers/:id", middleware.RequirePermission(rbacService, "shipping.manage"), shippingHandler.DeleteTier)
		admin.PUT("/shipping/tiers/reorder", middleware.RequirePermission(rbacService, "shipping.manage"), shippingHandler.ReorderTiers)
		admin.GET("/shipping/tiers/validate", middleware.RequirePermission(rbacService, "shipping.view"), shippingHandler.ValidateTiers)
		admin.POST("/shipping/test-calculate", middleware.RequirePermission(rbacService, "shipping.view"), shippingHandler.EstimateShipping)
	}
}
