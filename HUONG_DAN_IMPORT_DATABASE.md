# HƯỚNG DẪN IMPORT CƠ SỞ DỮ LIỆU FURNITURE SHOP (MYSQL)

Tài liệu này hướng dẫn người khác (thành viên nhóm, giáo viên, đối tác) cách import toàn bộ dữ liệu mẫu (Seed Database) của dự án **Furniture Shop** vào MySQL trên máy tính của họ.

---

## 📁 File dữ liệu (Seed Data)
- **Đường dẫn file SQL:** `furniture_shop.sql` (hoặc `database/furniture_shop.sql`)
- **Định dạng bảng mã:** `utf8mb4` (hỗ trợ đầy đủ tiếng Việt có dấu, emoji).
- **Tên Database tạo tự động:** `furniture_shop`
- **Dữ liệu mẫu bao gồm:**
  - 8 danh mục sản phẩm nội thất (Bàn, Ghế, Sofa, Giường, Tủ, Đèn...)
  - 32 sản phẩm hoàn chỉnh cùng hình ảnh, mô tả chi tiết và các biến thể kích thước/màu sắc.
  - Danh sách đơn hàng mẫu, giỏ hàng, đánh giá, mã giảm giá (`WELCOME10`), banner quảng cáo.
  - Cấu hình cài đặt cửa hàng.
  - **Tài khoản Quản trị (Admin) mặc định:**
    - Email: `admin@noithat.com`
    - Mật khẩu: `Admin@123`

---

## 🚀 Cách 1: Tự động bằng 1 Click (Khuyên Dùng Trên Windows)

1. Mở **XAMPP Control Panel** và nhấn **Start** tại dòng **MySQL** (cổng `3306`).
2. Nhấp đúp chuột vào file:
   👉 **`IMPORT_DATABASE.bat`**
3. Script sẽ tự động tìm MySQL trong máy và import toàn bộ database vào máy chỉ trong vài giây.

> 💡 **Mẹo:** Bất cứ khi nào bạn chỉnh sửa thêm bớt sản phẩm trên trang Admin và muốn cập nhật lại file seed để gửi cho người khác, bạn chỉ cần nhấp đúp file **`EXPORT_DATABASE.bat`**.

---

## 🖥️ Cách 2: Sử dụng giao diện phpMyAdmin (Trực quan trên trình duyệt)

Nếu máy tính dùng XAMPP, Laragon hoặc Docker:

1. Bật MySQL và Apache trên XAMPP.
2. Truy cập trình duyệt: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
3. Trên thanh menu trên cùng, bấm chọn tab **Nhập (Import)** *(Lưu ý: Không cần tạo trước database vì file SQL đã có sẵn lệnh tự động tạo database `furniture_shop`)*.
4. Bấm **Chọn tệp (Choose File)** -> tìm và chọn file **`furniture_shop.sql`**.
5. Đảm bảo Bảng mã tệp là **utf-8**.
6. Cuộn xuống cuối trang và nhấn nút **Nhập (Import)**.
7. Khi thấy thông báo màu xanh *"Đã thực hiện xong các truy vấn..."* là hoàn thành!

---

## ⚡ Cách 3: Sử dụng Dòng Lệnh (Terminal / Command Prompt)

Mở **Command Prompt (CMD)** hoặc **PowerShell** tại thư mục dự án và chạy lệnh:

### Đối với CMD (Windows):
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root --default-character-set=utf8mb4 < furniture_shop.sql
```

### Đối với PowerShell:
```powershell
Get-Content -Path .\furniture_shop.sql -Encoding utf8 | & "C:\xampp\mysql\bin\mysql.exe" -u root --default-character-set=utf8mb4
```

### Đối với macOS / Linux:
```bash
mysql -u root -p --default-character-set=utf8mb4 < furniture_shop.sql
```

---

## 🔑 Kiểm tra và Chạy dự án sau khi Import

1. Kiểm tra file cấu hình backend: `furniture-shop/backend/.env`
   ```ini
   DB_DSN=root:@tcp(127.0.0.1:3306)/furniture_shop?charset=utf8mb4&parseTime=True&loc=Local
   ```
2. Khởi động hệ thống:
   - Chạy Backend: `cd furniture-shop/backend && go run ./cmd/server` (Port `8080`)
   - Chạy Admin: `cd furniture-shop/admin-frontend && npm run dev` (Port `1234`)
   - Chạy Storefront: `cd furniture-shop/storefront && npm run dev` (Port `4321`)
3. Đăng nhập trang Admin tại: [http://localhost:1234](http://localhost:1234) với tài khoản:
   - **Email:** `admin@noithat.com`
   - **Mật khẩu:** `Admin@123`

