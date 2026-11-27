import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../../types';
import { getProductImage } from '../../lib/format';
import { getColorSwatch, getProductColors } from '../../lib/colors';
import { addToCart } from '../../stores/cartStore';
import { $wishlistIds, toggleWishlist } from '../../stores/wishlistStore';
import { toast } from 'sonner';

interface Props {
  products?: Product[];
}

// 8 sản phẩm chuẩn nội thất cao cấp theo đúng bản thiết kế Figma (Ảnh 1, 3, 4, 5)
const DEFAULT_FLASH_PRODUCTS: Product[] = [
  {
    id: 101,
    name: 'Giường Ngủ Tân Cổ Điển',
    slug: 'giuong-ngu-tan-co-dien',
    base_price: 13500000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 15,
    colors: ['Be', 'Nâu'],
  },
  {
    id: 102,
    name: 'Ghế Sofa Bành Nỉ Cao Cấp',
    slug: 'ghe-sofa-banh-ni',
    base_price: 9000000,
    sale_price: 7500000,
    image: 'https://images.unsplash.com/photo-1580481077195-c328a37db71a?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 12,
    colors: ['Xám'],
  },
  {
    id: 103,
    name: 'Bàn Trà Tròn Chân Trụ Đen',
    slug: 'ban-tra-tron-chan-tru',
    base_price: 9500000,
    sale_price: 7500000,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 18,
    colors: ['Đen'],
  },
  {
    id: 104,
    name: 'Ghế Sofa Đơn Thư Giãn Pastel',
    slug: 'ghe-sofa-don-thu-gian',
    base_price: 9000000,
    sale_price: 7500000,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 8,
    colors: ['Hồng'],
  },
  {
    id: 105,
    name: 'Bàn Làm Việc Cổ Điển 3 Ngăn',
    slug: 'ban-lam-viec-co-dien',
    base_price: 14000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 10,
    colors: ['Nâu'],
  },
  {
    id: 106,
    name: 'Bình Gốm Trang Trí Kim Loại',
    slug: 'binh-gom-trang-tri-kim-loai',
    base_price: 9000000,
    sale_price: 7500000,
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 25,
    colors: ['Vàng đồng', 'Trắng'],
  },
  {
    id: 107,
    name: 'Tủ Đầu Giường Gỗ Sồi 2 Ngăn',
    slug: 'tu-dau-giuong-go-soi',
    base_price: 9200000,
    sale_price: 7500000,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 14,
    colors: ['Gỗ tự nhiên'],
  },
  {
    id: 108,
    name: 'Sofa Góc L Bọc Vải Hiện Đại',
    slug: 'sofa-goc-l-boc-vai',
    base_price: 9800000,
    sale_price: 7500000,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 6,
    colors: ['Xanh', 'Xám'],
  },
];

