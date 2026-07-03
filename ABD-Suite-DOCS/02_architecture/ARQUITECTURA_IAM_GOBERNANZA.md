# 🏛️ ARQUITECTURA IAM: Gobernanza de Usuarios y Accesos ABDSuite
## Modelo "Enfoque B" — ABDtenantGovernance como Consola Única de Negocio

> **Fecha:** 20 de mayo de 2026  
> **Estado:** BORRADOR PARA REVISIÓN  
> **Referencia:** `DISENO_SSO_TENANTS.md`, `GuardianEngine.ts` (ABDAgRAG)

---

## 🧭 Visión General del Modelo

### El reparto de responsabilidades definitivo

```
┌─────────────────────────────────────────────────────────────────┐
│  ABDAuth (IdP)                                                  │
│  • Motor técnico ciego                                          │
│  • Almacena identidades: email, passwordHash, MFA               │
│  • Emite JWT firmados con claims de acceso                      │
│  • Valida SSO en /authorize (checks de gobernanza proactivos)   │
│  • Panel de SuperAdmin para gestión global de infraestructura   │
│  • NO tiene UI de gestión de usuarios de Tenant para el cliente │
└──────────────────────────────┬──────────────────────────────────┘
                               │ API interna (server-to-server)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ABDtenantGovernance (Control Plane / Consola de Negocio)       │
│  • UI de gestión de usuarios, grupos, departamentos             │
│  • Asignación de aplicaciones por usuario                       │
│  • Motor ABAC (Guardian) — políticas, roles delegados           │
│  • Llama a ABDAuth API para crear/suspender identidades técnicas│
│  • Vista filtrada por tenantId (aislamiento garantizado)        │
└─────────────────────────────────────────────────────────────────┘
                               │ JWT via SSO
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Satélites (ABDQuiz, ABDLogs, ABDElevators...)                   │
│  • Solo validan el JWT del SDK                                   │
│  • No gestionan usuarios: consumen los claims del token          │
│  • Filtran datos por tenantId del JWT                            │
└──────────────────────────────────────────────────────────────────┘
```

### Principio fundamental
> El **Administrador de Tenant** de Metalúrgica S.A. gestiona a sus empleados desde **ABDtenantGovernance**. ABDAuth es invisible para él; es infraestructura técnica del SuperAdmin. Cuando da de baja a un empleado, **pierde acceso a todas las aplicaciones de golpe** porque el JWT ya no se puede generar para él.

---

## 💾 Modelo de Datos Extendido

### A. Entidad `User` (en ABDAuth — Fuente de Verdad de Identidad)

```typescript
// Permanece en ABDAuth. Solo contiene lo mínimo para identity + governance.
interface IUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  surname: string;
  active: boolean;            // Baja lógica GLOBAL (pierde acceso a todo)
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  
  // Multi-tenant membership (ya implementado ✅)
  tenantId: string;           // Tenant activo/por defecto
  tenantIds: string[];        // Todos los tenants a los que pertenece
  tenants: UserTenantMembership[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface UserTenantMembership {
  tenantId: string;
  role: 'owner' | 'admin' | 'student';  // Rol base para el JWT
  status: 'active' | 'suspended';        // Baja lógica POR TENANT
  allowedApps: string[];                 // Apps explícitas (si role=student)
  appPermissions: string[];              // Permisos finos: 'quiz:write'
  // ↓ FUTURO: referencia a grupos en Gobernanza
  groupIds?: string[];                   // IDs de PermissionGroup en ABDtenantGovernance
}
```

### B. Entidad `PermissionGroup` (en ABDtenantGovernance — NUEVA)

Inspirada directamente en el sistema `permission_groups` + `Guardian` de ABDAgRAG.

```typescript
// Colección: `permission_groups` en la DB del tenant en Gobernanza
interface IPermissionGroup {
  _id: ObjectId;
  tenantId: string;
  name: string;         // Ej: "Técnicos de Campo", "Responsables de Zona Norte"
  slug: string;         // técnicos-campo (normalizado)
  description?: string;
  
  // Jerarquía (heredado de ABDAgRAG Guardian)
  parentId?: ObjectId;  // Grupo padre → hereda sus políticas
  
  // Políticas asignadas a este grupo
  policyIds: ObjectId[];
  
  // Aplicaciones a las que da acceso (complementa allowedApps del JWT)
  allowedApps?: string[];
  
  memberCount?: number; // Campo virtual para UI
  createdAt: Date;
  updatedAt: Date;
}
```

