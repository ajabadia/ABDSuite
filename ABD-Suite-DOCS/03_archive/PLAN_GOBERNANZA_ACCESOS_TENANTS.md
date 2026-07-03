# 📐 PLAN DE DESARROLLO: Gobernanza de Accesos (Usuarios, Tenants y Aplicaciones)

Este documento especifica los cambios de código, bases de datos y diseño visual que deben implementar de manera coordinada los equipos de **ABDAuth**, **ABDtenantGovernance** y las **Aplicaciones Satélite** para dar soporte al modelo de licenciamiento y control de accesos cruzados.

---

## 🎯 1. Objetivo y Reglas de Negocio
El objetivo es gobernar qué aplicaciones están disponibles en cada Tenant (Licenciamiento) y qué usuarios tienen acceso a qué aplicaciones dentro de cada Tenant (Autorización contextual).

### Reglas a implementar:
1.  **Licenciamiento (Tenant ↔ App)**: Un tenant solo puede ofrecer aplicaciones que tenga licenciadas.
2.  **Membresía Múltiple (User ↔ Tenant)**: Un usuario puede pertenecer a varios tenants con distintos roles.
3.  **Autorización Cruzada (User ↔ Tenant ↔ App)**: Un usuario puede tener acceso a una aplicación en el Tenant A, pero no tener acceso a la misma aplicación en el Tenant B.
4.  **Filtro Dinámico de UI**: Al administrar a un usuario, el listado de aplicaciones asignables para un tenant debe estar limitado por las aplicaciones licenciadas de dicho tenant.

---

## 💾 2. Especificación de Base de Datos (Modelos Mongoose)

### A. Modificaciones en `ABDtenantGovernance` (Colección: `tenants`)
Se añade la propiedad `allowedApps` para registrar las aplicaciones licenciadas:
```typescript
// En el modelo Tenant de ABDtenantGovernance
const TenantSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  
  // APLICACIONES LICENCIADAS PARA EL TENANT
  allowedApps: [{ type: String }], // Ej: ['quiz', 'elevators']
  
  branding: {
    logoUrl: { type: String, default: '' },
    theme: {
      primaryColor: { type: String, default: '210 100% 50%' },
      accentColor: { type: String, default: '180 100% 50%' }
    }
  }
}, { timestamps: true });
```

### B. Modificaciones en `ABDAuth` (Colección: `users`)
Se reestructura el array de `tenants` dentro del usuario para encapsular las aplicaciones habilitadas en cada membresía:
```typescript
// En el modelo User de ABDAuth
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  
  tenants: [{
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    role: { type: String, enum: ['owner', 'admin', 'student'], default: 'student' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    
    // APLICACIONES PERMITIDAS PARA ESTE USUARIO DENTRO DE ESTE TENANT
    allowedApps: [{ type: String }] // Debe ser un subconjunto de Tenant.allowedApps
  }]
}, { timestamps: true });
```

---

## 💻 3. Requerimientos de Desarrollo por Aplicación

### 🏢 3.1. En `ABDtenantGovernance` (Control Plane)
El equipo de gobernanza debe desarrollar la consola para configurar las licencias de las organizaciones.

#### Tareas a Programar:
1.  **Formulario de Tenant (`/admin/tenants/[id]`)**:
    *   Agregar un panel de selección de aplicaciones usando un listado de checkboxes.
    *   Las aplicaciones disponibles deben cargarse de una constante global del sistema (ej: `['auth', 'quiz', 'gobernanza', 'elevators']`).
2.  **Server Action / API**:
    *   Crear la lógica para guardar el array `allowedApps` en el documento del Tenant.
3.  **Auditoría**:
    *   Registrar un evento `TENANT_UPDATED` en `ABDLogs` detallando en `changedFields` los cambios realizados sobre `allowedApps`.

---

### 🔑 3.2. En `ABDAuth` (IdP & Directory)
El equipo de identidad debe desarrollar la consola de membresías y el control estricto de acceso durante el SSO.

