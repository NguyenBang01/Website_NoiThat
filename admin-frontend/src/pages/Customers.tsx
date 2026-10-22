import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Lock, Unlock, Search } from 'lucide-react';
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
  ConfirmDialog,
  showToast,
} from '@/components/ui';
import { customerApi, getErrorMessage } from '@/api';
import { formatDateTime } from '@/lib/format';
import type { Customer } from '@/types';

export const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const {
    data: customersRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => customerApi.getList(),
  });

  const rawCustomers = customersRes?.data;
  const customers: Customer[] = Array.isArray(rawCustomers)
    ? rawCustomers
    : Array.isArray((rawCustomers as any)?.items)
    ? (rawCustomers as any).items
    : [];

  const filteredCustomers = customers.filter((c) => {
    if (!searchInput.trim()) return true;
    const term = searchInput.toLowerCase().trim();
    return (
      c.full_name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      String(c.id).includes(term)
    );
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => customerApi.toggleStatus(id),
    onSuccess: () => {
      showToast.success('Cập nhật trạng thái khách hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setTargetCustomer(null);
    },
    onError: (err) => {
      showToast.error('Không thể cập nhật trạng thái', getErrorMessage(err));
      setTargetCustomer(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-emerald-700" />
            <span>Quản lý Khách hàng ({customers.length})</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Danh sách tài khoản khách hàng đã đăng ký mua hàng trên hệ thống.
          </p>
        </div>

        {/* Ô tìm kiếm khách hàng */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full rounded-xl border border-stone-300 pl-9 pr-4 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead>Địa chỉ Email</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Ngày đăng ký</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={7} rows={6} />}

          {isError && (
            <TableError colSpan={7} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && filteredCustomers.length === 0 && (
            <TableEmpty
              colSpan={7}
              title={searchInput ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
              description={
                searchInput
                  ? `Không có kết quả nào phù hợp với từ khóa "${searchInput}"`
                  : 'Chưa có tài khoản khách hàng nào trên hệ thống.'
              }
            />
          )}

          {!isLoading &&
            !isError &&
            filteredCustomers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs text-stone-500">{c.id}</TableCell>
                <TableCell className="font-semibold text-stone-900">{c.full_name}</TableCell>
                <TableCell className="text-xs text-stone-600">{c.email}</TableCell>
                <TableCell className="font-mono text-xs text-stone-600">
                  {c.phone || '-'}
                </TableCell>
                <TableCell className="text-xs text-stone-500">
                  {formatDateTime(c.created_at)}
                </TableCell>
                <TableCell>
                  {c.status === 'active' ? (
                    <Badge variant="success" dot>Hoạt động</Badge>
                  ) : (
                    <Badge variant="danger" dot>Bị khóa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={c.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => setTargetCustomer(c)}
                    leftIcon={c.status === 'active' ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  >
                    {c.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        isOpen={targetCustomer !== null}
        onClose={() => setTargetCustomer(null)}
        onConfirm={() => targetCustomer && toggleStatusMutation.mutate(targetCustomer.id)}
        title={targetCustomer?.status === 'active' ? 'Khóa tài khoản khách hàng?' : 'Mở khóa tài khoản?'}
        message={`Bạn có chắc muốn ${
          targetCustomer?.status === 'active' ? 'khóa' : 'mở khóa'
        } tài khoản của "${targetCustomer?.full_name}" (${targetCustomer?.email})?`}
        confirmText={targetCustomer?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
        variant={targetCustomer?.status === 'active' ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};
