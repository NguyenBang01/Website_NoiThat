import React, { useState } from 'react';
import {
  Heart,
  Plus,
  Minus,
  X,
  MapPin,
  Phone,
} from 'lucide-react';
import type { Product, ProductVariant } from '../../types';
import { getProductImage } from '../../lib/format';
import { addToCart, openCart } from '../../stores/cartStore';
import { openAuthModal } from '../../stores/authStore';
import { toast } from 'sonner';

interface Props {
  product: Product;
}

export default function ProductDetailView({ product }: Props) {
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  );

  // Danh sách hình ảnh
  const primaryImage = getProductImage(product.image || product.images?.[0]?.url, product.category?.name);
  
  // Tạo bộ ảnh các góc chụp (Front view, Back view, Angle view) tương tự Ảnh 3 Nhà Xinh
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        list.push(getProductImage(img.url, product.category?.name));
      });
    } else {
      list.push(primaryImage);
    }

    // Nếu chỉ có 1 ảnh, bổ sung thêm góc trực diện và góc sau để tạo layout 2 ảnh như Ảnh 3
    if (list.length === 1) {
      const cat = (product.category?.name || '').toLowerCase();
      if (cat.includes('sofa')) {
        list.push('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=80');
        list.push('https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900&auto=format&fit=crop&q=80');
      } else if (cat.includes('ghế') || cat.includes('ghe')) {
        list.push('https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=900&auto=format&fit=crop&q=80');
        list.push('https://images.unsplash.com/photo-1503602642458-232111445657?w=900&auto=format&fit=crop&q=80');
      } else if (cat.includes('bàn') || cat.includes('ban')) {
        list.push('https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=900&auto=format&fit=crop&q=80');
        list.push('https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=900&auto=format&fit=crop&q=80');
      } else {
        list.push('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&auto=format&fit=crop&q=80');
        list.push('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80');
      }
    }
    return list;
  }, [product, primaryImage]);

  const [activeImage, setActiveImage] = useState<string>(allImages[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [showShowroomModal, setShowShowroomModal] = useState<boolean>(false);
  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);

  // Trạng thái đóng/mở của 4 Accordion (Chi tiết, Kích thước, Bảo hành, Giao hàng)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    detail: false,
    size: false,
    warranty: false,
    shipping: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Tính giá chuẩn dạng "35,200,000 VND"
  const priceValue = selectedVariant
    ? (selectedVariant.sale_price || selectedVariant.price)
    : (product.sale_price || product.base_price || 0);

  const formattedPrice = `${priceValue.toLocaleString('en-US')} VND`;

  const handleQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)));
  };

  const handleAddToCart = async (openDrawer = false) => {
    const res = await addToCart({
      variant_id: selectedVariant?.id || product.id,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      sku: selectedVariant?.sku || product.sku || `GND-${product.id}`,
      color: selectedVariant?.color || product.colors?.[0] || 'Mặc định',
      size: selectedVariant?.size || undefined,
      material: selectedVariant?.material || 'Khung gỗ, chân kim loại, nệm bọc cao cấp',
      image_url: activeImage,
      original_price: selectedVariant?.price || product.base_price || priceValue,
      unit_price: priceValue,
      quantity: quantity,
      stock_quantity: selectedVariant?.stock_quantity ?? 10,
      available: true,
    });

    if (res.success) {
      toast.success(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng!`);
      if (openDrawer) {
        openCart();
      }
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(!isFavorite ? 'Đã lưu vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 font-sans text-neutral-800">
      {/* 1. Breadcrumb tinh tế, đúng chuẩn Ảnh 2 (Trang chủ / Phòng khách / Sofa / ...) */}
      <nav aria-label="Đường dẫn trang" className="flex items-center flex-wrap gap-2 text-xs text-neutral-500 mb-8">
        <a href="/" className="hover:text-black transition">
          Trang chủ
        </a>
        <span className="text-neutral-400">/</span>
        <a href="/products" className="hover:text-black transition">
          Phòng khách
        </a>
        <span className="text-neutral-400">/</span>
        <a href={`/products?category=${product.category?.slug}`} className="hover:text-black transition">
          {product.category?.name || 'Sofa'}
        </a>
        <span className="text-neutral-400">/</span>
        <span className="text-neutral-700 font-medium">{product.name}</span>
      </nav>

      {/* 2. Khung sản phẩm 2 cột: Ảnh bên trái + Thông tin đặt hàng bên phải (Theo Ảnh 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* CỘT TRÁI: Gallery ảnh (7 Cột) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Ảnh Chính Lớn */}
          <div className="relative bg-[#fcfcfc] rounded-lg overflow-hidden flex items-center justify-center p-4 sm:p-8 min-h-[380px] sm:min-h-[460px] border border-neutral-100">
            {/* Tag New Đỏ (Đúng vị trí trong Ảnh 2) */}
            <span className="absolute top-4 right-4 z-10 bg-[#e60000] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-xs">
              New
            </span>

            <img
              src={activeImage}
              alt={product.name}
              className="max-h-[420px] w-auto object-contain transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Dải 2 ảnh phụ hiển thị song song bên dưới (Chuẩn thiết kế Ảnh 3) */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              {allImages.slice(1, 3).map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`relative aspect-4/3 bg-[#fcfcfc] rounded-lg overflow-hidden border p-3 flex items-center justify-center cursor-pointer transition-all ${
                    activeImage === imgUrl ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} - góc chụp ${idx + 2}`}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] text-neutral-400 font-medium bg-white/80 px-1.5 py-0.5 rounded">
                    {idx === 0 ? 'Góc trực diện' : 'Góc sau'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Thông tin sản phẩm, mua hàng & accordions (5 Cột) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tên sản phẩm */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 tracking-tight">
              {product.name}
            </h1>
            {/* Thanh kẻ ngang nhỏ dưới tiêu đề (Chuẩn Ảnh 2) */}
            <div className="w-8 h-0.5 bg-neutral-200 mt-2.5 mb-4" />
          </div>

          {/* Giá tiền: 35,200,000 VND (Chuẩn font & định dạng Ảnh 2) */}
          <div className="text-xl sm:text-2xl font-bold text-neutral-900">
            {formattedPrice}
          </div>

          {/* Danh sách thông số cơ bản (Chuẩn Ảnh 2) */}
          <div className="space-y-2 text-sm text-neutral-800 pt-1">
            <p>
              <strong className="font-semibold text-neutral-900">Kích thước:</strong>{' '}
              {selectedVariant?.size || 'D2200 - R950 - C750 mm'}
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">Chất liệu:</strong>{' '}
              {selectedVariant?.material || 'Khung gỗ, chân kim loại, nệm bọc cao cấp'}
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">Hàng có sẵn –</strong>{' '}
              <button
                type="button"
                onClick={() => setShowShowroomModal(true)}
                className="underline font-semibold text-neutral-900 hover:text-brand-700 transition cursor-pointer"
              >
                Xem cửa hàng trưng bày
              </button>
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">Mã:</strong>{' '}
              <span className="font-mono text-neutral-600">
                {selectedVariant?.sku || product.sku || '3*119982'}
              </span>
            </p>
          </div>

          {/* Tùy chọn biến thể màu sắc (nếu có) */}
          {variants.length > 0 && variants.some((v) => v.color) && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Tùy chọn màu: <span className="text-neutral-900 font-bold">{selectedVariant?.color}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition cursor-pointer ${
                      selectedVariant?.id === v.id
                        ? 'border-black bg-black text-white font-semibold'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-black'
                    }`}
                  >
                    {v.color} {v.size ? `(${v.size})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hàng hành động: [ - 1 + ] [ MUA NGAY ] [ THÊM VÀO GIỎ ] [ ♡ ] (Chuẩn Ảnh 2) */}
          <div className="flex items-center gap-2.5 pt-3">
            {/* Bộ tăng giảm số lượng */}
            <div className="flex items-center border border-neutral-300 h-11 px-2 select-none shrink-0 bg-white">
              <button
                type="button"
                onClick={() => handleQuantity(-1)}
                className="w-6 h-full flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-neutral-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantity(1)}
                className="w-6 h-full flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nút MUA NGAY (Nền đen chữ trắng chuẩn Ảnh 2) */}
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              className="h-11 px-6 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest transition flex items-center justify-center cursor-pointer shrink-0"
            >
              MUA NGAY
            </button>

            {/* Nút THÊM VÀO GIỎ (Viền đen nền trắng chuẩn Ảnh 2) */}
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              className="h-11 px-5 border border-black bg-white hover:bg-black hover:text-white text-black font-semibold text-xs uppercase tracking-widest transition flex items-center justify-center cursor-pointer shrink-0"
            >
              THÊM VÀO GIỎ
            </button>

            {/* Nút Yêu thích hình trái tim */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              title="Yêu thích"
              className={`w-11 h-11 border border-neutral-300 flex items-center justify-center transition cursor-pointer hover:border-black shrink-0 ${
                isFavorite ? 'text-red-600 border-red-500' : 'text-neutral-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-600' : ''}`} />
            </button>
          </div>

          {/* Banner Ưu đãi Xanh Rêu Thành Viên (Chuẩn màu & nút ĐĂNG KÝ NGAY trong Ảnh 2) */}
          <div className="bg-[#657662] text-white p-3.5 sm:px-5 sm:py-3 rounded-none flex items-center justify-between gap-3 shadow-2xs">
            <span className="text-xs sm:text-sm font-medium">
              Giảm 5% khi đăng ký thành viên
            </span>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="border border-white text-white hover:bg-white hover:text-[#657662] transition text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 shrink-0 cursor-pointer"
            >
              ĐĂNG KÝ NGAY
            </button>
          </div>

          {/* 4 Mục Accordion Thu Gọn / Mở Rộng: Chi tiết, Kích thước, Bảo hành, Giao hàng (Chuẩn Ảnh 2 & 3) */}
          <div className="pt-2 border-t border-neutral-200 divide-y divide-neutral-200">
            {/* 1. Chi tiết */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('detail')}
                className="w-full py-3.5 flex items-center justify-between text-left text-sm font-normal text-neutral-900 hover:text-brand-800 transition cursor-pointer"
              >
                <span>Chi tiết</span>
                <span className="text-base text-neutral-500 font-light">
                  {openAccordions.detail ? '−' : '+'}
                </span>
              </button>
              {openAccordions.detail && (
                <div className="pb-4 text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-2">
                  <p>
                    {product.description ||
                      'Mẫu sofa cao cấp mang tinh thần tối giản hiện đại. Khung sườn làm từ gỗ sồi tự nhiên sấy khô chống mối mọt cong vênh. Đệm mút D40 êm ái đàn hồi cao kết hợp vải bọc Tana thoáng mát, bền đẹp dài lâu.'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-neutral-500 pt-1">
                    <li>Khung gỗ sồi tự nhiên chắc chắn, chịu lực lên đến 400kg.</li>
                    <li>Chân kim loại sơn tĩnh điện chống trầy xước và hoen gỉ.</li>
                    <li>Thiết kế công thái học ôm sát cột sống tạo cảm giác thư giãn tối đa.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 2. Kích thước */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('size')}
                className="w-full py-3.5 flex items-center justify-between text-left text-sm font-normal text-neutral-900 hover:text-brand-800 transition cursor-pointer"
              >
                <span>Kích thước</span>
                <span className="text-base text-neutral-500 font-light">
                  {openAccordions.size ? '−' : '+'}
                </span>
              </button>
              {openAccordions.size && (
                <div className="pb-4 text-xs sm:text-sm text-neutral-600 space-y-2">
                  <p>
                    <strong>Kích thước tổng thể:</strong> {selectedVariant?.size || 'D2200 x R950 x C750 mm'}
                  </p>
                  <p>
                    <strong>Chiều cao mặt ngồi:</strong> 420 mm
                  </p>
                  <p>
                    <strong>Chiều sâu mặt ngồi:</strong> 600 mm
                  </p>
                  <p>
                    <strong>Khoảng cách gầm:</strong> 150 mm (thuận tiện cho robot hút bụi lau dọn)
                  </p>
                </div>
              )}
            </div>

            {/* 3. Bảo hành */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('warranty')}
                className="w-full py-3.5 flex items-center justify-between text-left text-sm font-normal text-neutral-900 hover:text-brand-800 transition cursor-pointer"
              >
                <span>Bảo hành</span>
                <span className="text-base text-neutral-500 font-light">
                  {openAccordions.warranty ? '−' : '+'}
                </span>
              </button>
              {openAccordions.warranty && (
                <div className="pb-4 text-xs sm:text-sm text-neutral-600 space-y-2">
                  <p>
                    <strong>Thời gian bảo hành:</strong> 24 tháng chính hãng cho khung sườn và nệm mút.
                  </p>
                  <p>
                    <strong>Bảo trì:</strong> Hỗ trợ vệ sinh, bọc lại và bảo trì trọn đời sản phẩm.
                  </p>
                  <p>
                    <strong>Cam kết 1 đổi 1:</strong> Trong vòng 7 ngày nếu phát hiện bất kỳ lỗi kỹ thuật nào từ nhà sản xuất.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Giao hàng & lắp đặt */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('shipping')}
                className="w-full py-3.5 flex items-center justify-between text-left text-sm font-normal text-neutral-900 hover:text-brand-800 transition cursor-pointer"
              >
                <span>Giao hàng & lắp đặt</span>
                <span className="text-base text-neutral-500 font-light">
                  {openAccordions.shipping ? '−' : '+'}
                </span>
              </button>
              {openAccordions.shipping && (
                <div className="pb-4 text-xs sm:text-sm text-neutral-600 space-y-2">
                  <p>
                    <strong>Khu vực TP. Hồ Chí Minh:</strong> Giao hàng và lắp đặt hoàn toàn miễn phí trong vòng 24 - 48 giờ.
                  </p>
                  <p>
                    <strong>Các tỉnh thành khác:</strong> Hỗ trợ giao tận nơi với chi phí ưu đãi nhất, bọc màng PE và khung gỗ chống va đập.
                  </p>
                  <p>
                    <strong>Đội ngũ chuyên nghiệp:</strong> Đưa tận phòng, lắp đặt chỉn chu và thu dọn sạch sẽ trước khi bàn giao.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Xem cửa hàng trưng bày */}
      {showShowroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowShowroomModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 text-neutral-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-700" /> Hệ Thống Showroom Góc Nhà Đẹp
            </h3>
            <p className="text-xs text-neutral-500">
              Sản phẩm <strong>"{product.name}"</strong> hiện đang được trưng bày thực tế tại:
            </p>

            <div className="space-y-3 pt-2">
              {/* Showroom 1 */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-neutral-900">Showroom 1 (Tân Phú)</h4>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Có hàng sẵn</span>
                </div>
                <p className="text-xs text-neutral-700">
                  615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. HCM
                </p>
                <div className="flex items-center justify-between text-xs pt-1 text-neutral-500">
                  <span>Giờ mở cửa: 08:30 - 21:00</span>
                  <a href="tel:0931883988" className="font-bold text-brand-700 flex items-center gap-1 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> 0931.883.988
                  </a>
                </div>
              </div>

              {/* Showroom 2 */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-neutral-900">Showroom 2 (Tây Thạnh)</h4>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Có hàng sẵn</span>
                </div>
                <p className="text-xs text-neutral-700">
                  295 Tây Thạnh, Phường Tây Thạnh, Quận Tân Phú, TP. HCM
                </p>
                <div className="flex items-center justify-between text-xs pt-1 text-neutral-500">
                  <span>Giờ mở cửa: 08:30 - 21:00</span>
                  <a href="tel:0931883988" className="font-bold text-brand-700 flex items-center gap-1 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> 0931.883.988
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShowroomModal(false)}
              className="w-full py-3 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Đăng ký thành viên nhận 5% */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowMemberModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 text-neutral-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="w-12 h-12 rounded-full bg-[#657662]/10 text-[#657662] flex items-center justify-center mx-auto text-xl font-bold">
                5%
              </span>
              <h3 className="text-lg font-bold text-neutral-900">
                Đăng Ký Thành Viên Góc Nhà Đẹp
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Nhận ngay mã giảm giá <strong>5%</strong> cho đơn hàng đầu tiên và cập nhật ưu đãi độc quyền dành riêng cho thành viên.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowMemberModal(false);
                toast.success('Chúc mừng! Mã giảm giá GOCNHADEP5 đã được gửi đến số điện thoại của bạn.');
              }}
              className="space-y-3 pt-2"
            >
              <input
                type="text"
                placeholder="Họ và tên của bạn"
                required
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
              />
              <input
                type="tel"
                placeholder="Số điện thoại nhận mã ưu đãi"
                required
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#657662] hover:bg-[#576654] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition"
              >
                Nhận Voucher Ngay
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
