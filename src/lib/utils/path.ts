/**
 * Path Utilities for ABDFN Encryptor
 */

/**
 * Sanitizes a filename or suffix to prevent path traversal attacks.
 * Replaces slashes and backslashes with underscores and reduces multiple dots.
 */
export const sanitizeFileName = (name: string): string => {
  if (!name) return '';
  return name.replace(/[\\/]/g, '_').replace(/\.\.+/g, '.');
};
