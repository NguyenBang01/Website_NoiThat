package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"furniture-shop/backend/internal/database"
	"furniture-shop/backend/internal/middleware"
	"furniture-shop/backend/internal/models"
	"furniture-shop/backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	dsn := "root:@tcp(127.0.0.1:3306)/furniture_shop?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("Bỏ qua test vì MySQL không kết nối được: %v", err)
	}
	_ = database.AutoMigrate(db)
	_ = database.SeedRBAC(db)
	return db
}

func TestRequirePermission_Unauthenticated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	rbac := services.NewRBACService(db)

	r := gin.New()
	r.GET("/test-perm", middleware.RequirePermission(rbac, "product.create"), func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-perm", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Kỳ vọng 401 Unauthorized khi không có user_id, nhận được: %d", w.Code)
	}
}

func TestRequirePermission_SuperAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	rbac := services.NewRBACService(db)

	// Tìm hoặc tạo tài khoản super_admin test
	var superAdmin models.User
	var superRole models.Role
	_ = db.Where("name = 'super_admin'").First(&superRole).Error

	err := db.Where("email = 'test_superadmin@test.com'").First(&superAdmin).Error
	if err != nil {
		superAdmin = models.User{
			FullName:     "Test Super Admin",
			Email:        "test_superadmin@test.com",
			PasswordHash: "dummyhash",
			Role:         "super_admin",
			RoleID:       &superRole.ID,
			Status:       "active",
		}
		db.Create(&superAdmin)
	}

	r := gin.New()
	// Middleware giả lập auth gắn user_id
	r.Use(func(c *gin.Context) {
		c.Set("user_id", superAdmin.ID)
		c.Set("role", superAdmin.Role)
		c.Next()
	})
	r.GET("/test-super", middleware.RequirePermission(rbac, "random.permission.code"), func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-super", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Super admin phải luôn được chấp thuận mọi quyền, nhận được status: %d", w.Code)
	}
}

func TestRequirePermission_LockedAccount(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	rbac := services.NewRBACService(db)

	var lockedUser models.User
	err := db.Where("email = 'test_locked@test.com'").First(&lockedUser).Error
	if err != nil {
		lockedUser = models.User{
			FullName:     "Test Locked User",
			Email:        "test_locked@test.com",
			PasswordHash: "dummyhash",
			Role:         "sales",
			Status:       "locked",
		}
		db.Create(&lockedUser)
	}

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", lockedUser.ID)
		c.Set("role", lockedUser.Role)
		c.Next()
	})
	r.GET("/test-locked", middleware.RequirePermission(rbac, "product.view"), func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-locked", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("Tài khoản locked phải bị trả về 403 Forbidden, nhận được: %d", w.Code)
	}
}

func TestRequireAnyPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	rbac := services.NewRBACService(db)

	var salesRole models.Role
	_ = db.Where("name = 'sales'").First(&salesRole).Error

	var salesUser models.User
	err := db.Where("email = 'test_sales@test.com'").First(&salesUser).Error
	if err != nil {
		salesUser = models.User{
			FullName:     "Test Sales",
			Email:        "test_sales@test.com",
			PasswordHash: "dummyhash",
			Role:         "sales",
			RoleID:       &salesRole.ID,
			Status:       "active",
		}
		db.Create(&salesUser)
	}

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", salesUser.ID)
		c.Set("role", salesUser.Role)
		c.Next()
	})
	// Sales có order.view, không có role.manage
	r.GET("/test-any-success", middleware.RequireAnyPermission(rbac, "role.manage", "order.view"), func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})
	r.GET("/test-any-fail", middleware.RequireAnyPermission(rbac, "role.manage", "setting.manage"), func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Test case 1: Có 1 quyền khớp -> Thành công 200
	req1 := httptest.NewRequest(http.MethodGet, "/test-any-success", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Errorf("RequireAnyPermission có 1 quyền hợp lệ phải trả về 200, nhận được: %d", w1.Code)
	}

	// Test case 2: Không có quyền nào khớp -> Trả 403
	req2 := httptest.NewRequest(http.MethodGet, "/test-any-fail", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusForbidden {
		t.Errorf("RequireAnyPermission không có quyền nào khớp phải trả về 403, nhận được: %d", w2.Code)
	}
}
