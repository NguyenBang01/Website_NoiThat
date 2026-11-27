import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { Heart, ShoppingBag, Filter, ChevronDown, Check, X } from 'lucide-react';
import type { Product, Category, Brand } from '../../types';
import { getProductImage } from '../../lib/format';
import { getColorSwatch, getProductColors } from '../../lib/colors';
import { addToCart } from '../../stores/cartStore';
import { $wishlistIds, toggleWishlist } from '../../stores/wishlistStore';
import { toast } from 'sonner';

function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Props {
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  initialCategory?: string;
  initialQuery?: string;
  maxItems?: number;
}

// 12 sản phẩm chuẩn thiết kế theo đúng bản Figma Ảnh 1, 2, 5
const SHOWROOM_DEFAULT_PRODUCTS: Product[] = [
  // Hàng 1
  {
    id: 301,
    name: 'Ghế Sofa',
    slug: 'ghe-sofa-vang-boc-vai-cao-cap',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 15,
  },
  {
    id: 302,
    name: 'Ghế Sofa',
    slug: 'binh-thuy-tinh-nghe-thuat-lam-ngoc',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 20,
  },
  {
    id: 303,
    name: 'Ghế Sofa',
    slug: 'ghe-armchair-thu-gian-pastel',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 12,
  },
  {
    id: 304,
    name: 'Ghế Sofa',
    slug: 'ghe-may-dan-vintage-cao-cap',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1580481077195-c328a37db71a?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 18,
  },
  // Hàng 2
  {
    id: 305,
    name: 'Ghế Sofa',
    slug: 'giuong-ngu-tan-co-dien',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 14,
  },
  {
    id: 306,
    name: 'Ghế Sofa',
    slug: 'ban-tra-tron-chan-tru',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 16,
  },
  {
    id: 307,
    name: 'Ghế Sofa',
    slug: 'sofa-vang-module-trang',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 8,
  },
  {
    id: 308,
    name: 'Ghế Sofa',
    slug: 'tu-dau-giuong-go-soi',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 22,
  },
  // Hàng 3
  {
    id: 309,
    name: 'Ghế Sofa',
    slug: 'ban-lam-viec-co-dien',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 10,
  },
  {
    id: 310,
    name: 'Ghế Sofa',
    slug: 'ghe-sofa-banh-ni',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 9,
  },
  {
    id: 311,
    name: 'Ghế Sofa',
    slug: 'sofa-goc-l-boc-vai',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 6,
  },
  {
    id: 312,
    name: 'Ghế Sofa',
    slug: 'ghe-armchair-hong-tan-co-dien',
    base_price: 11000000,
    sale_price: 11000000,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 11,
  },
];

// Danh sách danh mục sản phẩm mặc định (đồng bộ từ cơ sở dữ liệu và hệ thống Admin)
const DEFAULT_CATEGORY_TABS = [
  'Tất cả',
  'Bàn ăn',
  'Ghế',
  'Sofa',
  'Giường',
  'Tủ & Kệ',
  'Đèn',
  'Đồ trang trí',
];

// Các tùy chọn mức giá & phong cách cơ sở (sẽ được ràng buộc động theo sản phẩm thực tế)
const PRICE_OPTIONS = [
  { label: 'Tất cả mức giá', val: 'all' },
  { label: 'Dưới 5 triệu', val: 'under5m' },
  { label: 'Từ 5 - 15 triệu', val: '5m-15m' },
  { label: 'Từ 15 - 30 triệu', val: '15m-30m' },
  { label: 'Từ 30 - 50 triệu', val: '30m-50m' },
  { label: 'Trên 50 triệu', val: 'over50m' },
];

const STYLE_OPTIONS = [
  { label: 'Tất cả phong cách', val: 'all' },
  { label: 'Hiện đại (Modern)', val: 'modern' },
  { label: 'Bắc Âu (Scandinavian)', val: 'nordic' },
  { label: 'Tối giản (Minimalist)', val: 'minimalist' },
  { label: 'Tân cổ điển / Luxury', val: 'luxury' },
  { label: 'Tự nhiên / Mộc', val: 'natural' },
];

const JUNK_VALUES = new Set(['sfs', 'fdfe', 'dfdf', 'khong co']);

