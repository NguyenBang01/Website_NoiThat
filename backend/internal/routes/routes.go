package routes

import (
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
	authService := &services.AuthService{
		DB:             db,
		JWTSecret:      cfg.JWTSecret,
		JWTExpireHours: cfg.JWTExpireHours,
		MailService:    mailService,
		GoogleClientID: cfg.GoogleClientID,
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
	authHandler := &handlers.AuthHandler{Service: authService}
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

	api := r.Group("/api/v1")

	// ==========================================
	// 0. CỔNG THANH TOÁN (SePay Webhook & Check)
	// ==========================================
	api.POST("/payment/sepay/webhook", sepayHandler.Webhook)
	api.GET("/payment/check/:orderCode", sepayHandler.CheckStatus)
	api.POST("/payment/cancel/:orderCode", sepayHandler.CancelUnpaid)

	// ==========================================
	// 1. CÔNG KHAI (Public)
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

	// Auth (Đăng ký, Đăng nhập, Quên mật khẩu có bảo vệ rate limit)
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
	// 2. KHÁCH HÀNG ĐÃ ĐĂNG NHẬP (Customer Protected)
	// ==========================================
	userAuth := api.Group("", middleware.AuthRequired(cfg.JWTSecret))
	{
		// Tài khoản khách (Module 10)
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

		// Giỏ hàng (Module 7)
		cart := userAuth.Group("/cart")
		{
			cart.GET("", cartHandler.GetCart)
			cart.POST("/items", cartHandler.AddItem)
			cart.PUT("/items/:id", cartHandler.UpdateItem)
			cart.DELETE("/items/:id", cartHandler.RemoveItem)
			cart.DELETE("/clear", cartHandler.ClearCart)
		}

		// Đặt hàng (Module 9)
		orders := userAuth.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.MyOrders)
			orders.GET("/:id", orderHandler.MyOrderDetail)
			orders.POST("/:id/cancel", orderHandler.CancelOrder)
		}

		// Đánh giá (Module 11)
		reviews := userAuth.Group("/reviews")
		{
			reviews.POST("", reviewHandler.CreateReview)
			reviews.GET("/my", reviewHandler.MyReviews)
			reviews.DELETE("/:id", reviewHandler.DeleteReview)
		}

		// Yêu thích (Module 11)
		wishlist := userAuth.Group("/wishlist")
		{
			wishlist.GET("", wishlistHandler.ListWishlist)
			wishlist.POST("", wishlistHandler.AddToWishlist)
			wishlist.DELETE("/:productId", wishlistHandler.RemoveFromWishlist)
		}
	}

	// ==========================================
	// 3. QUẢN TRỊ VIÊN (Admin Protected)
	// ==========================================
	admin := api.Group("/admin",
		middleware.AuthRequired(cfg.JWTSecret),
		middleware.RoleRequired("admin"),
	)
	{
		admin.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"success": true, "message": "Xin chào admin"})
		})

		// Quản lý danh mục
		admin.GET("/categories", categoryHandler.AdminList)
		admin.POST("/categories", categoryHandler.Create)
		admin.PUT("/categories/:id", categoryHandler.Update)
		admin.DELETE("/categories/:id", categoryHandler.Delete)

		// Quản lý thương hiệu (CRUD)
		admin.POST("/brands", brandHandler.Create)
		admin.PUT("/brands/:id", brandHandler.Update)
		admin.DELETE("/brands/:id", brandHandler.Delete)

		// Upload ảnh
		admin.POST("/uploads", uploadHandler.Upload)

		// Quản lý sản phẩm
		admin.GET("/products", productHandler.AdminList)
		admin.GET("/products/:id", productHandler.AdminGet)
		admin.POST("/products", productHandler.Create)
		admin.PUT("/products/:id", productHandler.Update)
		admin.DELETE("/products/:id", productHandler.Delete)

		// Quản lý mã giảm giá (Module 8)
		admin.GET("/coupons", couponHandler.List)
		admin.GET("/coupons/:id", couponHandler.Get)
		admin.POST("/coupons", couponHandler.Create)
		admin.PUT("/coupons/:id", couponHandler.Update)
		admin.DELETE("/coupons/:id", couponHandler.Delete)

		// Quản lý đơn hàng (Module 9)
		admin.GET("/orders", orderHandler.AdminOrders)
		admin.GET("/orders/:id", orderHandler.AdminOrderDetail)
		admin.PUT("/orders/:id/status", orderHandler.UpdateStatus)

		// Quản lý đánh giá (Module 11)
		admin.GET("/reviews", reviewHandler.AdminListReviews)
		admin.PUT("/reviews/:id", reviewHandler.AdminUpdateReview)

		// Quản lý banner (Module 12)
		admin.GET("/banners", bannerHandler.AdminList)
		admin.POST("/banners", bannerHandler.Create)
		admin.PUT("/banners/:id", bannerHandler.Update)
		admin.DELETE("/banners/:id", bannerHandler.Delete)

		// Cài đặt cửa hàng (Module 12)
		admin.PUT("/settings", settingHandler.Update)
		admin.POST("/settings/test-email", settingHandler.TestEmail)

		// Quản lý liên hệ (Module 12)
		admin.GET("/contacts", contactHandler.List)
		admin.PUT("/contacts/:id/read", contactHandler.MarkAsRead)
		admin.DELETE("/contacts/:id", contactHandler.Delete)

		// Quản lý khách hàng (Module 12)
		admin.GET("/customers", customerHandler.List)
		admin.GET("/customers/:id", customerHandler.Get)
		admin.PUT("/customers/:id/toggle-status", customerHandler.ToggleStatus)

		// Thống kê / Dashboard (Module 13)
		admin.GET("/dashboard/overview", dashboardHandler.Overview)
		admin.GET("/dashboard/revenue-by-day", dashboardHandler.RevenueByDay)
		admin.GET("/dashboard/revenue-by-month", dashboardHandler.RevenueByMonth)
		admin.GET("/dashboard/top-products", dashboardHandler.TopProducts)
		admin.GET("/dashboard/recent-orders", dashboardHandler.RecentOrders)
		admin.GET("/dashboard/low-stock", dashboardHandler.LowStock)

		// Lịch sử giao dịch SePay
		admin.GET("/payment/sepay/transactions", sepayHandler.ListTransactions)
	}
}

