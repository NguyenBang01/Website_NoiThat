import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Search,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
  TableError,
  showToast,
} from '@/components/ui';
import { couponApi, getErrorMessage } from '@/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Coupon } from '@/types';

const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'Mã giảm giá phải từ 3 ký tự')
    .max(50, 'Mã giảm giá tối đa 50 ký tự'),
  description: z.string().optional(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.coerce.number().min(1, 'Giá trị giảm phải lớn hơn 0'),
  min_order_amount: z.coerce.number().min(0, 'Đơn tối thiểu không được âm'),
  max_discount: z.string().optional(),
  usage_limit: z.coerce.number().int().min(0, 'Giới hạn không được âm'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.union([z.boolean(), z.string()]),
});

type CouponFormData = z.infer<typeof couponSchema>;

export const Coupons: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const {
    data: couponsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-coupons', searchQuery],
    queryFn: () => couponApi.getList({ q: searchQuery.trim() || undefined }),
  });

  const rawCoupons = couponsRes?.data;
  const allCoupons: Coupon[] = Array.isArray(rawCoupons)
    ? rawCoupons
    : Array.isArray((rawCoupons as any)?.items)
    ? (rawCoupons as any).items
    : [];

  const coupons = allCoupons.filter((c) => {
    if (statusFilter === 'active') return c.is_active;
    if (statusFilter === 'inactive') return !c.is_active;
    return true;
  });

  // Thống kê nhanh
  const totalActive = allCoupons.filter((c) => c.is_active).length;
  const totalUsed = allCoupons.reduce((sum, c) => sum + (c.used_count || 0), 0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: 10,
      min_order_amount: 0,
      max_discount: '',
      usage_limit: 100,
      is_active: 'true',
    },
  });

  const discountType = watch('discount_type');

  const openCreateModal = () => {
    setEditingCoupon(null);
    reset({
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: 10,
      min_order_amount: 0,
      max_discount: '',
      usage_limit: 100,
      start_date: '',
      end_date: '',
      is_active: 'true',
    });
    setModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    reset({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type || 'percent',
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount || 0,
      max_discount: c.max_discount ? String(c.max_discount) : '',
      usage_limit: c.usage_limit || 0,
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      is_active: String(c.is_active),
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: CouponFormData) => {
      const maxDiscountVal =
        data.max_discount && Number(data.max_discount) > 0 ? Number(data.max_discount) : null;

      const payload: Partial<Coupon> = {
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || undefined,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount,
        max_discount: data.discount_type === 'percent' ? maxDiscountVal : null,
        usage_limit: data.usage_limit,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : undefined,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : undefined,
        is_active: data.is_active === true || data.is_active === 'true',
      };

      if (editingCoupon) {
        return couponApi.update(editingCoupon.id, payload);
      }
      return couponApi.create(payload);
    },
    onSuccess: () => {
      showToast.success(editingCoupon ? 'Đã sửa mã giảm giá thành công' : 'Đã tạo mã giảm giá mới');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể lưu mã giảm giá', getErrorMessage(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (c: Coupon) => couponApi.update(c.id, { is_active: !c.is_active }),
    onSuccess: (_, variables) => {
      showToast.success(
        variables.is_active ? 'Đã tạm tắt mã giảm giá' : 'Đã kích hoạt mã giảm giá'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err) => {
      showToast.error('Lỗi đổi trạng thái', getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponApi.delete(id),
    onSuccess: () => {
      showToast.success('Đã xóa mã giảm giá');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeletingId(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa mã giảm giá', getErrorMessage(err));
      setDeletingId(null);
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-800 border border-amber-200">
              <Ticket className="h-6 w-6" />
            </div>
            <span>Quản lý Mã Giảm Giá & Voucher</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Thiết lập các chương trình khuyến mãi theo % hoặc số tiền cố định, giới hạn lượt dùng và đơn tối thiểu.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          Thêm mã giảm giá
        </Button>
      </div>

      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
              Tổng số mã
            </span>
            <span className="text-lg font-bold text-stone-900">{allCoupons.length} voucher</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
              Đang hoạt động
            </span>
            <span className="text-lg font-bold text-emerald-700">{totalActive} mã sẵn sàng</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider block">
              Lượt khách đã dùng
            </span>
            <span className="text-lg font-bold text-indigo-700">{totalUsed} lượt áp dụng</span>
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm & lọc trạng thái */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo mã voucher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab lọc trạng thái */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100/70 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Tất cả ({allCoupons.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Đang bật ({totalActive})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-white text-stone-700 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Đã tắt ({allCoupons.length - totalActive})
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã Voucher</TableHead>
            <TableHead>Mô tả / Chương trình</TableHead>
            <TableHead>Loại & Mức giảm</TableHead>
            <TableHead>Đơn tối thiểu</TableHead>
            <TableHead>Lượt dùng</TableHead>
            <TableHead>Thời hạn</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={8} rows={5} />}

          {isError && (
            <TableError colSpan={8} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && coupons.length === 0 && (
            <TableEmpty
              colSpan={8}
              title={searchQuery ? 'Không tìm thấy mã giảm giá phù hợp' : 'Chưa có mã giảm giá nào'}
              action={
                <Button size="sm" variant="primary" onClick={openCreateModal}>
                  Tạo mã giảm giá mới
                </Button>
              }
            />
          )}

          {!isLoading &&
            !isError &&
            coupons.map((c) => {
              const isExpired = c.end_date && new Date(c.end_date).getTime() < Date.now();
              const isLimitReached = c.usage_limit > 0 && c.used_count >= c.usage_limit;

              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                        {c.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code)}
                        className="p-1 text-stone-400 hover:text-amber-800 transition rounded hover:bg-stone-100 cursor-pointer"
                        title="Sao chép mã"
                      >
                        {copiedCode === c.code ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-stone-600 max-w-xs">
                    {c.description ? (
                      <span className="line-clamp-2">{c.description}</span>
                    ) : (
                      <span className="text-stone-300 italic">Chưa có mô tả</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {c.discount_type === 'percent' ? (
                        <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                          %
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                          đ
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-stone-900 text-xs">
                          {c.discount_type === 'percent'
                            ? `Giảm ${c.discount_value}%`
                            : formatCurrency(c.discount_value)}
                        </span>
                        {c.discount_type === 'percent' && c.max_discount && c.max_discount > 0 ? (
                          <span className="text-[11px] text-stone-500 font-normal block">
                            (Tối đa: {formatCurrency(c.max_discount)})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-stone-600">
                    {c.min_order_amount && c.min_order_amount > 0
                      ? formatCurrency(c.min_order_amount)
                      : 'Không yêu cầu'}
                  </TableCell>

                  <TableCell>
                    <div className="text-xs">
                      <span className="font-bold text-stone-900">{c.used_count || 0}</span>
                      <span className="text-stone-400">
                        {' '}
                        / {c.usage_limit && c.usage_limit > 0 ? `${c.usage_limit} lượt` : '∞'}
                      </span>
                      {isLimitReached && (
                        <span className="block text-[10px] font-semibold text-rose-600">Hết lượt</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-stone-500">
                    {c.end_date ? (
                      <div>
                        <span>{formatDateTime(c.end_date)}</span>
                        {isExpired && (
                          <span className="block text-[10px] font-bold text-rose-600">Đã hết hạn</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-medium">Vô thời hạn</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleStatusMutation.mutate(c)}
                      title="Bấm để bật/tắt nhanh mã này"
                      className="cursor-pointer transition hover:opacity-80"
                    >
                      {c.is_active ? (
                        <Badge variant="success" dot>
                          Kích hoạt
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Tạm dừng</Badge>
                      )}
                    </button>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-stone-600 hover:text-amber-800"
                        title="Chỉnh sửa mã"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(c.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Xóa mã"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? 'Chỉnh sửa Mã giảm giá' : 'Tạo Mã giảm giá mới'}
        description="Quy định điều kiện sử dụng mã voucher cho khách hàng mua sắm."
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input
            label="Mã giảm giá (Code) *"
            placeholder="VD: HE2026, SALENOITHAT..."
            className="uppercase font-mono font-bold"
            error={errors.code?.message}
            {...register('code')}
          />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Mô tả chương trình khuyến mãi
            </label>
            <input
              type="text"
              placeholder="VD: Giảm 10% chào đón thành viên mới"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 transition"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Hình thức giảm" {...register('discount_type')}>
              <option value="percent">Theo phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (VND)</option>
            </Select>

            <Input
              label={`Mức giảm (${discountType === 'percent' ? '%' : 'VND'}) *`}
              type="number"
              placeholder={discountType === 'percent' ? '10' : '100000'}
              error={errors.discount_value?.message}
              {...register('discount_value')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Đơn tối thiểu (VND)"
              type="number"
              placeholder="0 (không yêu cầu)"
              error={errors.min_order_amount?.message}
              {...register('min_order_amount')}
            />

            <Input
              label="Giới hạn số lượt dùng"
              type="number"
              placeholder="0 = Không giới hạn"
              error={errors.usage_limit?.message}
              {...register('usage_limit')}
            />
          </div>

          {discountType === 'percent' && (
            <div>
              <Input
                label="Giảm tối đa (VND)"
                type="number"
                placeholder="Để trống nếu không giới hạn mức giảm tối đa"
                error={errors.max_discount?.message}
                {...register('max_discount')}
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Nếu đặt 500,000đ thì khách mua đơn 10 triệu với mã 10% chỉ được giảm tối đa 500,000đ.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ngày bắt đầu có hiệu lực"
              type="date"
              error={errors.start_date?.message}
              {...register('start_date')}
            />

            <Input
              label="Ngày kết thúc (Hạn dùng)"
              type="date"
              error={errors.end_date?.message}
              {...register('end_date')}
            />
          </div>

          <Select label="Trạng thái" {...register('is_active')}>
            <option value="true">Kích hoạt (Cho phép khách sử dụng)</option>
            <option value="false">Tạm dừng (Khóa mã)</option>
          </Select>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              Lưu mã giảm giá
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa mã giảm giá?"
        message="Hành động này sẽ xóa vĩnh viễn mã giảm giá khỏi hệ thống. Nếu mã đã từng được áp dụng trên đơn hàng cũ, máy chủ sẽ bảo vệ dữ liệu."
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
