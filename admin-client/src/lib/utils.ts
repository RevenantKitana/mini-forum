import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decode HTML entities recursively to handle double-encoding
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  let decoded = text;
  let prevDecoded = '';
  
  // Keep decoding until no more changes (handles double/triple encoding)
  while (decoded !== prevDecoded) {
    prevDecoded = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x22;/g, '"')
      .replace(/&nbsp;/g, ' ');
  }
  
  return decoded;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return '';
  // Decode HTML entities before truncating
  const decoded = decodeHtmlEntities(text);
  if (decoded.length <= maxLength) return decoded;
  return decoded.slice(0, maxLength) + '...';
}
