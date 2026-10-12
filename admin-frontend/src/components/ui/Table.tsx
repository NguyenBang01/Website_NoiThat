import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/format';
import { Button } from './Button';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  className,
  containerClassName,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs',
        containerClassName
      )}
    >
      <table className={cn('w-full text-left border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead
    className={cn('bg-stone-50/80 border-b border-stone-200 text-stone-600', className)}
    {...props}
  />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => <tbody className={cn('divide-y divide-stone-100 text-stone-700', className)} {...props} />;

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={cn('transition-colors hover:bg-stone-50/60', className)}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th
    className={cn('px-4 py-3 font-semibold text-stone-700 whitespace-nowrap', className)}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => <td className={cn('px-4 py-3 align-middle', className)} {...props} />;

/**
 * Trạng thái Loading (Skeleton) cho bảng
 */
export const TableSkeleton: React.FC<{
  columns?: number;
  rows?: number;
}> = ({ columns = 5, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-stone-100 animate-pulse">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3.5">
              <div
                className="h-4 bg-stone-200 rounded-md"
                style={{
                  width: `${Math.floor(Math.random() * 40 + 50)}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/**
 * Trạng thái bảng rỗng (Empty State có hướng dẫn)
 */
export const TableEmpty: React.FC<{
  colSpan: number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}> = ({
  colSpan,
  title = 'Không có dữ liệu',
  description = 'Hiện chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc.',
  action,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-stone-100 p-3 text-stone-400">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="max-w-sm">
            <p className="font-semibold text-stone-800">{title}</p>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              {description}
            </p>
          </div>
          {action && <div className="pt-2">{action}</div>}
        </div>
      </td>
    </tr>
  );
};

/**
 * Trạng thái bảng gặp lỗi (Error State có nút thử lại)
 */
export const TableError: React.FC<{
  colSpan: number;
  message?: string;
  onRetry?: () => void;
}> = ({
  colSpan,
  message = 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.',
  onRetry,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-rose-50 p-3 text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="max-w-sm">
            <p className="font-semibold text-rose-800">Đã xảy ra lỗi</p>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              {message}
            </p>
          </div>
          {onRetry && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Thử lại
              </Button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};