### C. Entidad `PermissionPolicy` (en ABDtenantGovernance — NUEVA)

```typescript
// Colección: `permission_policies`
// Define reglas ABAC granulares: "Permitir/Denegar [Acción] en [Recurso]"
interface IPermissionPolicy {
  _id: ObjectId;
  tenantId: string;
  name: string;          // Ej: "Puede aprobar inspecciones"
  description?: string;
  
  effect: 'ALLOW' | 'DENY';
  resources: string[];   // Glob: ['inspection:*', 'report:read']
  actions: string[];     // ['read', 'write', 'approve', 'export', 'manage']
  
  // Condiciones ABAC (opcionales, para futuro avanzado)
  conditions?: {
    timeWindow?: { start: string; end: string; days?: number[] };
    ipRange?: string[];
    attributes?: Record<string, unknown>; // { "department": "Zona Norte" }
  };
  
  isActive: boolean;
  createdAt: Date;
}
```

### D. Entidad `DelegatedRole` (en ABDtenantGovernance — NUEVA)

```typescript
// Colección: `delegated_roles`
// Permite a un usuario ejercer temporalmente las funciones de otro
interface IDelegatedRole {
  _id: ObjectId;
  tenantId: string;
  
  // ¿Quién delega y a quién?
  delegatorUserId: string;    // Ej: "Ana García (Jefa de Zona)" se va de vacaciones
  delegateeUserId: string;    // Ej: "Carlos López (Técnico Senior)" actúa como jefa
  
  // ¿Qué se delega? (delegación explícita y parcial de políticas)
  policyIds: string[];        // Las políticas temporales que se conceden
  reason?: string;            // "Vacaciones agosto 2026"
  
  // Ventana temporal
  startsAt: Date;
  expiresAt: Date;
  
  isActive: boolean;
  createdAt: Date;
}
```

### E. Entidad `Space` y Gobernanza Jerárquica (en ABDtenantGovernance — NUEVA)

Los espacios modelan la estructura física o departamental del tenant (aulas, sedes, áreas). 

```typescript
// Colección: `spaces`
interface ISpace {
  _id: ObjectId;
  tenantId: string;
  name: string;
  slug: string;
  type: 'TENANT' | 'TEAM' | 'PERSONAL';
  
  // Jerarquía (Materialized Paths)
  parentSpaceId?: ObjectId;
  materializedPath?: string; 
  
  visibility: 'PUBLIC' | 'INTERNAL' | 'PRIVATE';
  
  // Array polimórfico de colaboradores
  collaborators?: {
    subjectId: string;                    // ID del Usuario o ID del PermissionGroup
    subjectType: 'USER' | 'GROUP';        // Discriminador polimórfico
    role: 'VIEWER' | 'EDITOR' | 'ADMIN';
    propagates: boolean;                  // Si el permiso se hereda a sub-espacios descendientes
  }[];
}
```

**Resolución de accesos a espacios**: El `SpaceService` cruza dinámicamente los grupos a los que pertenece el usuario con los `collaborators` del espacio. Un usuario puede ver un espacio privado si se le ha añadido explícitamente como `USER`, o si pertenece a un `GROUP` que tiene permisos en ese espacio. Esto desacopla la estructura organizativa de los permisos directos, permitiendo añadir grupos enteros a un aula o sede.

---

## ⚙️ Motor de Permisos — Guardian Adaptado para ABDSuite

### Resolución de permisos efectivos (en orden de prioridad)

```
1. SUPER_ADMIN → Bypass total (acceso a todo)
2. Tenant OWNER/ADMIN → Acceso a todas las apps licenciadas del tenant
3. Delegated Roles activos → Políticas temporales (ventana de tiempo)
4. Permission Overrides directos → Excepciones asignadas al usuario
5. Permission Groups → Herencia jerárquica de grupos (BFS recursivo)
6. allowedApps del JWT → Apps base permitidas para el usuario
7. Default DENY → Sin política explícita = acceso denegado
```

### Resolución de accesos a Espacios Físicos/Lógicos (`SpaceService`)

