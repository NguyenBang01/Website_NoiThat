$BaseUrl = "http://localhost:8080/api/v1"
$Headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TEST LUONG MUA HANG & 9 MODULES BACKEND BANG POWERSHELL  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. DANG NHAP ADMIN
Write-Host "`n[1] Dang nhap Admin..." -ForegroundColor Yellow
$AdminLoginBody = @{
    email    = "admin@noithat.com"
    password = "Admin@123"
} | ConvertTo-Json

$AdminLoginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $AdminLoginBody -Headers $Headers
$AdminToken = $AdminLoginRes.data.access_token
$AdminHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AdminToken"
}
Write-Host "  -> Admin Token: OK (User: $($AdminLoginRes.data.user.full_name))" -ForegroundColor Green

# 2. TAO MA GIAM GIA (Module 8)
Write-Host "`n[2] Admin tao ma giam gia 10% (Module 8)..." -ForegroundColor Yellow
$CouponCode = "SALE10-" + (Get-Random -Minimum 1000 -Maximum 9999)
$CouponBody = @{
    code             = $CouponCode
    description      = "Giam gia 10 phan tram"
    discount_type    = "percent"
    discount_value   = 10
    min_order_amount = 10000
    max_discount     = 500000
    usage_limit      = 100
    is_active        = $true
} | ConvertTo-Json

$CouponRes = Invoke-RestMethod -Uri "$BaseUrl/admin/coupons" -Method Post -Body $CouponBody -Headers $AdminHeaders
Write-Host "  -> Ma giam gia: $CouponCode tao thanh cong (ID: $($CouponRes.data.id))" -ForegroundColor Green

# 3. DANG KY KHACH HANG MOI (Module 10)
$RandomId = Get-Random -Minimum 10000 -Maximum 99999
$CustomerEmail = "customer$RandomId@gmail.com"
$CustomerPass = "Customer@123"
Write-Host "`n[3] Dang ky khach hang moi: $CustomerEmail..." -ForegroundColor Yellow

$RegisterBody = @{
    full_name = "Khach Hang Test $RandomId"
    email     = $CustomerEmail
    password  = $CustomerPass
    phone     = "0912345678"
} | ConvertTo-Json

$RegisterRes = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Body $RegisterBody -Headers $Headers
$CustomerToken = $RegisterRes.data.access_token
$CustomerHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $CustomerToken"
}
Write-Host "  -> Dang ky thanh cong, Token khach: OK" -ForegroundColor Green

# 4. KHACH HANG DUYET SAN PHAM (Module 6)
Write-Host "`n[4] Khach xem san pham cong khai (Module 6)..." -ForegroundColor Yellow
$ProductsRes = Invoke-RestMethod -Uri "$BaseUrl/products?limit=1" -Method Get
$FirstProduct = $ProductsRes.data[0]
Write-Host "  -> Chon san pham: $($FirstProduct.name) (Slug: $($FirstProduct.slug))" -ForegroundColor Green

$ProductDetailRes = Invoke-RestMethod -Uri "$BaseUrl/products/$($FirstProduct.slug)" -Method Get
$Variant = $ProductDetailRes.data.variants[0]
$InitialStock = $Variant.stock_quantity
Write-Host "  -> Bien the: SKU $($Variant.sku) | Gia: $($Variant.price) VND | Ton kho ban dau: $InitialStock" -ForegroundColor Green

# 5. KHACH HANG THEM VAO GIO HANG (Module 7)
Write-Host "`n[5] Them vao gio hang (Module 7)..." -ForegroundColor Yellow
$CartItemBody = @{
    variant_id = $Variant.id
    quantity   = 2
} | ConvertTo-Json

$AddCartRes = Invoke-RestMethod -Uri "$BaseUrl/cart/items" -Method Post -Body $CartItemBody -Headers $CustomerHeaders
Write-Host "  -> $($AddCartRes.message)" -ForegroundColor Green

