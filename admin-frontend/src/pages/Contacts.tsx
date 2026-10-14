import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, Eye } from 'lucide-react';
import {
  Button,
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
import { contactApi, getErrorMessage } from '@/api';
import { formatDateTime } from '@/lib/format';
import type { Contact } from '@/types';

export const Contacts: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    data: contactsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: () => contactApi.getList(),
  });

  const rawContacts = contactsRes?.data;
  const contacts: Contact[] = Array.isArray(rawContacts)
    ? rawContacts
    : Array.isArray((rawContacts as any)?.items)
    ? (rawContacts as any).items
    : [];

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => contactApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contactApi.delete(id),
    onSuccess: () => {
      showToast.success('Đã xóa tin nhắn liên hệ');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setDeletingId(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa', getErrorMessage(err));
      setDeletingId(null);
    },
  });

  const handleOpenDetail = (c: Contact) => {
    setViewingContact(c);
    if (!c.is_read) {
      markAsReadMutation.mutate(c.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
          <Mail className="h-6 w-6 text-amber-700" />
          <span>Hòm thư Liên hệ</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Các tin nhắn gửi từ khách hàng thông qua form liên hệ trên website.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người gửi</TableHead>
            <TableHead>Email & SĐT</TableHead>
            <TableHead>Tiêu đề yêu cầu</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={6} rows={5} />}

          {isError && (
            <TableError colSpan={6} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && contacts.length === 0 && (
            <TableEmpty colSpan={6} title="Hòm thư liên hệ đang rỗng" />
          )}

          {!isLoading &&
            !isError &&
            contacts.map((c) => (
              <TableRow key={c.id} className={!c.is_read ? 'bg-amber-50/40 font-semibold' : ''}>
                <TableCell className="text-stone-900">{c.full_name}</TableCell>
                <TableCell className="text-xs text-stone-600">
                  <div>{c.email}</div>
                  {c.phone && <div className="text-stone-400 font-mono">{c.phone}</div>}
                </TableCell>
                <TableCell className="text-xs text-stone-800 max-w-xs truncate">
                  {c.subject}
                </TableCell>
                <TableCell className="text-xs text-stone-500">
                  {formatDateTime(c.created_at)}
                </TableCell>
                <TableCell>
                  {!c.is_read ? (
                    <Badge variant="warning" dot>Mới</Badge>
                  ) : (
                    <Badge variant="neutral">Đã đọc</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetail(c)}
                      className="p-1.5 text-stone-600 hover:text-amber-800"
                      title="Xem nội dung"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(c.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50"
                      title="Xóa liên hệ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {/* Modal Xem chi tiết tin nhắn */}
      <Modal
        isOpen={viewingContact !== null}
        onClose={() => setViewingContact(null)}
        title={viewingContact?.subject || 'Nội dung liên hệ'}
        description={`Gửi từ ${viewingContact?.full_name} (${viewingContact?.email}) vào lúc ${formatDateTime(
          viewingContact?.created_at
        )}`}
        footer={
          <Button variant="outline" onClick={() => setViewingContact(null)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-stone-700">
          {viewingContact?.phone && (
            <p>
              <strong className="text-stone-900">Số điện thoại liên hệ:</strong>{' '}
              <span className="font-mono">{viewingContact.phone}</span>
            </p>
          )}

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 leading-relaxed whitespace-pre-wrap text-stone-800">
            {viewingContact?.message}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa tin nhắn liên hệ?"
        message="Hành động này sẽ xóa vĩnh viễn tin nhắn khỏi hệ thống."
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
