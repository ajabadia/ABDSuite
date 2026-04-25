# Regulatory TIN Plugins (Sync-Plug)

Deposite aquí los archivos `xx-tin.ts` copiados directamente del proyecto `ABDFATCACRS`.

## Estándar de Integración

Para que un archivo sea reconocido automáticamente, debe seguir este patrón:
1. Nombre del archivo: `[iso-code]-tin.ts` (ej: `es-tin.ts`).
2. Exportar una función de validación siguiendo la interfaz `TinValidatorPlugin`.

```typescript
import { HolderMetadata, TinValidationType, TinValidationResult } from '../../types/regulatory.types';

export const validateXXTIN = (value: string, type: TinValidationType, metadata?: HolderMetadata): boolean | TinValidationResult => {
    // ...
}
```
