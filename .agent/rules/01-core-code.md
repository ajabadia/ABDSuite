# 01-Core Code: Estándares Técnicos (Era 6.1)

## 1. TypeScript Strict Mode
- **tsconfig.json**: Debe tener `"strict": true`.
- **❌ Prohibido `: any`** en: core schemas, exported lib/services, logic processing.
- **✅ Obligatorio**: Tipos branded para IDs (`UnitId`, `OperatorId`, `RecordId`).
- **Arquitectura**: Clean Architecture (Layered) + Modular Bounded Contexts.

### 2. Estándar de Nomenclatura (Naming Convention)

👉 **100% Inglés en Capa de Datos**: Queda terminantemente prohibido el uso de castellano en llaves de Dexie, interfaces de tipos, nombres de stores o valores de enums técnicos.
👉 **Lower Camel Case**: Para todas las propiedades (`recordInternalId`, `operatorName`).
👉 **PascalCase**: Para Modelos, Clases e Interfaces (`AuditRecord`, `ReportingEntity`).
👉 **SNAKE_CASE**: Solo para constantes de configuración global o variables de entorno.

- **Zero-Backend Mandate**: Toda la lógica de procesamiento de datos debe residir exclusivamente en el cliente. Prohibido el uso de API Routes para procesamiento pesado de buffers o mutación de datos locales.
- **Inmutabilidad**: Prohibida la edición de registros de auditoría una vez persistidos.
- **Zod**: Requerido para validar estructuras de archivos cargados (JSON/CSV) y esquemas de persistencia en Dexie.

## 2. Zod Validation (Buffer Guard)
- Validar SIEMPRE la estructura de los datos antes de inyectarlos en el motor de procesamiento.
- **Domain Specific**: Validar `TIN` (Tax Identification Number) según reglas jurisdiccionales.
- Si falla → `throw ValidationError`.

## 3. Base de Datos (Dexie & Encrypted Adapter)
- **At-Rest Protection**: Toda operación de persistencia debe pasar por `EncryptedDbAdapter`. Jamás usar `Dexie` directamente para datos sensibles sin el motor de cifrado activo.
- **Universal UUIDs**: Uso obligatorio de UUIDs (v4) para IDs primarios para garantizar la portabilidad entre instalaciones.
- **Store Isolation**: Separación estricta de stores por dominio (`records`, `operators`, `audit_logs`, `config`).

## 4. Structured Logging (Audit Station)
- **MANDATORIO**: Uso de `AuditService` para registrar acciones críticas (`AUTH`, `RBAC`, `DATA`, `SYSTEM`).
- **PII Awareness**: El logger debe asegurar que datos PII no se almacenen en texto claro en logs de sistema, solo referencias o hashes si es necesario.
- **Correlation ID**: Generar un ID único por sesión de procesamiento para trazar eventos relacionados.

## 5. Performance & Memory Safety
- **Buffer Hygiene**: Limpiar buffers de memoria (`ArrayBuffer`, `Blob`) inmediatamente después de su uso.
- **Batch Processing**: Usar procesadores en lotes para evitar bloqueos del Main Thread en el navegador.
- **Web Workers**: Implementar lógica de cifrado/descifrado pesado en Web Workers cuando sea posible.

## 6. Document Generation (Letter Station)
- **GAWEB Parity**: Toda plantilla generada debe ser validada contra los requisitos de paridad visual y estructural del estándar v1.
- **Template Safety**: Sanitización de inputs antes de la inyección en `docxtemplater` o `handlebars`.
