import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Search, Eye } from 'lucide-react';
import {
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
  TableError,
  Pagination,
  ExportButton,
} from '@/components/ui';
import { orderApi, exportApi, getErrorMessage } from '@/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order } from '@/types';

const statusTabs = [
  { value: '', label: 'Tất cả đơn' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export const Orders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = 20;

  const [searchInput, setSearchInput] = useState(q);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Đồng bộ ô tìm kiếm khi URL thay đổi
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Reset selection when filter or page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [status, q, page]);

  // Chỉ debounce khi người dùng thực sự gõ tìm kiếm khác với q trong URL
  useEffect(() => {
    if (searchInput.trim() === q) return;

    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) {
          next.set('q', searchInput.trim());
        } else {
          next.delete('q');
        }
        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, q, setSearchParams]);

  const {
    data: ordersRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-orders', { status, q, page, limit }],
    queryFn: () =>
      orderApi.getList({
        status: status || undefined,
        q: q || undefined,
        page,
        limit,
      }),
  });

  const rawOrders = ordersRes?.data;
  const orders: Order[] = useMemo(() => {
    if (Array.isArray(rawOrders)) return rawOrders;
    if (Array.isArray((rawOrders as any)?.items)) return (rawOrders as any).items;
    return [];
  }, [rawOrders]);
  const meta = ordersRes?.meta;

  const handleTabChange = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('status', val);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  // Selection
  const isAllSelected = useMemo(() => {
    if (!orders.length) return false;
    return orders.every((o) => selectedIds.includes(o.id));
  }, [orders, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export Excel
  const handleExport = async (mode: 'all' | 'selected') => {
    if (mode === 'selected' && selectedIds.length > 0) {
      await exportApi.exportOrders({ ids: selectedIds.join(',') });
    } else {
      await exportApi.exportOrders({
        status: status || undefined,
        q: q || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <ShoppingCart className="h-6 w-6 text-emerald-700" />
            <span>Quản lý Đơn hàng</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Theo dõi và xử lý đơn hàng từ lúc khách đặt đến khi giao hàng hoàn tất. File Excel bao gồm 2 sheet: Tổng quan & Chi tiết từng món.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportButton
            onExport={handleExport}
            selectedCount={selectedIds.length}
            permission="export.order"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex overflow-x-auto border-b border-stone-200 gap-1 pb-px custom-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo mã đơn (FS-...), tên khách, SĐT..."
          className="w-full rounded-xl border border-stone-300 pl-9 pr-4 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {/* Orders Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                aria-label="Chọn tất cả đơn hàng"
              />
            </TableHead>
            <TableHead>Mã đơn hàng</TableHead>
            <TableHead>Khách hàng / Người nhận</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Ngày đặt</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={8} rows={6} />}

          {isError && (
            <TableError colSpan={8} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && orders.length === 0 && (
            <TableEmpty
              colSpan={8}
              title="Không có đơn hàng nào"
              description="Hiện chưa có đơn hàng nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc trạng thái."
            />
          )}

          {!isLoading &&
            !isError &&
            orders.map((o) => {
              const isSelected = selectedIds.includes(o.id);

              return (
                <TableRow key={o.id} className={isSelected ? 'bg-emerald-50/40' : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(o.id)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                      aria-label={`Chọn đơn hàng #${o.id}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Link
                      to={`/orders/${o.id}`}
                      className="font-mono font-bold text-xs text-emerald-800 hover:underline block"
                    >
                      #{o.order_number || o.order_code || o.id}
                    </Link>
                    <span className="text-[10px] text-stone-400 font-mono">
                      ID đơn: {o.id}
                    </span>
                  </TableCell>

                  <TableCell className="font-medium text-stone-900">
                    <div className="flex flex-col">
                      <span className="font-semibold text-stone-900">
                        {o.recipient_name || o.user?.full_name || 'Khách đặt'}
                      </span>
                      {o.user?.email && (
                        <span className="text-[11px] text-stone-500 font-normal">
                          {o.user.email}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-stone-600">
                    {o.recipient_phone || o.user?.phone || '-'}
                  </TableCell>

                  <TableCell className="font-bold text-emerald-800 text-sm font-serif">
                    {formatCurrency(o.total_amount || o.sub_total || 0)}
                  </TableCell>

                  <TableCell className="text-xs text-stone-500">
                    {formatDateTime(o.created_at)}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <div>
                        {o.status === 'awaiting_payment' && <Badge variant="warning" dot>Chờ chuyển khoản</Badge>}
                        {o.status === 'pending' && <Badge variant="warning" dot>Chờ xác nhận</Badge>}
                        {o.status === 'confirmed' && <Badge variant="info">Đã xác nhận</Badge>}
                        {o.status === 'shipping' && <Badge variant="info" dot>Đang giao</Badge>}
                        {o.status === 'delivered' && <Badge variant="success" dot>Hoàn thành</Badge>}
                        {o.status === 'cancelled' && <Badge variant="danger">Đã hủy</Badge>}
                        {o.status === 'returned' && <Badge variant="neutral">Trả hàng</Badge>}
                      </div>
                      {o.payment_method === 'bank_transfer' && o.status !== 'awaiting_payment' && o.status !== 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Đã chuyển khoản
                        </span>
                      ) : o.payment_method === 'bank_transfer' && o.status === 'awaiting_payment' ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Chưa chuyển khoản
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                          COD
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Link
                      to={`/orders/${o.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Chi tiết</span>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.total_pages}
          totalItems={meta.total}
          pageSize={limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
