# 📐 ESPECIFICACIÓN TÉCNICA: Modelo Multitenant y Flujo SSO (ABDAuth)

Este documento especifica la arquitectura de datos, el flujo de autenticación federada (SSO) y el comportamiento dinámico del Dashboard Launcher en la suite de aplicaciones de **ABD**.

> [!IMPORTANT]
> **Requisito de Construcción**: Todo el desarrollo de código resultante de esta especificación (tanto en `ABDAuth` como en los satélites) debe cumplir estrictamente con los estándares estéticos, de linters y de arquitectura descritos en el archivo [PROMPT_UNIFICADO_DESARROLLO.md](file:///d:/desarrollos/ABD-Suite-DOCS/PROMPT_UNIFICADO_DESARROLLO.md). Ejecutar el script `abd-audit.ps1` local antes de cada commit.

---

## 💾 1. Especificación del Modelo de Datos (MongoDB / Mongoose)

El modelo de datos federado en la base de datos de `ABDAuth` se compondrá de tres entidades principales interrelacionadas.

### A. Modelo `Tenant` (Organizaciones/Academias)
Representa a cada organización cliente de la plataforma. Controla las aplicaciones licenciadas y su personalización visual.
```typescript
// Schema Mongoose
const TenantSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true }, // Ej: 'academia-alfa'
  name: { type: String, required: true },                           // Ej: 'Academia Alfa'
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  allowedApps: [{ type: String }],                                  // Ej: ['quiz', 'gobernanza']
  branding: {
    logoUrl: { type: String, default: '' },
    theme: {
      primaryColor: { type: String, default: '210 100% 50%' },      // Variable HSL
      accentColor: { type: String, default: '180 100% 50%' }
    }
  }
}, { timestamps: true });
```

### B. Modelo `User` (Membresías y Roles)
El usuario posee membresías dinámicas asociadas a uno o más Tenants, cada una con un rol y estado específicos.
```typescript
// Schema Mongoose
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  
  // Mapeo multitenant
  tenants: [{
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    role: { type: String, enum: ['owner', 'admin', 'student'], default: 'student' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    appPermissions: [{ type: String }] // Opcional para permisos finos, ej: ['quiz:write']
  }]
}, { timestamps: true });
```

### C. Catálogo de Aplicaciones (Configuración Estática en código o Colección)
```typescript
interface Application {
  id: string;          // Ej: 'quiz', 'gobernanza'
  name: string;        // Ej: 'ABD Quiz', 'Tenant Governance'
  urlPattern: string;  // Patrón de subdominio: 'https://{tenant}.quiz.tudominio.com'
  icon: string;        // Nombre del icono de Lucide
}
```

---

## 🔑 2. Diseño del Flujo SSO (Single Sign-On)

El flujo de inicio de sesión federado entre los satélites y `ABDAuth` se resolverá mediante un mecanismo basado en cookies seguras o redirección con Tokens JWT firmados.

### El Token JWT (Payload Estándar de la Suite)
El JWT emitido por `ABDAuth` debe contener la siguiente estructura de *claims* para evitar consultas a base de datos en los satélites:
```json
{
  "sub": "usr_912389123",
  "email": "student@academia-alfa.com",
  "name": "Alex J.",
  "tenantId": "academia-alfa",
  "role": "student",
  "permissions": ["quiz:read"],
  "iat": 1716123456,
  "exp": 1716130656
}
```

---

## 🖥️ 3. El Launcher de Aplicaciones (`/dashboard` en `ABDAuth`)

Una vez que un usuario inicia sesión directamente en `ABDAuth` sin un callback satélite específico, será redirigido al panel central:

1.  **Paso 1: Selector de Tenant (si pertenece a más de uno):**
    *   Si el usuario tiene múltiples membresías en su array `tenants`, se muestra un modal/pantalla de estilo militar/técnico para seleccionar el Tenant activo.
2.  **Paso 2: Renderizado del Grid del Launcher:**
    *   A partir del Tenant seleccionado, se listan las aplicaciones permitidas en `allowedApps` para dicho Tenant.
    *   Se dibuja un grid táctil de alta densidad utilizando los componentes del chasis `@abd/styles`.
    *   Cada tarjeta calcula su URL destino inyectando el slug del Tenant en el patrón de la aplicación (ej: `https://academia-alfa.quiz.tudominio.com`).
    *   El click de la tarjeta redirige al usuario pasándole el token JWT de sesión para el inicio de sesión automático.

---

## 📊 4. Registro de Auditoría y Logs (Alineación con ABDLogs)

Para asegurar que todos los eventos de autenticación, SSO y gestión de Tenants puedan ser migrados y consumidos de forma transparente por la futura aplicación centralizada de logs (`ABDLogs`), los desarrolladores de `ABDAuth` deben implementar el registro de auditoría siguiendo estrictamente la misma estructura de esquema (`IAuditLog`) empleada en `ABDtenantGobernance`:

### Acciones a Auditar
*   `USER_LOGIN`: Inicio de sesión exitoso.
*   `USER_LOGOUT`: Cierre de sesión.
*   `SSO_HANDSHAKE_GRANTED`: Handshake de redirección SSO exitoso hacia un satélite.
*   `SSO_HANDSHAKE_DENIED`: Intento de acceso denegado a un satélite (ej. aplicación no licenciada para el tenant o rol insuficiente).
*   `TENANT_CREATED` / `TENANT_UPDATED` / `TENANT_SUSPENDED`: Modificaciones sobre la entidad Tenant.

### Estructura del Objeto de Log (Mongoose)
Los eventos deben registrarse en una colección local `audit_auth_ops` utilizando la siguiente estructura:
```typescript
interface IAuditLog {
  tenantId: string;                     // Slug del tenant (ej: 'academia-alfa') o 'SYSTEM'
  action: 
    | 'USER_LOGIN' 
    | 'USER_LOGOUT' 
    | 'SSO_HANDSHAKE_GRANTED' 
    | 'SSO_HANDSHAKE_DENIED'
    | 'TENANT_CREATED'
    | 'TENANT_UPDATED'
    | 'TENANT_SUSPENDED';
  entityType: 'USER' | 'TENANT' | 'SSO';
  entityId: string;                     // ID de la entidad afectada (UserId, TenantId, etc.)
  userId: string;                       // ID del usuario que ejecuta la acción
  userEmail: string;                    // Email del usuario que ejecuta la acción
  changedFields: Record<string, unknown>; // Metadatos del evento (ej: app de destino, parámetros HTTP)
  previousState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;                     // Autogenerado por timestamp
}
```

---

## 🛰️ 5. Especificación y Contrato de Seguridad en Aplicaciones Satélites

Para garantizar la inmunidad y la protección ante accesos cruzados entre Tenants, todas las aplicaciones satélite deben implementar el siguiente contrato de seguridad. En la práctica, **toda esta lógica compleja se delega y consume a través del SDK centralizado `@abd/satellite-sdk`**, permitiendo que la "carcasa" clonada de la aplicación mantenga el código limpio (DRY) y seguro.

### A. Firma y Validación Criptográfica (Contrato de Sesión)
*   **Especificación**: Las cookies de sesión (`abd_session`) no almacenan datos en texto plano. Contienen un token JWT criptográficamente firmado por `ABDAuth`.
*   **Garantía**: Cada acceso debe descifrar y validar la firma digital del JWT utilizando la clave compartida `AUTH_JWT_SECRET` mediante la librería `jose`.
*   **Implementación en Satélite**: La aplicación no escribe algoritmos de validación; importa `getIndustrialSession()` y `ensureIndustrialAccess(role)` del SDK, las cuales retornan el perfil validado o lanzan excepciones de seguridad de forma automática.

### B. Aislamiento y Mapeo de Subdominios (Cross-Tenant Guard)
*   **Especificación**: Las aplicaciones satélite deben inferir el slug del Tenant resolviendo el subdominio de la petición en la cabecera (ej: `academia-alfa.quiz.tudominio.com` -> `academia-alfa`).
*   **Filtro Cruzado**: Al validar la sesión, la aplicación debe comprobar que el `tenantId` codificado en el payload del JWT coincida **exactamente** con el subdominio desde el cual se realiza la solicitud. Si un alumno autenticado en `academia-alfa` intenta entrar a `academia-beta.quiz.tudominio.com`, se debe invalidar el acceso y redirigir inmediatamente a `ABDAuth` bajo el nuevo tenant para evitar la contaminación de datos.
*   **Implementación en Satélite**: El middleware perimetral del satélite (`src/proxy.ts`) se decora usando `withIndustrialAuth(options)` del SDK, el cual intercepta el flujo de peticiones, analiza el subdominio y ejecuta el Cross-Tenant Guard de forma transparente.

### C. Aislamiento Físico en Consultas de Base de Datos
*   **Especificación**: Todas las consultas a colecciones multi-tenant (ej. exámenes en `ABDQuiz`, espacios en `ABDtenantGobernance`) deben incluir siempre de forma explícita el filtro del Tenant activo resuelto a partir del token de la sesión validada:
    ```typescript
    const tenantId = session.user.tenantId;
    const exams = await Exam.find({ tenantId });
    ```
*   **Garantía**: Esto asegura que, aunque compartan la misma colección o base de datos física, un tenant jamás pueda acceder a registros pertenecientes a otro.

---

## 📐 6. Pautas para el Equipo de Desarrollo

*   **Tipado Mongoose:** No utilizar `any` al interactuar con modelos. Definir interfaces TypeScript estrictas para `ITenant`, `IUser` e `IAuditLog`.
*   **Contenedores UI:** Utilizar estrictamente el contenedor `<main>` con paddings uniformes de la suite (`p-6 md:p-12`) y el wrapper de ancho limitado (`max-w-7xl mx-auto`).
*   **Colores y Bordes:** Las esquinas de los botones del selector de Tenants deben ser `rounded-none`. Los colores de estado (activo/suspendido) deben usar `text-primary` o `text-destructive` en lugar de clases de colores locales (como `text-red-500`).

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md]]
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDAuth.md]]
	* [[grafos/ABDSatelliteSDK.md]]
