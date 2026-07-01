'use client';

/**
 * @purpose Renderiza un componente tooltip personalizado que muestra datos de carga con etiquetas y formato opcional.
 * @purpose_en Renders a custom tooltip component that displays payload data with labels and optional formatting.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:u6fopg
 * @lastUpdated 2026-06-21T09:12:57.733Z
 */

import React from 'react';

export interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-card border border-border backdrop-blur-md rounded-none text-[10px] font-mono select-none pointer-events-none z-20">
        <p className="font-bold text-primary mb-1 uppercase tracking-widest">{label}</p>
        {payload.map((item, index) => {
          let valueString = String(item.value);
          if (typeof item.value === 'number' && item.value > 100000000) {
            valueString = `${(item.value / 1024 / 1024 / 1024).toFixed(2)} GB`;
          }
          const colorClass = 
            index === 0 ? 'text-sky-500' :
            index === 1 ? 'text-emerald-500' :
            index === 2 ? 'text-amber-500' :
            index === 3 ? 'text-red-500' : 'text-violet-500';
          return (
            <p key={index} className={`tracking-tight uppercase ${colorClass}`}>
              {item.name ? `${item.name}: ` : ''}
              {valueString}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};
