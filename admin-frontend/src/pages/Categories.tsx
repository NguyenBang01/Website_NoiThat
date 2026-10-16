import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Upload,
  ChevronRight,
  ChevronDown,
  Layers,
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
import { categoryApi, uploadApi, getErrorMessage } from '@/api';
import { imgUrl } from '@/lib/format';
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(150, 'Tối đa 150 ký tự'),
  slug: z.string().max(190, 'Tối đa 190 ký tự').optional(),
  parent_id: z.string().optional(),
  image: z.string().max(255).optional(),
  sort_order: z.coerce.number().int(),
  is_active: z.union([z.boolean(), z.string()]),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Lấy danh sách danh mục phẳng từ server
  const {
    data: categoriesRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoryApi.getAll,
  });

  const categories = useMemo(() => categoriesRes?.data || [], [categoriesRes]);

  // Xây dựng cây danh mục 2 cấp
  const categoryTree = useMemo(() => {
    const roots: Category[] = [];
    const childrenMap = new Map<number, Category[]>();

    categories.forEach((cat) => {
      if (!cat.parent_id) {
        roots.push({ ...cat, children: [] });
      } else {
        const arr = childrenMap.get(cat.parent_id) || [];
        arr.push(cat);
        childrenMap.set(cat.parent_id, arr);
      }
    });

    roots.sort((a, b) => a.sort_order - b.sort_order);

    return roots.map((root) => ({
      ...root,
      children: (childrenMap.get(root.id) || []).sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [categories]);

  // Danh sách các danh mục gốc hợp lệ làm cha
  const validParentOptions = useMemo(() => {
    return categories
      .filter((c) => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
      .map((c) => ({
        value: String(c.id),
        label: c.name,
      }));
  }, [categories, editingCategory]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      parent_id: '',
      image: '',
      sort_order: 0,
      is_active: true,
    },
  });

  const currentImage = watch('image');

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: '',
      slug: '',
      parent_id: '',
      image: '',
      sort_order: 0,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      slug: cat.slug || '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      image: cat.image || '',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active,
    });
    setModalOpen(true);
  };

  // Mutation Thêm / Sửa
  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const payload: Partial<Category> = {
        name: data.name,
        slug: data.slug || undefined,
        parent_id: data.parent_id ? Number(data.parent_id) : null,
        image: data.image || '',
        sort_order: data.sort_order,
        is_active: data.is_active === true || data.is_active === 'true',
      };

      if (editingCategory) {
        return categoryApi.update(editingCategory.id, payload);
      }
      return categoryApi.create(payload);
    },
    onSuccess: () => {
      showToast.success(
        editingCategory ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể lưu danh mục', getErrorMessage(err));
    },
  });

  // Mutation Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: () => {
      showToast.success('Đã xóa danh mục thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeletingId(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa danh mục', getErrorMessage(err));
      setDeletingId(null);
    },
  });

  // Tải ảnh đại diện
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setValue('image', res.data.url);
      showToast.success('Tải ảnh lên thành công');
    } catch (err) {
      showToast.error('Lỗi tải ảnh', getErrorMessage(err));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <FolderTree className="h-6 w-6 text-amber-700" />
            <span>Quản lý Danh mục sản phẩm</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tổ chức danh mục theo cấu trúc cây 2 cấp (Danh mục gốc & Danh mục con).
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Thêm danh mục
        </Button>
      </div>

      {/* Categories Tree Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Tên danh mục</TableHead>
            <TableHead>Ảnh</TableHead>
            <TableHead>Đường dẫn (Slug)</TableHead>
            <TableHead>Thứ tự</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={7} rows={6} />}

          {isError && (
            <TableError
              colSpan={7}
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && categoryTree.length === 0 && (
            <TableEmpty
              colSpan={7}
              title="Chưa có danh mục nào"
              description="Hãy bấm 'Thêm danh mục' để bắt đầu phân loại sản phẩm nội thất."
              action={
                <Button size="sm" variant="primary" onClick={openCreateModal}>
                  Tạo danh mục đầu tiên
                </Button>
              }
            />
          )}

          {!isLoading &&
            !isError &&
            categoryTree.map((root) => {
              const hasChildren = (root.children?.length ?? 0) > 0;
              const isExpanded = expandedParents[root.id] ?? true;

              return (
                <React.Fragment key={`root-${root.id}`}>
                  {/* Danh mục cha (Gốc) */}
                  <TableRow className="bg-stone-50/50 font-medium">
                    <TableCell>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(root.id)}
                          className="p-1 rounded-md hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="text-stone-300 ml-2">•</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-700" />
                        <span className="font-bold text-stone-900">{root.name}</span>
                        {hasChildren && (
                          <span className="text-[11px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full font-normal">
                            {root.children?.length} con
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {root.image ? (
                        <img
                          src={imgUrl(root.image)}
                          alt={root.name}
                          className="h-9 w-9 rounded-lg object-cover border border-stone-200"
                        />
                      ) : (
                        <span className="text-xs text-stone-400 italic">Không có</span>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-stone-600">
                      {root.slug}
                    </TableCell>

                    <TableCell>{root.sort_order}</TableCell>

                    <TableCell>
                      {root.is_active ? (
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
                          onClick={() => openEditModal(root)}
                          className="p-1.5 text-stone-600 hover:text-amber-800"
                          title="Sửa danh mục"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(root.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Danh mục con (nếu đang mở rộng) */}
                  {hasChildren &&
                    isExpanded &&
                    root.children?.map((child) => (
                      <TableRow key={`child-${child.id}`} className="hover:bg-white">
                        <TableCell />

                        <TableCell>
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-stone-300">└─</span>
                            <span className="text-stone-800 font-medium">{child.name}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {child.image ? (
                            <img
                              src={imgUrl(child.image)}
                              alt={child.name}
                              className="h-8 w-8 rounded-lg object-cover border border-stone-200"
                            />
                          ) : (
                            <span className="text-xs text-stone-400 italic">Không có</span>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-stone-500">
                          {child.slug}
                        </TableCell>

                        <TableCell>{child.sort_order}</TableCell>

                        <TableCell>
                          {child.is_active ? (
                            <Badge variant="success" size="sm">Hiển thị</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Ẩn</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(child)}
                              className="p-1.5 text-stone-600 hover:text-amber-800"
                              title="Sửa danh mục"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(child.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              );
            })}
        </TableBody>
      </Table>

      {/* Modal Thêm / Sửa Danh mục */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm mới Danh mục'}
        description="Điền thông tin danh mục. Bỏ trống đường dẫn (slug) để server tự sinh từ tên."
      >
        <form
          id="category-form"
          onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Tên danh mục *"
            placeholder="VD: Sofa phòng khách, Bàn ăn..."
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Đường dẫn (Slug)"
            placeholder="sofa-phong-khach (để trống để tự tạo)"
            error={errors.slug?.message}
            {...register('slug')}
          />

          <Select
            label="Danh mục cha"
            error={errors.parent_id?.message}
            {...register('parent_id')}
          >
            <option value="">-- Là danh mục gốc (không có cha) --</option>
            {validParentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          {/* Upload ảnh đại diện */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Ảnh đại diện danh mục
            </label>
            <div className="flex items-center gap-3">
              {currentImage ? (
                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-stone-200">
                  <img
                    src={imgUrl(currentImage)}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <label className="flex items-center gap-2 px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer">
                <Upload className="h-4 w-4 text-stone-500" />
                <span>{uploadingImage ? 'Đang nén & tải lên...' : 'Chọn file ảnh'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleUploadImage}
                />
              </label>

              {currentImage && (
                <button
                  type="button"
                  onClick={() => setValue('image', '')}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa ảnh
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Hệ thống tự động nén và tối ưu độ nét, bạn có thể chọn mọi kích thước file ảnh chụp.
            </p>
            <input type="hidden" {...register('image')} />
          </div>

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
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm xóa danh mục */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Xác nhận xóa danh mục?"
        message="Nếu danh mục này còn chứa danh mục con hoặc sản phẩm, hệ thống sẽ từ chối xóa để đảm bảo an toàn dữ liệu."
        confirmText="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
