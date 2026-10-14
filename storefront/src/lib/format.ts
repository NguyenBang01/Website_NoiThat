import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Định dạng tiền VND số nguyên chuẩn (VD: 12.800.000 ₫)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng ngày giờ: dd/MM/yyyy HH:mm
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

/**
 * Định dạng ngày: dd/MM/yyyy
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Chuyển đường dẫn tương đối từ backend thành URL đầy đủ
 */
export function imgUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Tính phần trăm giảm giá: VD 12.000.000 -> 9.600.000 = -20%
 */
export function calculateDiscountPercent(
  originalPrice: number,
  salePrice: number | null | undefined
): number {
  if (!salePrice || salePrice >= originalPrice || originalPrice <= 0) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function getProductImage(url: string | null | undefined, categoryName?: string): string {
  if (url) {
    return imgUrl(url);
  }
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('sofa')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80';
  }
  if (cat.includes('ghế') || cat.includes('ghe')) {
    return 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=600&auto=format&fit=crop&q=80';
  }
  if (cat.includes('giường') || cat.includes('giuong')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80';
  }
  if (cat.includes('bàn') || cat.includes('ban')) {
    return 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=600&auto=format&fit=crop&q=80';
  }
  if (cat.includes('đèn') || cat.includes('den')) {
    return 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80';
}

