export interface ColorSwatchInfo {
  name: string;
  bg: string;
  border: string;
  ring?: string;
}

/**
 * Ánh xạ tên màu tiếng Việt thành mã màu CSS hex và kiểu viền chuẩn
 */
export function getColorSwatch(colorName: string): ColorSwatchInfo {
  const norm = (colorName || '').toLowerCase().trim();

  // Trắng / Trắng xanh / Trắng ngọc trai / Sứ
  if (norm.includes('trắng xanh')) {
    return { name: colorName, bg: '#dbeafe', border: 'border-sky-300' };
  }
  if (norm.includes('trắng ngọc trai') || norm.includes('trắng') || norm.includes('white') || norm.includes('sứ')) {
    return { name: colorName, bg: '#ffffff', border: 'border-stone-300', ring: 'ring-1 ring-stone-200' };
  }

  // Be / Kem
  if (norm.includes('be') || norm.includes('kem') || norm.includes('beige')) {
    return { name: colorName, bg: '#e5dacf', border: 'border-amber-200' };
  }

  // Nâu / Nâu óc chó / Da bò / Nâu họa tiết
  if (norm.includes('óc chó') || norm.includes('walnut')) {
    return { name: colorName, bg: '#4a2c11', border: 'border-stone-700' };
  }
  if (norm.includes('gỗ tự nhiên') || norm.includes('oak') || norm.includes('beech')) {
    return { name: colorName, bg: '#c2854e', border: 'border-amber-600/40' };
  }
  if (norm.includes('nâu') || norm.includes('nau') || norm.includes('da bò') || norm.includes('taupe')) {
    return { name: colorName, bg: '#78350f', border: 'border-amber-900/40' };
  }

  // Đen
  if (norm.includes('đen') || norm.includes('den') || norm.includes('black')) {
    return { name: colorName, bg: '#18181b', border: 'border-stone-900' };
  }

  // Xám / Ghi
  if (norm.includes('xám trắng')) {
    return { name: colorName, bg: '#e2e8f0', border: 'border-stone-300' };
  }
  if (
    norm.includes('xám') ||
    norm.includes('xam') ||
    norm.includes('ghi') ||
    norm.includes('grey') ||
    norm.includes('gray') ||
    norm.includes('greymist') ||
    norm.includes('titanium')
  ) {
    return { name: colorName, bg: '#9ca3af', border: 'border-stone-400' };
  }

  // Xanh rêu
  if (norm.includes('rêu') || norm.includes('moss')) {
    return { name: colorName, bg: '#3f6212', border: 'border-lime-800' };
  }

  // Xanh lá
  if (norm.includes('lá') || norm.includes('green')) {
    return { name: colorName, bg: '#16a34a', border: 'border-emerald-600' };
  }

  // Xanh dương / Bầu trời / Powder Blue
  if (norm.includes('bầu trời') || norm.includes('powder blue') || norm.includes('sky')) {
    return { name: colorName, bg: '#7dd3fc', border: 'border-sky-400' };
  }
  if (norm.includes('xanh') || norm.includes('blue')) {
    return { name: colorName, bg: '#0284c7', border: 'border-sky-600' };
  }

  // Vàng / Vàng đồng
  if (norm.includes('đồng') || norm.includes('vàng') || norm.includes('gold')) {
    return { name: colorName, bg: '#d97706', border: 'border-amber-500' };
  }

  // Hồng / Đỏ
  if (norm.includes('hồng') || norm.includes('pink') || norm.includes('rosy')) {
    return { name: colorName, bg: '#f472b6', border: 'border-pink-300' };
  }
  if (norm.includes('đỏ') || norm.includes('red')) {
    return { name: colorName, bg: '#dc2626', border: 'border-red-500' };
  }

  // Cam
  if (norm.includes('cam') || norm.includes('orange')) {
    return { name: colorName, bg: '#ea580c', border: 'border-orange-500' };
  }

  // Mặc định trung tính
  return { name: colorName, bg: '#cbd5e1', border: 'border-stone-300' };
}

const UNACCENTED_COLOR_LABELS: Record<string, string> = {
  den: 'Đen',
  nau: 'Nâu',
  trang: 'Trắng',
  xam: 'Xám',
  hong: 'Hồng',
  xanh: 'Xanh',
  be: 'Be',
  'vang dong': 'Vàng đồng',
};

function colorMergeKey(c: string): string {
  return (c || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuẩn hóa nhãn màu hiển thị (ví dụ "Den" -> "Đen", "Nau" -> "Nâu")
 */
export function normalizeColorLabel(raw: string): string {
  const trimmed = (raw || '').replace(/\s+/g, ' ').trim();
  const key = colorMergeKey(trimmed);
  if (!/[^\x00-\x7F]/.test(trimmed) && UNACCENTED_COLOR_LABELS[key]) {
    return UNACCENTED_COLOR_LABELS[key];
  }
  return trimmed;
}

/**
 * Trích xuất danh sách màu thực tế duy nhất từ sản phẩm (từ colors hoặc variants), gộp màu trùng không dấu
 */
export function getProductColors(p: { colors?: string[]; variants?: Array<{ color?: string | null }> }): string[] {
  const seen = new Map<string, string>();

  const addColor = (raw?: string | null) => {
    if (!raw || typeof raw !== 'string') return;
    const cleaned = normalizeColorLabel(raw);
    const key = colorMergeKey(cleaned);
    if (!cleaned || key === 'sfs' || key === 'fdfe' || key === 'dfdf') return;

    const existing = seen.get(key);
    // Ưu tiên bản có dấu tiếng Việt nếu đã có bản không dấu
    if (!existing || (!/[^\x00-\x7F]/.test(existing) && /[^\x00-\x7F]/.test(cleaned))) {
      seen.set(key, cleaned);
    }
  };

  if (Array.isArray(p.colors)) {
    for (const c of p.colors) addColor(c);
  }

  if (seen.size === 0 && Array.isArray(p.variants)) {
    for (const v of p.variants) addColor(v.color);
  }

  return Array.from(seen.values());
}