// Trích xuất danh sách chất liệu hoặc kích thước thực tế (duy nhất) của 1 sản phẩm
function extractProductValues(
  primary: string[] | undefined,
  variants: Product['variants'] | undefined,
  field: 'material' | 'size'
): string[] {
  const seen = new Set<string>();
  const list: string[] = [];

  const pushVal = (raw?: string | null) => {
    if (!raw || typeof raw !== 'string') return;
    const trimmed = raw.trim();
    const norm = trimmed.toLowerCase();
    if (!trimmed || JUNK_VALUES.has(norm) || seen.has(norm)) return;
    seen.add(norm);
    list.push(trimmed);
  };

  if (Array.isArray(primary)) {
    for (const item of primary) pushVal(item);
  }
  if (list.length === 0 && Array.isArray(variants)) {
    for (const v of variants) pushVal(v[field]);
  }
  return list;
}

const getProductMaterials = (p: Product) => extractProductValues(p.materials, p.variants, 'material');
const getProductSizes = (p: Product) => extractProductValues(p.sizes, p.variants, 'size');

interface FilterState {
  type: string;
  price: string;
  style: string;
  color: string;
  material: string;
  size: string;
  brand: string;
}

type FilterKey = keyof FilterState;

interface FilterOption {
  label: string;
  val: string;
  swatch?: ReturnType<typeof getColorSwatch>;
}

function matchesProductPrice(p: Product, priceKey: string): boolean {
  if (priceKey === 'all') return true;
  const pr = p.sale_price || p.base_price || 0;
  if (priceKey === 'under5m') return pr < 5000000;
  if (priceKey === '5m-15m') return pr >= 5000000 && pr <= 15000000;
  if (priceKey === '15m-30m') return pr > 15000000 && pr <= 30000000;
  if (priceKey === '30m-50m') return pr > 30000000 && pr <= 50000000;
  if (priceKey === 'over50m') return pr > 50000000;
  return true;
}

function matchesProductStyle(p: Product, styleKey: string): boolean {
  if (styleKey === 'all') return true;
  const styleSlug = toSlug(styleKey);
  const sDesc = toSlug(p.short_desc || p.short_description || p.description || '');
  const pName = toSlug(p.name || '');
  const bSlug = toSlug(p.brand?.slug || '');

  if (styleSlug === 'modern') {
    return (
      sDesc.includes('hien dai') ||
      sDesc.includes('modern') ||
      sDesc.includes('tinh gon') ||
      pName.includes('coastal') ||
      pName.includes('jupiter') ||
      pName.includes('moretti') ||
      pName.includes('acrylic') ||
      pName.includes('porto') ||
      pName.includes('cameo') ||
      pName.includes('landa') ||
      pName.includes('genie')
    );
  }
  if (styleSlug === 'nordic') {
    return (
      sDesc.includes('bac au') ||
      sDesc.includes('nordic') ||
      bSlug === 'scandi-living' ||
      pName.includes('skagen') ||
      pName.includes('bridge') ||
      pName.includes('coastal')
    );
  }
  if (styleSlug === 'minimalist') {
    return (
      sDesc.includes('toi gian') ||
      sDesc.includes('minimal') ||
      sDesc.includes('don gian') ||
      pName.includes('maxine') ||
      pName.includes('pio') ||
      pName.includes('maison') ||
      pName.includes('penny')
    );
  }
  if (styleSlug === 'luxury') {
    return (
      sDesc.includes('co dien') ||
      sDesc.includes('luxury') ||
      sDesc.includes('sang trong') ||
      sDesc.includes('dang cap') ||
      pName.includes('victoria') ||
      pName.includes('elanoire') ||
      pName.includes('savona') ||
      pName.includes('queens') ||
      pName.includes('roche') ||
      pName.includes('flow')
    );
  }
  if (styleSlug === 'natural') {
    return (
      sDesc.includes('tu nhien') ||
      sDesc.includes('moc') ||
      bSlug === 'nha-go-viet' ||
      pName.includes('may') ||
      pName.includes('oak')
    );
  }
  return sDesc.includes(styleSlug) || pName.includes(styleSlug);
}

function matchesProductType(p: Product, typeKey: string): boolean {
  if (typeKey === 'all') return true;
  const typeSlug = toSlug(typeKey);
  const cSlug = toSlug(p.category?.slug || '');
  const cName = toSlug(p.category?.name || '');
  if (cSlug) return cSlug === typeSlug;
  return cName === typeSlug;
}

