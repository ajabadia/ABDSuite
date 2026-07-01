"use client"

/**
 * @purpose Gestiona y renderiza un componente de diálogo utilizando primitives de UI Radix.
 * @purpose_en Manages and renders a dialog component using Radix UI primitives.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:0,imports:5,sig:dbpzve
 * @lastUpdated 2026-06-29T22:23:24.172Z
 */

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { DialogPortal, DialogOverlay } from "./dialog-primitives.js"
import { DialogContent } from "./dialog-content.js"
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./dialog-elements.js"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
