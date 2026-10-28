import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { Heart, ShoppingBag, Filter, ArrowRight, X } from 'lucide-react';
import type { Product, Category } from '../../types';
import { formatCurrency, getProductImage } from '../../lib/format';
import { addToCart } from '../../stores/cartStore';
import { $wishlistIds, toggleWishlist } from '../../stores/wishlistStore';
import { toast } from 'sonner';

export function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveCategoryName(
  param: string,
  categories: Category[],
  rooms: string[]
): string {
  if (!param) return 'Tất cả';

  const cleanParam = param.trim();
  const slug = toSlug(cleanParam);

  // 1. Nhóm Tủ & Kệ
  if (
    slug === 'tu-ke' ||
    slug === 'tu' ||
    slug === 'ke' ||
    slug.includes('tu') ||
    slug.includes('ke')
  ) {
    if (rooms.includes('Tủ & Kệ')) return 'Tủ & Kệ';
  }

  // 2. Nếu param là ID số
  const numId = Number(cleanParam);
  if (!isNaN(numId) && numId > 0 && categories.length > 0) {
    const foundById = categories.find((c) => c.id === numId);
    if (foundById) {
      const byName = rooms.find((r) => toSlug(r) === toSlug(foundById.name));
      if (byName) return byName;
      return foundById.name;
    }
  }

  // 3. Khớp theo category slug hoặc name từ categories backend
  if (categories.length > 0) {
    const found = categories.find(
      (c) => toSlug(c.slug) === slug || toSlug(c.name) === slug
    );
    if (found) {
      const byName = rooms.find((r) => toSlug(r) === toSlug(found.name));
      if (byName) return byName;
      return found.name;
    }
  }

  // 4. Khớp chính xác slug trong danh sách rooms
  const exactSlug = rooms.find((r) => toSlug(r) === slug);
  if (exactSlug) return exactSlug;

  // 5. Khớp các nhóm danh mục phổ biến
  if (slug === 'ban' || slug === 'ban-an' || slug.includes('ban')) {
    const banRoom = rooms.find((r) => toSlug(r).includes('ban'));
    if (banRoom) return banRoom;
  }
  if (slug === 'ghe' || slug.includes('ghe')) {
    const gheRoom = rooms.find((r) => toSlug(r).includes('ghe'));
    if (gheRoom) return gheRoom;
  }
  if (slug === 'sofa' || slug.includes('sofa')) {
    const sofaRoom = rooms.find((r) => toSlug(r).includes('sofa'));
    if (sofaRoom) return sofaRoom;
  }
  if (slug === 'giuong' || slug.includes('giuong')) {
    const giuongRoom = rooms.find((r) => toSlug(r).includes('giuong'));
    if (giuongRoom) return giuongRoom;
  }
  if (slug === 'den' || slug.includes('den')) {
    const denRoom = rooms.find((r) => toSlug(r).includes('den'));
    if (denRoom) return denRoom;
  }
  if (slug === 'trang-tri' || slug.includes('trang-tri') || slug.includes('decor')) {
    const decorRoom = rooms.find(
      (r) => toSlug(r).includes('trang-tri') || toSlug(r).includes('decor')
    );
    if (decorRoom) return decorRoom;
  }
  if (slug === 'noi-that-khac' || slug.includes('khac')) {
    const otherRoom = rooms.find((r) => toSlug(r).includes('khac'));
    if (otherRoom) return otherRoom;
  }

  // 6. Khớp một phần
  const partial = rooms.find((r) => {
    const rSlug = toSlug(r);
    return rSlug.includes(slug) || slug.includes(rSlug);
  });
  if (partial) return partial;

  return 'Tất cả';
}

interface Props {
  products?: Product[];
  categories?: Category[];
  initialCategory?: string;
  initialQuery?: string;
}

