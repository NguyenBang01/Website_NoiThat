import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Lock, Unlock } from 'lucide-react';
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

  const customers: Customer[] = customersRes?.data || [];

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
          <Users className="h-6 w-6 text-amber-700" />
          <span>Quản lý Khách hàng</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Danh sách tài khoản khách hàng đã đăng ký mua hàng trên hệ thống.
        </p>
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

          {!isLoading && !isError && customers.length === 0 && (
            <TableEmpty colSpan={7} title="Chưa có khách hàng nào" />
          )}

          {!isLoading &&
            !isError &&
            customers.map((c) => (
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
