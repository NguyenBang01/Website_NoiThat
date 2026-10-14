import React, { useState } from 'react';
import { Heart, ShoppingBag, Filter, ArrowRight } from 'lucide-react';
import type { Product, Category } from '../../types';
import { formatCurrency, getProductImage } from '../../lib/format';
import { addToCart } from '../../stores/cartStore';
import { toast } from 'sonner';

interface Props {
  products?: Product[];
  categories?: Category[];
}

export default function RoomShowroomSection({ products = [], categories = [] }: Props) {
  const [selectedRoom, setSelectedRoom] = useState('Tất cả');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under5m' | '5m-10m' | 'over10m'>('all');
  const [selectedPill, setSelectedPill] = useState<string>('');

  // Lấy danh sách tabs từ categories backend
  const categoryNames = categories.map((c) => c.name);
  const rooms = ['Tất cả', ...Array.from(new Set(categoryNames.length > 0 ? categoryNames : ['Sofa', 'Ghế', 'Bàn ăn', 'Giường', 'Đèn']))];

  const filterPills = [
    { label: 'Tất cả mức giá', value: 'all' },
    { label: 'Dưới 5 triệu', value: 'under5m' },
    { label: '5 - 10 triệu', value: '5m-10m' },
    { label: 'Trên 10 triệu', value: 'over10m' },
  ];

  // Lọc sản phẩm thực tế từ backend
  let filtered = products;

  // Lọc theo phòng / danh mục
  if (selectedRoom !== 'Tất cả') {
    filtered = filtered.filter(
      (p) =>
        p.category?.name?.toLowerCase().includes(selectedRoom.toLowerCase()) ||
        p.category?.slug?.toLowerCase().includes(selectedRoom.toLowerCase())
    );
  }

  // Lọc theo mức giá
  if (priceFilter === 'under5m') {
    filtered = filtered.filter((p) => (p.sale_price || p.base_price || 0) < 5000000);
  } else if (priceFilter === '5m-10m') {
    filtered = filtered.filter((p) => {
      const price = p.sale_price || p.base_price || 0;
      return price >= 5000000 && price <= 10000000;
    });
  } else if (priceFilter === 'over10m') {
    filtered = filtered.filter((p) => (p.sale_price || p.base_price || 0) > 10000000);
  }

  const handleAddToCart = async (p: Product) => {
    const price = p.sale_price || p.base_price || 0;
    const res = await addToCart({
      variant_id: p.variants?.[0]?.id || p.id,
      product_id: p.id,
      product_name: p.name,
      product_slug: p.slug,
      sku: p.sku || `GND-${p.id}`,
      color: p.colors?.[0] || 'Tiêu chuẩn',
      material: 'Gỗ & Vải nhập khẩu',
      image_url: p.image || p.images?.[0]?.url,
      original_price: p.base_price || price,
      unit_price: price,
      quantity: 1,
      stock_quantity: 20,
      available: true,
    });

    if (res.success) {
      toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`);
    } else {
      toast.error(res.message);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="phong-trung-bay" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
      {/* Title Header */}
      <div className="text-center space-y-1 mb-8">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-700">
          MỖI KHÔNG GIAN MỘT CÂU CHUYỆN
        </h3>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-brand-900 tracking-tight">
          PHÒNG TRƯNG BÀY GÓC NHÀ ĐẸP
        </h2>
      </div>

      {/* Room Tabs */}
      <div className="bg-[#e8f7ee]/60 rounded-2xl p-2 max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-around overflow-x-auto text-sm font-semibold">
          {rooms.map((room) => (
            <button
              key={room}
              type="button"
              onClick={() => setSelectedRoom(room)}
              className={`py-2 px-4 transition relative whitespace-nowrap cursor-pointer ${
                selectedRoom === room
                  ? 'text-brand-800 font-bold'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              {room}
              {selectedRoom === room && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-700 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter pills bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-6 pt-1">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warm-100 text-warm-700 text-xs font-bold shrink-0">
          <Filter className="w-3.5 h-3.5 text-brand-700" /> Bộ lọc giá:
        </div>

        {filterPills.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setPriceFilter(pill.value as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 border cursor-pointer ${
              priceFilter === pill.value
                ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                : 'bg-white border-warm-200 text-warm-700 hover:border-brand-500 hover:text-brand-700'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Products Grid (4 columns) - Tight whitespace-free layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {filtered.map((p) => {
          const displayPrice = p.sale_price || p.base_price || 0;
          const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);

          return (
            <div
              key={p.id}
              className="group bg-white rounded-2xl border border-warm-200 hover:border-brand-400 p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full relative"
            >
              {/* Quick Actions */}
              <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  title="Yêu thích"
                  className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-warm-400 hover:text-rose-500 hover:bg-white shadow-xs flex items-center justify-center transition"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(p)}
                  title="Thêm vào giỏ"
                  className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-warm-600 hover:text-brand-700 hover:bg-white shadow-xs flex items-center justify-center transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>

              {/* Product Image Link to Detail Page */}
              <a
                href={`/products/${p.slug}`}
                title={`Xem chi tiết ${p.name}`}
                className="w-full aspect-square rounded-xl bg-warm-50 overflow-hidden mb-3.5 block shrink-0 cursor-pointer"
              >
                <img
                  src={imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </a>

              {/* Info Block */}
              <div className="flex flex-col flex-1 justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-warm-400">
                    <span className="font-medium">{p.category?.name || 'Nội thất'}</span>
                    <span className="font-serif font-bold text-sm text-brand-800">
                      {formatCurrency(displayPrice)}
                    </span>
                  </div>

                  <a
                    href={`/products/${p.slug}`}
                    className="block group-hover:text-brand-700 transition"
                  >
                    <h4 className="text-xs font-semibold text-warm-900 line-clamp-2 min-h-[2.4rem] leading-snug">
                      {p.name}
                    </h4>
                  </a>
                </div>

                {/* Bottom Row: Colors & Xem chi tiết */}
                <div className="pt-2 border-t border-warm-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {p.colors && p.colors.length > 0 ? (
                      p.colors.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-md text-[10px] bg-warm-100 text-warm-700 font-medium border border-warm-200"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-warm-400">Tiêu chuẩn</span>
                    )}
                  </div>

                  <a
                    href={`/products/${p.slug}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    Chi tiết <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Button Xem tất cả */}
      <div className="text-center pt-10">
        <a
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm tracking-wide transition shadow-sm hover:shadow gap-2"
        >
          Xem tất cả sản phẩm Góc Nhà Đẹp <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
