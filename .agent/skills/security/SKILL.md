---
name: 04-compliance-security
description: Blindaje criptográfico mediante Web Crypto API, cumplimiento Offline-First y protección de claves maestras.
---

# Compliance & Security - ABDFN Unified Suite (ERA 6.1)

## Propósito
Garantiza la integridad y confidencialidad absoluta de los archivos procesados, asegurando que toda la suite opere bajo un modelo de "Confianza Cero" (Zero-Knowledge) y blindaje at-rest.

## Capacidades Integradas

### 1. Estándares Criptográficos (Industrial Web Crypto)
- **Algoritmos Modernos**: Implementación exclusiva de AES-GCM (256-bit) para cifrado simétrico.
- **Derivación de Claves**: Uso obligatorio de PBKDF2 (100,000+ iteraciones) con salt dinámico.
- **Installation Key (IK)**: Validación de la llave de instalación antes de habilitar el motor criptográfico.

### 2. Privacidad Extrema (Offline Compliance)
- **Zero-Data Leak**: Asegurar que ninguna clave, buffer o metadato sea transmitido a la red.
- **EncryptedDbAdapter**: Persistencia obligatoria bajo el motor de cifrado de base de datos local.

### 3. Gestión de Claves (Memory Safety)
- **Non-Persistent Passwords**: Las contraseñas maestras solo residen en memoria volátil.
- **Auto-Purge**: Limpieza automática de claves y buffers tras inactividad.

### 4. Mitigación de Ataques
- **Injection Protection**: Sanitización de inputs y escape de renders dinámicos.
- **Regex Guard**: Prevención de ReDoS mediante validación de eficiencia.
- **Filename Integrity**: Sanitización de nombres de archivo para prevenir Path Traversal.

## Workflow de Seguridad
1. **Validar IK**: Confirmar estado del motor criptográfico.
2. **Derivación Segura**: Ejecutar PBKDF2 para derivar claves de sesión.
3. **Audit de Entrada**: Sanitizar y validar estructura de datos.
4. **Cifrado/Descifrado**: Aplicar AES-GCM y gestionar IVs únicos.
5. **Log Auditor**: Registrar éxito/fallo en el sistema de auditoría forense sin revelar datos sensibles.
