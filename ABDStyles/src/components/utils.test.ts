import { describe, it, expect } from 'vitest';
import { cn } from './utils.js';

describe('components/utils.ts (cn)', () => {
  it('should join plain class name strings together', () => {
    const result = cn('class1', 'class2', 'class-name-3');
    expect(result).toBe('class1 class2 class-name-3');
  });

  it('should handle and filter falsy values correctly', () => {
    const result = cn('class1', null, undefined, 'class2', '', false, 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should resolve conditional object classes correctly', () => {
    const result = cn('base-class', {
      'conditional-active': true,
      'conditional-inactive': false,
    });
    expect(result).toBe('base-class conditional-active');
  });

  it('should support arrays of classes including nested arrays', () => {
    const result = cn(['c1', 'c2'], ['c3', { c4: true, c5: false }]);
    expect(result).toBe('c1 c2 c3 c4');
  });

  it('should resolve conflicting Tailwind CSS classes correctly using twMerge', () => {
    // px-2 and py-1 conflict with p-4, so p-4 should overwrite them
    const resultPadding = cn('px-2 py-1', 'p-4');
    expect(resultPadding).toBe('p-4');

    // text-red-500 conflicts with text-blue-600, blue should win
    const resultColor = cn('text-red-500', 'text-blue-600');
    expect(resultColor).toBe('text-blue-600');
  });
});
