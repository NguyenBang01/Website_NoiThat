import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  RotateCcw,
  Package,
  FolderTree,
  Ticket,
  Star,
  UserCheck,
  Search,
  Clock,
  User as UserIcon,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  Button,
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
  ConfirmDialog,
} from '@/components/ui';
import { trashApi, getErrorMessage } from '@/api';
import { formatDateTime } from '@/lib/format';
import { Can } from '@/components/auth/Can';
import { toast } from 'sonner';
import type { TrashItem, TrashModule } from '@/types';

const modules: Array<{ key: TrashModule; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'product', label: 'Sản phẩm', icon: Package },
  { key: 'category', label: 'Danh mục', icon: FolderTree },
  { key: 'voucher', label: 'Mã giảm giá', icon: Ticket },
  { key: 'review', label: 'Đánh giá', icon: Star },
  { key: 'staff', label: 'Nhân viên', icon: UserCheck },
];

export const TrashPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeModule = (searchParams.get('module') as TrashModule) || 'product';
  const q = searchParams.get('search') || '';
  const fromDate = searchParams.get('from_date') || '';
  const toDate = searchParams.get('to_date') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = 15;

  const [searchInput, setSearchInput] = useState(q);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [purgingItem, setPurgingItem] = useState<TrashItem | null>(null);
  const [isEmptying, setIsEmptying] = useState(false);

  // Sync search input
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Reset selection when module changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeModule]);

  // Debounce search
  useEffect(() => {
    if (searchInput.trim() === q) return;

    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) {
          next.set('search', searchInput.trim());
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, q, setSearchParams]);

  // Query trash items
  const {
    data: trashRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-trash', { module: activeModule, page, limit, search: q, fromDate, toDate }],
    queryFn: () =>
      trashApi.getList({
        module: activeModule,
        page,
        limit,
        search: q || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }),
  });

  const rawItems = trashRes?.data;
  const items: TrashItem[] = useMemo(() => {
    if (Array.isArray(rawItems)) return rawItems;
    if (Array.isArray((rawItems as any)?.items)) return (rawItems as any).items;
    return [];
  }, [rawItems]);
  const meta = trashRes?.meta;

  // Single restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id: number) => trashApi.restore(activeModule, id),
    onSuccess: () => {
      toast.success('Khôi phục bản ghi thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-trash'] });
      invalidateModuleList(activeModule);
    },
    onError: (err) => {
      toast.error('Không thể khôi phục: ' + getErrorMessage(err));
    },
  });

  // Batch restore mutation
  const restoreBatchMutation = useMutation({
    mutationFn: (ids: number[]) => trashApi.restoreBatch(activeModule, ids),
    onSuccess: (res) => {
      const respData = res.data;
      if (respData?.failed_count && respData.failed_count > 0) {
        toast.warning(
          `Khôi phục thành công ${respData.success_count} mục, thất bại ${respData.failed_count} mục.`,
          {
            description: respData.errors?.join('\n'),
          }
        );
      } else {
        toast.success(`Đã khôi phục thành công ${respData?.success_count || selectedIds.length} mục!`);
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-trash'] });
      invalidateModuleList(activeModule);
    },
    onError: (err) => {
      toast.error('Không thể khôi phục hàng loạt: ' + getErrorMessage(err));
    },
  });

  // Purge mutation
  const purgeMutation = useMutation({
    mutationFn: (id: number) => trashApi.purge(activeModule, id),
    onSuccess: () => {
      toast.success('Đã xóa vĩnh viễn bản ghi thành công!');
      setPurgingItem(null);
      setSelectedIds((prev) => prev.filter((id) => id !== purgingItem?.id));
      queryClient.invalidateQueries({ queryKey: ['admin-trash'] });
    },
    onError: (err) => {
      toast.error('Không thể xóa vĩnh viễn: ' + getErrorMessage(err));
      setPurgingItem(null);
    },
  });

  // Empty trash mutation
  const emptyMutation = useMutation({
    mutationFn: () => trashApi.empty(activeModule),
    onSuccess: () => {
      toast.success('Đã dọn sạch thùng rác của mục này thành công!');
      setIsEmptying(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-trash'] });
    },
    onError: (err) => {
      toast.error('Không thể dọn sạch thùng rác: ' + getErrorMessage(err));
      setIsEmptying(false);
    },
  });

  const invalidateModuleList = (mod: TrashModule) => {
    switch (mod) {
      case 'product':
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        break;
      case 'category':
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        break;
      case 'voucher':
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
        break;
      case 'review':
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        break;
      case 'staff':
        queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
        break;
    }
  };

  const handleModuleChange = (mod: TrashModule) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('module', mod);
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

  // Checkbox selection logic
  const isAllSelected = useMemo(() => {
    if (!items.length) return false;
    return items.every((it) => selectedIds.includes(it.id));
  }, [items, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((it) => it.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const activeModuleLabel = modules.find((m) => m.key === activeModule)?.label || activeModule;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Trash2 className="h-6 w-6 text-emerald-700" />
            <span>Thùng rác & Khôi phục</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Quản lý các bản ghi đã xóa mềm. Hệ thống tự động xóa vĩnh viễn các bản ghi sau 30 ngày lưu trữ.
          </p>
        </div>

        {/* Global Empty Trash Action */}
        <Can permission="trash.purge">
          <Button
            variant="outline"
            onClick={() => setIsEmptying(true)}
            disabled={items.length === 0 || emptyMutation.isPending}
            className="text-rose-700 border-rose-300 hover:bg-rose-50 hover:border-rose-400"
            leftIcon={<Trash2 className="h-4 w-4 text-rose-600" />}
          >
            Dọn sạch {activeModuleLabel}
          </Button>
        </Can>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-stone-200 pb-2">
        {modules.map(({ key, label, icon: Icon }) => {
          const isActive = activeModule === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleModuleChange(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-200' : 'text-stone-500'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Tìm kiếm trong thùng rác ${activeModuleLabel.toLowerCase()}...`}
            className="w-full rounded-xl border border-stone-300 pl-9 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (e.target.value) next.set('from_date', e.target.value);
                  else next.delete('from_date');
                  next.set('page', '1');
                  return next;
                });
              }}
              title="Xóa từ ngày"
              className="rounded-xl border border-stone-300 pl-9 pr-3 py-2 text-sm bg-white text-stone-700 focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <span className="text-stone-400 text-xs">đến</span>
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (e.target.value) next.set('to_date', e.target.value);
                  else next.delete('to_date');
                  next.set('page', '1');
                  return next;
                });
              }}
              title="Xóa đến ngày"
              className="rounded-xl border border-stone-300 pl-9 pr-3 py-2 text-sm bg-white text-stone-700 focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Selected Batch Action Banner */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Đã chọn {selectedIds.length} mục trong thùng rác</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-stone-600 bg-white"
            >
              Bỏ chọn
            </Button>
            <Can permission="trash.restore">
              <Button
                variant="primary"
                size="sm"
                onClick={() => restoreBatchMutation.mutate(selectedIds)}
                isLoading={restoreBatchMutation.isPending}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Khôi phục {selectedIds.length} mục
              </Button>
            </Can>
          </div>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                aria-label="Chọn tất cả"
              />
            </TableHead>
            <TableHead>Tên / Đối tượng</TableHead>
            <TableHead>Mã định danh</TableHead>
            <TableHead>Người xóa</TableHead>
            <TableHead>Thời gian xóa</TableHead>
            <TableHead>Hạn tự xóa</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={7} rows={6} />}

          {isError && (
            <TableError
              colSpan={7}
              message={getErrorMessage(error) || 'Không thể tải dữ liệu thùng rác'}
              onRetry={refetch}
            />
          )}

          {!isLoading && !isError && items.length === 0 && (
            <TableEmpty
              colSpan={7}
              title={`Thùng rác ${activeModuleLabel.toLowerCase()} trống`}
              description="Hiện tại không có bản ghi nào bị xóa trong mục này."
            />
          )}

          {!isLoading &&
            !isError &&
            items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isCriticalTime = item.days_remaining <= 5;
              const variantsCount = item.extra?.variants_count;
              const roleName = item.extra?.role_name;

              return (
                <TableRow key={item.id} className={isSelected ? 'bg-emerald-50/40' : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                      aria-label={`Chọn mục ${item.title}`}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-stone-900">{item.title}</div>
                    {item.extra && Object.keys(item.extra).length > 0 && (
                      <div className="text-[11px] text-stone-400 mt-0.5 truncate max-w-xs">
                        {item.module === 'product' && variantsCount !== undefined && variantsCount !== null && (
                          <span>{String(variantsCount)} biến thể đi kèm</span>
                        )}
                        {item.module === 'staff' && roleName !== undefined && roleName !== null && (
                          <span>Vai trò: {String(roleName)}</span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <code className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-mono">
                      {item.code || `#${item.id}`}
                    </code>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-stone-700">
                      <UserIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span>{item.deleted_by_name || 'Hệ thống'}</span>
                    </div>
                    {item.deleted_by_email && (
                      <div className="text-[11px] text-stone-400 pl-5">{item.deleted_by_email}</div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-stone-600">
                      <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span>{formatDateTime(item.deleted_at)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={isCriticalTime ? 'danger' : 'warning'}>
                      {item.days_remaining > 0 ? `Còn ${item.days_remaining} ngày` : 'Sắp bị xóa'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Can permission="trash.restore">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreMutation.mutate(item.id)}
                          isLoading={restoreMutation.isPending && restoreMutation.variables === item.id}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          title="Khôi phục"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </Can>

                      <Can permission="trash.purge">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPurgingItem(item)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
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
          totalPages={meta.total_pages || Math.ceil(meta.total / limit)}
          totalItems={meta.total}
          pageSize={limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Confirm Permanent Purge Modal */}
      <ConfirmDialog
        isOpen={purgingItem !== null}
        onClose={() => setPurgingItem(null)}
        onConfirm={() => purgingItem && purgeMutation.mutate(purgingItem.id)}
        title="Xác nhận xóa vĩnh viễn?"
        message={`Bạn có chắc muốn xóa vĩnh viễn "${purgingItem?.title}"? Hành động này sẽ loại bỏ hoàn toàn dữ liệu và các tệp đính kèm liên quan khỏi hệ thống, không thể khôi phục lại được.`}
        confirmText="Xóa vĩnh viễn"
        variant="danger"
        isLoading={purgeMutation.isPending}
      />

      {/* Confirm Empty Trash Modal */}
      <ConfirmDialog
        isOpen={isEmptying}
        onClose={() => setIsEmptying(false)}
        onConfirm={() => emptyMutation.mutate()}
        title={`Dọn sạch thùng rác ${activeModuleLabel.toLowerCase()}?`}
        message={`Hành động này sẽ xóa vĩnh viễn toàn bộ các bản ghi trong thùng rác của mục ${activeModuleLabel.toLowerCase()} cùng các tệp tin đính kèm. Thao tác này không thể hoàn tác!`}
        confirmText="Dọn sạch tất cả"
        variant="danger"
        isLoading={emptyMutation.isPending}
      />
    </div>
  );
};
