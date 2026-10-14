import sanitize from 'sanitize-html';

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return sanitize(dirty, {
    allowedTags: [
      'p', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'br', 'hr', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      '*': ['class', 'style', 'id']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.href && !attribs.href.startsWith('/')) {
          attribs.target = '_blank';
          attribs.rel = 'noopener noreferrer';
        }
        return { tagName, attribs };
      }
    }
  });
}
