import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ticket, Plus, Edit2, Trash2 } from 'lucide-react';
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
  code: z.string().min(3, 'Mã giảm giá phải từ 3 ký tự').max(50),
  description: z.string().optional(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.coerce.number().min(1, 'Giá trị giảm phải lớn hơn 0'),
  min_order_amount: z.coerce.number().min(0),
  max_discount: z.coerce.number().nullable().optional(),
  usage_limit: z.coerce.number().int().min(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean(),
});

type CouponFormData = z.infer<typeof couponSchema>;

export const Coupons: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    data: couponsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponApi.getList(),
  });
  const rawCoupons = couponsRes?.data;
  const coupons: Coupon[] = Array.isArray(rawCoupons)
    ? rawCoupons
    : Array.isArray((rawCoupons as any)?.items)
    ? (rawCoupons as any).items
    : [];
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
      max_discount: null,
      usage_limit: 100,
      is_active: true,
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
      max_discount: null,
      usage_limit: 100,
      is_active: true,
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
      max_discount: c.max_discount || null,
      usage_limit: c.usage_limit || 0,
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      is_active: c.is_active,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: CouponFormData) => {
      const payload: Partial<Coupon> = {
        code: data.code,
        description: data.description || undefined,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount,
        max_discount: data.max_discount,
        usage_limit: data.usage_limit,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : undefined,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : undefined,
        is_active: data.is_active,
      };

      if (editingCoupon) {
        return couponApi.update(editingCoupon.id, payload);
      }
      return couponApi.create(payload);
    },
    onSuccess: () => {
      showToast.success(editingCoupon ? 'Đã sửa mã giảm giá' : 'Đã tạo mã giảm giá');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể lưu mã giảm giá', getErrorMessage(err));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-amber-700" />
            <span>Quản lý Mã giảm giá (Coupons)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Thiết lập các chương trình khuyến mãi theo phần trăm (%) hoặc số tiền cố định (VND).
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          Thêm mã giảm giá
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã Voucher</TableHead>
            <TableHead>Loại & Giá trị giảm</TableHead>
            <TableHead>Đơn tối thiểu</TableHead>
            <TableHead>Đã dùng / Giới hạn</TableHead>
            <TableHead>Hạn sử dụng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={7} rows={5} />}

          {isError && (
            <TableError colSpan={7} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && coupons.length === 0 && (
            <TableEmpty
              colSpan={7}
              title="Chưa có mã giảm giá nào"
              action={
                <Button size="sm" variant="primary" onClick={openCreateModal}>
                  Tạo mã đầu tiên
                </Button>
              }
            />
          )}

          {!isLoading &&
            !isError &&
            coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="font-mono font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                    {c.code}
                  </span>
                </TableCell>

                <TableCell className="font-semibold text-stone-900">
                  {c.discount_type === 'percent'
                    ? `${c.discount_value}%`
                    : formatCurrency(c.discount_value)}
                  {c.max_discount ? (
                    <span className="text-[11px] text-stone-500 font-normal block">
                      (Tối đa: {formatCurrency(c.max_discount)})
                    </span>
                  ) : null}
                </TableCell>

                <TableCell className="text-xs text-stone-600">
                  {c.min_order_amount ? formatCurrency(c.min_order_amount) : 'Không yêu cầu'}
                </TableCell>

                <TableCell>
                  <span className="font-bold text-stone-900">{c.used_count || 0}</span>
                  <span className="text-stone-400"> / {c.usage_limit || '∞'} lượt</span>
                </TableCell>

                <TableCell className="text-xs text-stone-500">
                  {c.end_date ? formatDateTime(c.end_date) : 'Vô thời hạn'}
                </TableCell>

                <TableCell>
                  {c.is_active ? (
                    <Badge variant="success" dot>Kích hoạt</Badge>
                  ) : (
                    <Badge variant="neutral">Tắt</Badge>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-stone-600 hover:text-amber-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(c.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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

          <div className="grid grid-cols-2 gap-4">
            <Select label="Hình thức giảm" {...register('discount_type')}>
              <option value="percent">Theo phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (VND)</option>
            </Select>

            <Input
              label={`Giá trị giảm (${discountType === 'percent' ? '%' : 'VND'}) *`}
              type="number"
              error={errors.discount_value?.message}
              {...register('discount_value')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Đơn tối thiểu (VND)"
              type="number"
              placeholder="0"
              error={errors.min_order_amount?.message}
              {...register('min_order_amount')}
            />

            {discountType === 'percent' ? (
              <Input
                label="Giảm tối đa (VND)"
                type="number"
                placeholder="Để trống nếu không giới hạn"
                error={errors.max_discount?.message}
                {...register('max_discount')}
              />
            ) : (
              <Input
                label="Giới hạn số lượt dùng"
                type="number"
                placeholder="100"
                error={errors.usage_limit?.message}
                {...register('usage_limit')}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ngày bắt đầu"
              type="date"
              error={errors.start_date?.message}
              {...register('start_date')}
            />

            <Input
              label="Ngày kết thúc"
              type="date"
              error={errors.end_date?.message}
              {...register('end_date')}
            />
          </div>

          <Select label="Trạng thái" {...register('is_active')}>
            <option value="true">Kích hoạt (Cho phép dùng)</option>
            <option value="false">Tạm dừng (Khóa mã)</option>
          </Select>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || saveMutation.isPending}>
              Lưu mã
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa mã giảm giá?"
        message="Nếu mã này đã có người dùng, máy chủ sẽ từ chối xóa để đảm bảo toàn vẹn dữ liệu đơn hàng."
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
