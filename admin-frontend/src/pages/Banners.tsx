import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Upload,
  ExternalLink,
  Film,
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
import { bannerApi, uploadApi, getErrorMessage } from '@/api';
import { imgUrl } from '@/lib/format';
import type { Banner } from '@/types';

const SAMPLE_INTERIOR_VIDEO =
  'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-4824-large.mp4';

const bannerSchema = z.object({
  title: z.string().min(1, 'Tiêu đề banner không được để trống').max(255),
  subtitle: z.string().max(255).optional(),
  image: z.string().min(1, 'Vui lòng tải lên hoặc nhập đường dẫn hình ảnh / video cho banner'),
  media_type: z.enum(['image', 'video']),
  link: z.string().max(255).optional(),
  sort_order: z.coerce.number().int(),
  is_active: z.union([z.boolean(), z.string()]),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export const Banners: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'url'>('upload');

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
      media_type: 'image',
      link: '',
      sort_order: 0,
      is_active: true,
    },
  });

  const currentImage = watch('image');
  const currentMediaType = watch('media_type') || 'image';

  const isVideoItem = (b: Banner) => {
    return b.media_type === 'video' || /\.(mp4|webm|mov|ogg)($|\?)/i.test(b.image || '');
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setVideoInputMode('upload');
    reset({
      title: '',
      subtitle: '',
      image: '',
      media_type: 'image',
      link: '',
      sort_order: 0,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    const isVid = isVideoItem(b);
    setEditingBanner(b);
    setVideoInputMode(b.image?.startsWith('http') ? 'url' : 'upload');
    reset({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      media_type: isVid ? 'video' : 'image',
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
        media_type: data.media_type,
        link: data.link || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active === true || data.is_active === 'true',
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

    setUploadingMedia(true);
    try {
      const res = await uploadApi.uploadMedia(file);
      setValue('image', res.data.url);
      const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
      if (isVid) {
        setValue('media_type', 'video');
      }
      showToast.success(isVid ? 'Tải video banner thành công' : 'Tải ảnh banner thành công');
    } catch (err) {
      showToast.error('Lỗi tải tệp', getErrorMessage(err));
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Film className="h-6 w-6 text-emerald-700" />
            <span>Quản lý Banner quảng cáo</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Hình ảnh & Banner video chuyển động liên tục trên trang chủ website nội thất Góc Nhà Đẹp.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          Thêm banner mới
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Xem trước</TableHead>
            <TableHead>Tiêu đề & Định dạng</TableHead>
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
            banners.map((b) => {
              const isVid = isVideoItem(b);
              const previewUrl = imgUrl(b.image);

              return (
                <TableRow key={b.id}>
                  <TableCell>
                    {isVid ? (
                      <div className="relative h-12 w-24 rounded-lg overflow-hidden border border-stone-200 bg-stone-900 shadow-xs">
                        <video
                          src={previewUrl}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1 rounded flex items-center gap-0.5">
                          <Film className="h-2 w-2" />
                          <span>VIDEO</span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={b.title}
                        className="h-12 w-24 object-cover rounded-lg border border-stone-200"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-900">{b.title}</p>
                      {isVid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Film className="h-3 w-3 text-emerald-600" />
                          Video động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          <ImageIcon className="h-3 w-3 text-stone-400" />
                          Ảnh tĩnh
                        </span>
                      )}
                    </div>
                    {b.subtitle && <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{b.subtitle}</p>}
                  </TableCell>

                  <TableCell className="text-xs text-stone-600 font-mono">
                    {b.link ? (
                      <a
                        href={b.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                      >
                        <span className="max-w-[140px] truncate">{b.link}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  <TableCell className="font-medium text-stone-700">{b.sort_order}</TableCell>

                  <TableCell>
                    {b.is_active ? (
                      <Badge variant="success" dot>
                        Hiển thị
                      </Badge>
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
                        className="p-1.5 text-stone-600 hover:text-emerald-700"
                        title="Chỉnh sửa banner"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(b.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Xóa banner"
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
        title={editingBanner ? 'Chỉnh sửa banner' : 'Thêm banner mới (Ảnh hoặc Video động)'}
      >
        <form onSubmit={handleSubmit((d: BannerFormData) => saveMutation.mutate(d))} className="space-y-4">
          {/* Lựa chọn loại banner: Ảnh hoặc Video */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Loại banner hiển thị *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('media_type', 'image')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  currentMediaType === 'image'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <ImageIcon className="h-4 w-4 text-emerald-700" />
                <span>Hình ảnh tĩnh</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('media_type', 'video')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  currentMediaType === 'video'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Film className="h-4 w-4 text-emerald-700" />
                <span>Banner động (Video liên tục)</span>
              </button>
            </div>
            <input type="hidden" {...register('media_type')} />
          </div>

          <Input
            label="Tiêu đề banner *"
            placeholder="VD: Không Gian Sống Sang Trọng & Tinh Tế"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Phụ đề (Subtitle)"
            placeholder="VD: Kiến tạo tổ ấm hoàn mỹ với bộ sưu tập nội thất mới nhất"
            error={errors.subtitle?.message}
            {...register('subtitle')}
          />

          {/* Phần cung cấp Media (Ảnh hoặc Video) */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-stone-800">
                {currentMediaType === 'video' ? '🎬 File Video chuyển động' : '🖼️ File Hình ảnh banner'}
              </label>

              {currentMediaType === 'video' && (
                <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      videoInputMode === 'upload'
                        ? 'bg-emerald-700 text-white font-medium'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Tải file lên
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('url')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      videoInputMode === 'url'
                        ? 'bg-emerald-700 text-white font-medium'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Nhập link URL
                  </button>
                </div>
              )}
            </div>

            {/* Khung tải file hoặc nhập URL */}
            {currentMediaType === 'image' ? (
              <div className="flex items-center gap-3">
                {currentImage && (
                  <img
                    src={imgUrl(currentImage)}
                    alt="Preview"
                    className="h-16 w-32 object-cover rounded-lg border border-stone-200"
                  />
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer shadow-2xs">
                  <Upload className="h-4 w-4 text-emerald-700" />
                  <span>{uploadingMedia ? 'Đang nén & tải lên...' : 'Chọn file ảnh từ máy'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                {videoInputMode === 'upload' ? (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer shadow-2xs">
                      <Upload className="h-4 w-4 text-emerald-700" />
                      <span>{uploadingMedia ? 'Đang tải video lên server...' : 'Chọn file video (.mp4, .webm - tối đa 50MB)'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/ogg"
                        className="hidden"
                        onChange={handleUploadBanner}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Dán đường dẫn video MP4/WebM trực tiếp (VD: https://.../video.mp4)"
                        value={currentImage}
                        onChange={(e) => setValue('image', e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Nút bấm dùng video mẫu miễn phí */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
                  <span className="text-stone-500">Chưa có video sẵn?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('image', SAMPLE_INTERIOR_VIDEO);
                      setValue('media_type', 'video');
                      showToast.info('Đã chọn video mẫu phòng khách hiện đại');
                    }}
                    className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Dùng thử video mẫu nội thất cao cấp</span>
                  </button>
                </div>

                {/* Khung xem trước Video phát trực tiếp */}
                {currentImage && (
                  <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-900 shadow-md">
                    <video
                      src={imgUrl(currentImage)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Xem trước: Chuyển động liên tục không ngừng nghỉ</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {errors.image && <p className="text-xs text-rose-600 mt-1">{errors.image.message}</p>}
            <input type="hidden" {...register('image')} />
          </div>

          <Input
            label="Liên kết khi click (Link URL)"
            placeholder="VD: /products hoặc /products/sofa-bergen"
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
              <option value="true">Hiển thị trên web</option>
              <option value="false">Tạm ẩn</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || saveMutation.isPending}>
              {editingBanner ? 'Lưu thay đổi' : 'Tạo banner'}
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