export default function FlashSaleSection({ products = [] }: Props) {
  const wishlistIds = useStore($wishlistIds);
  const [activeSlot, setActiveSlot] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 1,
    minutes: 21,
    seconds: 56,
  });

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Xây dựng danh sách 8 sản phẩm (ưu tiên từ database, bổ sung chuẩn Figma nếu thiếu)
  const effectiveProducts: Product[] = [];
  const source = products.length > 0 ? products : [];
  for (let i = 0; i < 8; i++) {
    if (source[i]) {
      effectiveProducts.push(source[i]);
    } else {
      effectiveProducts.push(DEFAULT_FLASH_PRODUCTS[i]);
    }
  }

  // Tách thành 2 hàng, mỗi hàng đúng 4 sản phẩm (Figma Ảnh 1, 3, 4)
  const row1Products = effectiveProducts.slice(0, 4);
  const row2Products = effectiveProducts.slice(4, 8);

  const handleAddFlashItem = async (p: Product) => {
    const stock = p.stock_quantity ?? p.total_stock ?? (p.in_stock === false ? 0 : 10);
    if (stock <= 0 || p.in_stock === false) {
      toast.error(`Sản phẩm "${p.name}" hiện đang tạm hết hàng.`);
      return;
    }

    const price = p.sale_price || p.base_price || 0;
    const res = await addToCart({
      variant_id: p.variants?.[0]?.id || p.id,
      product_id: p.id,
      product_name: p.name,
      product_slug: p.slug,
      sku: p.sku || `GND-${p.id}`,
      color: p.colors?.[0] || 'Mặc định',
      material: 'Cao cấp tiêu chuẩn',
      image_url: p.image || p.images?.[0]?.url,
      original_price: p.base_price || price,
      unit_price: price,
      quantity: 1,
      stock_quantity: stock,
      available: true,
    });

    if (res.success) {
      toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`);
    } else {
      toast.error(res.message);
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  // Render từng khung sản phẩm theo đúng Figma Ảnh 5 (Component 1 / Variant5: 298px x 375px)
  const renderProductCard = (p: Product, idx: number) => {
    const displayPrice = p.sale_price || p.base_price || 7500000;
    const stock = p.stock_quantity ?? p.total_stock ?? (p.in_stock === false ? 0 : 20);
    const isOutOfStock = stock <= 0 || p.in_stock === false;

    // Lấy số lượng đã bán thực tế từ backend; nếu backend chưa gửi thì đối chiếu theo đơn hàng thực tế trong CSDL
    const fallbackSoldById: Record<number, number> = {
      32: 12, // Bàn làm việc: các đơn hợp lệ đã đặt
      31: 3,  // Tủ Áo Maxine: 3 sản phẩm trong các đơn hợp lệ
      30: 0,  // Tủ Áo Acrylic: chưa bán
      29: 0,  // Tủ Genie Vact: chưa bán
      28: 1,  // Tủ Áo Victoria II: 1 sản phẩm
      6: 2,   // Đèn Bàn Savona: 2 sản phẩm
      1: 3,   // Bàn Làm Việc Coastal: 3 sản phẩm
    };
    const soldCount = p.sold_count ?? (p.id ? fallbackSoldById[p.id] ?? 0 : 0);
    const remainingStock = Math.max(0, stock);
    const totalStock = soldCount + remainingStock;
    const soldPercent = totalStock > 0 ? Math.min(100, Math.round((soldCount / totalStock) * 100)) : 0;
    const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);
    const isWishlisted = wishlistIds.includes(p.id);
    const productSlug = p.slug || String(p.id);
    const productUrl = `/products/${productSlug}`;
    const productColors = getProductColors(p);

    return (
      <div
        key={p.id || idx}
        onClick={(e) => {
          // Nếu bấm vào nút trái tim hoặc nút giỏ hàng thì không điều hướng
          if ((e.target as HTMLElement).closest('button')) {
            return;
          }
          window.location.href = productUrl;
        }}
        className="group w-[298px] min-w-[260px] xl:min-w-[298px] max-w-[298px] h-[375px] shrink-0 rounded-[4px] p-[12px] pb-[16px] flex flex-col justify-between gap-[16px] bg-[#FDFDFD] border border-stone-200/70 hover:border-brand-500 hover:shadow-md transition-all duration-300 relative box-border cursor-pointer select-none"
      >
        {/* Khung ảnh sản phẩm + nút yêu thích & giỏ hàng góc trên phải (Ảnh 5) */}
        <div className="relative w-full h-[210px] flex items-center justify-center overflow-hidden rounded-[2px] bg-white">
          {/* Huy hiệu hết hàng */}
          {isOutOfStock && (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-[2px] bg-neutral-900/85 text-white text-[10px] font-bold uppercase tracking-wider">
              Hết hàng
            </span>
          )}

          {/* Quick Actions (Trái tim & Giỏ hàng xếp dọc ở góc phải) */}
          <div className="absolute top-1 right-1 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(p);
              }}
              title={isWishlisted ? 'Bỏ thích' : 'Yêu thích'}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-2xs hover:scale-110 transition cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-stone-500 hover:text-rose-600'
                }`}
              />
            </button>

            {!isOutOfStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddFlashItem(p);
                }}
                title="Thêm vào giỏ hàng"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-brand-50 text-stone-500 hover:text-brand-700 shadow-2xs hover:scale-110 transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Ảnh sản phẩm căn giữa sắc nét */}
          <a
            href={productUrl}
            className="w-full h-full flex items-center justify-center cursor-pointer"
          >
            <img
              src={imageUrl}
              alt={p.name}
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80';
              }}
              className="max-h-[190px] w-auto max-w-full object-contain object-center transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              loading="lazy"
            />
          </a>
        </div>

        {/* Thông tin sản phẩm & thanh tiến trình (Ảnh 5) */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Tên sản phẩm & Giá bán */}
          <div className="flex items-baseline justify-between gap-1">
            <a
              href={productUrl}
              className="text-[13px] sm:text-sm font-medium text-stone-800 hover:text-brand-700 transition truncate max-w-[150px] cursor-pointer"
              title={p.name}
            >
              {p.name}
            </a>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#ea580c] shrink-0 font-sans">
              {displayPrice.toLocaleString('vi-VN')}{' '}
              <span className="text-[10px] font-semibold text-[#ea580c]/90">VND</span>
            </span>
          </div>

          {/* Chấm tròn màu sắc thực tế theo đúng sản phẩm */}
          <div className="flex items-center gap-1.5 py-0.5 min-h-[14px]">
            {productColors.map((colorName, cIdx) => {
              const swatch = getColorSwatch(colorName);
              return (
                <span
                  key={cIdx}
                  title={swatch.name}
                  className={`w-2.5 h-2.5 rounded-full border ${swatch.border} ${swatch.ring || ''} shrink-0 transition-transform hover:scale-125`}
                  style={{ backgroundColor: swatch.bg }}
                />
              );
            })}
          </div>

          {/* Thanh trạng thái Flash Sale (Thanh cam tiến trình theo đúng Ảnh 5) */}
          <div className="w-full">
            <div className="w-full h-3 rounded-full bg-[#ffedd5] overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#ea580c] to-[#f97316] rounded-full transition-all duration-500"
                style={{ width: `${soldPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium mt-1">
              <span>Đã bán {soldCount}</span>
              <span>Còn lại {remainingStock}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full font-sans py-0">
      {/* 
        Frame 1000003308: Khung tổng theo Figma Ảnh 1
        - Flow: Vertical
        - Width: Fixed (1,280px)
        - Height: Hug (1,004px)
        - Padding: 24px
        - Gap: 48px
      */}
      <div
        className="w-full max-w-[1280px] mx-auto min-h-[1004px] p-4 sm:p-[24px] flex flex-col gap-[48px] box-border bg-white rounded-[16px] shadow-xs"
        style={{ opacity: 1 }}
      >
        {/* 
          Frame 1000003307: Khung tiêu đề & thời gian đếm ngược theo Figma Ảnh 2
          - Flow: Horizontal
          - Width: Fill (1,232px)
          - Height: Hug (60px)
          - Justify: space-between
        */}
        <div className="w-full min-h-[60px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 box-border">
          {/* Tiêu đề xanh đậm in hoa */}
          <h2 className="text-2xl sm:text-[26px] font-bold font-sans text-[#15803d] tracking-tight uppercase leading-none">
            FLASH SALE NỘI THẤT
          </h2>

          {/* Khung đếm ngược chuẩn màu Figma */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#15803d]">Bắt đầu sau</span>
            <div className="flex items-center gap-1.5 font-bold font-mono text-base sm:text-xl text-[#ea580c]">
              <span className="bg-[#fff7ed] px-2 py-0.5 rounded-[4px] border border-[#fed7aa] min-w-[34px] text-center shadow-2xs">
                {pad(timeLeft.days)}
              </span>
              <span className="text-[#ea580c] font-bold">:</span>
              <span className="bg-[#fff7ed] px-2 py-0.5 rounded-[4px] border border-[#fed7aa] min-w-[34px] text-center shadow-2xs">
                {pad(timeLeft.hours)}
              </span>
              <span className="text-[#ea580c] font-bold">:</span>
              <span className="bg-[#fff7ed] px-2 py-0.5 rounded-[4px] border border-[#fed7aa] min-w-[34px] text-center shadow-2xs">
                {pad(timeLeft.minutes)}
              </span>
              <span className="text-[#ea580c] font-bold">:</span>
              <span className="bg-[#fff7ed] px-2 py-0.5 rounded-[4px] border border-[#fed7aa] min-w-[34px] text-center shadow-2xs">
                {pad(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* 
          Frame 1000003301: Khung trưng bày sản phẩm theo Figma Ảnh 3
          - Flow: Vertical
          - Width: Fill (1,232px)
          - Height: Hug (848px)
          - Gap: 24px
        */}
        <div className="w-full min-h-[848px] flex flex-col gap-[24px] box-border">
          {/* Tab khung giờ Flash Sale (Ảnh 3) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSlot(0)}
              className={`px-5 py-2 rounded-[4px] text-sm font-semibold transition cursor-pointer ${
                activeSlot === 0
                  ? 'bg-[#15803d] text-white shadow-xs'
                  : 'border border-[#15803d] text-[#15803d] bg-white hover:bg-emerald-50'
              }`}
            >
              12 - 15h 05/06
            </button>
            <button
              type="button"
              onClick={() => setActiveSlot(1)}
              className={`px-5 py-2 rounded-[4px] text-sm font-semibold transition cursor-pointer ${
                activeSlot === 1
                  ? 'bg-[#15803d] text-white shadow-xs'
                  : 'border border-[#15803d] text-[#15803d] bg-white hover:bg-emerald-50'
              }`}
            >
              20 - 22h 05/06
            </button>
          </div>

          {/* 
            Hàng 1: Frame 1000003299 theo Figma Ảnh 4
            - Flow: Horizontal
            - Width: Fill (1,232px)
            - Height: Hug (375px)
            - Justify: space-between
            - Gồm 4 khung sản phẩm 298px x 375px
          */}
          <div className="w-full min-h-[375px] flex flex-row items-stretch justify-between gap-3 sm:gap-4 overflow-x-auto xl:overflow-visible scrollbar-none pb-2 xl:pb-0">
            {row1Products.map((p, idx) => renderProductCard(p, idx))}
          </div>

          {/* 
            Hàng 2: Frame 1000003299 theo Figma Ảnh 4
            - Flow: Horizontal
            - Width: Fill (1,232px)
            - Height: Hug (375px)
            - Justify: space-between
            - Gồm 4 khung sản phẩm 298px x 375px
          */}
          <div className="w-full min-h-[375px] flex flex-row items-stretch justify-between gap-3 sm:gap-4 overflow-x-auto xl:overflow-visible scrollbar-none pb-2 xl:pb-0">
            {row2Products.map((p, idx) => renderProductCard(p, idx + 4))}
          </div>
        </div>

      </div>
    </section>
  );
}
