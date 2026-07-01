"use client"

/**
 * @purpose Proporciona.
 * @purpose_en Exports `DialogPortal` and `DialogOverlay` from the Radix UI library for use in dialog components.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:0,imports:1,sig:18xa867
 * @lastUpdated 2026-06-29T22:23:21.615Z
 */

import { Dialog as DialogPrimitive } from "radix-ui"

const DialogPortal = DialogPrimitive.Portal
const DialogOverlay = DialogPrimitive.Overlay

export { DialogPortal, DialogOverlay }
