package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"furniture-shop/backend/internal/config"
	"furniture-shop/backend/internal/database"
	"furniture-shop/backend/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Đọc cấu hình từ .env
	cfg := config.Load()
	if cfg.JWTSecret == "" {
		log.Fatal("Thiếu JWT_SECRET trong file .env")
	}
	gin.SetMode(cfg.GinMode)

	// 2. Kết nối database & tự động migrate
	db, err := database.Connect(cfg.DBDSN)
	if err != nil {
		log.Fatalf("Không kết nối được MySQL: %v", err)
	}
	log.Println("Đã kết nối MySQL và đồng bộ database thành công")

	// 3. Tạo router và khai báo API kèm Context ứng dụng
	appCtx, cancelApp := context.WithCancel(context.Background())
	defer cancelApp()

	r := gin.Default()
	routes.Setup(r, db, cfg, appCtx)

	// 4. Cấu hình HTTP Server kèm các Timeout chuẩn sản xuất chống treo kết nối / Slowloris
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// 5. Chạy server trong một Goroutine riêng
	go func() {
		log.Printf("Server đang chạy tại http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Lỗi khởi chạy server: %v", err)
		}
	}()

	// 6. Tắt server an toàn (Graceful Shutdown)
	// Lắng nghe tín hiệu ngắt (Ctrl+C hoặc SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Đang tắt server an toàn...")
	cancelApp() // Dừng ngay các cron job nền (như dọn rác tự động)

	// Cho server 5 giây để hoàn tất các request đang xử lý dở
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server buộc phải dừng: %v", err)
	}

	// Đóng kết nối database pool
	sqlDB, err := db.DB()
	if err == nil {
		_ = sqlDB.Close()
	}

	log.Println("Server đã dừng hoàn toàn an toàn.")
}
