---
name: security-privacy-standard
description: Blindaje criptográfico mediante Web Crypto API, cumplimiento Offline-First y protección PII.
version: 2.1 (Industrial Aseptic Edition)
---

# Security & Privacy Standard: ABDFN Industrial

Este skill define los protocolos para asegurar la confidencialidad absoluta (Zero-Knowledge) y el blindaje criptográfico At-Rest de la suite.

## ⚡ Cuándo activar
- Al implementar funciones de cifrado/descifrado o manejo de archivos sensibles.
- Durante el diseño de esquemas de base de datos o flujos de auditoría.
- En cualquier proceso que involucre PII (Información de Identificación Personal).

## ⚖️ Leyes de Hierro (Security Laws)

### 1. Estándares Criptográficos
- **AES-GCM (256-bit)**: Único estándar aceptado para cifrado simétrico. Requiere un IV (Vector de Inicialización) único por operación.
- **PBKDF2**: Obligatorio para derivar claves de contraseñas. Mínimo 100,000 iteraciones con salt dinámico.
- **Root of Trust**: El acceso a los datos depende de la **Installation Key (IK)**.

### 2. Privacidad (Zero-Knowledge)
- **Zero-Data Leak**: Prohibido transmitir claves, buffers o metadatos sensibles por la red.
- **Non-Persistent Passwords**: Prohibido guardar contraseñas o claves maestras en `localStorage` o Cookies. Memoria volátil únicamente.
- **PII Masking**: Datos sensibles en logs de auditoría global DEBEN ser enmascarados o anonimizados.

### 3. Mitigación de Ataques
- **Regex Guard**: Validar que las expresiones regulares sean lineales para evitar **ReDoS**.
- **Path Traversal**: Sanitizar nombres de archivos (eliminar `..`, `/`, `\`).
- **CSV Injection**: Sanitizar campos de exportación que comiencen con `=`, `+`, `-`, `@`.

## 🛠️ Workflow de Seguridad
1. **Validar Contexto**: Asegurar ejecución en `Secure Context`.
2. **Derivación/Apertura**: Validar IK y derivar llaves de sesión.
3. **Procesamiento Aséptico**: Ejecutar operaciones criptográficas con auto-purga de buffers tras finalizar.
4. **Auditoría Forense**: Registrar el evento en el sistema de auditoría cumpliendo con la anonimización de PII.

---
**Status**: ENFORCED. Zero-Knowledge Compliance.