Para saber qué espacios puede ver un usuario (y, por tanto, qué exámenes o documentos alojados allí puede consumir), el motor intercepta la sesión y:
1. Recupera la lista de grupos a los que pertenece el usuario en ese tenant.
2. Construye un predicado unificado (`$or`) que busca coincidencias en el array `collaborators` usando `$elemMatch`:
   - `subjectType: 'USER'` AND `subjectId: userId`
   - `subjectType: 'GROUP'` AND `subjectId: { $in: groupIds }`
3. Esto permite a los satélites (ABDQuiz, ABDDocs) listar los recursos jerárquicos exactos a los que tiene acceso el alumno en 1 sola query de MongoDB.

### Dónde se ejecuta cada validación

| Capa | Validación | Herramienta |
|---|---|---|
| **SSO (ABDAuth)** | ¿El usuario tiene acceso a esta APP en este TENANT? | `/authorize` route (ya implementado ✅) |
| **Middleware del Satélite** | ¿El JWT es válido y el tenantId coincide con el subdominio? | `@abd/satellite-sdk` (`withIndustrialAuth`) |
| **API del Satélite** | ¿El usuario puede hacer esta ACCIÓN sobre este RECURSO? | Guardian (futuro SDK compartido) |
| **UI del Satélite** | Mostrar/ocultar botones según permisos | Claims del JWT |

---

## 🔐 Protocolo de Comunicación S2S (Server-to-Server) y Sincronización de Entorno

### Autenticación S2S segura (ABAC Guardian)
Cuando un satélite realiza una consulta de autorización al motor central de Gobernanza (vía `@ajabadia/satellite-sdk` y su método `evaluateAccess`), la comunicación se realiza mediante peticiones HTTP POST internas a `/api/internal/guardian/evaluate`:
- **Cabecera requerida:** `x-abd-internal-secret`
- **Variable de entorno:** `ABD_INTERNAL_SECRET`

Ambos extremos (satélite y plano de control) deben compartir exactamente el mismo valor secreto de esta variable de entorno.

