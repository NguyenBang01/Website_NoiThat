import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight, X } from 'lucide-react';
import { clientFetch } from '../../lib/api';
import { formatCurrency, getProductImage } from '../../lib/format';
import type { Product } from '../../types';

export default function HeaderSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lắng nghe sự kiện click ra ngoài để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce tìm kiếm tự động khi người dùng gõ
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await clientFetch<Product[]>(`/products?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.success && Array.isArray(res.data)) {
          setResults(res.data);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      window.location.href = `/products?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-72 sm:w-80 md:w-96">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm sản phẩm, bàn, ghế, sofa..."
          className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#e8f7ee] hover:bg-[#ddf3e5] focus:bg-white border border-[#bbf0cb] focus:border-brand-500 text-warm-900 placeholder-warm-600 text-sm outline-hidden transition shadow-2xs"
        />
        <Search className="w-4 h-4 text-warm-600 absolute left-3.5 pointer-events-none" />
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-brand-600 animate-spin absolute right-3" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="w-4 h-4 text-warm-400 hover:text-warm-700 absolute right-3 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </form>

      {/* Dropdown hiển thị kết quả tìm kiếm tức thì */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-warm-200 overflow-hidden z-50 text-warm-900 animate-in fade-in zoom-in-95 duration-150">
          {isLoading && results.length === 0 ? (
            <div className="p-5 text-center text-xs text-warm-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Đang tìm kiếm sản phẩm...</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-4 py-2.5 bg-warm-50/70 border-b border-warm-100 flex items-center justify-between text-xs text-warm-500 font-medium">
                <span>Gợi ý sản phẩm ({results.length})</span>
                <span className="text-[11px] text-warm-400">Nhấn Enter để xem tất cả</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-warm-100">
                {results.map((product) => {
                  const displayPrice = product.sale_price || product.base_price || 0;
                  const thumb = getProductImage(product.image || product.images?.[0]?.url, product.category?.name);

                  return (
                    <a
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="p-3 flex items-center gap-3 hover:bg-brand-50/50 transition-colors group cursor-pointer"
                    >
                      <img
                        src={thumb}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-warm-100 border border-warm-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-warm-900 group-hover:text-brand-800 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-brand-700 font-mono">
                            {formatCurrency(displayPrice)}
                          </span>
                          {product.category?.name && (
                            <span className="text-[10px] bg-warm-100 text-warm-600 px-1.5 py-0.5 rounded">
                              {product.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              <a
                href={`/products?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-t border-brand-200/50"
              >
                <span>Xem tất cả kết quả cho "{query.trim()}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-5 text-center text-xs text-warm-500 space-y-1">
              <p className="font-semibold text-warm-800">Không tìm thấy sản phẩm</p>
              <p className="text-warm-500">Không có kết quả nào khớp với "{query.trim()}".</p>
              <p className="text-[11px] text-warm-400 pt-1">Gợi ý: Thử tìm "sofa", "bàn ăn", "ghế", "giường", "tủ"...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
