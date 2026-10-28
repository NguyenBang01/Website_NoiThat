import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Product } from '../../types';
import { formatCurrency, getProductImage } from '../../lib/format';
import { addToCart } from '../../stores/cartStore';
import { $wishlistIds, toggleWishlist } from '../../stores/wishlistStore';
import { toast } from 'sonner';

interface Props {
  products?: Product[];
}

export default function NewAndBestSellersSection({ products = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'new' | 'best'>('new');
  const wishlistIds = useStore($wishlistIds);

  // Lọc sản phẩm thực tế từ backend
  const newArrivals = products.slice(0, 3);
  const bestSellers = products.filter((p) => p.is_featured).slice(0, 3);

  const displayList = activeTab === 'new' ? newArrivals : (bestSellers.length > 0 ? bestSellers : newArrivals);

  if (displayList.length === 0) {
    return null;
  }

  const handleAddToCart = async (p: Product) => {
    const price = p.sale_price || p.base_price || 0;
    const res = await addToCart({
      variant_id: p.variants?.[0]?.id || p.id,
      product_id: p.id,
      product_name: p.name,
      product_slug: p.slug,
      sku: p.sku || `GND-${p.id}`,
      color: p.colors?.[0] || 'Mặc định',
      material: 'Chất liệu tiêu chuẩn',
      image_url: p.image || p.images?.[0]?.url,
      original_price: p.base_price || price,
      unit_price: price,
      quantity: 1,
      stock_quantity: 30,
      available: true,
    });

    if (res.success) {
      toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Top Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`py-3 px-6 rounded-t-2xl font-bold text-sm sm:text-base transition cursor-pointer ${
              activeTab === 'new'
                ? 'bg-[#dcfce7] text-brand-900 border-t border-x border-[#bbf7d0]'
                : 'bg-white text-warm-600 hover:text-warm-900'
            }`}
          >
            Hàng mới về
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('best')}
            className={`py-3 px-6 rounded-t-2xl font-bold text-sm sm:text-base transition cursor-pointer ${
              activeTab === 'best'
                ? 'bg-[#dcfce7] text-brand-900 border-t border-x border-[#bbf7d0]'
                : 'bg-white text-warm-600 hover:text-warm-900'
            }`}
          >
            Bán chạy
          </button>
        </div>

        <a
          href="/products"
          className="text-xs sm:text-sm font-semibold text-warm-900 hover:text-brand-700 underline underline-offset-4 flex items-center gap-1 transition"
        >
          Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Container */}
      <div className="bg-[#dcfce7] rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 border border-[#bbf7d0] shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {displayList.map((p) => {
            const displayPrice = p.sale_price || p.base_price || 0;
            const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full relative border border-white hover:border-brand-300"
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
                    className={`w-8 h-8 rounded-full bg-white/95 shadow-xs flex items-center justify-center transition cursor-pointer ${
                      wishlistIds.includes(p.id)
                        ? 'text-rose-600 bg-white'
                        : 'text-warm-400 hover:text-rose-500 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${wishlistIds.includes(p.id) ? 'fill-rose-600' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    title="Thêm vào giỏ"
                    className="w-8 h-8 rounded-full bg-white/95 text-warm-600 hover:text-brand-700 shadow-xs flex items-center justify-center transition"
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </a>

                {/* Info Block */}
                <div className="flex flex-col flex-1 justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-warm-500">
                      <span>{p.category?.name || 'Nội thất'}</span>
                      <span className="font-serif font-bold text-sm text-brand-800">
                        {formatCurrency(displayPrice)}
                      </span>
                    </div>

                    <a href={`/products/${p.slug}`} className="block">
                      <h4 className="text-xs font-semibold text-warm-900 line-clamp-2 min-h-[2.2rem] leading-snug group-hover:text-brand-700 transition">
                        {p.name}
                      </h4>
                    </a>
                  </div>

                  {/* Color swatches */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-warm-100">
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
              </div>
            );
          })}

          {/* Promo Card 4 with "Mua ngay" (Matching Figma Image 5) */}
          <div className="bg-white rounded-2xl p-5 shadow-soft flex flex-col justify-between text-center relative border border-white h-full">
            <div className="pt-2">
              <span className="font-serif font-black text-xl text-brand-900 tracking-wider">
                GÓC NHÀ ĐẸP
              </span>
              <p className="text-xs text-warm-500 font-medium mt-1">
                Bộ sưu tập đón đầu xu hướng
              </p>
            </div>

            <div className="py-4 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-[#e8f7ee] flex items-center justify-center text-brand-800 mb-4 shadow-xs">
                <ShoppingBag className="w-10 h-10 text-brand-700" />
              </div>
              <a
                href="/products"
                className="w-full py-2.5 px-4 rounded-xl bg-[#00b4d8] hover:bg-[#0096c7] text-white font-bold text-sm tracking-wide transition shadow-sm hover:shadow"
              >
                Mua ngay
              </a>
            </div>

            <p className="text-[11px] text-warm-400 italic pb-1">
              * Cam kết 100% chính hãng
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
