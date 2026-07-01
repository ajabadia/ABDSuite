/**
 * @purpose Renderiza un componente etiqueta estilizado con nombres de clase opcionales y propiedades.
 * @purpose_en Renders a styled label component with optional class names and props.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:m48edq
 * @lastUpdated 2026-06-29T22:23:30.690Z
 */

import * as React from "react"
import { cn } from "../utils.js"

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
