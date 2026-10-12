import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Image as ImageIcon, Plus, Edit2, Trash2, Upload, ExternalLink } from 'lucide-react';
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
import { bannerApi, uploadApi, getErrorMessage } from '@/api';
import { imgUrl } from '@/lib/format';
import type { Banner } from '@/types';

const bannerSchema = z.object({
  title: z.string().min(1, 'Tiêu đề banner không được để trống').max(255),
  subtitle: z.string().max(255).optional(),
  image: z.string().min(1, 'Vui lòng tải lên hình ảnh cho banner'),
  link: z.string().max(255).optional(),
  sort_order: z.coerce.number().int(),
  is_active: z.boolean(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export const Banners: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    data: bannersRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => bannerApi.getList(),
  });

  // Backend trả về mảng hoặc { items: [] }
  const rawData = bannersRes?.data;
  const banners: Banner[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { items?: Banner[] })?.items || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      image: '',
      link: '',
      sort_order: 0,
      is_active: true,
    },
  });

  const currentImage = watch('image');

  const openCreateModal = () => {
    setEditingBanner(null);
    reset({
      title: '',
      subtitle: '',
      image: '',
      link: '',
      sort_order: 0,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    reset({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      link: b.link || '',
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: BannerFormData) => {
      const payload: Partial<Banner> = {
        title: data.title,
        subtitle: data.subtitle || undefined,
        image: data.image,
        link: data.link || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active,
      };

      if (editingBanner) {
        return bannerApi.update(editingBanner.id, payload);
      }
      return bannerApi.create(payload);
    },
    onSuccess: () => {
      showToast.success(editingBanner ? 'Đã cập nhật banner' : 'Đã tạo banner mới');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể lưu banner', getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannerApi.delete(id),
    onSuccess: () => {
      showToast.success('Đã xóa banner');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setDeletingId(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa banner', getErrorMessage(err));
      setDeletingId(null);
    },
  });

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setValue('image', res.data.url);
      showToast.success('Tải ảnh banner thành công');
    } catch (err) {
      showToast.error('Lỗi tải ảnh', getErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <ImageIcon className="h-6 w-6 text-amber-700" />
            <span>Quản lý Banner quảng cáo</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Hình ảnh trình chiếu slider trên trang chủ website bán đồ nội thất.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          Thêm banner mới
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Xem trước</TableHead>
            <TableHead>Tiêu đề & Phụ đề</TableHead>
            <TableHead>Liên kết (Link)</TableHead>
            <TableHead>Thứ tự</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={6} rows={4} />}

          {isError && (
            <TableError colSpan={6} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && banners.length === 0 && (
            <TableEmpty
              colSpan={6}
              title="Chưa có banner nào"
              action={
                <Button size="sm" variant="primary" onClick={openCreateModal}>
                  Tạo banner đầu tiên
                </Button>
              }
            />
          )}

          {!isLoading &&
            !isError &&
            banners.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <img
                    src={imgUrl(b.image)}
                    alt={b.title}
                    className="h-12 w-24 object-cover rounded-lg border border-stone-200"
                  />
                </TableCell>

                <TableCell>
                  <p className="font-semibold text-stone-900">{b.title}</p>
                  {b.subtitle && <p className="text-xs text-stone-500">{b.subtitle}</p>}
                </TableCell>

                <TableCell className="text-xs text-stone-600 font-mono">
                  {b.link ? (
                    <a
                      href={b.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-800 hover:underline"
                    >
                      <span>{b.link}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>

                <TableCell>{b.sort_order}</TableCell>

                <TableCell>
                  {b.is_active ? (
                    <Badge variant="success" dot>Hiển thị</Badge>
                  ) : (
                    <Badge variant="neutral">Ẩn</Badge>
                  )}
                </TableCell>

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
        title={editingBanner ? 'Sửa banner' : 'Thêm banner mới'}
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input
            label="Tiêu đề banner *"
            placeholder="VD: Bộ Sưu Tập Phòng Khách Mùa Thu"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Phụ đề (Subtitle)"
            placeholder="VD: Giảm ngay 20% cho toàn bộ sofa da"
            error={errors.subtitle?.message}
            {...register('subtitle')}
          />

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Hình ảnh banner *
            </label>
            <div className="flex items-center gap-3">
              {currentImage && (
                <img
                  src={imgUrl(currentImage)}
                  alt="Preview"
                  className="h-14 w-28 object-cover rounded-lg border border-stone-200"
                />
              )}
              <label className="flex items-center gap-2 px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer">
                <Upload className="h-4 w-4 text-stone-500" />
                <span>{uploadingImage ? 'Đang tải...' : 'Tải ảnh banner lên (tối đa 5MB)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} />
              </label>
            </div>
            {errors.image && <p className="text-xs text-rose-600 mt-1">{errors.image.message}</p>}
            <input type="hidden" {...register('image')} />
          </div>

          <Input
            label="Liên kết điều hướng (Link URL)"
            placeholder="VD: /products/sofa-bergen"
            error={errors.link?.message}
            {...register('link')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thứ tự hiển thị"
              type="number"
              placeholder="0"
              error={errors.sort_order?.message}
              {...register('sort_order')}
            />

            <Select label="Trạng thái" {...register('is_active')}>
              <option value="true">Hiển thị</option>
              <option value="false">Ẩn</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || saveMutation.isPending}>
              Lưu banner
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa banner?"
        message="Hành động này sẽ xóa banner khỏi thanh trình chiếu trang chủ."
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