function matchesProductBrand(p: Product, brandKey: string): boolean {
  if (brandKey === 'all') return true;
  const brandSlug = toSlug(brandKey);
  const bSlug = toSlug(p.brand?.slug || '');
  const bName = toSlug(p.brand?.name || '');
  return bSlug === brandSlug || bName === brandSlug;
}

function applyFacetedFilters(pool: Product[], filters: FilterState, excludeKey?: FilterKey): Product[] {
  return pool.filter((p) => {
    if (excludeKey !== 'type' && !matchesProductType(p, filters.type)) return false;
    if (excludeKey !== 'price' && !matchesProductPrice(p, filters.price)) return false;
    if (excludeKey !== 'style' && !matchesProductStyle(p, filters.style)) return false;
    if (excludeKey !== 'color' && filters.color !== 'all') {
      const target = toSlug(filters.color);
      if (!getProductColors(p).some((c) => toSlug(c) === target)) return false;
    }
    if (excludeKey !== 'material' && filters.material !== 'all') {
      const target = filters.material.toLowerCase();
      if (!getProductMaterials(p).some((m) => m.toLowerCase() === target)) return false;
    }
    if (excludeKey !== 'size' && filters.size !== 'all') {
      const target = filters.size.toLowerCase();
      if (!getProductSizes(p).some((s) => s.toLowerCase() === target)) return false;
    }
    if (excludeKey !== 'brand' && !matchesProductBrand(p, filters.brand)) return false;
    return true;
  });
}

