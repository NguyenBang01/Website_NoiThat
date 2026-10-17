import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, MessageCircle, X, Move } from 'lucide-react';

export default function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const dragInfo = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);

  // Khởi tạo vị trí từ localStorage hoặc mặc định góc dưới bên phải
  useEffect(() => {
    setHasLoaded(true);
    try {
      const saved = localStorage.getItem('gnd_contact_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const maxX = window.innerWidth - 66;
          const maxY = window.innerHeight - 66;
          setPosition({
            x: Math.min(Math.max(10, parsed.x), Math.max(10, maxX)),
            y: Math.min(Math.max(10, parsed.y), Math.max(10, maxY)),
          });
          return;
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    // Mặc định: cách góc phải 24px, góc dưới 24px
    const defaultX = Math.max(10, window.innerWidth - 80);
    const defaultY = Math.max(10, window.innerHeight - 84);
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  // Tự động giữ nút trong khung nhìn khi người dùng co giãn cửa sổ
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const maxX = window.innerWidth - 66;
        const maxY = window.innerHeight - 66;
        return {
          x: Math.min(Math.max(10, prev.x), Math.max(10, maxX)),
          y: Math.min(Math.max(10, prev.y), Math.max(10, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bắt đầu kéo
  const startDrag = (clientX: number, clientY: number) => {
    const currentX = position ? position.x : (window.innerWidth - 80);
    const currentY = position ? position.y : (window.innerHeight - 84);

    dragInfo.current = {
      isDown: true,
      startX: clientX,
      startY: clientY,
      origX: currentX,
      origY: currentY,
      moved: false,
    };
  };

  // Đang kéo di chuyển
  const onMove = useCallback((clientX: number, clientY: number) => {
    if (!dragInfo.current.isDown) return;

    const dx = clientX - dragInfo.current.startX;
    const dy = clientY - dragInfo.current.startY;

    if (!dragInfo.current.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      dragInfo.current.moved = true;
      setIsDragging(true);
    }

    if (dragInfo.current.moved) {
      const maxX = window.innerWidth - 66;
      const maxY = window.innerHeight - 66;

      const nextX = Math.min(Math.max(10, dragInfo.current.origX + dx), Math.max(10, maxX));
      const nextY = Math.min(Math.max(10, dragInfo.current.origY + dy), Math.max(10, maxY));

      setPosition({ x: nextX, y: nextY });
    }
  }, []);

  // Kết thúc kéo
  const endDrag = useCallback(() => {
    if (!dragInfo.current.isDown) return;

    const hadMoved = dragInfo.current.moved;
    dragInfo.current.isDown = false;

    // Trì hoãn nhẹ để sự kiện click không bị kích hoạt nhầm sau khi kéo
    setTimeout(() => {
      setIsDragging(false);
      dragInfo.current.moved = false;
    }, 60);

    if (hadMoved && position) {
      try {
        localStorage.setItem('gnd_contact_pos', JSON.stringify(position));
      } catch {
        // Bỏ qua lỗi lưu
      }
    }
  }, [position]);

  // Lắng nghe sự kiện chuột và cảm ứng trên toàn màn hình
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragInfo.current.isDown && e.touches.length > 0) {
        // Ngăn cuộn trang khi đang kéo nút
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      endDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onMove, endDrag]);

  // Xử lý bấm mở / đóng menu
  const handleButtonClick = (e: React.MouseEvent) => {
    if (dragInfo.current.moved || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const isNearTop = position ? position.y < 220 : false;
  const isNearLeft = position ? position.x < 180 : false;

  return (
    <aside
      aria-label="Liên hệ nhanh Góc Nhà Đẹp"
      style={
        hasLoaded && position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : {
              right: '24px',
              bottom: '24px',
            }
      }
      className={`fixed z-50 font-sans select-none touch-none ${
        isDragging ? 'cursor-grabbing opacity-90 scale-105' : 'cursor-grab'
      }`}
    >
      {/* Expanded Popup Menu */}
      {isOpen && (
        <div
          className={`absolute flex flex-col gap-2.5 transition-all duration-300 animate-in fade-in ${
            isNearTop
              ? 'top-full mt-2.5 slide-in-from-top-3'
              : 'bottom-full mb-2.5 slide-in-from-bottom-3'
          } ${isNearLeft ? 'left-0 items-start' : 'right-0 items-end'}`}
        >
          {/* Zalo Button */}
          <a
            href="https://zalo.me/0931883988"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat qua Zalo: 0931.883.988"
            aria-label="Chat Zalo: 0931.883.988"
            onClick={(e) => {
              if (isDragging || dragInfo.current.moved) e.preventDefault();
            }}
            className="group flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-white shadow-elevated border border-blue-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="text-xs font-bold text-warm-800 group-hover:text-[#0068ff] transition-colors whitespace-nowrap">
              Chat Zalo
            </span>
            <div className="w-10 h-10 rounded-full bg-[#0068ff] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-md group-hover:bg-[#0055d4] transition-colors">
              Zalo
            </div>
          </a>

          {/* Hotline Phone Button */}
          <a
            href="tel:0931883988"
            title="Gọi Hotline: 0931.883.988"
            aria-label="Gọi hotline: 0931.883.988"
            onClick={(e) => {
              if (isDragging || dragInfo.current.moved) e.preventDefault();
            }}
            className="group flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-white shadow-elevated border border-blue-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="text-xs font-bold text-warm-800 group-hover:text-[#0068ff] transition-colors whitespace-nowrap">
              0931.883.988
            </span>
            <div className="w-10 h-10 rounded-full bg-[#0068ff] text-white flex items-center justify-center shadow-md group-hover:bg-[#0055d4] transition-colors">
              <Phone className="w-4 h-4 animate-pulse" />
            </div>
          </a>
        </div>
      )}

      {/* Main Collapsible & Draggable Toggle Button */}
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => {
          if (e.button === 0) {
            startDrag(e.clientX, e.clientY);
          }
        }}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onClick={handleButtonClick}
        aria-label={isOpen ? 'Đóng menu liên hệ (Kéo để di chuyển)' : 'Mở menu liên hệ (Kéo để di chuyển)'}
        title={isOpen ? 'Bấm để đóng • Kéo để di chuyển vị trí' : 'Bấm để mở • Kéo để di chuyển vị trí'}
        className="relative group w-14 h-14 rounded-full bg-[#0068ff] hover:bg-[#0055d4] text-white shadow-elevated flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 ring-4 ring-blue-500/20"
      >
        {/* Animated radar ping rings */}
        <span className="absolute -inset-1 rounded-full bg-[#0068ff] opacity-40 animate-ping pointer-events-none" />

        {/* Small drag move hint badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[#0068ff] shadow-md border border-blue-200 flex items-center justify-center opacity-85 group-hover:opacity-100 group-hover:scale-110 transition pointer-events-none">
          <Move className="w-2.5 h-2.5 stroke-[2.5]" />
        </span>

        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5] transition-transform duration-300 rotate-90" />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <MessageCircle className="w-6 h-6 animate-bounce stroke-[2.2]" />
            <span className="text-[9px] font-extrabold tracking-tighter uppercase mt-0.5">Liên hệ</span>
          </div>
        )}
      </button>
    </aside>
  );
}
