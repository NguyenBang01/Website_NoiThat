import React, { useState } from 'react';
import { Phone, MessageCircle, X } from 'lucide-react';

export default function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside aria-label="Liên hệ nhanh Góc Nhà Đẹp" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans select-none">
      {/* Expanded Popup Menu - All using Zalo blue (#0068ff) */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Zalo Button */}
          <a
            href="https://zalo.me/0931883988"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat qua Zalo: 0931.883.988"
            aria-label="Chat Zalo: 0931.883.988"
            className="group flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-white shadow-elevated border border-blue-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="text-xs font-bold text-warm-800 group-hover:text-[#0068ff] transition-colors">
              Chat Zalo
            </span>
            <div className="w-10 h-10 rounded-full bg-[#0068ff] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-md group-hover:bg-[#0055d4] transition-colors">
              Zalo
            </div>
          </a>

          {/* Hotline Phone Button - SAME ZALO BLUE */}
          <a
            href="tel:0931883988"
            title="Gọi Hotline: 0931.883.988"
            aria-label="Gọi hotline: 0931.883.988"
            className="group flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-white shadow-elevated border border-blue-200 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="text-xs font-bold text-warm-800 group-hover:text-[#0068ff] transition-colors">
              0931.883.988
            </span>
            <div className="w-10 h-10 rounded-full bg-[#0068ff] text-white flex items-center justify-center shadow-md group-hover:bg-[#0055d4] transition-colors">
              <Phone className="w-4 h-4 animate-pulse" />
            </div>
          </a>
        </div>
      )}

      {/* Main Collapsible Toggle Button - SAME ZALO BLUE */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng menu liên hệ' : 'Mở menu liên hệ'}
        title={isOpen ? 'Đóng liên hệ' : 'Liên hệ ngay'}
        className="relative group w-14 h-14 rounded-full bg-[#0068ff] hover:bg-[#0055d4] text-white shadow-elevated flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-blue-500/20"
      >
        {/* Animated radar ping rings */}
        <span className="absolute -inset-1 rounded-full bg-[#0068ff] opacity-40 animate-ping pointer-events-none" />

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
