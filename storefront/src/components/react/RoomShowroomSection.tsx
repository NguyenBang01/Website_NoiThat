import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { Heart, ShoppingBag, Filter, ChevronDown, Check, X } from 'lucide-react';
import type { Product, Category } from '../../types';
import { getProductImage } from '../../lib/format';
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
  initialCategory?: string;
  initialQuery?: string;
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

// Các tùy chọn bộ lọc thực tế tương tác
const TYPE_OPTIONS = [
  { label: 'Tất cả loại sản phẩm', val: 'all' },
  { label: 'Bàn ăn / Bàn làm việc', val: 'ban' },
  { label: 'Ghế & Armchair', val: 'ghe' },
  { label: 'Sofa phòng khách', val: 'sofa' },
  { label: 'Giường ngủ', val: 'giuong' },
  { label: 'Tủ & Kệ', val: 'tu-ke' },
  { label: 'Đèn chiếu sáng', val: 'den' },
  { label: 'Đồ trang trí & Decor', val: 'decor' },
];

const PRICE_OPTIONS = [
  { label: 'Tất cả mức giá', val: 'all' },
  { label: 'Dưới 2 triệu', val: 'under2m' },
  { label: 'Từ 2 - 5 triệu', val: '2m-5m' },
  { label: 'Từ 5 - 10 triệu', val: '5m-10m' },
  { label: 'Từ 10 - 20 triệu', val: '10m-20m' },
  { label: 'Trên 20 triệu', val: 'over20m' },
];

const STYLE_OPTIONS = [
  { label: 'Tất cả phong cách', val: 'all' },
  { label: 'Hiện đại (Modern)', val: 'modern' },
  { label: 'Bắc Âu (Scandinavian)', val: 'nordic' },
  { label: 'Tối giản (Minimalist)', val: 'minimalist' },
  { label: 'Tân cổ điển / Luxury', val: 'luxury' },
  { label: 'Tự nhiên / Mộc', val: 'natural' },
];

const COLOR_OPTIONS = [
  { label: 'Tất cả màu sắc', val: 'all', dot: null },
  { label: 'Trắng / Sứ', val: 'trang', dot: 'bg-white border border-stone-300' },
  { label: 'Xám / Greymist', val: 'xam', dot: 'bg-stone-400' },
  { label: 'Nâu gỗ / Da bò', val: 'nau', dot: 'bg-amber-800' },
  { label: 'Đen / Titanium', val: 'den', dot: 'bg-stone-900' },
  { label: 'Xanh lam / Pastel Blue', val: 'xanh', dot: 'bg-sky-500' },
  { label: 'Hồng / Rosy', val: 'hong', dot: 'bg-pink-400' },
];

const MATERIAL_OPTIONS = [
  { label: 'Tất cả chất liệu', val: 'all' },
  { label: 'Gỗ sồi / Gỗ tự nhiên', val: 'go' },
  { label: 'Da bò cao cấp', val: 'da' },
  { label: 'Vải nỉ / Fabric', val: 'vai' },
  { label: 'Kim loại / Hợp kim', val: 'kim-loai' },
  { label: 'Mây đan tự nhiên', val: 'may' },
  { label: 'Sứ / Thủy tinh', val: 'su-thuy-tinh' },
];

const SIZE_OPTIONS = [
  { label: 'Tất cả kích thước', val: 'all' },
  { label: 'Nhỏ / Dưới 1m4', val: 'mini' },
  { label: 'Tiêu chuẩn (1m6 - 1m8)', val: 'standard' },
  { label: 'Cỡ lớn / Trên 2m (Góc L, 8 chỗ)', val: 'large' },
];

const BRAND_OPTIONS = [
  { label: 'Tất cả thương hiệu', val: 'all' },
  { label: 'Góc Nhà Đẹp', val: 'goc-nha-dep' },
  { label: 'Savona', val: 'savona' },
  { label: 'Victoria Home', val: 'victoria' },
  { label: 'Coastal Living', val: 'coastal' },
  { label: 'Home Decor VN', val: 'home-decor-vn' },
];

