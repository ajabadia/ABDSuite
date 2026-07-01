/**
 * @purpose Proporciona una combinación de nombres de clase utilizando `clsx` y `tailwind-merge`.
 * @purpose_en Merges and combines class names using `clsx` and `tailwind-merge`.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1gv7yg5
 * @lastUpdated 2026-06-21T09:03:07.992Z
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
