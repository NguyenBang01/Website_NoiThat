package database

import (
	"log"

	"furniture-shop/backend/internal/models"

	"gorm.io/gorm"
)

func strPtr(s string) *string {
	return &s
}

// SeedBanners tự động đồng bộ các ảnh/banner mặc định của các mục trên trang chủ vào bảng banners
// để quản trị viên có thể chỉnh sửa trực tiếp trong trang Quản lý Banner quảng cáo.
func SeedBanners(db *gorm.DB) error {
	var nonSliderCount int64
	if err := db.Model(&models.Banner{}).Where("position != ?", "home_slider").Count(&nonSliderCount).Error; err != nil {
		return err
	}
	if nonSliderCount > 0 {
		return nil
	}

	defaults := []models.Banner{
		// 1. Giới thiệu thương hiệu (2 ảnh)
		{
			Title:     "KIẾN TẠO KHÔNG GIAN SỐNG ĐẲNG CẤP",
			Subtitle:  strPtr("Ảnh lớn bên trái khối Giới thiệu thương hiệu"),
			Image:     "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&auto=format&fit=crop&q=85",
			MediaType: "image",
			Position:  "brand_story_main",
			Link:      strPtr("/products"),
			SortOrder: 1,
			IsActive:  true,
		},
		{
			Title:     "Nội thất xanh tinh tế hiện đại",
			Subtitle:  strPtr("Ảnh nhỏ bên phải khối Giới thiệu thương hiệu"),
			Image:     "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=85",
			MediaType: "image",
			Position:  "brand_story_sub",
			Link:      strPtr("/products"),
			SortOrder: 2,
			IsActive:  true,
		},

		// 2. Bộ sưu tập (3 ảnh)
		{
			Title:     "BST MODERN LIVING",
			Subtitle:  strPtr("Bộ sưu tập phong cách hiện đại"),
			Image:     "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1200&auto=format&fit=crop&q=85",
			MediaType: "image",
			Position:  "collection",
			Link:      strPtr("/products?collection=modern-living"),
			SortOrder: 1,
			IsActive:  true,
		},
		{
			Title:     "BST LUXURY",
			Subtitle:  strPtr("Bộ sưu tập nội thất sang trọng"),
			Image:     "https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=1200&auto=format&fit=crop&q=85",
			MediaType: "image",
			Position:  "collection",
			Link:      strPtr("/products?collection=luxury"),
			SortOrder: 2,
			IsActive:  true,
		},
		{
			Title:     "BST MINIMALIST",
			Subtitle:  strPtr("Bộ sưu tập tối giản tinh tế"),
			Image:     "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=85",
			MediaType: "image",
			Position:  "collection",
			Link:      strPtr("/products?collection=minimalist"),
			SortOrder: 3,
			IsActive:  true,
		},

		// 3. Banner toàn cảnh cam kết
		{
			Title:     "Phòng trưng bày không gian sống đẳng cấp Góc Nhà Đẹp",
			Subtitle:  strPtr("Ảnh toàn cảnh phía trên 3 thẻ Cam kết"),
			Image:     "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85",
			MediaType: "image",
			Position:  "commitment_banner",
			Link:      strPtr("/products"),
			SortOrder: 1,
			IsActive:  true,
		},

		// 4. Tin tức (3 ảnh)
		{
			Title:     "Xu Hướng Nội Thất 2026 – Tinh Tế & Bền Vững",
			Subtitle:  strPtr("Khám phá những phong cách thiết kế nổi bật với vật liệu thân thiện môi trường ..."),
			Image:     "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&auto=format&fit=crop&q=80",
			MediaType: "image",
			Position:  "news",
			Link:      strPtr("/news/xu-huong-noi-that-2026"),
			SortOrder: 1,
			IsActive:  true,
		},
		{
			Title:     "Bàn Trà – Điểm Nhấn Hoàn Hảo Cho Phòng Khách",
			Subtitle:  strPtr("Thiết kế đa dạng, đường nét tinh tế và chất liệu cao cấp giúp hoàn thiện..."),
			Image:     "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80",
			MediaType: "image",
			Position:  "news",
			Link:      strPtr("/news/ban-tra-diem-nhan-phong-khach"),
			SortOrder: 2,
			IsActive:  true,
		},
		{
			Title:     "Giải Pháp Nội Thất Văn Phòng Hiện Đại",
			Subtitle:  strPtr("Tối ưu công năng sử dụng với hệ thống bàn ghế và không gian làm việc hiện đại."),
			Image:     "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
			MediaType: "image",
			Position:  "news",
			Link:      strPtr("/news/giai-phap-noi-that-van-phong"),
			SortOrder: 3,
			IsActive:  true,
		},

		// 5. Kiến thức Phong Thủy & Nội Thất (3 ảnh)
		{
			Title:     "5 Cách Bố Trí Phòng Khách Chung Cư Chuẩn Phong Thủy",
			Subtitle:  strPtr("Khám phá sơ đồ bố trí nội thất phòng khách chung cư giúp lưu thông sinh khí..."),
			Image:     "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
			MediaType: "image",
			Position:  "fengshui",
			Link:      strPtr("/news/5-cach-bo-tri-phong-khach-chung-cu-chuan-phong-thuy"),
			SortOrder: 1,
			IsActive:  true,
		},
		{
			Title:     "Màu Sơn Phòng Ngủ Cho Người Mệnh Mộc Giúp Gia Đình",
			Subtitle:  strPtr("Người mệnh Mộc nên chọn sơn phòng ngủ màu gì hợp nhất?"),
			Image:     "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80",
			MediaType: "image",
			Position:  "fengshui",
			Link:      strPtr("/news/mau-son-phong-ngu-cho-nguoi-menh-moc"),
			SortOrder: 2,
			IsActive:  true,
		},
		{
			Title:     "Nguyên Tắc Bố Trí Bếp Và Chậu Rửa Tránh Đại Kỵ Thủy Hỏa",
			Subtitle:  strPtr("Bếp ga đại diện cho Hỏa, chậu rửa đại diện cho Thủy"),
			Image:     "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
			MediaType: "image",
			Position:  "fengshui",
			Link:      strPtr("/news/nguyen-tac-bo-tri-bep-va-chau-rua-tranh-dai-ky-thuy-hoa"),
			SortOrder: 3,
			IsActive:  true,
		},

		// 6. Ảnh minh họa form tư vấn
		{
			Title:     "KIẾN TẠO KHÔNG GIAN SỐNG THEO PHONG CÁCH CỦA BẠN",
			Subtitle:  strPtr("Ảnh minh họa bên trái khối Đăng ký tư vấn"),
			Image:     "/uploads/defaults/consultation_illustration.png",
			MediaType: "image",
			Position:  "consultation",
			Link:      strPtr("/contact"),
			SortOrder: 1,
			IsActive:  true,
		},
	}

	if err := db.Create(&defaults).Error; err != nil {
		return err
	}
	log.Printf("[INFO] Đã đồng bộ %d hình ảnh/banner trang chủ vào Quản lý Banner", len(defaults))
	return nil
}
