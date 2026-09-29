import DOMPurify from 'isomorphic-dompurify';

/**
 * Standard allowed HTML tags for user content (Markdown / Rich text)
 */
export const ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'a',
  'p',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'del',
  'br',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

/**
 * Standard allowed HTML attributes
 */
export const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'target',
  'rel',
  'class',
  'loading',
  'width',
  'height',
];

/**
 * Sanitize rich text / Markdown content with DOMPurify
 * Strips dangerous tags (<script>, <iframe>, <object>, <embed>, etc.) and event handlers (onerror, onload, onclick, etc.)
 */
export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strip all HTML tags completely for plain text fields (title, username, display_name, tag names, etc.)
 */
export function sanitizeText(dirty?: string | null): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Helper to sanitize array of post blocks
 */
export function sanitizeBlocks<T extends { type: string; content?: string | null }>(blocks?: T[] | null): T[] {
  if (!blocks || !Array.isArray(blocks)) return [];
  return blocks.map((block) => {
    if (block.type === 'TEXT' && block.content) {
      return {
        ...block,
        content: sanitizeHtml(block.content),
      };
    }
    return block;
  });
}