export default function RoomShowroomSection({
  products = [],
  categories = [],
  initialCategory = '',
  initialQuery = '',
}: Props) {
  // Lấy danh sách tabs từ categories backend và gộp "Tủ" + "Kệ" thành "Tủ & Kệ"
  const rooms = useMemo(() => {
    const rawList =
      categories.length > 0
        ? categories.map((c) => c.name)
        : ['Bàn', 'Ghế', 'Sofa', 'Giường', 'Tủ', 'Kệ', 'Đèn', 'Đồ trang trí', 'Nội thất khác'];

    const result: string[] = ['Tất cả'];
    let addedTuKe = false;

    rawList.forEach((name) => {
      const lower = name.toLowerCase().trim();
      if (
        lower === 'tủ' ||
        lower === 'kệ' ||
        lower === 'tu' ||
        lower === 'ke' ||
        (lower.includes('tủ') && lower.includes('kệ')) ||
        lower === 'tủ & kệ' ||
        lower === 'tủ kệ'
      ) {
        if (!addedTuKe) {
          result.push('Tủ & Kệ');
          addedTuKe = true;
        }
      } else if (!result.includes(name)) {
        result.push(name);
      }
    });

    if (!addedTuKe && rawList.some((n) => n.toLowerCase().includes('tủ') || n.toLowerCase().includes('kệ'))) {
      result.push('Tủ & Kệ');
    }

    return result;
  }, [categories]);

  const [selectedRoom, setSelectedRoom] = useState(() => {
    if (initialCategory) {
      return resolveCategoryName(initialCategory, categories, rooms);
    }
    return 'Tất cả';
  });
  const [priceFilter, setPriceFilter] = useState<'all' | 'under5m' | '5m-10m' | 'over10m'>('all');
  const wishlistIds = useStore($wishlistIds);
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');

  // Lắng nghe thay đổi URL (khi nhấp link trong Header dropdown hoặc back/forward trình duyệt)
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get('q') || '';
      const catParam = params.get('category') || '';

      if (qParam) {
        setSearchQuery(qParam);
      }

      if (catParam) {
        const resolved = resolveCategoryName(catParam, categories, rooms);
        setSelectedRoom(resolved);
      } else if (!initialCategory && !catParam) {
        setSelectedRoom('Tất cả');
      }
    };

    syncFromUrl();

    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('categorychange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('categorychange', syncFromUrl);
    };
  }, [rooms, categories, initialCategory]);

  const filterPills = [
    { label: 'Tất cả mức giá', value: 'all' },
    { label: 'Dưới 5 triệu', value: 'under5m' },
    { label: '5 - 10 triệu', value: '5m-10m' },
    { label: 'Trên 10 triệu', value: 'over10m' },
  ];

  // Lọc sản phẩm thực tế từ backend
  let filtered = products;

  // Lọc theo từ khóa tìm kiếm
  if (searchQuery.trim()) {
    const qLower = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        (p.short_desc && p.short_desc.toLowerCase().includes(qLower)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(qLower)) ||
        (p.sku && p.sku.toLowerCase().includes(qLower))
    );
  }

  // Lọc theo phòng / danh mục (có xử lý gộp Tủ & Kệ)
  if (selectedRoom !== 'Tất cả') {
    const roomSlug = toSlug(selectedRoom);
    const isTuKe =
      selectedRoom === 'Tủ & Kệ' ||
      roomSlug === 'tu-ke' ||
      roomSlug === 'tu' ||
      roomSlug === 'ke';

    if (isTuKe) {
      filtered = filtered.filter((p) => {
        const cName = toSlug(p.category?.name || '');
        const cSlug = toSlug(p.category?.slug || '');
        const pName = toSlug(p.name || '');
        return (
          cName.includes('tu') ||
          cName.includes('ke') ||
          cSlug.includes('tu') ||
          cSlug.includes('ke') ||
          pName.includes('tu') ||
          pName.includes('ke')
        );
      });
    } else {
      filtered = filtered.filter((p) => {
        const cName = toSlug(p.category?.name || '');
        const cSlug = toSlug(p.category?.slug || '');
        const pName = toSlug(p.name || '');

        // Nhóm Bàn / Bàn ăn
        if (roomSlug.includes('ban')) {
          return cName.includes('ban') || cSlug.includes('ban') || pName.includes('ban');
        }
        // Nhóm Ghế
        if (roomSlug.includes('ghe')) {
          return cName.includes('ghe') || cSlug.includes('ghe') || pName.includes('ghe');
        }
        // Nhóm Sofa
        if (roomSlug.includes('sofa')) {
          return cName.includes('sofa') || cSlug.includes('sofa') || pName.includes('sofa');
        }
        // Nhóm Giường
        if (roomSlug.includes('giuong')) {
          return cName.includes('giuong') || cSlug.includes('giuong') || pName.includes('giuong');
        }
        // Nhóm Đèn
        if (roomSlug.includes('den')) {
          return cName.includes('den') || cSlug.includes('den') || pName.includes('den');
        }
        // Nhóm Trang trí
        if (roomSlug.includes('trang-tri') || roomSlug.includes('decor')) {
          return (
            cName.includes('trang-tri') ||
            cSlug.includes('trang-tri') ||
            cName.includes('decor') ||
            cSlug.includes('decor') ||
            pName.includes('trang-tri') ||
            pName.includes('decor')
          );
        }
        // Nhóm Nội thất khác
        if (roomSlug.includes('khac')) {
          return cName.includes('khac') || cSlug.includes('khac') || pName.includes('khac');
        }

        // So khớp trực tiếp thông thường
        return (
          cName === roomSlug ||
          cSlug === roomSlug ||
          cName.includes(roomSlug) ||
          roomSlug.includes(cName) ||
          pName.includes(roomSlug)
        );
      });
    }
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

      {/* Room Tabs (Đã gộp Tủ & Kệ) */}
      <div className="bg-[#e8f7ee]/60 rounded-2xl p-2 max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-around overflow-x-auto text-sm font-semibold">
          {rooms.map((room) => (
            <button
              key={room}
              type="button"
              onClick={() => {
                setSelectedRoom(room);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  if (room === 'Tất cả') {
                    url.searchParams.delete('category');
                  } else {
                    url.searchParams.set('category', toSlug(room));
                  }
                  window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
                }
              }}
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

      {/* Thông báo danh mục đang chọn */}
      {selectedRoom !== 'Tất cả' && !searchQuery && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-200 text-brand-900 px-4 py-2.5 rounded-xl text-sm max-w-4xl mx-auto mb-6">
          <span>
            Đang hiển thị danh mục: <strong className="text-brand-800">{selectedRoom}</strong> ({filtered.length} sản phẩm)
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedRoom('Tất cả');
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('category');
                window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
              }
            }}
            className="text-xs text-brand-700 hover:text-brand-900 font-bold underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Xem tất cả sản phẩm
          </button>
        </div>
      )}

      {/* Thông báo nếu có từ khóa tìm kiếm */}
      {searchQuery && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-200 text-brand-900 px-4 py-2.5 rounded-xl text-sm max-w-4xl mx-auto mb-6">
          <span>
            Kết quả tìm kiếm cho: <strong>"{searchQuery}"</strong> ({filtered.length} sản phẩm)
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              const url = new URL(window.location.href);
              url.searchParams.delete('q');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
            }}
            className="text-xs text-brand-700 hover:text-brand-900 font-bold underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Xóa tìm kiếm
          </button>
        </div>
      )}

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

      {/* Products Grid (4 columns) */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-warm-200/80 p-8 max-w-2xl mx-auto">
          <p className="text-base font-semibold text-warm-800">
            Không tìm thấy sản phẩm nào trong danh mục "{selectedRoom}"
          </p>
          <p className="text-xs text-warm-500 mt-1">Vui lòng thử chọn danh mục hoặc mức giá khác.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedRoom('Tất cả');
              setPriceFilter('all');
              setSearchQuery('');
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('category');
                url.searchParams.delete('q');
                window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
              }
            }}
            className="mt-4 px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-semibold hover:bg-brand-800 transition cursor-pointer"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      ) : (
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
      )}

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