### Estrategia de Sincronización en Desarrollo Local (Monorepo)
Para evitar la desincronización manual de secretos comunes en desarrollo local (frecuentemente causante de fallos del tipo `SDK_SECRET_MISSING`), se implementa una estrategia de **fuente única de verdad**:
1. **[.env.shared](file:///d:/desarrollos/ABDSuite/.env.shared) (Raíz):** Define las variables y secretos comunes para todo el ecosistema (ej. `ABD_INTERNAL_SECRET`, `AUTH_JWT_SECRET`, etc.).
2. **[sync-env.ps1](file:///d:/desarrollos/ABDSuite/scripts/sync-env.ps1) (Script de Fusión):** Un script automatizado en PowerShell que se ejecuta al levantar el entorno (vía `start-all.bat`). Este realiza un *merge* inteligente: actualiza/inyecta únicamente los valores comunes del archivo compartido en el `.env.local` de cada satélite, garantizando que **no se eliminen** ni sobrescriban las variables específicas de base de datos o puertos propios de cada satélite.

### Garantía de Configuración en Vercel (Producción / Staging)
Dado que los archivos `.env.local` están en el `.gitignore` y no se suben al control de versiones, la consistencia de las variables compartidas en Vercel se garantiza de la siguiente forma:
1. **Declaración en la Consola del Proyecto:** Cada proyecto satélite en Vercel debe tener declaradas las variables del `.env.shared` (como `ABD_INTERNAL_SECRET`) con los mismos valores compartidos de producción.
2. **Uso de la CLI de Vercel (Recomendado):** Se puede utilizar la CLI de Vercel para sincronizar y jalar las variables de producción/staging de forma segura:
   - `vercel env pull .env.production.local`
   - O bien crear las variables mediante `vercel env add ABD_INTERNAL_SECRET` a nivel de proyecto o equipo.

---

## 🔄 Ciclo de Vida de un Usuario


### Alta (Provisioning)
```
Admin de Tenant entra a ABDtenantGovernance
  → Rellena formulario: email, nombre, apps, grupos
  → ABDtenantGovernance llama ABDAuth API (POST /api/internal/users)
  → ABDAuth crea la identidad técnica y envía email de activación
  → El usuario activa su cuenta y establece contraseña/MFA
  → Listo: puede hacer SSO en las apps asignadas
```

### Baja por Tenant (Deprovisioning parcial)
```
Admin suspende usuario en ABDtenantGovernance
  → Status = 'suspended' en UserTenantMembership
  → ABDtenantGovernance llama ABDAuth API (PATCH /api/internal/users/:id)
  → ABDAuth actualiza el estado de esa membresía
  → Efecto inmediato: /authorize bloquea y redirige al dashboard con error
  → Sesiones JWT existentes expiran según su TTL (máx. 2h)
  ✅ Pierde acceso a TODAS las apps de ESE tenant de golpe
  ✅ Mantiene acceso a otros tenants donde siga activo
```

### Baja Global (Usuario abandona la empresa / SuperAdmin)
```
SUPER_ADMIN o Owner pone active=false en el usuario
  → El usuario pierde acceso a TODOS sus tenants simultáneamente
  → El email queda registrado para auditoría (no se borra físicamente)
```

---

## 📐 Decisiones de Diseño Clave

### 1. Roles Propios del Tenant (Nombres en el idioma del cliente)

El tenant NO define roles globales del sistema. Lo que "traduce" sus roles de negocio son los **PermissionGroups con nombres propios**:

```
"Técnico de Campo"  → Grupo con políticas [inspection:read, report:write]
"Inspector Jefe"    → Grupo con políticas [inspection:*, report:*, approve:*]
"Administrador IT"  → Role 'admin' en membership → hereda todas las apps
```

**Ventaja:** No hay que modificar el JWT ni el esquema central cada vez que un tenant necesita un rol nuevo. Los grupos son entidades de negocio del tenant, gestionadas por ellos mismos dentro de ABDtenantGobernanza.

### 2. Licenciamiento de Aplicaciones por Tenant (con límite futuro de usuarios)

```typescript
// Evolución futura de Tenant.allowedApps (actualmente string[])
interface TenantAppLicense {
  appSlug: string;        // 'quiz', 'elevators', 'logs'
  maxUsers?: number;      // null = ilimitado; 5 = máximo 5 usuarios
  expiresAt?: Date;       // null = permanente
  status: 'active' | 'suspended';
}
// Retro-compatible: si es string, se trata como { appSlug: string, status: 'active' }
```

### 3. Un Usuario en Múltiples Tenants

```
Usuario: carlos@email.com
  ├─ Tenant: metalurgica-sa → role: admin → apps: [elevators, quiz, logs]
  └─ Tenant: fundicion-norte → role: student → apps: [elevators]
                                groups: ["Técnico Senior Grupo B"]
```

El JWT siempre se emite para **un tenant concreto** (el del contexto de la petición SSO). El `tenantId` del JWT determina qué datos ve en el satélite.

### 4. Integración Futura con Active Directory / Azure AD

El modelo está diseñado para ser **compatible con SCIM** (System for Cross-domain Identity Management):

- Los usuarios de AD se sincronizan como `IUser` en ABDAuth
- Sus grupos de AD se mapean a `PermissionGroups` en ABDtenantGovernance
- El proveedor SAML/OIDC externo sustituye el `/login` de ABDAuth pero el resto del flujo SSO es idéntico

---

## 🗺️ Hoja de Ruta de Implementación

### Fase 1 — Fundamentos (YA IMPLEMENTADO ✅)
- [x] Esquema multitenant de usuarios (`tenants[]`, `tenantIds[]`, `allowedApps`)
- [x] JWT con `allowedApps` calculados por intersección Tenant↔User
- [x] Validación proactiva de gobernanza en `/authorize`
- [x] UI de membresías en ABDAuth (SuperAdmin: MembershipsSection)
- [x] Persistencia y sincronización en POST/PUT de `/api/admin/users`
- [x] Lectura de tenants habilitada para rol ADMIN (no solo SUPER_ADMIN)

### Fase 2 — Gestión de Usuarios desde ABDtenantGobernanza (YA IMPLEMENTADO ✅)
- [x] API interna en ABDAuth: `POST/PATCH/GET /api/internal/users` (server-to-server con API Key)
- [x] UI en ABDtenantGovernance: Panel de Usuarios del Tenant (alta, baja, cambio de rol y apps)
- [x] Flujo de invitación por email con activación de cuenta

### Fase 3 — Grupos y Departamentos en ABDtenantGobernanza (YA IMPLEMENTADO ✅)
- [x] Modelo `PermissionGroup` con jerarquía en DB de Gobernanza
- [x] UI: Panel de Grupos (crear, editar, asignar usuarios, asignar políticas)
- [x] Sincronización de `groupIds` al JWT via campo `groups[]` en el token
- [x] Heredar `allowedApps` de grupos (un usuario hereda las apps de sus grupos)

### Fase 4 — Roles Delegados
- [ ] Modelo `DelegatedRole` con ventana temporal
- [ ] UI: Modal "Delegar mis funciones" en el perfil del usuario
- [ ] Evaluación de roles delegados activos en el motor de permisos

### Fase 5 — Políticas ABAC Granulares (CONTROL PLANE IMPLEMENTADO ✅)
- [x] Modelo `PermissionPolicy` con recursos y acciones en glob
- [x] UI: Creación y asignación de políticas en el Panel de Permisos
- [ ] Guardian Engine adaptado de ABDAgRAG (ya probado en producción)
- [ ] API `/api/internal/guardian/evaluate` consumible por satélites vía SDK

### Fase 6 — Licenciamiento por Cuota y Uso
- [ ] Evolucionar `Tenant.allowedApps: string[]` → `TenantAppLicense[]`
- [ ] Contador de usuarios activos por app (para respetar `maxUsers`)
- [ ] Dashboard de licencias en ABDtenantGovernance para el SuperAdmin

### Fase 7 — Integración SAML/OIDC / Active Directory
- [ ] Endpoint `/api/auth/saml/callback` en ABDAuth
- [ ] Mapping de atributos SAML → `IUser` vía `IndustrialNormalizer`
- [ ] Sync de grupos SAML → `PermissionGroups` vía SCIM

---

## 📦 Relación de Usuarios y Tenants con Aplicaciones

En ABDSuite, el acceso a las aplicaciones está estructurado en tres niveles complementarios de gobernanza (licenciamiento, asignación y autorización):

1. **Catálogo de Aplicaciones (Central en ABDAuth)**:
   - Colección `Applications` en la base de datos `AUTH`.
   - Contiene la definición técnica de los satélites (ej. `clientId`, `clientSecret`, `slug`, `redirectUris`, `active`).

2. **Licenciamiento por Tenant (Negocio en ABDAuth)**:
   - Campo `Tenant.allowedApps` (array de slugs, ej. `['elevators', 'quiz']`).
   - Define qué aplicaciones tiene derecho a utilizar un tenant de acuerdo con su contrato o suscripción.

3. **Acceso a Nivel de Usuario (Gobernanza)**:
   - Campo `UserTenantMembership.allowedApps` en `User.tenants` (ej. `['elevators']`).
   - Permite al administrador del tenant restringir a qué aplicaciones de las licenciadas tiene acceso un usuario individual.
   - *Nota*: Los roles privilegiados (`admin`, `owner`) heredan automáticamente todas las aplicaciones licenciadas del tenant, mientras que los usuarios base (`student` / `operator`) requieren asignación explícitas.

4. **Flujo de Intersección y Autorización (Federado en `/authorize`)**:
   - Cuando un usuario inicia SSO en un satélite (ej. `ABDQuiz`), el endpoint `/authorize` de `ABDAuth` realiza la intersección:
     $$\text{App Habilitada} = (\text{appSlug} \in \text{Tenant.allowedApps}) \land (\text{isPrivileged} \lor \text{appSlug} \in \text{User.tenants[tenant].allowedApps})$$
   - Si se supera esta prueba, se emite el código de autorización; de lo contrario, se deniega proactivamente y se redirige con el código de error correspondiente (`APPLICATION_NOT_LICENSED` o `UNAUTHORIZED_TENANT_ACCESS`).

---

## 🛠️ Decisiones de Arquitectura Consolidadas

### 1. Ubicación y Aislamiento de Grupos y Políticas
- **Decisión**: Los `PermissionGroups` y `PermissionPolicies` vivirán en la base de datos operativa de **ABDtenantGovernance**, aislados por tenant (Opción A).
- **Razón**: Máxima segregación y autonomía del tenant (cumple exigencias de privacidad/GDPR y multi-tenant estricto). ABDAuth emite la identidad base (JWT) y Gobernanza evalúa la autorización granular (ABAC) reduciendo el acoplamiento técnico en el IdP.

### 2. Delegación de Funciones
- **Decisión**: La delegación de funciones se implementará por **políticas explícitas y temporales** (`DelegatedRole`).
- **Razón**: Es el estándar en sistemas SaaS corporativos de alta seguridad. Un usuario no asume la identidad completa de otro; asume temporalmente un subconjunto definido de políticas de acción/recurso durante una ventana de tiempo predeterminada.

### 3. Modelo de Licenciamiento por Cuota
- **Decisión**: Se pospone a la **Fase 6** de la hoja de ruta. Para el MVP, el control se realiza mediante la asignación simple de slugs de aplicaciones permitidas (`allowedApps: string[]`).

### 4. Conmutador de Contexto Multi-Tenant (TenantSelector)
- **Decisión**: La selección del inquilino activo se centraliza a nivel de UI usando el componente compartido `TenantSelector` de `@abd/styles`. Se integra como botón flotante global en la cabecera (junto a `SystemSettings`) y propaga el estado del inquilino mediante parámetros en la URL (`?tenantId=...`).
- **Razón**: Asegura consistencia visual (Tech-Noir) en toda la suite, elimina selectores locales redundantes y delega la seguridad en el backend. Los usuarios que no tengan el rol `SUPER_ADMIN` ven este selector como un distintivo inerte e informativo (modo lectura), mientras que el backend ignora parámetros manipulados y enforza estrictamente el `tenantId` de la sesión.

### 5. Orquestación Dinámica de Bases de Datos por Cliente (Multi-DB Connection Routing)
- **Decisión**: Implementar un enrutamiento automático y transparente de bases de datos a nivel de capa ORM/ODM (Mongoose) mediante `AsyncLocalStorage` y Proxies de JavaScript en `ABDQuiz`.
- **Razón**: Permite dar soporte a dos modelos de aislamiento físico e híbrido (`DATABASE_PER_TENANT` y `COLLECTION_PREFIX`) sin tener que refactorizar las consultas del código de negocio (*zero-refactor*). Mantiene las conexiones activas en un pool global persistente para evitar la degradación de rendimiento y sockets huérfanos, soportando de forma nativa HMR en desarrollo.

> [!WARNING]
> **Pendiente de Replicación**: Este patrón de enrutamiento dinámico multi-tenant se ha implementado inicialmente en **`ABDQuiz`** como piloto. Queda pendiente replicarlo en el resto de aplicaciones satélite (como `ABDLogs` u otras futuras de la suite) a medida que requieran aislamiento físico o lógico de sus bases de datos por inquilino.

---

## ⚠️ Lecciones Aprendidas de la Auditoría del Código de ABDAgRAG

Durante la inspección profunda de la implementación de referencia en `ABDAgRAG`, se han identificado dos problemas críticos de diseño y bugs que **debemos evitar y solucionar** en el desarrollo de `ABDSuite`:

### 🚨 Bug Crítico de Evaluación en `requirePermission`
En `ABDAgRAG` (`src/lib/auth.ts`), la función middleware `requirePermission` evalúa el acceso del usuario instanciando el objeto de evaluación de esta manera:
```typescript
const result = await engine.evaluate({
  id: session.user.id,
  tenantId: session.user.tenantId,
  role: session.user.role
  // ❌ ERROR: Se omiten permissionGroups y permissionOverrides
}, resource, action);
```
**Impacto**: Las políticas asignadas a grupos jerárquicos o los overrides individuales del usuario son ignorados por completo en los checks de las API de rutas, reduciendo la evaluación a un simple rol estático.
**Solución para ABDSuite**: Asegurar que en el middleware de los satélites y gobernanza se pasen explícitamente los campos `permissionGroups` y `permissionOverrides` mapeados en la sesión del usuario al llamar a `GuardianEngine.evaluate`.

### ⚡ Estrategia de Invalidadación del Caché de Guardian
- En `ABDAgRAG`, `GuardianEngine` usa Upstash Redis para cachear evaluaciones de permisos durante 60 segundos, pero carece de un mecanismo de invalidación activa.
- **Solución para ABDSuite**: Implementar un bus de eventos sencillo o llamadas API internas de deprovisioning que eliminen las claves de caché (`redis.del("guardian:perm:<tenantId>:*")` o usando patrones de tags de usuario) inmediatamente cuando:
  - Se suspende o modifica un usuario.
  - Se altera la jerarquía o políticas de un `PermissionGroup`.
  - Expira o se desactiva un `DelegatedRole`.

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]
	* [[02_architecture/DISENO_SSO_TENANTS.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDtenantGovernance.md]]
	* [[grafos/ABDAuth.md]]
