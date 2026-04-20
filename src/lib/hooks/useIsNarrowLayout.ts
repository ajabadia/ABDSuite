'use client';
import { useEffect, useState } from 'react';

/**
 * Industrial Hook for detecting narrow viewports (Phase 15).
 * Useful for switching between dense table views and master-detail mobile layouts.
 */
export function useIsNarrowLayout(maxWidth = 900) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);

    const update = () => setIsNarrow(mq.matches);
    
    // Initial check
    update();

    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [maxWidth]);

  return isNarrow;
}
