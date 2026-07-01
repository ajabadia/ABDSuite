'use client';

/**
 * @purpose Gestiona un componente progreso personalizable con estilos dinámicos.
 * @purpose_en Manages a customizable progress bar component with dynamic styling.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:0,imports:3,sig:1dpokyv
 * @lastUpdated 2026-06-21T09:01:34.994Z
 */

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Extracting dynamic logic into a dedicated constant to ensure architectural purity.
  const dynamicStyle = { 
    "--progress-translate": `-${100 - (value || 0)}%` 
  } as React.CSSProperties;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all [transform:translateX(var(--progress-translate))]"
        style={dynamicStyle}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
