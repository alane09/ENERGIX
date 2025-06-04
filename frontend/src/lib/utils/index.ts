import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine class names with Tailwind CSS
 * @param inputs Class names to combine
 * @returns Combined class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a localized string
 * @param date Date to format
 * @param locale Locale to use for formatting (default: 'fr-FR')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale = 'fr-FR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a number to a localized string
 * @param value Number to format
 * @param locale Locale to use for formatting (default: 'fr-FR')
 * @param options Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale = 'fr-FR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a currency value
 * @param value Currency value to format
 * @param currency Currency code (default: 'EUR')
 * @param locale Locale to use for formatting (default: 'fr-FR')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency = 'EUR',
  locale = 'fr-FR'
): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency,
  });
}

/**
 * Generate a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Truncate a string to a specified length
 * @param str String to truncate
 * @param length Maximum length (default: 50)
 * @param suffix Suffix to add to truncated string (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, length = 50, suffix = '...'): string {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Capitalize the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Download a file from a Blob
 * @param blob Blob to download
 * @param filename Filename to use
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get file extension from filename
 * @param filename Filename
 * @returns File extension (lowercase, without dot)
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if a file is an image
 * @param filename Filename or extension
 * @returns True if the file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.includes('.') ? getFileExtension(filename) : filename.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

/**
 * Get MIME type from file extension
 * @param extension File extension (without dot)
 * @returns MIME type
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
