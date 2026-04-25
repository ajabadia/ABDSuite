# 03-Governance & Security: Blindaje Industrial (Era 6.1)

## 1. Modelo de Confianza Cero (Zero-Knowledge)
- **Offline Integrity**: Ninguna clave maestra, buffer de archivo o dato PII debe salir del entorno local del cliente.
- **Mem-Only Passwords**: Las contraseñas de desbloqueo jamás deben persistirse en `LocalStorage`, `Cookies` o `IndexedDB` en texto claro. Deben residir únicamente en la memoria volátil de la sesión.
- **Secure Context Only**: La suite solo es plenamente funcional en contextos seguros (`HTTPS` o `localhost`) para habilitar la `WebCrypto API`.

## 2. Crypt Station & Vaults
- **Installation Key (IK)**: Es el ancla de confianza. El acceso a los datos de la unidad está bloqueado hasta que el administrador maestro desbloquea el motor criptográfico mediante la IK.
- **Derivación PBKDF2**: Uso obligatorio de PBKDF2 con al menos 100,000 iteraciones y salt dinámico para la generación de claves de cifrado.
- **AES-256-GCM Integrity**: Todo cifrado de datos at-rest debe usar AES en modo GCM para garantizar tanto la confidencialidad como la integridad de los datos (mediante Authentication Tag).
- **IV Management**: Un Vector de Inicialización (IV) único y aleatorio debe generarse para cada operación de cifrado.

## 3. Control de Acceso (RBAC Industrial)
- **ADMIN**: Gobierno total de la instalación, gestión de operadores y desbloqueo de la **Installation Key**.
- **TECH**: Diseño de modelos (ETL, LETTER), ejecución de procesos y acceso a herramientas de auditoría técnica.
- **OPERATOR**: Ejecución de flujos diarios definidos (cifrar, generar documentos) sin acceso a la configuración estructural.
- **Permission Enforcement**: Uso obligatorio de `PermissionsService` para validar la capacidad del operador antes de ejecutar acciones en estaciones de trabajo.

## 4. Auditoría Técnica y Supervisión Forense
- **Audit Station**: Registro obligatorio de eventos críticos categorizados en `AUTH`, `RBAC`, `CONFIG`, `DATA` y `SYSTEM`.
- **Forensic Logs**: Los logs deben incluir metadatos técnicos (timestamp, unitId, operatorId, actionType) sin exponer el contenido sensible de los datos procesados.
- **Tamper Evidence**: El sistema debe alertar sobre inconsistencias en los IVs o fallos de integridad durante el descifrado de bóvedas.

## 5. Protección de Datos PII y Privacidad
- **Automatic Masking**: Los componentes de la interfaz deben enmascarar automáticamente campos sensibles (TINs, nombres completos) a menos que el operador tenga permisos explícitos de visualización.
- **Buffer Cleansing**: Implementar purga automática de buffers de archivos cargados tras periodos de inactividad o al cerrar la sesión de trabajo.
- **Sanitización de Salida**: Todo documento generado en la `Letter Station` debe pasar por un proceso de sanitización de metadatos para evitar fugas de información oculta.
