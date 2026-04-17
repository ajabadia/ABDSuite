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
  if (!filename) return 'ABDFN_GEN_UNNAMED';

  // 1. Remove control characters and reserved characters across OSs
  // Forbidden in Windows: < > : " / \ | ? *
  // Forbidden in Unix: / (and NULL)
  let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, replacement);

  // 2. Prevent path traversal (..)
  sanitized = sanitized.replace(/\.\.+/g, replacement);

  // 3. Prevent hidden files (Unix starts with .)
  if (sanitized.startsWith('.')) {
    sanitized = 'DATA' + sanitized;
  }

  // 4. Trace-back and Trim
  sanitized = sanitized.trim();
  
  if (sanitized === '.' || sanitized === '..') {
    return 'ABDFN_GEN_UNNAMED';
  }

  // 5. Length Limit (Industrial legacy often limits to 255 or even 40)
  const MAX_LENGTH = 120;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized || 'ABDFN_GEN_UNNAMED';
}
