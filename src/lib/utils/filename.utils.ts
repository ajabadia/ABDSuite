/**
 * Filename Sanitization Utility
 * Compliance: 04-compliance-security (Advanced Defense)
 */

/**
 * Sanitizes a filename to prevent path traversal and remove forbidden characters.
 * @param filename The original filename
 * @param replacement Character to replace invalid ones with (default: '_')
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string, replacement: string = '_'): string {
  if (!filename) return 'unnamed_file';

  // 1. Remove control characters and reserved characters across OSs
  // Forbidden in Windows: < > : " / \ | ? *
  // Forbidden in Unix: / (and NULL)
  let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, replacement);

  // 2. Prevent path traversal (..)
  sanitized = sanitized.replace(/\.\.+/g, replacement);

  // 3. Trim and ensure it's not empty after sanitization
  sanitized = sanitized.trim();
  
  if (sanitized === '.' || sanitized === '..') {
    return 'invalid_name';
  }

  return sanitized || 'unnamed_file';
}