export default function RoomShowroomSection({
  products = [],
  categories = [],
  brands = [],
  initialCategory = '',
  initialQuery = '',
  maxItems = 12,
}: Props) {
  // Lấy danh sách danh mục động từ props categories hoặc fallback về danh mục mặc định
  const categoryTabs = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      const activeCats = categories
        .filter((c) => c.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((c) => c.name);
      return ['Tất cả', ...activeCats];
    }
    return DEFAULT_CATEGORY_TABS;
  }, [categories]);

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (!initialCategory) return 'Tất cả';
    if (Array.isArray(categories) && categories.length > 0) {
      const found = categories.find(
        (c) => c.slug === initialCategory || toSlug(c.name) === toSlug(initialCategory)
      );
      if (found) return found.name;
    }
    return initialCategory;
  });

  useEffect(() => {
    if (initialCategory) {
      if (Array.isArray(categories) && categories.length > 0) {
        const found = categories.find(
          (c) => c.slug === initialCategory || toSlug(c.name) === toSlug(initialCategory)
        );
        if (found) {
          setSelectedCategory(found.name);
          return;
        }
      }
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, categories]);

  const [selectedType, setSelectedType] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const wishlistIds = useStore($wishlistIds);

  // Đếm số lượng bộ lọc đang áp dụng
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'Tất cả') count++;
    if (selectedType !== 'all') count++;
    if (selectedPrice !== 'all') count++;
    if (selectedStyle !== 'all') count++;
    if (selectedColor !== 'all') count++;
    if (selectedMaterial !== 'all') count++;
    if (selectedSize !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    return count;
  }, [selectedCategory, selectedType, selectedPrice, selectedStyle, selectedColor, selectedMaterial, selectedSize, selectedBrand]);

  // Đặt lại tất cả bộ lọc
  const handleResetFilters = () => {
    setSelectedCategory('Tất cả');
    setSelectedType('all');
    setSelectedPrice('all');
    setSelectedStyle('all');
    setSelectedColor('all');
    setSelectedMaterial('all');
    setSelectedSize('all');
    setSelectedBrand('all');
    setActiveDropdown(null);
    toast.info('Đã đặt lại tất cả bộ lọc về mặc định.');
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filter-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Xử lý giỏ hàng nhanh
  const handleAddToCart = async (p: Product) => {
    const stock = p.stock_quantity ?? p.total_stock ?? (p.in_stock === false ? 0 : 10);
    if (stock <= 0 || p.in_stock === false) {
      toast.error(`Sản phẩm "${p.name}" hiện đang tạm hết hàng.`);
      return;
    }

    const price = p.sale_price || p.base_price || 11000000;
    const res = await addToCart({
      variant_id: p.variants?.[0]?.id || p.id,
      product_id: p.id,
      product_name: p.name,
      product_slug: p.slug,
      sku: p.sku || `GND-${p.id}`,
      color: p.colors?.[0] || 'Mặc định',
      material: 'Chất liệu cao cấp',
      image_url: p.image || p.images?.[0]?.url,
      original_price: p.base_price || price,
      unit_price: price,
      quantity: 1,
      stock_quantity: stock,
      available: true,
    });

    if (res.success) {
      toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`);
    } else {
      toast.error(res.message);
    }
  };

  // Nguồn sản phẩm sau khi lọc theo từ khóa và tab danh mục phía trên
  const categoryScopedPool = useMemo(() => {
    let pool = Array.isArray(products) && products.length > 0 ? products : SHOWROOM_DEFAULT_PRODUCTS;

    if (initialQuery && initialQuery.trim() !== '') {
      const qSlug = toSlug(initialQuery.trim());
      pool = pool.filter((p) => {
        const hay = toSlug(
          `${p.name || ''} ${p.sku || ''} ${p.short_desc || ''} ${p.category?.name || ''} ${p.brand?.name || ''}`
        );
        return hay.includes(qSlug);
      });
    }

    if (selectedCategory !== 'Tất cả') {
      const catSlug = toSlug(selectedCategory);
      const matchedCat = categories?.find(
        (c) => toSlug(c.name) === catSlug || c.slug === catSlug
      );

      pool = pool.filter((p) => {
        if (matchedCat && p.category_id && p.category_id === matchedCat.id) return true;
        if (matchedCat && p.category?.id && p.category.id === matchedCat.id) return true;

        const cName = toSlug(p.category?.name || '');
        const cSlug = toSlug(p.category?.slug || '');
        if (cName === catSlug || cSlug === catSlug) return true;

        const pName = toSlug(p.name || '');
        if (pName.includes(catSlug)) return true;
        return false;
      });
    }

    return pool;
  }, [products, categories, initialQuery, selectedCategory]);

  const filterState: FilterState = useMemo(
    () => ({
      type: selectedType,
      price: selectedPrice,
      style: selectedStyle,
      color: selectedColor,
      material: selectedMaterial,
      size: selectedSize,
      brand: selectedBrand,
    }),
    [selectedType, selectedPrice, selectedStyle, selectedColor, selectedMaterial, selectedSize, selectedBrand]
  );

  // Ràng buộc động các lựa chọn của từng dropdown theo các bộ lọc còn lại
  const facetedOptions = useMemo(() => {
    const typePool = applyFacetedFilters(categoryScopedPool, filterState, 'type');
    const typeMap = new Map<string, string>();
    for (const p of typePool) {
      if (p.category?.slug && p.category?.name) {
        typeMap.set(p.category.slug, p.category.name);
      }
    }
    const orderedTypes: FilterOption[] = [{ label: 'Tất cả loại sản phẩm', val: 'all' }];
    if (Array.isArray(categories) && categories.length > 0) {
      for (const c of [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
        if (typeMap.has(c.slug)) {
          orderedTypes.push({ label: c.name, val: c.slug });
          typeMap.delete(c.slug);
        }
      }
    }
    for (const [val, label] of typeMap.entries()) {
      orderedTypes.push({ label, val });
    }

    const pricePool = applyFacetedFilters(categoryScopedPool, filterState, 'price');
    const priceOptions: FilterOption[] = PRICE_OPTIONS.filter(
      (opt) => opt.val === 'all' || pricePool.some((p) => matchesProductPrice(p, opt.val))
    );

    const stylePool = applyFacetedFilters(categoryScopedPool, filterState, 'style');
    const styleOptions: FilterOption[] = STYLE_OPTIONS.filter(
      (opt) => opt.val === 'all' || stylePool.some((p) => matchesProductStyle(p, opt.val))
    );

    const colorPool = applyFacetedFilters(categoryScopedPool, filterState, 'color');
    const colorMap = new Map<string, string>();
    for (const p of colorPool) {
      for (const c of getProductColors(p)) {
        const key = toSlug(c);
        const existing = colorMap.get(key);
        if (!existing || (!/[^\x00-\x7F]/.test(existing) && /[^\x00-\x7F]/.test(c))) {
          colorMap.set(key, c);
        }
      }
    }
    const colorOptions: FilterOption[] = [
      { label: 'Tất cả màu sắc', val: 'all' },
      ...Array.from(colorMap.values())
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((c) => ({ label: c, val: c, swatch: getColorSwatch(c) })),
    ];

    const materialPool = applyFacetedFilters(categoryScopedPool, filterState, 'material');
    const materialMap = new Map<string, string>();
    for (const p of materialPool) {
      for (const m of getProductMaterials(p)) {
        const key = m.toLowerCase();
        if (!materialMap.has(key)) materialMap.set(key, m);
      }
    }
    const materialOptions: FilterOption[] = [
      { label: 'Tất cả chất liệu', val: 'all' },
      ...Array.from(materialMap.values())
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((m) => ({ label: m, val: m })),
    ];

    const sizePool = applyFacetedFilters(categoryScopedPool, filterState, 'size');
    const sizeMap = new Map<string, string>();
    for (const p of sizePool) {
      for (const s of getProductSizes(p)) {
        const key = s.toLowerCase();
        if (!sizeMap.has(key)) sizeMap.set(key, s);
      }
    }
    const sizeOptions: FilterOption[] = [
      { label: 'Tất cả kích thước', val: 'all' },
      ...Array.from(sizeMap.values())
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((s) => ({ label: s, val: s })),
    ];

    const brandPool = applyFacetedFilters(categoryScopedPool, filterState, 'brand');
    const brandMap = new Map<string, string>();
    for (const p of brandPool) {
      if (p.brand?.name) {
        const slug = p.brand.slug || toSlug(p.brand.name);
        if (!brandMap.has(slug)) brandMap.set(slug, p.brand.name);
      }
    }
    const orderedBrands: FilterOption[] = [{ label: 'Tất cả thương hiệu', val: 'all' }];
    if (Array.isArray(brands) && brands.length > 0) {
      for (const b of brands) {
        if (brandMap.has(b.slug)) {
          orderedBrands.push({ label: b.name, val: b.slug });
          brandMap.delete(b.slug);
        }
      }
    }
    for (const [val, label] of brandMap.entries()) {
      orderedBrands.push({ label, val });
    }

    return {
      type: orderedTypes,
      price: priceOptions,
      style: styleOptions,
      color: colorOptions,
      material: materialOptions,
      size: sizeOptions,
      brand: orderedBrands,
    };
  }, [categoryScopedPool, filterState, categories, brands]);

  // Tự động đặt lại bộ lọc con nếu giá trị đang chọn không còn tồn tại trong tập sản phẩm hiện tại
  useEffect(() => {
    if (selectedType !== 'all' && !facetedOptions.type.some((o) => o.val === selectedType)) {
      setSelectedType('all');
    }
    if (selectedPrice !== 'all' && !facetedOptions.price.some((o) => o.val === selectedPrice)) {
      setSelectedPrice('all');
    }
    if (selectedStyle !== 'all' && !facetedOptions.style.some((o) => o.val === selectedStyle)) {
      setSelectedStyle('all');
    }
    if (
      selectedColor !== 'all' &&
      !facetedOptions.color.some((o) => toSlug(o.val) === toSlug(selectedColor))
    ) {
      setSelectedColor('all');
    }
    if (
      selectedMaterial !== 'all' &&
      !facetedOptions.material.some((o) => o.val.toLowerCase() === selectedMaterial.toLowerCase())
    ) {
      setSelectedMaterial('all');
    }
    if (
      selectedSize !== 'all' &&
      !facetedOptions.size.some((o) => o.val.toLowerCase() === selectedSize.toLowerCase())
    ) {
      setSelectedSize('all');
    }
    if (selectedBrand !== 'all' && !facetedOptions.brand.some((o) => o.val === selectedBrand)) {
      setSelectedBrand('all');
    }
  }, [
    facetedOptions,
    selectedType,
    selectedPrice,
    selectedStyle,
    selectedColor,
    selectedMaterial,
    selectedSize,
    selectedBrand,
  ]);

  // Lọc sản phẩm cuối cùng theo danh mục và tất cả 7 bộ lọc ràng buộc chặt
  const displayProducts = useMemo(() => {
    const filtered = applyFacetedFilters(categoryScopedPool, filterState);
    return maxItems > 0 ? filtered.slice(0, maxItems) : filtered;
  }, [categoryScopedPool, filterState, maxItems]);

  // Render từng thẻ sản phẩm theo chuẩn Figma Ảnh 7 (Component 5: 298 Hug x 375) & Ảnh 8 (Frame 1000002744: 298 Fill x 59 Hug)
  const renderProductCard = (p: Product, idx: number) => {
    const displayPrice = p.sale_price || p.base_price || 11000000;
    const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);
    const isWishlisted = wishlistIds.includes(p.id);
    const productSlug = p.slug || String(p.id);
    const productUrl = `/products/${productSlug}`;
    const productColors = getProductColors(p);

    return (
      <div
        key={p.id || idx}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          window.location.href = productUrl;
        }}
        /* 
          Component 5 (Ảnh 7):
          - Flow: Vertical
          - Width: Hug (298px)
          - Height: Fixed (375px)
          - Radius: 4px
          - Padding Bottom: 16px
          - Gap: 32px
          - Color: #FDFDFD
        */
        className="group w-[298px] min-w-[260px] xl:min-w-[298px] max-w-[298px] h-[375px] shrink-0 rounded-[4px] p-[12px] pb-[16px] flex flex-col justify-between gap-[32px] bg-[#FDFDFD] border border-stone-200/60 hover:border-brand-500 hover:shadow-md transition-all duration-300 relative box-border cursor-pointer select-none"
      >
        {/* Khung ảnh sản phẩm + Nút Yêu thích & Giỏ hàng */}
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-[2px] bg-white">
          {/* Quick Actions (Trái tim & Giỏ hàng xếp dọc ở góc phải) */}
          <div className="absolute top-1 right-1 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(p);
              }}
              title={isWishlisted ? 'Bỏ thích' : 'Yêu thích'}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-2xs hover:scale-110 transition cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-stone-500 hover:text-rose-600'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(p);
              }}
              title="Thêm vào giỏ hàng"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-brand-50 text-stone-500 hover:text-brand-700 shadow-2xs hover:scale-110 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>

          {/* Ảnh sản phẩm căn giữa sắc nét */}
          <a
            href={productUrl}
            className="w-full h-full flex items-center justify-center cursor-pointer"
          >
            <img
              src={imageUrl}
              alt={p.name}
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80';
              }}
              className="max-h-[200px] w-auto max-w-full object-contain object-center transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              loading="lazy"
            />
          </a>
        </div>

        {/* 
          Frame 1000002744 (Ảnh 8): Khung nhỏ thông tin sản phẩm
          - Flow: Vertical
          - Width: Fill (298px)
          - Height: Hug (59px)
          - Padding: 8px
        */}
        <div className="w-full min-h-[59px] px-[8px] py-[2px] flex flex-col justify-between box-border">
          {/* Tên đơn hàng & Số tiền đơn hàng (Màu xanh lá #15803d theo Ảnh 8) */}
          <div className="flex items-baseline justify-between gap-1 w-full">
            <a
              href={productUrl}
              className="text-[13px] sm:text-sm font-medium text-stone-800 hover:text-brand-700 transition truncate max-w-[150px] cursor-pointer"
              title={p.name}
            >
              {p.name}
            </a>
            <span className="text-[14px] sm:text-[15px] font-bold text-[#15803d] shrink-0 font-sans">
              {displayPrice.toLocaleString('vi-VN')}{' '}
              <span className="text-[10px] font-semibold text-[#15803d]/90">VND</span>
            </span>
          </div>

          {/* Chấm tròn màu sắc thực tế theo đúng sản phẩm */}
          <div className="flex items-center gap-1.5 py-0.5 min-h-[14px]">
            {productColors.map((colorName, cIdx) => {
              const swatch = getColorSwatch(colorName);
              return (
                <span
                  key={cIdx}
                  title={swatch.name}
                  className={`w-2.5 h-2.5 rounded-full border ${swatch.border} ${swatch.ring || ''} shrink-0 transition-transform hover:scale-125`}
                  style={{ backgroundColor: swatch.bg }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    /* 
      Frame 1000003354 (Ảnh 1): Khung to nhất của Phòng trưng bày
      - Width: 1,440px
      - Height: 1,674px
      - Background: Gradient nhẹ có viền lá mờ 2 bên
    */
    <section
      id="frame-1000003354"
      className="w-full max-w-[1440px] mx-auto min-h-[1674px] relative py-6 sm:py-10 flex flex-col items-center justify-start box-border bg-gradient-to-b from-[#e8f7ee]/40 via-[#dcfce7]/20 to-[#e8f7ee]/50 rounded-[24px] overflow-hidden select-none"
      style={{ opacity: 1 }}
    >
      {/* 
        Frame 1000003313 (Ảnh 2): Khung chứa toàn bộ nội dung
        - Flow: Vertical
        - Width: Fixed (1,278px)
        - Height: Hug (1,719px)
        - Left: 81px (căn giữa trong 1440px)
        - Border: 1px
        - Padding: Top: 48px, Right: 24px, Bottom: 48px, Left: 24px
        - Gap: 48px
        - Colors: #FFFFFF 23% (Glassmorphism mờ nhẹ)
      */}
      <div
        id="frame-1000003313"
        className="w-full max-w-[1278px] min-h-[1600px] xl:min-h-[1719px] mx-auto p-[16px] sm:px-[24px] sm:py-[48px] flex flex-col gap-[36px] sm:gap-[48px] bg-white/[0.23] backdrop-blur-md rounded-[20px] border border-white/60 shadow-xs box-border"
      >
        {/* 
          Ảnh 3: Khung tiêu đề
          - Width: 578px Hug
          - Height: 96px Hug
        */}
        <div className="w-full max-w-[578px] min-h-[96px] mx-auto flex flex-col items-center justify-center text-center gap-2 box-border">
          <span className="text-sm sm:text-base font-semibold tracking-wider text-[#15803d] uppercase font-sans">
            MỖI KHÔNG GIAN MỘT CÂU CHUYỆN
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#15803d] uppercase font-sans underline underline-offset-8 decoration-2 decoration-[#15803d]">
            PHÒNG TRƯNG BÀY GÓC NHÀ ĐẸP
          </h2>
        </div>

        {/* 
          Menu Tabs: Thay thế danh mục phòng thành tất cả các danh mục sản phẩm của cửa hàng
          - Width: 1230px Fill
          - Height: 94px Hug
        */}
        <div className="w-full max-w-[1230px] min-h-[70px] sm:min-h-[94px] mx-auto flex items-center justify-around gap-2 sm:gap-6 overflow-x-auto box-border border-b border-stone-200/50 pb-2">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategory(tab)}
                className={`py-3 px-3 sm:px-6 text-sm sm:text-base transition-all relative whitespace-nowrap cursor-pointer font-sans ${
                  isActive
                    ? 'text-[#15803d] font-bold'
                    : 'text-stone-700 hover:text-[#15803d] font-medium'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#15803d] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* 
          Ảnh 5: Khung hiển thị bộ lọc & lưới 12 sản phẩm
          - Width: 1230px Fill
          - Height: 1243px Hug
        */}
        <div className="w-full max-w-[1230px] min-h-[1243px] mx-auto flex flex-col gap-6 box-border">
          {/* Thanh 8 nút bộ lọc (Figma Ảnh 5) — giữ toàn bộ 8 nút trên 1 hàng ngang trên desktop, không dùng overflow để không cắt dropdown */}
          <div className="w-full flex flex-wrap lg:flex-nowrap items-center gap-1.5 xl:gap-2 pb-2 pt-1 relative z-30 box-border">
            {/* Nút 1: Bộ lọc (Màu cam nổi bật) */}
            <button
              type="button"
              onClick={handleResetFilters}
              title={activeFiltersCount > 0 ? 'Nhấn để xóa tất cả bộ lọc' : 'Bộ lọc sản phẩm'}
              className={`px-2.5 xl:px-3 py-1.5 rounded-[4px] border text-[11px] xl:text-xs font-semibold flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none whitespace-nowrap ${
                activeFiltersCount > 0
                  ? 'border-amber-600 bg-amber-500 text-white hover:bg-amber-600'
                  : 'border-amber-500 bg-white text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Filter className={`w-3.5 h-3.5 ${activeFiltersCount > 0 ? 'text-white' : 'text-amber-600'}`} />
              <span>Bộ lọc</span>
              {activeFiltersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-amber-700 text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* 7 nút Dropdown ràng buộc lẫn nhau theo sản phẩm thực tế */}
            {(
              [
                {
                  key: 'type' as FilterKey,
                  fallback: 'Tất cả loại sản phẩm',
                  value: selectedType,
                  setter: setSelectedType,
                  options: facetedOptions.type,
                  menuWidth: 'w-56',
                  alignRight: false,
                },
                {
                  key: 'price' as FilterKey,
                  fallback: 'Tất cả mức giá',
                  value: selectedPrice,
                  setter: setSelectedPrice,
                  options: facetedOptions.price,
                  menuWidth: 'w-52',
                  alignRight: false,
                },
                {
                  key: 'style' as FilterKey,
                  fallback: 'Tất cả phong cách',
                  value: selectedStyle,
                  setter: setSelectedStyle,
                  options: facetedOptions.style,
                  menuWidth: 'w-56',
                  alignRight: false,
                },
                {
                  key: 'color' as FilterKey,
                  fallback: 'Tất cả màu sắc',
                  value: selectedColor,
                  setter: setSelectedColor,
                  options: facetedOptions.color,
                  menuWidth: 'w-56',
                  alignRight: false,
                },
                {
                  key: 'material' as FilterKey,
                  fallback: 'Tất cả chất liệu',
                  value: selectedMaterial,
                  setter: setSelectedMaterial,
                  options: facetedOptions.material,
                  menuWidth: 'w-72',
                  alignRight: false,
                },
                {
                  key: 'size' as FilterKey,
                  fallback: 'Tất cả kích thước',
                  value: selectedSize,
                  setter: setSelectedSize,
                  options: facetedOptions.size,
                  menuWidth: 'w-56',
                  alignRight: true,
                },
                {
                  key: 'brand' as FilterKey,
                  fallback: 'Tất cả thương hiệu',
                  value: selectedBrand,
                  setter: setSelectedBrand,
                  options: facetedOptions.brand,
                  menuWidth: 'w-52',
                  alignRight: true,
                },
              ] as const
            ).map((cfg) => {
              const isOpen = activeDropdown === cfg.key;
              const isSelected = cfg.value !== 'all';
              const activeOpt = cfg.options.find(
                (o) =>
                  cfg.key === 'color'
                    ? toSlug(o.val) === toSlug(cfg.value)
                    : o.val.toLowerCase() === cfg.value.toLowerCase()
              );
              const buttonLabel = activeOpt?.label || cfg.fallback;

              return (
                <div key={cfg.key} className="relative filter-dropdown-container shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : cfg.key)}
                    title={buttonLabel}
                    className={`px-2.5 xl:px-3 py-1.5 rounded-[4px] border text-[11px] xl:text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none whitespace-nowrap ${
                      isSelected
                        ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                        : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                    }`}
                  >
                    {activeOpt?.swatch && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full border shrink-0 ${activeOpt.swatch.border} ${activeOpt.swatch.ring || ''}`}
                        style={{ backgroundColor: activeOpt.swatch.bg }}
                      />
                    )}
                    <span className="max-w-[125px] xl:max-w-[145px] truncate">{buttonLabel}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#15803d]' : 'text-stone-400'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className={`absolute top-full ${
                        cfg.alignRight ? 'right-0 lg:right-0' : 'left-0'
                      } mt-1.5 ${cfg.menuWidth} max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50`}
                    >
                      {cfg.options.map((opt) => {
                        const checked =
                          cfg.key === 'color'
                            ? toSlug(opt.val) === toSlug(cfg.value)
                            : opt.val.toLowerCase() === cfg.value.toLowerCase();
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              cfg.setter(opt.val);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {opt.swatch && (
                                <span
                                  className={`w-3 h-3 rounded-full border shrink-0 ${opt.swatch.border} ${opt.swatch.ring || ''}`}
                                  style={{ backgroundColor: opt.swatch.bg }}
                                />
                              )}
                              <span className={`leading-snug ${checked ? 'font-bold text-[#15803d]' : ''}`}>
                                {opt.label}
                              </span>
                            </div>
                            {checked && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lưới sản phẩm responsive: Tối đa 4 cột x 3 hàng = 12 sản phẩm (Figma Ảnh 5 & 6) */}
          {displayProducts.length > 0 ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 box-border justify-items-center sm:justify-items-start">
              {displayProducts.map((p, idx) => renderProductCard(p, idx))}
            </div>
          ) : (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-white/40 rounded-xl border border-dashed border-stone-300">
              <Filter className="w-10 h-10 text-stone-400 stroke-1" />
              <p className="text-stone-700 font-medium text-base">
                Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 rounded-md bg-[#15803d] text-white text-xs font-semibold hover:bg-[#166534] transition shadow-xs cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Nút "Xem tất cả" màu xanh lá chuẩn Figma Ảnh 1 & 2 */}
        <div className="w-full flex items-center justify-center pt-2">
          <a
            href="/products"
            className="px-8 py-2.5 rounded-[4px] bg-[#15803d] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold tracking-wide transition shadow-xs hover:shadow-md cursor-pointer"
          >
            Xem tất cả
          </a>
        </div>
      </div>
    </section>
  );
}
