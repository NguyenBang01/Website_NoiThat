import React, { useState } from 'react';
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

// 4 sản phẩm chuẩn thiết kế theo đúng bản Figma (Ảnh 1, 2, 3, 4)
const DEFAULT_NEW_PRODUCTS: Product[] = [
  {
    id: 201,
    name: 'Ghế Sofa',
    slug: 'ghe-sofa-vang-boc-vai-cao-cap',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 15,
  },
  {
    id: 202,
    name: 'Ghế Sofa',
    slug: 'binh-thuy-tinh-nghe-thuat-lam-ngoc',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 20,
  },
  {
    id: 203,
    name: 'Ghế Sofa',
    slug: 'ghe-armchair-thu-gian-pastel',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 12,
  },
  {
    id: 204,
    name: 'Ghế Sofa',
    slug: 'ghe-may-dan-vintage-cao-cap',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1580481077195-c328a37db71a?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 18,
  },
];

const DEFAULT_BEST_PRODUCTS: Product[] = [
  {
    id: 205,
    name: 'Bàn Ăn Mây',
    slug: 'ban-an-may-tu-nhien',
    base_price: 18900000,
    sale_price: 18900000,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 10,
  },
  {
    id: 206,
    name: 'Sofa Da Cao Cấp',
    slug: 'sofa-da-cao-cap-y',
    base_price: 25000000,
    sale_price: 25000000,
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 8,
  },
  {
    id: 207,
    name: 'Giường Ngủ',
    slug: 'giuong-ngu-hien-dai',
    base_price: 22000000,
    sale_price: 22000000,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 14,
  },
  {
    id: 208,
    name: 'Đèn Cây Đứng',
    slug: 'den-cay-dung-sang-trong',
    base_price: 8500000,
    sale_price: 8500000,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 25,
  },
];