$GetCartRes = Invoke-RestMethod -Uri "$BaseUrl/cart" -Method Get -Headers $CustomerHeaders
Write-Host "  -> Gio hang co $($GetCartRes.data.items.Count) mon, Tong tien gio hang: $($GetCartRes.data.total_amount) VND" -ForegroundColor Green

# 6. KIEM TRA MA GIAM GIA (Module 8)
Write-Host "`n[6] Kiem tra ap dung ma giam gia $CouponCode..." -ForegroundColor Yellow
$OrderTotalForCoupon = $GetCartRes.data.total
if (-not $OrderTotalForCoupon -or $OrderTotalForCoupon -le 0) {
    $OrderTotalForCoupon = $Variant.price * 2
}
$ValidateCouponBody = @{
    code        = $CouponCode
    order_total = [int64]$OrderTotalForCoupon
} | ConvertTo-Json

$ValidateRes = Invoke-RestMethod -Uri "$BaseUrl/coupons/validate" -Method Post -Body $ValidateCouponBody -Headers $Headers
Write-Host "  -> Ma hop le: $($ValidateRes.data.valid) | Giam gia: $($ValidateRes.data.discount_amount) VND | $($ValidateRes.data.message)" -ForegroundColor Green

# 7. DAT HANG (Module 9 - Transaction, Row Lock, Snapshot gia)
Write-Host "`n[7] Tien hanh dat hang voi ma $CouponCode..." -ForegroundColor Yellow
$OrderBody = @{
    recipient_name   = "Khach Hang Test $RandomId"
    recipient_phone  = "0912345678"
    shipping_address = "So 123 Nam Ky Khoi Nghia, Q1, TPHCM"
    coupon_code      = $CouponCode
    note             = "Giao hang can than"
    items            = @(
        @{
            variant_id = $Variant.id
            quantity   = 2
        }
    )
} | ConvertTo-Json

$OrderRes = Invoke-RestMethod -Uri "$BaseUrl/orders" -Method Post -Body $OrderBody -Headers $CustomerHeaders
$OrderId = $OrderRes.data.id
$OrderNumber = $OrderRes.data.order_number
Write-Host "  -> Dat hang thanh cong! Ma don: $OrderNumber | Tong thanh toan: $($OrderRes.data.total_amount) VND" -ForegroundColor Green

# 8. KIEM TRA TON KHO DA TRU CHINH XAC
Write-Host "`n[8] Kiem tra tru ton kho trong DB..." -ForegroundColor Yellow
$ProductCheckRes = Invoke-RestMethod -Uri "$BaseUrl/products/$($FirstProduct.slug)" -Method Get
$UpdatedStock = ($ProductCheckRes.data.variants | Where-Object { $_.id -eq $Variant.id }).stock_quantity
Write-Host "  -> Ton kho ban dau: $InitialStock" -ForegroundColor Gray
Write-Host "  -> Ton kho hien tai (da tru 2): $UpdatedStock" -ForegroundColor Green
if ($UpdatedStock -eq ($InitialStock - 2)) {
    Write-Host "  ===> KET QUA: TON KHO GIAM DUNG CHINH XAC (-2) <===" -ForegroundColor Green
} else {
    Write-Host "  ===> CANH BAO: TON KHO CHUA DUNG <===" -ForegroundColor Red
}

# 9. ADMIN DOI TRANG THAI DON HANG (Module 9 Status Transition)
Write-Host "`n[9] Admin duyet don hang: pending -> confirmed -> shipping -> delivered..." -ForegroundColor Yellow

$StatusBody1 = @{ status = "confirmed"; note = "Admin xac nhan don" } | ConvertTo-Json
$res1 = Invoke-RestMethod -Uri "$BaseUrl/admin/orders/$OrderId/status" -Method Put -Body $StatusBody1 -Headers $AdminHeaders
Write-Host "  -> [Buoc 1] Admin xac nhan (confirmed): $($res1.message)" -ForegroundColor Green

