# SPEC-004: Industrialización del Motor Batch v6.5 (RegTech)

## 🎯 Objetivo
Transformar el procesador de lotes básico en una herramienta de grado industrial capaz de manejar archivos CSV/TXT de forma dinámica, preservando la integridad de los datos originales del usuario y proporcionando diagnósticos detallados bajo el estándar de la Era 6.5.

## 🏗️ Arquitectura del Puente de Datos
- **Entrada**: Archivos CSV/TXT con delimitador auto-detectado.
- **Procesamiento**: Mapeo inteligente de cabeceras (`TIN`, `COUNTRY`, `HOLDER_TYPE`).
- **Persistencia**: Conservación de la estructura original de la línea para exportación espejo.
- **Salida**: CSV enriquecido con columnas de diagnóstico (`VALIDATION_STATUS`, `TIN_TYPE`, `ENGINE_MESSAGE`).

## ⚖️ Reglas de Negocio
1. **Prioridad de Voz**: El mensaje del plugin debe ser el diagnóstico principal.
2. **Preservación**: No se deben alterar las columnas originales del usuario.
3. **Seguridad de Tipos**: Eliminación de `any` en favor de discriminación por `switch`.
4. **Trazabilidad**: Registro automático en `AuditService` para cada ejecución masiva.

## 🛠️ Tecnologías
- TypeScript Strict.
- React Hooks (State Management).
- Unified Regulatory Service (Core Engine).
- Audit Service (Logging Industrial).
