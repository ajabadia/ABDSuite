/**
 * @purpose Gestiona funciones de utilidad para nombres de clases en componentes de estilo.
 * @purpose_en Manages utility functions for class names in style components.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:2y1qfd
 * @lastUpdated 2026-06-23T23:26:33.672Z
 */

/**
 * Shared utility helpers for style components
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
