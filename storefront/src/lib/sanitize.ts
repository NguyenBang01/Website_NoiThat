/**
 * Hàm làm sạch HTML an toàn cho cả môi trường Server (SSR) và Client (Browser).
 * Loại bỏ toàn bộ các thẻ độc hại (script, iframe, embed, object) và inline event handler (on*).
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript:[^"']*/gi, '');
}
