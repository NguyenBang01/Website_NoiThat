import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Edit2, Trash2 } from 'lucide-react';
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
  Pagination,
  ConfirmDialog,
  showToast,
} from '@/components/ui';
import { productApi, categoryApi, getErrorMessage } from '@/api';
import { formatCurrency, imgUrl } from '@/lib/format';
import type { Product } from '@/types';

export const ProductList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('category_id') || '';
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = 20;

  const [searchInput, setSearchInput] = useState(q);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Đồng bộ ô tìm kiếm khi URL thay đổi
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Chỉ debounce khi người dùng thực sự gõ tìm kiếm khác với q trong URL
  useEffect(() => {
    if (searchInput.trim() === q) return;

    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) {
          next.set('q', searchInput.trim());
        } else {
          next.delete('q');
        }
        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, q, setSearchParams]);

  // Lấy danh sách sản phẩm
  const {
    data: productsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-products', { q, categoryId, status, page, limit }],
    queryFn: () =>
      productApi.getList({
        q: q || undefined,
        category_id: categoryId || undefined,
        status: status || undefined,
        page,
        limit,
      }),
  });

  // Lấy danh mục để lọc
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoryApi.getAll,
  });

  const categories = categoriesRes?.data || [];
  const rawProducts = productsRes?.data;
  const products: Product[] = Array.isArray(rawProducts)
    ? rawProducts
    : Array.isArray((rawProducts as any)?.items)
    ? (rawProducts as any).items
    : [];
  const meta = productsRes?.meta;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (e.target.value) {
        next.set('category_id', e.target.value);
      } else {
        next.delete('category_id');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (e.target.value) {
        next.set('status', e.target.value);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      showToast.success('Đã xóa sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeletingProduct(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa sản phẩm', getErrorMessage(err));
      setDeletingProduct(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Package className="h-6 w-6 text-amber-700" />
            <span>Quản lý Sản phẩm</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Danh sách tất cả sản phẩm nội thất kèm biến thể màu sắc, kích thước và tồn kho.
          </p>
        </div>

        <Link to="/products/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Thêm sản phẩm mới
          </Button>
        </Link>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
            className="w-full rounded-xl border border-stone-300 pl-9 pr-4 py-2 text-sm focus:border-amber-600 focus:outline-none"
          />
        </div>

        <select
          value={categoryId}
          onChange={handleCategoryChange}
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm bg-white text-stone-700 focus:border-amber-600 focus:outline-none"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent_id ? `└─ ${c.name}` : c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={handleStatusChange}
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm bg-white text-stone-700 focus:border-amber-600 focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán (Active)</option>
          <option value="draft">Bản nháp (Draft)</option>
          <option value="hidden">Đã ẩn (Hidden)</option>
        </select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Ảnh</TableHead>
            <TableHead>Tên sản phẩm & SKU</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Giá hiển thị</TableHead>
            <TableHead>Biến thể / Tồn kho</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && <TableSkeleton columns={7} rows={6} />}

          {isError && (
            <TableError colSpan={7} message={getErrorMessage(error)} onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && products.length === 0 && (
            <TableEmpty
              colSpan={7}
              title="Không tìm thấy sản phẩm"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc danh mục, trạng thái."
              action={
                <Link to="/products/new">
                  <Button size="sm" variant="primary">
                    Thêm sản phẩm mới
                  </Button>
                </Link>
              }
            />
          )}

          {!isLoading &&
            !isError &&
            products.map((p) => {
              const primaryImg =
                p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url;
              const displayPrice = p.min_price || p.variants?.[0]?.price || 0;
              const totalStock =
                p.total_stock !== undefined
                  ? p.total_stock
                  : p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) ?? 0;

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    {primaryImg ? (
                      <img
                        src={imgUrl(primaryImg)}
                        alt={p.name}
                        className="h-11 w-11 rounded-lg object-cover border border-stone-200"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div>
                      <Link
                        to={`/products/${p.id}`}
                        className="font-semibold text-stone-900 hover:text-amber-800 transition-colors line-clamp-1"
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                      <span className="font-mono text-xs text-stone-500">SKU: {p.sku}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-stone-600">
                    {p.category?.name || categories.find((c) => c.id === p.category_id)?.name || '-'}
                  </TableCell>

                  <TableCell className="font-semibold text-amber-800 text-sm">
                    {formatCurrency(displayPrice)}
                  </TableCell>

                  <TableCell>
                    <div className="text-xs">
                      <span className="font-medium text-stone-800">
                        {p.variants?.length || 0} biến thể
                      </span>
                      <span className="text-stone-400 mx-1">•</span>
                      <span className={totalStock <= 5 ? 'text-rose-600 font-bold' : 'text-stone-600'}>
                        Kho: {totalStock}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {p.status === 'active' && <Badge variant="success">Đang bán</Badge>}
                    {p.status === 'draft' && <Badge variant="neutral">Bản nháp</Badge>}
                    {p.status === 'hidden' && <Badge variant="warning">Đã ẩn</Badge>}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/products/${p.id}`}>
                        <Button variant="ghost" size="sm" className="p-1.5 text-stone-600 hover:text-amber-800">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingProduct(p)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50"
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

      {/* Phân trang */}
      {meta && meta.total_pages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.total_pages || Math.ceil(meta.total / limit)}
          totalItems={meta.total}
          pageSize={limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
        title="Xác nhận xóa sản phẩm?"
        message={`Bạn có chắc muốn xóa sản phẩm "${deletingProduct?.name}"? Hệ thống sẽ thực hiện xóa mềm để bảo vệ lịch sử đơn hàng.`}
        confirmText="Xóa sản phẩm"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
