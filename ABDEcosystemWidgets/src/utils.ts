/**
 * @purpose Proporciona una forma de combinar nombres de clase utilizando `clsx` y `tailwind-merge`.
 * @purpose_en Merges and combines class names using `clsx` and `tailwind-merge`.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:mt3gra
 * @lastUpdated 2026-06-21T14:27:55.055Z
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
