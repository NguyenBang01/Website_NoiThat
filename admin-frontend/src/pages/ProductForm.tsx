import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Upload,
  GripVertical,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import {
  Button,
  Input,
  Select,
  showToast,
} from '@/components/ui';
import { productApi, categoryApi, brandApi, uploadApi, getErrorMessage } from '@/api';
import { imgUrl } from '@/lib/format';
import type { ProductImage } from '@/types';

// Zod Schema cho từng biến thể
const variantSchema = z.object({
  id: z.number(),
  sku: z.string().min(1, 'Mã SKU biến thể không được để trống'),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  price: z.coerce.number().min(1, 'Giá gốc phải lớn hơn 0'),
  sale_price: z.coerce.number().nullable().optional(),
  stock_quantity: z.coerce.number().int().min(0, 'Tồn kho không âm'),
  is_active: z.boolean(),
});

// Zod Schema cho toàn bộ form sản phẩm
const productFormSchema = z
  .object({
    name: z.string().min(2, 'Tên sản phẩm phải từ 2 ký tự trở lên').max(255),
    slug: z.string().max(255).optional(),
    sku: z.string().min(1, 'Mã SKU chung không được để trống').max(100),
    category_id: z.coerce.number().min(1, 'Vui lòng chọn danh mục sản phẩm'),
    brand_id: z.coerce.number().nullable().optional(),
    short_desc: z.string().max(500, 'Tối đa 500 ký tự').optional(),
    description: z.string().optional(),
    warranty: z.string().max(100).optional(),
    status: z.enum(['draft', 'active', 'hidden']),
    is_featured: z.boolean(),
    variants: z.array(variantSchema).min(1, 'Bắt buộc phải có ít nhất 1 biến thể sản phẩm'),
  })
  .superRefine((data, ctx) => {
    // Kiểm tra từng biến thể: sale_price không được lớn hơn price
    data.variants.forEach((v, index) => {
      if (v.sale_price !== null && v.sale_price !== undefined && v.sale_price > v.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Giá khuyến mãi không được lớn hơn giá gốc',
          path: ['variants', index, 'sale_price'],
        });
      }
    });

    // Kiểm tra SKU biến thể trùng lặp
    const skus = data.variants.map((v) => v.sku.trim().toUpperCase());
    const seen = new Set<string>();
    skus.forEach((sku, index) => {
      if (sku) {
        if (seen.has(sku)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Mã SKU biến thể "${sku}" bị trùng lặp`,
            path: ['variants', index, 'sku'],
          });
        }
        seen.add(sku);
      }
    });
  });

type ProductFormData = z.infer<typeof productFormSchema>;

// Component từng ảnh có kéo thả dnd-kit
const SortableImageCard: React.FC<{
  image: ProductImage;
  index: number;
  onSetPrimary: (index: number) => void;
  onRemove: (index: number) => void;
  onChangeVariantSku: (index: number, sku: string) => void;
  availableSkus: string[];
}> = ({ image, index, onSetPrimary, onRemove, onChangeVariantSku, availableSkus }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `img-${image.url}-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border bg-white p-2 shadow-xs transition-shadow ${
        image.is_primary ? 'border-amber-600 ring-2 ring-amber-600/20' : 'border-stone-200'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* Nút kéo thả */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 z-10 rounded-md bg-stone-900/60 p-1 text-white hover:bg-stone-900 cursor-grab active:cursor-grabbing"
        title="Kéo thả đổi thứ tự ảnh"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Nút xóa ảnh */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 z-10 rounded-md bg-rose-600 p-1 text-white hover:bg-rose-700 cursor-pointer"
        title="Xóa ảnh này"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Ảnh preview */}
      <div className="h-32 w-full overflow-hidden rounded-lg bg-stone-100 flex items-center justify-center">
        <img
          src={imgUrl(image.url)}
          alt={image.alt || 'Ảnh sản phẩm'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Các tùy chỉnh ảnh: Ảnh chính, gán biến thể */}
      <div className="mt-2 space-y-1.5 text-xs">
        <button
          type="button"
          onClick={() => onSetPrimary(index)}
          className={`flex w-full items-center justify-center gap-1 rounded-md py-1 font-medium cursor-pointer transition-colors ${
            image.is_primary
              ? 'bg-amber-700 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {image.is_primary && <Check className="h-3.5 w-3.5" />}
          <span>{image.is_primary ? 'Ảnh chính' : 'Đặt làm ảnh chính'}</span>
        </button>

        <select
          value={image.variant_sku || ''}
          onChange={(e) => onChangeVariantSku(index, e.target.value)}
          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-[11px] text-stone-700 focus:border-amber-600 focus:outline-none"
        >
          <option value="">Ảnh chung (Tất cả)</option>
          {availableSkus.map((sku) => (
            <option key={sku} value={sku}>
              Gán SKU: {sku}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const ProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Cấu hình Tiptap Editor cho mô tả chi tiết
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    editorProps: {
      attributes: {
        className:
          'min-h-[160px] max-h-[360px] overflow-y-auto rounded-b-xl p-3.5 text-sm text-stone-800 focus:outline-none custom-scrollbar prose prose-stone max-w-none',
      },
    },
  });

  // Tải danh mục và thương hiệu
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoryApi.getAll,
  });

  const { data: brandsRes } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: brandApi.getAll,
  });

  const categories = categoriesRes?.data || [];
  const brands = brandsRes?.data || [];

  // Form Hook
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      sku: '',
      category_id: 0,
      brand_id: null,
      short_desc: '',
      description: '',
      warranty: '12 tháng',
      status: 'active',
      is_featured: false,
      variants: [
        {
          id: 0,
          sku: '',
          color: '',
          size: '',
          material: '',
          price: 1000000,
          sale_price: null,
          stock_quantity: 10,
          is_active: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  // Tải dữ liệu sản phẩm nếu đang sửa
  const { data: productDataRes, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productApi.getById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && productDataRes?.data) {
      const p = productDataRes.data;
      reset({
        name: p.name,
        slug: p.slug || '',
        sku: p.sku,
        category_id: p.category_id,
        brand_id: p.brand_id || null,
        short_desc: p.short_desc || '',
        description: p.description || '',
        warranty: p.warranty || '',
        status: p.status,
        is_featured: p.is_featured,
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          color: v.color || '',
          size: v.size || '',
          material: v.material || '',
          price: v.price,
          sale_price: v.sale_price || null,
          stock_quantity: v.stock_quantity,
          is_active: v.is_active,
        })),
      });

      if (editor && p.description) {
        editor.commands.setContent(p.description);
      }

      setImages(p.images || []);
    }
  }, [isEdit, productDataRes, reset, editor]);

  // Cảm biến kéo thả dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, idx) => `img-${images[idx].url}-${idx}` === active.id);
      const newIndex = images.findIndex((_, idx) => `img-${images[idx].url}-${idx}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setImages((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  // Upload nhiều ảnh
  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const res = await uploadApi.uploadImage(file);
        setImages((prev) => [
          ...prev,
          {
            url: res.data.url,
            alt: file.name.replace(/\.[^/.]+$/, ''),
            is_primary: prev.length === 0,
            sort_order: prev.length,
            variant_sku: '',
          },
        ]);
        successCount++;
      } catch (err) {
        showToast.error(`Lỗi tải file "${file.name}"`, getErrorMessage(err));
      }
    }

    if (successCount > 0) {
      showToast.success(`Đã tải lên thành công ${successCount} hình ảnh`);
    }

    setIsUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (prev[index]?.is_primary && filtered.length > 0) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleChangeVariantSku = (index: number, sku: string) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, variant_sku: sku } : img))
    );
  };

  // Nhân bản một dòng biến thể để nhập nhanh các màu sắc khác
  const handleCloneVariant = (index: number) => {
    const current = watch(`variants.${index}`);
    append({
      id: 0,
      sku: `${current.sku}-COPY`,
      color: current.color || '',
      size: current.size || '',
      material: current.material || '',
      price: current.price,
      sale_price: current.sale_price,
      stock_quantity: current.stock_quantity,
      is_active: current.is_active,
    });
    showToast.info('Đã nhân bản biến thể. Hãy cập nhật lại mã SKU!');
  };

  // Danh sách SKU biến thể hiện tại để gán ảnh
  const watchedVariants = watch('variants');
  const availableSkus = (watchedVariants || [])
    .map((v) => v.sku?.trim().toUpperCase())
    .filter(Boolean);

  // Mutation Lưu
  const saveMutation = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      const descriptionHtml = editor?.getHTML() || '';

      const payload = {
        category_id: Number(formData.category_id),
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        name: formData.name,
        slug: formData.slug || '',
        sku: formData.sku.toUpperCase(),
        short_desc: formData.short_desc || '',
        description: descriptionHtml,
        warranty: formData.warranty || '',
        status: formData.status,
        is_featured: formData.is_featured,
        variants: formData.variants.map((v) => ({
          ...v,
          sku: v.sku.toUpperCase(),
        })),
        images: images.map((img, idx) => ({
          url: img.url,
          alt: img.alt || '',
          is_primary: img.is_primary,
          sort_order: idx,
          variant_sku: img.variant_sku || '',
        })),
      };

      if (isEdit) {
        return productApi.update(id!, payload);
      }
      return productApi.create(payload);
    },
    onSuccess: () => {
      showToast.success(isEdit ? 'Đã cập nhật sản phẩm thành công' : 'Đã tạo sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/products');
    },
    onError: (err) => {
      showToast.error('Không thể lưu sản phẩm', getErrorMessage(err));
    },
  });

  if (isEdit && isLoadingProduct) {
    return (
      <div className="py-20 text-center text-sm text-stone-500">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-8 pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {isEdit ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Nhập thông tin chi tiết, quản lý biến thể kích thước / màu sắc và sắp xếp hình ảnh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || saveMutation.isPending}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </Button>
        </div>
      </div>

      {/* Mục 1: Thông tin chung */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Info className="h-5 w-5 text-amber-700" />
          <h2 className="text-base font-bold text-stone-900">1. Thông tin chung</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Tên sản phẩm *"
              placeholder="VD: Sofa góc chữ L Bergen phong cách Bắc Âu"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <Input
            label="Mã SKU chung *"
            placeholder="VD: SOFA-BERGEN"
            error={errors.sku?.message}
            {...register('sku')}
          />

          <Input
            label="Đường dẫn (Slug)"
            placeholder="sofa-goc-chu-l-bergen (để trống để tự tạo)"
            error={errors.slug?.message}
            {...register('slug')}
          />

          <Select
            label="Danh mục sản phẩm *"
            error={errors.category_id?.message}
            {...register('category_id')}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent_id ? `└─ ${c.name}` : c.name}
              </option>
            ))}
          </Select>

          <Select
            label="Thương hiệu"
            error={errors.brand_id?.message}
            {...register('brand_id')}
          >
            <option value="">-- Không có thương hiệu --</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Input
            label="Chính sách bảo hành"
            placeholder="VD: 24 tháng, 12 tháng..."
            error={errors.warranty?.message}
            {...register('warranty')}
          />

          <Select label="Trạng thái hiển thị" {...register('status')}>
            <option value="active">Đang bán (Active - Hiện ra cho khách)</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="hidden">Đã ẩn (Hidden)</option>
          </Select>

          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_featured"
              className="h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-600"
              {...register('is_featured')}
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-stone-800 cursor-pointer">
              Đánh dấu là Sản phẩm nổi bật (Hiển thị trang chủ)
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              placeholder="Tóm tắt ngắn gọn chất liệu, ưu điểm nổi bật..."
              className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-amber-600 focus:outline-none"
              {...register('short_desc')}
            />
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Mô tả chi tiết (Tiptap Rich Text)
            </label>
            <div className="rounded-xl border border-stone-300 overflow-hidden bg-white">
              {/* Tiptap Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50/80 p-2 text-xs">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`rounded px-2 py-1 font-bold ${
                    editor?.isActive('bold') ? 'bg-amber-700 text-white' : 'hover:bg-stone-200'
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`rounded px-2 py-1 italic ${
                    editor?.isActive('italic') ? 'bg-amber-700 text-white' : 'hover:bg-stone-200'
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`rounded px-2 py-1 font-semibold ${
                    editor?.isActive('heading', { level: 2 })
                      ? 'bg-amber-700 text-white'
                      : 'hover:bg-stone-200'
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`rounded px-2 py-1 font-semibold ${
                    editor?.isActive('heading', { level: 3 })
                      ? 'bg-amber-700 text-white'
                      : 'hover:bg-stone-200'
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`rounded px-2 py-1 ${
                    editor?.isActive('bulletList') ? 'bg-amber-700 text-white' : 'hover:bg-stone-200'
                  }`}
                >
                  Danh sách
                </button>
              </div>

              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* Mục 2: Biến thể sản phẩm (Bắt buộc ít nhất 1 dòng) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <h2 className="text-base font-bold text-stone-900">2. Quản lý Biến thể (Variants) *</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Mỗi sản phẩm phải có ít nhất 1 biến thể. Giá và tồn kho cấp sản phẩm do server tự tính từ các biến thể này.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id: 0,
                sku: `${watch('sku') || 'VAR'}-${fields.length + 1}`,
                color: '',
                size: '',
                material: '',
                price: 1000000,
                sale_price: null,
                stock_quantity: 10,
                is_active: true,
              })
            }
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Thêm dòng biến thể
          </Button>
        </div>

        {errors.variants?.message && (
          <p className="text-xs text-rose-600 font-semibold">{errors.variants.message}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold">
                <th className="py-2.5 px-2">Mã SKU *</th>
                <th className="py-2.5 px-2">Màu sắc</th>
                <th className="py-2.5 px-2">Kích thước</th>
                <th className="py-2.5 px-2">Chất liệu</th>
                <th className="py-2.5 px-2">Giá gốc (VND) *</th>
                <th className="py-2.5 px-2">Giá khuyến mãi</th>
                <th className="py-2.5 px-2">Tồn kho *</th>
                <th className="py-2.5 px-2 text-center">Bán?</th>
                <th className="py-2.5 px-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {fields.map((field, idx) => (
                <tr key={field.id} className="hover:bg-stone-50/40">
                  <td className="p-2 min-w-[130px]">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 uppercase font-mono text-xs focus:border-amber-600 focus:outline-none"
                      placeholder="SOFA-GRY"
                      {...register(`variants.${idx}.sku`)}
                    />
                    {errors.variants?.[idx]?.sku && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        {errors.variants[idx]?.sku?.message}
                      </span>
                    )}
                  </td>

                  <td className="p-2 min-w-[100px]">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                      placeholder="Xám"
                      {...register(`variants.${idx}.color`)}
                    />
                  </td>

                  <td className="p-2 min-w-[100px]">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                      placeholder="280x160 cm"
                      {...register(`variants.${idx}.size`)}
                    />
                  </td>

                  <td className="p-2 min-w-[100px]">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                      placeholder="Vải nỉ"
                      {...register(`variants.${idx}.material`)}
                    />
                  </td>

                  <td className="p-2 min-w-[110px]">
                    <input
                      type="number"
                      step={1000}
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs font-semibold focus:border-amber-600 focus:outline-none"
                      {...register(`variants.${idx}.price`)}
                    />
                    {errors.variants?.[idx]?.price && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        {errors.variants[idx]?.price?.message}
                      </span>
                    )}
                  </td>

                  <td className="p-2 min-w-[110px]">
                    <input
                      type="number"
                      step={1000}
                      placeholder="Không KM"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                      {...register(`variants.${idx}.sale_price`)}
                    />
                    {errors.variants?.[idx]?.sale_price && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        {errors.variants[idx]?.sale_price?.message}
                      </span>
                    )}
                  </td>

                  <td className="p-2 min-w-[80px]">
                    <input
                      type="number"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                      {...register(`variants.${idx}.stock_quantity`)}
                    />
                  </td>

                  <td className="p-2 text-center min-w-[50px]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-stone-300 text-amber-700"
                      {...register(`variants.${idx}.is_active`)}
                    />
                  </td>

                  <td className="p-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleCloneVariant(idx)}
                        className="rounded p-1 text-stone-500 hover:bg-stone-200 cursor-pointer"
                        title="Nhân bản dòng này để tạo màu mới nhanh"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={fields.length <= 1}
                        onClick={() => {
                          if (fields.length <= 1) {
                            showToast.warning('Bắt buộc phải có ít nhất 1 biến thể');
                            return;
                          }
                          remove(idx);
                        }}
                        className="rounded p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                        title="Xóa biến thể"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mục 3: Quản lý Hình ảnh (Upload nhiều ảnh, kéo thả sắp xếp dnd-kit) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              3. Hình ảnh sản phẩm (Kéo thả sắp xếp thứ tự)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Hỗ trợ tải nhiều ảnh JPG, PNG, WEBP tối đa 5MB. Kéo thả để đổi vị trí hiển thị; chọn 1 ảnh chính.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{isUploadingImages ? 'Đang tải lên...' : 'Tải thêm ảnh'}</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={isUploadingImages}
              onChange={handleUploadImages}
            />
          </label>
        </div>

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
            <p className="text-xs text-stone-500">
              Chưa có hình ảnh nào cho sản phẩm này. Hãy bấm "Tải thêm ảnh" ở trên.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={images.map((img, idx) => `img-${img.url}-${idx}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, idx) => (
                  <SortableImageCard
                    key={`img-${img.url}-${idx}`}
                    image={img}
                    index={idx}
                    onSetPrimary={handleSetPrimaryImage}
                    onRemove={handleRemoveImage}
                    onChangeVariantSku={handleChangeVariantSku}
                    availableSkus={availableSkus}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
        <Button type="button" variant="outline" onClick={() => navigate('/products')}>
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting || saveMutation.isPending}
        >
          {isEdit ? 'Lưu sản phẩm' : 'Hoàn tất & Đăng bán'}
        </Button>
      </div>
    </form>
  );
};
