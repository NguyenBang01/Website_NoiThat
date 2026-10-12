import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, CheckCircle, XCircle } from 'lucide-react';
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
  showToast,
} from '@/components/ui';
import { reviewApi, getErrorMessage } from '@/api';
import { formatDateTime } from '@/lib/format';
import type { Review } from '@/types';

export const Reviews: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: reviewsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-reviews', statusFilter],
    queryFn: () => reviewApi.getList({ status: statusFilter || undefined }),
  });

  const reviews: Review[] = reviewsRes?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'approved' | 'rejected' }) =>
      reviewApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      showToast.success(
        variables.status === 'approved' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err) => {
      showToast.error('Không thể cập nhật đánh giá', getErrorMessage(err));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Star className="h-6 w-6 text-amber-700" />
            <span>Quản lý Đánh giá sản phẩm</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kiểm duyệt bình luận và đánh giá số sao của khách hàng trước khi hiển thị ra ngoài cửa hàng.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm bg-white text-stone-700 focus:border-amber-600 focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ kiểm duyệt (Pending)</option>
          <option value="approved">Đã duyệt (Approved)</option>
          <option value="rejected">Từ chối (Rejected)</option>
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Đánh giá</TableHead>
            <TableHead>Nội dung nhận xét</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động duyệt</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={6} rows={5} />}

          {isError && (
            <TableError colSpan={6} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && reviews.length === 0 && (
            <TableEmpty colSpan={6} title="Chưa có đánh giá nào phù hợp" />
          )}

          {!isLoading &&
            !isError &&
            reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold text-stone-900">
                  {r.user?.name || r.user?.full_name || 'Khách hàng'}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-stone-600">({r.rating}/5)</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-stone-700 max-w-xs">
                  {r.comment || <span className="italic text-stone-400">Không có lời bình</span>}
                </TableCell>

                <TableCell className="text-xs text-stone-500">
                  {formatDateTime(r.created_at)}
                </TableCell>

                <TableCell>
                  {r.status === 'pending' && <Badge variant="warning" dot>Chờ duyệt</Badge>}
                  {r.status === 'approved' && <Badge variant="success">Đã duyệt</Badge>}
                  {r.status === 'rejected' && <Badge variant="danger">Từ chối</Badge>}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.status !== 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'approved' })}
                        leftIcon={<CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                      >
                        Duyệt
                      </Button>
                    )}
                    {r.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'rejected' })}
                        leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
                      >
                        Từ chối
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};
