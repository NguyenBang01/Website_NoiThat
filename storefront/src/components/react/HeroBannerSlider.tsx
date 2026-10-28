import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import type { Banner } from '../../types';
import { imgUrl } from '../../lib/format';

interface HeroBannerSliderProps {
  banners?: Banner[];
}

const DEFAULT_BANNER: Banner = {
  id: 0,
  title: 'MỖI KHÔNG GIAN, MỘT CÂU CHUYỆN RIÊNG',
  subtitle:
    'Kiến tạo không gian sống tinh tế với những giải pháp nội thất hiện đại, hài hòa giữa thẩm mỹ, công năng và cảm hứng sống.',
  image:
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&auto=format&fit=crop&q=85',
  link: '/products',
  sort_order: 0,
};

export default function HeroBannerSlider({ banners = [] }: HeroBannerSliderProps) {
  // Lọc chỉ lấy banner đang kích hoạt nếu có trường is_active
  const activeBanners = banners.filter((b) => b.is_active !== false);
  const slideList = activeBanners.length > 0 ? activeBanners : [DEFAULT_BANNER];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Tự động chuyển slide sau mỗi 7 giây (nếu có từ 2 banner trở lên)
  useEffect(() => {
    if (slideList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideList.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [slideList.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slideList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  };

  // Hỗ trợ vuốt tay trên điện thoại
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const currentBanner = slideList[currentIndex];
  const targetLink = currentBanner.link || currentBanner.link_url || '/products';
  const displayImage = imgUrl(currentBanner.image);

  return (
    <section
      className="relative w-full h-[540px] sm:h-[600px] lg:h-[680px] bg-warm-900 overflow-hidden font-sans select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Danh sách các slide với hiệu ứng chuyển động mượt mà (Hỗ trợ cả Hình ảnh & Video lặp liên tục) */}
      {slideList.map((banner, index) => {
        const isCurrent = index === currentIndex;
        const bannerMedia = imgUrl(banner.image);
        const isVideo =
          banner.media_type === 'video' ||
          /\.(mp4|webm|mov|ogg)($|\?)/i.test(banner.image || '');

        return (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {isVideo ? (
              /* Banner Động: Video tự động phát lặp lại liên tục không ngưng nghỉ */
              <video
                src={bannerMedia}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className={`w-full h-full object-cover object-center transition-transform duration-7000 ease-out ${
                  isCurrent ? 'scale-105' : 'scale-100'
                }`}
              />
            ) : (
              /* Banner Tĩnh: Hình ảnh chất lượng cao */
              <img
                src={bannerMedia}
                alt={banner.title}
                className={`w-full h-full object-cover object-center transition-transform duration-7000 ease-out ${
                  isCurrent ? 'scale-105' : 'scale-100'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}

            {/* Lớp phủ Gradient đồng bộ tông màu thương hiệu */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </div>
        );
      })}

      {/* Nội dung Banner nổi bật */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        <div className="max-w-2xl space-y-5 text-white animate-fadeIn">
          {/* Nhãn tag thương hiệu nhỏ */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-brand-200 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Bộ Sưu Tập Nội Thất Góc Nhà Đẹp</span>
          </div>

          {/* Tiêu đề Banner */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight leading-tight uppercase drop-shadow-md">
              {currentBanner.title}
            </h1>
          </div>

          {/* Phụ đề Banner */}
          {currentBanner.subtitle && (
            <p className="text-warm-100 text-sm sm:text-base lg:text-lg leading-relaxed italic font-light max-w-xl drop-shadow-xs">
              {currentBanner.subtitle}
            </p>
          )}

          {/* Nút Khám phá ngay */}
          <div className="pt-3">
            <a
              href={targetLink}
              className="inline-flex items-center gap-2 text-white font-semibold text-sm sm:text-base hover:text-brand-300 transition group border-b-2 border-white hover:border-brand-300 pb-1.5 cursor-pointer"
            >
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Nút điều hướng chuyển Slide (chỉ hiện khi có từ 2 banner trở lên) */}
      {slideList.length > 1 && (
        <>
          {/* Mũi tên trái */}
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer shadow-lg"
            aria-label="Banner trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Mũi tên phải */}
          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer shadow-lg"
            aria-label="Banner tiếp theo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Chấm tròn chỉ số vị trí Slide (Pagination Dots) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
            {slideList.map((_, dotIdx) => {
              const isActive = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'w-8 bg-brand-400 shadow-md'
                      : 'w-2.5 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Chuyển tới banner ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
