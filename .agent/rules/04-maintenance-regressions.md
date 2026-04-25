# 04-Maintenance & Regressions: Calidad Industrial (Era 6.1)

## 1. Estrategia de Testing Offline-First
- **Unit Tests (Jest)**: Base obligatoria para servicios de criptografía, transformación ETL y lógica de validación jurisdiccional.
- **Dexie Integration Tests**: Verificación de esquemas y migraciones de base de datos local. Uso de `dexie-memory-bridge` para tests rápidos.
- **Offline Compliance Audit**: Pruebas automatizadas para asegurar que los servicios de procesamiento no realizan peticiones de red externas (Zero-Data Leak).
- **Parity Testing**: Comparación de documentos generados por la `Letter Station` contra el estándar maestro GAWEB v1.

## 2. Portabilidad e Integridad de Datos
- **Universal Portability Standard**: Pruebas de exportación e importación de datos industriales para asegurar que los registros se transfieren sin colisiones de UUIDs.
- **Backup Integrity**: Validación de sumas de comprobación (Checksums) y firmas en archivos de backup generados por el sistema.
- **Migration Guards**: Toda actualización de esquema en Dexie debe incluir un script de migración verificado para evitar pérdida de datos at-rest.

## 3. Clean Architecture y SOLID
- **Shell & Modules Pattern**: Mantener el desacoplamiento estricto entre el motor central (Shell) y las estaciones de trabajo (Modules).
- **Dependency Inversion**: Los módulos deben depender de interfaces de servicios (ej: `ICryptoService`), permitiendo el mockeo fácil para tests.
- **Logic Isolation**: Prohibido mezclar lógica de UI con lógica de procesamiento de buffers.

## 4. Documentación de Decisiones (ADRs)
- **Architecture Decision Records**: Registro mandatorio del "por qué" de las decisiones arquitectónicas en `.brain/adr/`.
- **Era Versioning**: Documentar qué cambios pertenecen a cada Era (ej: Transición Era 5 -> Era 6.1).
- **Technical Manuals**: Mantener actualizados los manuales de integración para operadores y técnicos.

## 5. Mantenibilidad del Estándar Aseptic
- **Boy Scout Rule**: Refactorización constante de componentes que no cumplan con el estándar visual Aseptic v6.1 (marcar con bordes de auditoría si es necesario).
- **Visual Regression**: Asegurar que los cambios en `tokens.css` o `base.css` no afecten negativamente a la visualización industrial de otros módulos.
- **Code Reviews**: Enfoque especial en la gestión de memoria y el cierre de recursos (File handles, database connections).

## 6. Observabilidad Local (System Audit)
- **Log Fidelity**: Asegurar que los logs capturados por `AuditService` proporcionan suficiente información forense para diagnosticar fallos en entornos sin conexión.
- **Self-Diagnostic Tools**: Implementar herramientas internas para verificar la integridad de la base de datos y el estado de la **Installation Key**.
