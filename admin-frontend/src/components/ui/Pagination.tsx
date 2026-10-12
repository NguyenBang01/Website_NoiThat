import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/format';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 20,
  onPageSizeChange,
  totalItems,
  className,
}) => {
  if (totalPages <= 0) return null;

  // Generate page numbers to display with smart window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems ?? currentPage * pageSize);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-sm text-stone-600',
        className
      )}
    >
      {/* Thông tin số lượng */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <span className="text-xs text-stone-500">
            Hiển thị <span className="font-semibold text-stone-800">{startItem}</span> -{' '}
            <span className="font-semibold text-stone-800">{endItem}</span> trên{' '}
            <span className="font-semibold text-stone-800">{totalItems}</span> bản ghi
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-500">Số dòng/trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 focus:border-amber-600 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Điều hướng trang */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-stone-400 select-none"
                >
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={cn(
                  'min-w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                  isCurrent
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
