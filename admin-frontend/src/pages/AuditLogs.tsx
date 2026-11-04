import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  Clock,
  User as UserIcon,
  Globe,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
  TableError,
} from '@/components/ui';
import { auditLogApi, getErrorMessage } from '@/api';
import { formatDateTime } from '@/lib/format';
import type { AuditLog } from '@/types';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');

  const {
    data: logsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', { page, limit, actionFilter }],
    queryFn: () =>
      auditLogApi.getAll({
        page,
        limit,
        action: actionFilter || undefined,
      }),
  });

  const logs: AuditLog[] = logsRes?.data || [];
  const meta = logsRes?.meta || {
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 1,
  };

  // Helper formatting action badge
  const renderActionBadge = (action: string) => {
    if (action.includes('create')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes('update') || action.includes('edit')) {
      return <Badge variant="info">{action}</Badge>;
    }
    if (action.includes('delete') || action.includes('lock')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (action.includes('login') || action.includes('auth')) {
      return <Badge variant="purple">{action}</Badge>;
    }
    return <Badge variant="neutral">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-700" />
            <span>Nhật Ký Hoạt Động (Audit Log)</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Theo dõi mọi hành động quan trọng của nhân viên: phân quyền, đổi mật khẩu, sửa dữ liệu và truy cập
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search by action */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Lọc theo hành động (vd: staff.create, role.update, auth.login...)"
            className="pl-10 h-10 w-full"
          />
        </div>

        {/* Action quick select */}
        <div className="w-full md:w-56">
          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-10"
          >
            <option value="">Tất cả hành động</option>
            <option value="auth.login">Đăng nhập (auth.login)</option>
            <option value="staff.create">Thêm nhân viên (staff.create)</option>
            <option value="staff.update">Sửa nhân viên (staff.update)</option>
            <option value="staff.lock">Khóa tài khoản (staff.lock)</option>
            <option value="staff.unlock">Mở khóa tài khoản (staff.unlock)</option>
            <option value="staff.reset_password">Đặt lại mật khẩu</option>
            <option value="staff.delete">Xóa nhân viên (staff.delete)</option>
            <option value="role.create">Tạo vai trò (role.create)</option>
            <option value="role.update">Sửa vai trò (role.update)</option>
            <option value="role.delete">Xóa vai trò (role.delete)</option>
          </Select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Chi tiết thao tác</TableHead>
              <TableHead>Địa chỉ IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={8} />
            ) : isError ? (
              <TableError
                colSpan={6}
                message={getErrorMessage(error)}
                onRetry={() => refetch()}
              />
            ) : logs.length === 0 ? (
              <TableEmpty
                colSpan={6}
                title="Chưa có nhật ký hoạt động nào"
                description="Các hành động quan trọng khi được thực hiện sẽ tự động ghi lại tại đây."
              />
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-stone-50/70 transition-colors">
                  {/* Timestamp */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-stone-700 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{formatDateTime(log.created_at)}</span>
                    </div>
                  </TableCell>

                  {/* Staff / Performer */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0 border border-stone-200">
                        {log.user?.full_name ? log.user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-stone-900 leading-tight">
                          {log.user?.full_name || `User #${log.user_id}`}
                        </div>
                        {log.user?.email && (
                          <div className="text-[11px] text-stone-400">
                            {log.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    {renderActionBadge(log.action)}
                  </TableCell>

                  {/* Target */}
                  <TableCell>
                    {log.target ? (
                      <code className="text-xs font-mono bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200">
                        {log.target}
                      </code>
                    ) : (
                      <span className="text-xs text-stone-400">-</span>
                    )}
                  </TableCell>

                  {/* Details */}
                  <TableCell>
                    <span className="text-xs text-stone-600 max-w-sm line-clamp-2" title={log.details}>
                      {log.details || '-'}
                    </span>
                  </TableCell>

                  {/* IP Address */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                      <Globe className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{log.ip || '-'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="p-4 border-t border-stone-200">
            <Pagination
              currentPage={page}
              totalPages={meta.total_pages}
              pageSize={limit}
              totalItems={meta.total}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setLimit(s);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