#### Tareas a Programar:
1.  **Formulario de Usuario (`/dashboard/users/[id]`)**:
    *   En la sección de gestión de membresías de tenants, para cada tenant asociado al usuario, mostrar un sub-panel con checkboxes de aplicaciones.
    *   **Comportamiento Dinámico**: Este sub-panel debe rellenarse consultando previamente las `allowedApps` de ese Tenant en la base de datos. No se pueden mostrar ni marcar aplicaciones que el tenant no tenga licenciadas.
2.  **Servicios de Handshake (SSO/OAuth Endpoint)**:
    *   Cuando un satélite solicite autorización pasándole su identificador (ej: `appId = 'quiz'`) y el tenant (ej: `tenantId = 'academia-alfa'`):
        *   Validar que la cuenta global del usuario esté `active`.
        *   Validar que la membresía del usuario en `academia-alfa` esté `active`.
        *   Validar que `'quiz'` esté presente en `Tenant.allowedApps`.
        *   Validar que `'quiz'` esté presente en `User.tenants[x].allowedApps`.
        *   Si alguna validación falla, denegar el SSO y redirigir a una página de error local `/unauthorized` mostrando un mensaje explicativo (ej. *"Tu cuenta no tiene permisos para usar esta aplicación en esta academia"*).
3.  **Generación de JWT**:
    *   Inyectar en los claims del token JWT la lista final de aplicaciones autorizadas para el usuario en el tenant actual (`allowedApps`) y su rol.

---

### 🛰️ 3.3. En las Aplicaciones Satélites (ej. `ABDQuiz`)
Las aplicaciones satélite deben proteger sus endpoints y navegación basándose en el JWT emitido por el IdP.

#### Tareas a Programar:
1.  **Verificador de Middleware/Sesión (`getIndustrialSession()`)**:
    *   Al descifrar y validar el JWT firmado, comprobar que el `appId` local (ej: `'quiz'`) esté presente en el array `allowedApps` del payload del token.
    *   Si no está presente, destruir la sesión local y redirigir a `ABDAuth` con un código de error en la query string.

---

## 🎨 4. Directrices de Estilo Visual (Alineado con `STYLE_GUIDE.md`)

Cualquier componente visual desarrollado para estas pantallas debe seguir el estándar *Uncodixfy / Tech-Noir*:

*   **Paleta de Colores**:
    *   Fondo abisal: HSL `240 10% 3.9%` (`bg-background`).
    *   Bordes técnicos: HSL `240 5.9% 10%` o `240 5.9% 15%`.
    *   Estados de Checkboxes activos: usar el color primario dinámico de marca `--primary` del Tenant.
*   **Geometría**:
    *   Esquinas totalmente angulares: usar **`rounded-none`** de forma obligatoria en todos los botones, tarjetas y campos de entrada.
*   **Interactividad**:
    *   Las transiciones de selección en los checkboxes deben ser de `150ms` con efecto `ease-in-out` y un cambio sutil de opacidad de fondo.
    *   Uso de notificaciones `sonner` de estilo militar para confirmar el guardado exitoso de accesos.

---

## 🛡️ 5. Aseguramiento de Calidad (Alineado con `PROMPT_UNIFICADO_DESARROLLO.md`)

*   **Evitar `any`**: Todos los payloads, respuestas de API y variables de mapeo de membresías deben estar estrictamente tipados.
*   **Seguridad Fail-Safe**: Si la base de datos de Tenants no responde al cargar el formulario de usuarios, por defecto los checkboxes de aplicaciones deben renderizarse deshabilitados (bloqueo total preventivo).
*   **Auditoría de Estilos**: Antes de enviar cualquier cambio a revisión, los desarrolladores deben ejecutar el script `./abd-audit.ps1` en la raíz de su respectivo proyecto para validar que no existan desviaciones estéticas (colores hexadecimales hardcodeados o bordes redondeados).
