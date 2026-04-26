'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface IndustrialVirtualTableProps<T> {
  items: T[];
  totalItems: number;
  itemHeight: number;
  renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  onRangeChange?: (startIndex: number, endIndex: number) => void;
  className?: string;
  header?: React.ReactNode;
}

export function IndustrialVirtualTable<T>({
  items,
  totalItems,
  itemHeight,
  renderRow,
  onRangeChange,
  className,
  header
}: IndustrialVirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  const buffer = 5; 
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(totalItems - 1, Math.floor((scrollTop + containerHeight) / itemHeight) + buffer);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (onRangeChange) {
      onRangeChange(startIndex + 1, endIndex + 1);
    }
  }, [startIndex, endIndex, onRangeChange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = totalItems * itemHeight;

  return (
    <div className={`industrial-virtual-table ${className || ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flex: 1 }}>
      {header && <div className="virtual-table-header">{header}</div>}
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          position: 'relative',
          background: 'rgba(0,0,0,0.1)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Espaciador para el scroll real */}
        <div style={{ height: `${totalHeight}px`, width: '100%', pointerEvents: 'none' }} />
        
        {/* Contenedor de filas visibles */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          transform: `translateY(${startIndex * itemHeight}px)` 
        }}>
          {items.map((item, i) => {
            const globalIndex = startIndex + i;
            if (globalIndex > endIndex) return null;
            
            return renderRow(item, globalIndex, {
              height: `${itemHeight}px`,
              display: 'flex',
              alignItems: 'center'
            });
          })}
        </div>
      </div>
    </div>
  );
}