export default function NewAndBestSellersSection({ products = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'new' | 'best'>('new');
  const wishlistIds = useStore($wishlistIds);

  // Lấy đúng 4 sản phẩm theo hàng ngang (Figma Ảnh 2)
  const sourceProducts = Array.isArray(products) ? products : [];

  const newArrivals: Product[] = [];
  const bestSellers: Product[] = [];

  for (let i = 0; i < 4; i++) {
    newArrivals.push(sourceProducts[i] || DEFAULT_NEW_PRODUCTS[i]);
  }

  const featured = sourceProducts.filter((p) => p.is_featured);
  for (let i = 0; i < 4; i++) {
    bestSellers.push(featured[i] || sourceProducts[i + 4] || DEFAULT_BEST_PRODUCTS[i]);
  }

  const displayList = activeTab === 'new' ? newArrivals : bestSellers;

  const handleAddToCart = async (p: Product) => {
    const stock = p.stock_quantity ?? p.total_stock ?? (p.in_stock === false ? 0 : 10);
    if (stock <= 0 || p.in_stock === false) {
      toast.error(`Sản phẩm "${p.name}" hiện đang tạm hết hàng.`);
      return;
    }

    const price = p.sale_price || p.base_price || 11000000;
    const res = await addToCart({
      variant_id: p.variants?.[0]?.id || p.id,
      product_id: p.id,
      product_name: p.name,
      product_slug: p.slug,
      sku: p.sku || `GND-${p.id}`,
      color: p.colors?.[0] || 'Mặc định',
      material: 'Chất liệu cao cấp',
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

  // Render từng sản phẩm theo đúng Figma Ảnh 3 (Component 5) & Ảnh 4 (Frame 1000002744)
  const renderProductCard = (p: Product, idx: number) => {
    const displayPrice = p.sale_price || p.base_price || 11000000;
    const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);
    const isWishlisted = wishlistIds.includes(p.id);
    const productSlug = p.slug || String(p.id);
    const productUrl = `/products/${productSlug}`;
    const productColors = getProductColors(p);

    return (
      <div
        key={p.id || idx}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          window.location.href = productUrl;
        }}
        /* 
          Component 5 (Ảnh 3):
          - Flow: Vertical
          - Width: Hug (298px)
          - Height: Fixed (375px)
          - Radius: 4px
          - Padding Bottom: 16px
          - Gap: 32px
          - Color: #FDFDFD
        */
        className="group w-[298px] min-w-[260px] xl:min-w-[298px] max-w-[298px] h-[375px] shrink-0 rounded-[4px] p-[12px] pb-[16px] flex flex-col justify-between gap-[32px] bg-[#FDFDFD] border border-stone-200/60 hover:border-brand-500 hover:shadow-md transition-all duration-300 relative box-border cursor-pointer select-none"
      >
        {/* Khung ảnh sản phẩm + Nút Yêu thích & Giỏ hàng ở góc phải */}
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-[2px] bg-white">
          {/* Quick Actions (Trái tim & Giỏ hàng) */}
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

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(p);
              }}
              title="Thêm vào giỏ hàng"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-brand-50 text-stone-500 hover:text-brand-700 shadow-2xs hover:scale-110 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>

          {/* Ảnh sản phẩm căn giữa */}
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
              className="max-h-[200px] w-auto max-w-full object-contain object-center transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              loading="lazy"
            />
          </a>
        </div>

        {/* 
          Frame 1000002744 (Ảnh 4): Khung nhỏ thông tin sản phẩm
          - Flow: Vertical
          - Width: Fill (298px)
          - Height: Hug (59px)
          - Padding: 8px
          - Gap: 24px (hoặc cách đều giữa dòng tên/giá và dòng màu)
        */}
        <div className="w-full min-h-[59px] px-[8px] py-[2px] flex flex-col justify-between box-border">
          {/* Tên đơn hàng (sản phẩm) & Số tiền đơn hàng (Màu xanh lá theo Ảnh 4) */}
          <div className="flex items-baseline justify-between gap-1 w-full">
            <a
              href={productUrl}
              className="text-[13px] sm:text-sm font-medium text-stone-800 hover:text-brand-700 transition truncate max-w-[150px] cursor-pointer"
              title={p.name}
            >
              {p.name}
            </a>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#15803d] shrink-0 font-sans">
              {displayPrice.toLocaleString('vi-VN')}{' '}
              <span className="text-[10px] font-semibold text-[#15803d]/90">VND</span>
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
        </div>
      </div>
    );
  };

  return (
    /* 
      Frame 1000003353 (Ảnh 1): Khung to của Hàng mới về hoặc Bán chạy
      - Width: 1,440px
      - Height: 559px
      - Background: #D7F4D6 (xanh bạc hà pastel)
    */
    <section
      id="frame-1000003353"
      className="w-full max-w-[1440px] mx-auto min-h-[559px] rounded-[16px] bg-[#D7F4D6] relative flex flex-col justify-start box-border overflow-hidden select-none"
      style={{ opacity: 1 }}
    >
      {/* 
        Thanh Tabs: "Hàng mới về", "Bán chạy" & "Xem tất cả ->" (Figma Ảnh 1)
        Căn chuẩn theo độ rộng Fixed (1,280px) căn giữa
      */}
      <div className="w-full max-w-[1280px] mx-auto pt-6 px-4 sm:px-0 flex items-center justify-between box-border">
        <div className="flex items-center gap-2">
          {/* Tab Hàng mới về */}
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-6 py-2.5 rounded-t-[8px] font-bold text-sm sm:text-base transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-[#bceabc] text-[#15803d] shadow-2xs'
                : 'bg-white/80 hover:bg-white text-[#15803d] font-semibold'
            }`}
          >
            Hàng mới về
          </button>

          {/* Tab Bán chạy */}
          <button
            type="button"
            onClick={() => setActiveTab('best')}
            className={`px-6 py-2.5 rounded-t-[8px] font-bold text-sm sm:text-base transition-all cursor-pointer ${
              activeTab === 'best'
                ? 'bg-[#bceabc] text-[#15803d] shadow-2xs'
                : 'bg-white/80 hover:bg-white text-[#15803d] font-semibold'
            }`}
          >
            Bán chạy
          </button>
        </div>

        {/* Nút Xem tất cả -> */}
        <a
          href="/products"
          className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-brand-700 flex items-center gap-1 transition"
        >
          Xem tất cả <span className="text-base leading-none">→</span>
        </a>
      </div>

      {/* 
        Frame 1000003299 (Ảnh 2): Khung chứa tất cả các sản phẩm
        - Flow: Horizontal
        - Width: Fixed (1,280px)
        - Height: Hug (375px)
        - Top: 107px (thông qua mt-[18px] kết hợp pt-6 của tabs)
        - Left: 79px (mx-auto trong max-w-[1280px] của 1440px)
        - Justify: space-between
      */}
      <div
        id="frame-1000003299"
        className="w-full max-w-[1280px] mx-auto min-h-[375px] mt-[18px] mb-[77px] px-4 sm:px-0 flex flex-row items-center justify-between gap-4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 box-border"
      >
        {displayList.map((p, idx) => renderProductCard(p, idx))}
      </div>
    </section>
  );
}
