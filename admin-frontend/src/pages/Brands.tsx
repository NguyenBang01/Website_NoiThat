import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Award, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import {
  Button,
  Input,
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
import { brandApi, uploadApi, getErrorMessage } from '@/api';
import { imgUrl } from '@/lib/format';
import type { Brand } from '@/types';

const brandSchema = z.object({
  name: z.string().min(1, 'Tên thương hiệu không được để trống').max(150),
  slug: z.string().max(190).optional(),
  logo: z.string().max(255).optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

export const Brands: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const {
    data: brandsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: brandApi.getAll,
  });

  const brands = brandsRes?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: '', slug: '', logo: '' },
  });

  const currentLogo = watch('logo');

  const openCreateModal = () => {
    setEditingBrand(null);
    reset({ name: '', slug: '', logo: '' });
    setModalOpen(true);
  };

  const openEditModal = (b: Brand) => {
    setEditingBrand(b);
    reset({
      name: b.name,
      slug: b.slug || '',
      logo: b.logo || '',
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: BrandFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        logo: data.logo || undefined,
      };
      if (editingBrand) {
        return brandApi.update(editingBrand.id, payload);
      }
      return brandApi.create(payload);
    },
    onSuccess: () => {
      showToast.success(editingBrand ? 'Đã cập nhật thương hiệu' : 'Đã tạo thương hiệu');
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể lưu thương hiệu', getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => brandApi.delete(id),
    onSuccess: () => {
      showToast.success('Đã xóa thương hiệu');
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setDeletingId(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa thương hiệu', getErrorMessage(err));
      setDeletingId(null);
    },
  });

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setValue('logo', res.data.url);
      showToast.success('Tải logo lên thành công');
    } catch (err) {
      showToast.error('Lỗi tải logo', getErrorMessage(err));
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Award className="h-6 w-6 text-emerald-700" />
            <span>Quản lý Thương hiệu</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Danh sách các thương hiệu / nhà sản xuất đồ nội thất.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          Thêm thương hiệu
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Logo</TableHead>
            <TableHead>Tên thương hiệu</TableHead>
            <TableHead>Đường dẫn (Slug)</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={5} rows={5} />}

          {isError && (
            <TableError colSpan={5} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && brands.length === 0 && (
            <TableEmpty
              colSpan={5}
              title="Chưa có thương hiệu nào"
              action={
                <Button size="sm" variant="primary" onClick={openCreateModal}>
                  Tạo thương hiệu
                </Button>
              }
            />
          )}

          {!isLoading &&
            !isError &&
            brands.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs text-stone-500">{b.id}</TableCell>
                <TableCell>
                  {b.logo ? (
                    <img
                      src={imgUrl(b.logo)}
                      alt={b.name}
                      className="h-10 w-16 object-contain rounded-lg border border-stone-200 bg-white p-1"
                    />
                  ) : (
                    <span className="text-xs text-stone-400 italic">Không có logo</span>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-stone-900">{b.name}</TableCell>
                <TableCell className="font-mono text-xs text-stone-600">{b.slug}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-stone-600 hover:text-amber-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(b.id)}
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
        title={editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input
            label="Tên thương hiệu *"
            placeholder="VD: Hòa Phát, An Cường, Bergen..."
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Đường dẫn (Slug)"
            placeholder="De-trong-tu-tao"
            error={errors.slug?.message}
            {...register('slug')}
          />

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Logo</label>
            <div className="flex items-center gap-3">
              {currentLogo && (
                <img
                  src={imgUrl(currentLogo)}
                  alt="Logo"
                  className="h-12 w-20 object-contain border border-stone-200 rounded-lg p-1 bg-white"
                />
              )}
              <label className="flex items-center gap-2 px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer">
                <Upload className="h-4 w-4 text-stone-500" />
                <span>{uploadingLogo ? 'Đang tải...' : 'Tải logo lên'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
              </label>
            </div>
            <input type="hidden" {...register('logo')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || saveMutation.isPending}>
              Lưu
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa thương hiệu?"
        message="Thương hiệu sẽ không thể xóa nếu đang có sản phẩm liên kết (mã lỗi 409)."
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
