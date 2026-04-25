# Standard Patterns: Era 6.1 (Industrial Core)

Este documento define los patrones de implementación obligatorios para garantizar la coherencia arquitectónica en la suite.

## 1. Client-Side Service Pattern
Toda la lógica de negocio debe residir en clases de servicio dentro de `src/lib/services/`. Siga esta estructura para métodos asíncronos:

```typescript
import { AuditService } from './AuditService';
import { PermissionsService } from './permissions';
import { AppError, ValidationError } from '../errors/AppError';
import { db } from '../db/EncryptedDbAdapter';

export class DataProcessorService {
    static async processRecord(recordId: string, operatorContext: OperatorContext) {
        const correlationId = crypto.randomUUID();
        
        try {
            // 1. RBAC Check
            await PermissionsService.enforce('DATA', 'PROCESS', operatorContext);

            // 2. Data Retrieval (Encrypted Context)
            const record = await db.records.get(recordId);
            if (!record) throw new ValidationError('Record not found');

            // 3. Domain Logic
            const result = await this.logicEngine(record);

            // 4. Persistence
            await db.records.update(recordId, { ...result, lastProcessed: new Date() });

            // 5. Industrial Audit Log
            await AuditService.logEvent({
                category: 'DATA',
                action: 'PROCESS_SUCCESS',
                correlationId,
                operatorId: operatorContext.id,
                metadata: { recordId }
            });

            return { success: true, correlationId };

        } catch (error) {
            // 6. Unified Error Handling & Logging
            const appError = error instanceof AppError ? error : new AppError('Unexpected error during processing');
            
            await AuditService.logEvent({
                category: 'SYSTEM',
                action: 'PROCESS_FAILURE',
                correlationId,
                level: 'ERROR',
                metadata: { error: appError.message, recordId }
            });

            throw appError;
        }
    }
}
```

## 2. Industrial Error Taxonomy
- **❌ Prohibido**: `throw new Error()` genérico.
- **✅ Obligatorio**: Usar subclases de `AppError`:
    - `ValidationError`: Fallos de esquema o datos de entrada.
    - `SecurityError`: Fallos de IK, Vault o Permisos.
    - `DatabaseError`: Errores en el motor IndexedDB/Dexie.
    - `ComplianceError`: Fallos en reglas jurisdiccionales (TIN, etc).
    - `FileError`: Problemas con buffers, blobs o plantillas docx.

## 3. Logging & Terminal Output
- **AuditService**: Para persistencia forense en la base de datos de auditoría.
- **LogConsole**: Para feedback en tiempo real al operador durante procesos largos.
- **❌ Prohibido**: `console.log` en producción. Toda salida debe estar mediada por el sistema de logs de la suite.

## 4. UI State Management (Wizards)
- **Step Isolation**: Cada paso del wizard debe manejar su propio estado local.
- **Progressive Validation**: No permitir avanzar al siguiente paso (`Step`) sin validación exitosa del actual mediante Zod.
- **Clean Dismount**: Limpiar ObjectURLs y buffers al cerrar o cambiar de módulo.

## 5. Criptografía en Reposo
- Jamás realizar una consulta `db.table.put()` con datos sensibles sin asegurar que el motor de cifrado de `EncryptedDbAdapter` está desbloqueado.
- Usar el patrón `await vault.unlock(password)` antes de iniciar cualquier sesión de trabajo que requiera acceso a datos blindados.