export default function RoomShowroomSection({
  products = [],
  categories = [],
  initialCategory = '',
  initialQuery = '',
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

  // Lọc sản phẩm theo danh mục và tất cả 7 bộ lọc
  const displayProducts = useMemo(() => {
    let pool = Array.isArray(products) && products.length > 0 ? products : SHOWROOM_DEFAULT_PRODUCTS;

    // 1. Lọc theo Danh mục sản phẩm (Category Tabs)
    if (selectedCategory !== 'Tất cả') {
      const catSlug = toSlug(selectedCategory);
      const matchedCat = categories?.find(
        (c) => toSlug(c.name) === catSlug || c.slug === catSlug
      );

      pool = pool.filter((p) => {
        // Khớp category_id nếu có
        if (matchedCat && p.category_id && p.category_id === matchedCat.id) return true;
        if (matchedCat && p.category?.id && p.category.id === matchedCat.id) return true;

        // Khớp category name hoặc slug
        const cName = toSlug(p.category?.name || '');
        const cSlug = toSlug(p.category?.slug || '');
        if (cName.includes(catSlug) || cSlug.includes(catSlug) || catSlug.includes(cName) || catSlug.includes(cSlug)) return true;

        // Khớp tên sản phẩm
        const pName = toSlug(p.name || '');
        if (pName.includes(catSlug)) return true;

        // Nhóm từ khóa danh mục
        if (catSlug.includes('ban')) return pName.includes('ban') || cName.includes('ban');
        if (catSlug.includes('ghe')) return pName.includes('ghe') || cName.includes('ghe');
        if (catSlug.includes('sofa')) return pName.includes('sofa') || cName.includes('sofa');
        if (catSlug.includes('giuong')) return pName.includes('giuong') || cName.includes('giuong');
        if (catSlug.includes('tu') || catSlug.includes('ke')) return pName.includes('tu') || pName.includes('ke') || cName.includes('tu') || cName.includes('ke');
        if (catSlug.includes('den')) return pName.includes('den') || cName.includes('den');
        if (catSlug.includes('trang-tri') || catSlug.includes('decor')) return pName.includes('trang-tri') || pName.includes('binh') || pName.includes('decor') || cName.includes('trang-tri');
        return false;
      });
    }

    // 2. Lọc theo Loại sản phẩm (Type Dropdown)
    if (selectedType !== 'all') {
      const typeSlug = toSlug(selectedType);
      pool = pool.filter((p) => {
        const pName = toSlug(p.name || '');
        const cName = toSlug(p.category?.name || '');
        const sDesc = toSlug(p.short_desc || p.short_description || '');
        if (typeSlug === 'ban') return pName.includes('ban') || cName.includes('ban');
        if (typeSlug === 'ghe') return pName.includes('ghe') || pName.includes('armchair') || cName.includes('ghe');
        if (typeSlug === 'sofa') return pName.includes('sofa') || cName.includes('sofa');
        if (typeSlug === 'giuong') return pName.includes('giuong') || cName.includes('giuong');
        if (typeSlug === 'tu-ke') return pName.includes('tu') || pName.includes('ke') || cName.includes('tu') || cName.includes('ke');
        if (typeSlug === 'den') return pName.includes('den') || cName.includes('den');
        if (typeSlug === 'decor') return pName.includes('decor') || pName.includes('trang-tri') || pName.includes('binh') || cName.includes('trang-tri');
        return pName.includes(typeSlug) || cName.includes(typeSlug) || sDesc.includes(typeSlug);
      });
    }

    // 3. Lọc theo Giá
    if (selectedPrice !== 'all') {
      pool = pool.filter((p) => {
        const pr = p.sale_price || p.base_price || 0;
        if (selectedPrice === 'under2m') return pr < 2000000;
        if (selectedPrice === '2m-5m') return pr >= 2000000 && pr <= 5000000;
        if (selectedPrice === '5m-10m') return pr >= 5000000 && pr <= 10000000;
        if (selectedPrice === '10m-20m') return pr >= 10000000 && pr <= 20000000;
        if (selectedPrice === 'over20m') return pr > 20000000;
        return true;
      });
    }

    // 4. Lọc theo Phong cách
    if (selectedStyle !== 'all') {
      const styleSlug = toSlug(selectedStyle);
      pool = pool.filter((p) => {
        const sDesc = toSlug(p.short_desc || p.short_description || p.description || '');
        const pName = toSlug(p.name || '');
        if (styleSlug === 'modern') return sDesc.includes('hien dai') || sDesc.includes('modern') || pName.includes('coastal') || pName.includes('jupiter') || pName.includes('moretti');
        if (styleSlug === 'nordic') return sDesc.includes('bac au') || sDesc.includes('nordic') || pName.includes('skagen') || pName.includes('bridge');
        if (styleSlug === 'minimalist') return sDesc.includes('toi gian') || sDesc.includes('minimal') || pName.includes('maxine') || pName.includes('acrylic') || pName.includes('pio');
        if (styleSlug === 'luxury') return sDesc.includes('co dien') || sDesc.includes('luxury') || sDesc.includes('sang trong') || pName.includes('victoria') || pName.includes('elanoire') || pName.includes('maison') || pName.includes('cameo') || pName.includes('ona');
        if (styleSlug === 'natural') return sDesc.includes('tu nhien') || sDesc.includes('moc') || pName.includes('may') || pName.includes('oak');
        return sDesc.includes(styleSlug) || pName.includes(styleSlug);
      });
    }

    // 5. Lọc theo Màu sắc
    if (selectedColor !== 'all') {
      const colorSlug = toSlug(selectedColor);
      pool = pool.filter((p) => {
        if (Array.isArray(p.colors) && p.colors.some(c => toSlug(c).includes(colorSlug) || colorSlug.includes(toSlug(c)))) {
          return true;
        }
        if (Array.isArray(p.variants) && p.variants.some(v => v.color && toSlug(v.color).includes(colorSlug))) {
          return true;
        }
        const pName = toSlug(p.name || '');
        const sDesc = toSlug(p.short_desc || p.short_description || p.description || '');
        if (colorSlug === 'trang') return pName.includes('trang') || pName.includes('white') || sDesc.includes('trang') || sDesc.includes('su trang') || sDesc.includes('kem');
        if (colorSlug === 'xam') return pName.includes('grey') || pName.includes('xam') || pName.includes('ghi') || pName.includes('greymist') || pName.includes('titanium');
        if (colorSlug === 'nau') return pName.includes('nau') || pName.includes('da bo') || pName.includes('taupe') || sDesc.includes('nau') || pName.includes('oak');
        if (colorSlug === 'den') return pName.includes('den') || pName.includes('black') || sDesc.includes('den') || pName.includes('elanoire');
        if (colorSlug === 'xanh') return pName.includes('green') || pName.includes('blue') || pName.includes('coastal') || sDesc.includes('xanh');
        if (colorSlug === 'hong') return pName.includes('hong') || pName.includes('rosy') || pName.includes('pink') || pName.includes('pastel');
        return pName.includes(colorSlug) || sDesc.includes(colorSlug);
      });
    }

    // 6. Chất liệu
    if (selectedMaterial !== 'all') {
      const matSlug = toSlug(selectedMaterial);
      pool = pool.filter((p) => {
        if (Array.isArray(p.variants) && p.variants.some(v => v.material && toSlug(v.material).includes(matSlug))) {
          return true;
        }
        const sDesc = toSlug(p.short_desc || p.short_description || p.description || '');
        const pName = toSlug(p.name || '');
        if (matSlug === 'go') return pName.includes('go') || pName.includes('oak') || sDesc.includes('go') || sDesc.includes('oak');
        if (matSlug === 'da') return pName.includes('da') || sDesc.includes('da bo') || sDesc.includes('da that');
        if (matSlug === 'vai') return pName.includes('vai') || pName.includes('fabric') || sDesc.includes('vai') || sDesc.includes('ni');
        if (matSlug === 'kim-loai') return pName.includes('kim loai') || pName.includes('thep') || sDesc.includes('kim loai') || sDesc.includes('dong');
        if (matSlug === 'may') return pName.includes('may') || sDesc.includes('may');
        if (matSlug === 'su-thuy-tinh') return pName.includes('su') || pName.includes('thuy tinh') || sDesc.includes('su') || sDesc.includes('gom');
        return sDesc.includes(matSlug) || pName.includes(matSlug);
      });
    }

    // 7. Kích thước
    if (selectedSize !== 'all') {
      const sizeSlug = toSlug(selectedSize);
      pool = pool.filter((p) => {
        const sDesc = toSlug(p.short_desc || p.short_description || '');
        const pName = toSlug(p.name || '');
        if (sizeSlug === 'mini') {
          return pName.includes('mini') || pName.includes('1m2') || pName.includes('1m4') || pName.includes('ban lam viec') || pName.includes('armchair') || pName.includes('den ban');
        }
        if (sizeSlug === 'standard') {
          return pName.includes('1m6') || pName.includes('1m8') || pName.includes('3 cho') || pName.includes('6 cho') || pName.includes('bridge');
        }
        if (sizeSlug === 'large') {
          return pName.includes('2m') || pName.includes('2m2') || pName.includes('2m9') || pName.includes('8 cho') || pName.includes('goc') || pName.includes('skagen') || pName.includes('cameo');
        }
        return true;
      });
    }

    // 8. Thương hiệu
    if (selectedBrand !== 'all') {
      const brandSlug = toSlug(selectedBrand);
      pool = pool.filter((p) => {
        const bName = toSlug(p.brand?.name || '');
        const pName = toSlug(p.name || '');
        const sDesc = toSlug(p.short_desc || p.short_description || '');
        if (brandSlug === 'goc-nha-dep') return true;
        if (brandSlug === 'savona') return pName.includes('savona') || bName.includes('savona') || sDesc.includes('savona');
        if (brandSlug === 'home-decor-vn') return bName.includes('home-decor') || pName.includes('decor') || pName.includes('savona');
        if (brandSlug === 'victoria') return pName.includes('victoria');
        if (brandSlug === 'coastal') return pName.includes('coastal');
        return bName.includes(brandSlug) || pName.includes(brandSlug) || sDesc.includes(brandSlug);
      });
    }

    // Tuyệt đối KHÔNG lặp lại sản phẩm nếu số lượng ít (VD: chỉ có 1 đèn thì hiển thị đúng 1 đèn)
    // Tối đa 12 sản phẩm trên trang chủ
    return pool.slice(0, 12);
  }, [
    products,
    categories,
    selectedCategory,
    selectedType,
    selectedPrice,
    selectedStyle,
    selectedColor,
    selectedMaterial,
    selectedSize,
    selectedBrand,
  ]);

  // Render từng thẻ sản phẩm theo chuẩn Figma Ảnh 7 (Component 5: 298 Hug x 375) & Ảnh 8 (Frame 1000002744: 298 Fill x 59 Hug)
  const renderProductCard = (p: Product, idx: number) => {
    const displayPrice = p.sale_price || p.base_price || 11000000;
    const imageUrl = getProductImage(p.image || p.images?.[0]?.url, p.category?.name);
    const isWishlisted = wishlistIds.includes(p.id);
    const productSlug = p.slug || String(p.id);
    const productUrl = `/products/${productSlug}`;

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

          {/* 5 chấm tròn màu sắc theo đúng Ảnh 8 */}
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full border border-stone-300 bg-white ring-1 ring-stone-200" />
            <span className="w-2.5 h-2.5 rounded-full border border-pink-300 bg-[#fbcfe8]" />
            <span className="w-2.5 h-2.5 rounded-full border border-emerald-300 bg-[#a7f3d0]" />
            <span className="w-2.5 h-2.5 rounded-full border border-stone-300 bg-[#e5e7eb]" />
            <span className="w-2.5 h-2.5 rounded-full border border-stone-800 bg-[#1c1917]" />
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
          {/* Thanh 8 nút bộ lọc (Figma Ảnh 5) */}
          <div className="w-full flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 relative box-border">
            {/* Nút 1: Bộ lọc (Màu cam nổi bật) */}
            <button
              type="button"
              onClick={handleResetFilters}
              title={activeFiltersCount > 0 ? 'Nhấn để xóa tất cả bộ lọc' : 'Bộ lọc sản phẩm'}
              className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
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

            {/* Nút 2: Loại sản phẩm */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedType !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{TYPE_OPTIONS.find((t) => t.val === selectedType)?.label || 'Loại sản phẩm'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'type' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'type' && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => {
                        setSelectedType(t.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className={selectedType === t.val ? 'font-bold text-[#15803d]' : ''}>{t.label}</span>
                      {selectedType === t.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút 3: Giá */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedPrice !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{PRICE_OPTIONS.find((p) => p.val === selectedPrice)?.label || 'Giá'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'price' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'price' && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {PRICE_OPTIONS.map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setSelectedPrice(p.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className={selectedPrice === p.val ? 'font-bold text-[#15803d]' : ''}>{p.label}</span>
                      {selectedPrice === p.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút 4: Phong cách */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedStyle !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{STYLE_OPTIONS.find((s) => s.val === selectedStyle)?.label || 'Phong cách'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'style' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'style' && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {STYLE_OPTIONS.map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => {
                        setSelectedStyle(s.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className={selectedStyle === s.val ? 'font-bold text-[#15803d]' : ''}>{s.label}</span>
                      {selectedStyle === s.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút 5: Màu sắc */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedColor !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{COLOR_OPTIONS.find((c) => c.val === selectedColor)?.label || 'Màu sắc'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'color' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'color' && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {c.dot && <span className={`w-3 h-3 rounded-full shrink-0 ${c.dot}`} />}
                        <span className={selectedColor === c.val ? 'font-bold text-[#15803d]' : ''}>{c.label}</span>
                      </div>
                      {selectedColor === c.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút 6: Chất liệu */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'material' ? null : 'material')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedMaterial !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{MATERIAL_OPTIONS.find((m) => m.val === selectedMaterial)?.label || 'Chất liệu'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'material' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'material' && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {MATERIAL_OPTIONS.map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => {
                        setSelectedMaterial(m.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className={selectedMaterial === m.val ? 'font-bold text-[#15803d]' : ''}>{m.label}</span>
                      {selectedMaterial === m.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút 7: Kích thước */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedSize !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{SIZE_OPTIONS.find((s) => s.val === selectedSize)?.label || 'Kích thước'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'size' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'size' && (
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => {
                        setSelectedSize(s.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className={selectedSize === s.val ? 'font-bold text-[#15803d]' : ''}>{s.label}</span>
                      {selectedSize === s.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút 8: Thương hiệu */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')}
                className={`px-3.5 py-1.5 rounded-[4px] border text-xs font-medium flex items-center gap-1.5 shrink-0 transition shadow-2xs cursor-pointer select-none ${
                  selectedBrand !== 'all'
                    ? 'border-[#15803d] bg-[#ecfaeb] text-[#15803d] font-bold'
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-[#15803d] hover:text-[#15803d]'
                }`}
              >
                <span>{BRAND_OPTIONS.find((b) => b.val === selectedBrand)?.label || 'Thương hiệu'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'brand' ? 'rotate-180 text-[#15803d]' : 'text-stone-400'}`} />
              </button>
              {activeDropdown === 'brand' && (
                <div className="absolute top-full right-0 lg:left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {BRAND_OPTIONS.map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(b.val);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-[#ecfaeb] hover:text-[#15803d] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className={selectedBrand === b.val ? 'font-bold text-[#15803d]' : ''}>{b.label}</span>
                      {selectedBrand === b.val && <Check className="w-3.5 h-3.5 text-[#15803d] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
