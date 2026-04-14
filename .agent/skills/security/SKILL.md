---
name: 04-compliance-security
description: Blindaje criptográfico mediante Web Crypto API, cumplimiento Offline-First y protección de claves maestras.
---

# Compliance & Security - ABDFN Unified Suite (ERA 5)

## Propósito
Garantiza la integridad y confidencialidad absoluta de los archivos procesados en cualquier módulo, asegurando que toda la suite opere bajo un modelo de "Confianza Cero" (Zero-Knowledge).

## Capacidades Integradas

### 1. Estándares Criptográficos (Web Crypto SDK)
- **Algoritmos Modernos**: Implementa exclusivamente AES-GCM (256-bit) para cifrado simétrico mediante la **SubtleCrypto API**.
- **Derivación de Claves**: Uso obligatorio de PBKDF2 con salt dinámico para transformar la contraseña maestra del usuario en una clave de cifrado robusta.
- **IV Integrity**: Un Vector de Inicialización (IV) único por cada operación de cifrado para evitar ataques de repetición.

### 2. Privacidad Extrema (Offline Compliance)
- **Zero-Data Leak**: Auditoría técnica para asegurar que ninguna clave, buffer de archivo o metadato sea transmitido a través de la red (Local-Only processing).
- **Secure Contexts**: Verifica que la aplicación solo se ejecute en contextos seguros (HTTPS o localhost) para habilitar las APIs criptográficas del navegador.

### 3. Gestión de Claves (Password Safety)
- **Non-Persistent Passwords**: Las contraseñas maestras nunca deben persistirse en LocalStorage ni Cookies. Solo residen en la memoria volátil de la sesión.
- **Auto-Purge**: Implementa limpieza de memoria automática tras periodos de inactividad (ej. 5 min) o al desvincular archivos.

### 4. Mitigación de Ataques (Advanced Defense)
- **Injection Protection**: Auditoría obligatoria de cualquier renderizado dinámico en el DOM para prevenir **XSS**. Confirmación de que la arquitectura offline elimina el riesgo de **SQLi**.
- **Regex Guard**: Validación de que toda expresión regular sea lineal y eficiente, evitando patrones que puedan causar **ReDoS** (backtracking catastrófico).
- **Filename Integrity**: Sanitización obligatoria de nombres de archivos de salida para prevenir **Path Traversal** mediante la eliminación de caracteres de navegación (`..`, `/`, `\`).

## Workflow de Seguridad
1. **Evaluar Origen**: ¿El archivo cargado es válido? Validar estructura antes de cifrar.
2. **Derivación Segura**: Ejecutar PBKDF2 antes de cualquier mutación de datos.
3. **Audit de Entrada**: Sanitizar y escapar cualquier texto de usuario (sufijos, nombres de archivo) antes del procesamiento o renderizado.
4. **Cifrado/Descifrado**: Aplicar AES-GCM y generar el archivo resultante como un Blob descargable localmente.
5. **Log Auditor**: Registrar el éxito o fallo de la operación en la consola interna sin revelar datos sensibles.
