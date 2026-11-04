import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, Loader2, ChevronDown, CheckSquare, ListFilter } from 'lucide-react';
import { Button } from './Button';
import { Can } from '@/components/auth/Can';
import { toast } from 'sonner';

export interface ExportButtonProps {
  onExport: (mode: 'all' | 'selected') => Promise<void> | void;
  selectedCount?: number;
  isLoading?: boolean;
  disabled?: boolean;
  permission?: string;
  label?: string;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  selectedCount = 0,
  isLoading = false,
  disabled = false,
  permission,
  label = 'Xuất Excel',
  className = '',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loading = isLoading || internalLoading;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExecute = async (mode: 'all' | 'selected') => {
    setIsOpen(false);
    setInternalLoading(true);
    try {
      await onExport(mode);
      toast.success(
        mode === 'selected'
          ? `Đã xuất ${selectedCount} bản ghi ra file Excel`
          : 'Đã xuất file Excel thành công'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xuất file Excel';
      toast.error(msg);
    } finally {
      setInternalLoading(false);
    }
  };

  const buttonContent = (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {selectedCount > 0 ? (
        <div className="inline-flex rounded-xl shadow-2xs">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            onClick={() => handleExecute('selected')}
            className="rounded-r-none border-r-0 text-emerald-800 hover:text-emerald-900 border-stone-300 hover:border-emerald-500 bg-white"
            leftIcon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              )
            }
          >
            Xuất ({selectedCount}) mục đã chọn
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-l-none px-2 border-stone-300 hover:border-emerald-500 bg-white"
            aria-label="Tùy chọn xuất"
          >
            <ChevronDown className="h-4 w-4 text-stone-600" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loading}
          onClick={() => handleExecute('all')}
          className="border-stone-300 hover:border-emerald-500 text-stone-700 hover:text-emerald-800 bg-white shadow-2xs"
          leftIcon={
            loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            )
          }
        >
          {loading ? 'Đang xuất file...' : label}
        </Button>
      )}

      {/* Dropdown menu if selectedCount > 0 */}
      {isOpen && selectedCount > 0 && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-hidden animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => handleExecute('selected')}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
          >
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            <span>Xuất {selectedCount} mục đã chọn</span>
          </button>
          <button
            type="button"
            onClick={() => handleExecute('all')}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            <ListFilter className="h-4 w-4 text-stone-500" />
            <span>Xuất toàn bộ theo bộ lọc</span>
          </button>
        </div>
      )}
    </div>
  );

  if (permission) {
    return <Can permission={permission}>{buttonContent}</Can>;
  }

  return buttonContent;
};
