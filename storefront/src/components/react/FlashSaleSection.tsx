import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../../types';
import { formatCurrency, getProductImage } from '../../lib/format';
import { addToCart } from '../../stores/cartStore';
import { $wishlistIds, toggleWishlist } from '../../stores/wishlistStore';
import { toast } from 'sonner';

interface Props {
  products?: Product[];
}

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

  // Lọc sản phẩm thực tế từ backend
  const flashProducts = products.length > 0 ? products.slice(0, 3) : [];

  const handleAddFlashItem = async (p: Product) => {
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
      stock_quantity: 10,
      available: true,
    });

    if (res.success) {
      toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`);
    } else {
      toast.error(res.message);
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  if (flashProducts.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Title & Countdown bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-warm-100">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-brand-800 tracking-tight flex items-center gap-2">
          FLASH SALE NỘI THẤT
        </h2>

        {/* Countdown Box */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-warm-700">Bắt đầu sau</span>
          <div className="flex items-center gap-1.5 text-orange-600 font-bold font-mono text-base sm:text-lg">
            <span className="bg-orange-50 px-2 py-1 rounded-md border border-orange-200 min-w-[32px] text-center">
              {pad(timeLeft.days)}
            </span>
            <span className="text-warm-400">:</span>
            <span className="bg-orange-50 px-2 py-1 rounded-md border border-orange-200 min-w-[32px] text-center">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-warm-400">:</span>
            <span className="bg-orange-50 px-2 py-1 rounded-md border border-orange-200 min-w-[32px] text-center">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-warm-400">:</span>
            <span className="bg-orange-50 px-2 py-1 rounded-md border border-orange-200 min-w-[32px] text-center">
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Time Slot Tabs */}
      <div className="flex items-center gap-3 pt-5 pb-6">
        <button
          type="button"
          onClick={() => setActiveSlot(0)}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeSlot === 0
              ? 'bg-brand-700 text-white shadow-xs'
              : 'border border-brand-700 text-brand-700 hover:bg-brand-50'
          }`}
        >
          12 - 15h Hôm nay
        </button>
        <button
          type="button"
          onClick={() => setActiveSlot(1)}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeSlot === 1
              ? 'bg-brand-700 text-white shadow-xs'
              : 'border border-brand-700 text-brand-700 hover:bg-brand-50'
          }`}
        >
          20 - 22h Hôm nay
        </button>
      </div>

      {/* Products Carousel / Grid with Real Backend Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {flashProducts.slice(0, 2).map((p, idx) => {
          const displayPrice = p.sale_price || p.base_price || 0;
          const originalPrice = p.base_price || displayPrice;
          const soldCount = 12 + idx * 7;
          const remainingStock = 8;
          const soldPercent = Math.min(100, Math.round((soldCount / (soldCount + remainingStock)) * 100));
          const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);

          return (
            <div
              key={p.id}
              className="group bg-white rounded-2xl border border-warm-200 hover:border-brand-300 p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full relative"
            >
              {/* Quick Actions */}
              <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(p);
                  }}
                  title={wishlistIds.includes(p.id) ? 'Bỏ thích' : 'Yêu thích'}
                  className={`w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs shadow-xs flex items-center justify-center transition cursor-pointer ${
                    wishlistIds.includes(p.id)
                      ? 'text-rose-600 bg-white'
                      : 'text-warm-400 hover:text-rose-500 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${wishlistIds.includes(p.id) ? 'fill-rose-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFlashItem(p)}
                  title="Thêm vào giỏ"
                  className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-warm-600 hover:text-brand-700 hover:bg-white shadow-xs flex items-center justify-center transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>

              {/* Product Image Link */}
              <a
                href={`/products/${p.slug}`}
                className="w-full aspect-square rounded-xl bg-warm-50 overflow-hidden mb-3.5 block shrink-0"
              >
                <img
                  src={imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </a>

              {/* Name & Price */}
              <div className="flex flex-col flex-1 justify-between gap-3">
                <div className="space-y-1.5">
                  <a href={`/products/${p.slug}`} className="block">
                    <h3 className="text-sm font-semibold text-warm-900 line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-brand-700 transition">
                      {p.name}
                    </h3>
                  </a>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-accent font-serif">
                      {formatCurrency(displayPrice)}
                    </span>
                    {p.sale_price && p.base_price && p.sale_price < p.base_price && (
                      <span className="text-xs text-warm-400 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Color swatches from backend */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {p.colors && p.colors.length > 0 ? (
                      p.colors.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-warm-100 text-warm-700 font-medium border border-warm-200"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-warm-400">Tiêu chuẩn</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-2 border-t border-warm-100/80">
                  <div className="w-full h-2 rounded-full bg-orange-100 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${soldPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-warm-500 font-medium mt-1">
                    <span>Đã bán {soldCount}</span>
                    <span>Còn lại {remainingStock}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Feature Promo Card (Figma Card 3 with "Mua ngay") */}
        <div className="bg-linear-to-b from-[#f0fdf4] to-white rounded-2xl border border-emerald-200 p-5 shadow-soft flex flex-col justify-between text-center relative overflow-hidden h-full">
          <div className="pt-2">
            <span className="font-serif font-black text-xl text-brand-900 tracking-wider">
              GÓC NHÀ ĐẸP
            </span>
            <p className="text-xs text-brand-700 font-medium mt-1">
              Ưu đãi độc quyền Flash Sale hôm nay
            </p>
          </div>

          <div className="py-4 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-brand-800 mb-4 shadow-xs">
              <ShoppingBag className="w-10 h-10 text-brand-700 animate-pulse" />
            </div>
            <a
              href="/products"
              className="w-full py-2.5 px-4 rounded-xl bg-[#00b4d8] hover:bg-[#0096c7] text-white font-bold text-sm tracking-wide transition shadow-sm hover:shadow"
            >
              Mua ngay
            </a>
          </div>

          <p className="text-[11px] text-warm-500 italic pb-1">
            * Số lượng có hạn theo từng khung giờ
          </p>
        </div>

        {/* Product 3 from backend */}
        {flashProducts.slice(2, 3).map((p) => {
          const displayPrice = p.sale_price || p.base_price || 0;
          const originalPrice = p.base_price || displayPrice;
          const soldCount = 20;
          const remainingStock = 5;
          const soldPercent = Math.min(100, Math.round((soldCount / (soldCount + remainingStock)) * 100));
          const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);

          return (
            <div
              key={p.id}
              className="group bg-white rounded-2xl border border-warm-200 hover:border-brand-300 p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full relative"
            >
              {/* Quick Actions */}
              <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(p);
                  }}
                  title={wishlistIds.includes(p.id) ? 'Bỏ thích' : 'Yêu thích'}
                  className={`w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs shadow-xs flex items-center justify-center transition cursor-pointer ${
                    wishlistIds.includes(p.id)
                      ? 'text-rose-600 bg-white'
                      : 'text-warm-400 hover:text-rose-500 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${wishlistIds.includes(p.id) ? 'fill-rose-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFlashItem(p)}
                  title="Thêm vào giỏ"
                  className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-warm-600 hover:text-brand-700 hover:bg-white shadow-xs flex items-center justify-center transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>

              {/* Image Link */}
              <a
                href={`/products/${p.slug}`}
                className="w-full aspect-square rounded-xl bg-warm-50 overflow-hidden mb-3.5 block shrink-0"
              >
                <img
                  src={imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </a>

              {/* Name & Price */}
              <div className="flex flex-col flex-1 justify-between gap-3">
                <div className="space-y-1.5">
                  <a href={`/products/${p.slug}`} className="block">
                    <h3 className="text-sm font-semibold text-warm-900 line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-brand-700 transition">
                      {p.name}
                    </h3>
                  </a>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-accent font-serif">
                      {formatCurrency(displayPrice)}
                    </span>
                    {p.sale_price && p.base_price && p.sale_price < p.base_price && (
                      <span className="text-xs text-warm-400 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Color swatches */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {p.colors && p.colors.length > 0 ? (
                      p.colors.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-warm-100 text-warm-700 font-medium border border-warm-200"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-warm-400">Tiêu chuẩn</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-2 border-t border-warm-100/80">
                  <div className="w-full h-2 rounded-full bg-orange-100 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${soldPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-warm-500 font-medium mt-1">
                    <span>Đã bán {soldCount}</span>
                    <span>Còn lại {remainingStock}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