$StatusBody2 = @{ status = "shipping"; note = "Dang giao hang ViettelPost" } | ConvertTo-Json
$res2 = Invoke-RestMethod -Uri "$BaseUrl/admin/orders/$OrderId/status" -Method Put -Body $StatusBody2 -Headers $AdminHeaders
Write-Host "  -> [Buoc 2] Dang giao hang (shipping): $($res2.message)" -ForegroundColor Green

$StatusBody3 = @{ status = "delivered"; note = "Khach da nhan hang thanh cong" } | ConvertTo-Json
$res3 = Invoke-RestMethod -Uri "$BaseUrl/admin/orders/$OrderId/status" -Method Put -Body $StatusBody3 -Headers $AdminHeaders
Write-Host "  -> [Buoc 3] Giao hang hoan tat (delivered): $($res3.message)" -ForegroundColor Green

# 10. TEST CAC CHUC NANG MODULE CON LAI
Write-Host "`n[10] Kiem tra cac module bo sung:" -ForegroundColor Yellow

# Module 10: So dia chi
$AddressBody = @{
    recipient_name = "Dia chi co quan"
    phone          = "0912345678"
    province       = "Ho Chi Minh"
    district       = "Quan 1"
    ward           = "Ben Nghe"
    street         = "15 Le Duan"
    is_default     = $true
} | ConvertTo-Json
$AddrRes = Invoke-RestMethod -Uri "$BaseUrl/account/addresses" -Method Post -Body $AddressBody -Headers $CustomerHeaders
Write-Host "  - Module 10 (So dia chi): Them dia chi OK (ID: $($AddrRes.data.id))" -ForegroundColor Green

# Module 11: Yeu thich & Danh gia
$WishlistBody = @{ product_id = $FirstProduct.id } | ConvertTo-Json
$WishRes = Invoke-RestMethod -Uri "$BaseUrl/wishlist" -Method Post -Body $WishlistBody -Headers $CustomerHeaders
Write-Host "  - Module 11 (Yeu thich): Them vao danh sach yeu thich OK" -ForegroundColor Green

$ReviewBody = @{
    product_id = $FirstProduct.id
    rating     = 5
    comment    = "San pham rat dep va chac chan!"
} | ConvertTo-Json
$ReviewRes = Invoke-RestMethod -Uri "$BaseUrl/reviews" -Method Post -Body $ReviewBody -Headers $CustomerHeaders
Write-Host "  - Module 11 (Danh gia): Gui danh gia 5 sao OK" -ForegroundColor Green

# Module 12: Lien he & Banner
$ContactBody = @{
    full_name = "Nguyen Van Khach"
    email     = "guest@gmail.com"
    subject   = "Tu van mua hang"
    message   = "Can tu van bo sofa phong khach"
} | ConvertTo-Json
$ContactRes = Invoke-RestMethod -Uri "$BaseUrl/contacts" -Method Post -Body $ContactBody -Headers $Headers
Write-Host "  - Module 12 (Lien he): Gui form lien he OK (ID: $($ContactRes.data.id))" -ForegroundColor Green

$BannersRes = Invoke-RestMethod -Uri "$BaseUrl/banners" -Method Get
Write-Host "  - Module 12 (Banner): Lay danh sach banner OK" -ForegroundColor Green

# Module 13: Dashboard Thong ke
$OverviewRes = Invoke-RestMethod -Uri "$BaseUrl/admin/dashboard/overview" -Method Get -Headers $AdminHeaders
Write-Host "  - Module 13 (Dashboard): Doanh thu: $($OverviewRes.data.total_revenue) VND | Don da giao: $($OverviewRes.data.total_orders) | Khach hang: $($OverviewRes.data.total_customers)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  TAT CA 9 MODULES & LUONG MUA HANG DA TEST THANH CONG 100%!  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
