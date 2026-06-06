# 🛠️ PLAN DE DESARROLLO: Gestión de Errores SSO y Conmutación de Contexto (ABDAuth)

Este documento contiene las especificaciones técnicas y los pasos detallados de desarrollo que debe seguir el proyecto **`ABDAuth`** para implementar el manejo de errores de redirección de SSO en el dashboard y habilitar el selector de organización completo (incluyendo el contexto virtual `GLOBAL`) para los usuarios con rol `SUPER_ADMIN`.

> [!IMPORTANT]
> **Cumplimiento de Estilo y Normas**: 
> Toda modificación debe alinearse estrictamente con el archivo [PROMPT_UNIFICADO_DESARROLLO.md](file:///d:/desarrollos/ABD-Suite-DOCS/PROMPT_UNIFICADO_DESARROLLO.md) y la guía [STYLE_GUIDE.md](file:///d:/desarrollos/ABD-Suite-DOCS/STYLE_GUIDE.md). En particular:
> 1. Respetar la regla **FIRE:MAX_LINES** (máx. 150 líneas por archivo de componente).
> 2. No utilizar colores hexadecimales hardcodeados; usar variables CSS de Tailwind v4 (`text-destructive`, `border-border`, `bg-card`, etc.).
> 3. Traducir todas las cadenas a través de `next-intl` (evitar **FIRE:I18N_VIOLATION**).
> 4. Asegurar que las esquinas y los botones usen bordes afilados (`rounded-none` o `rounded-sm` con máx. `0.15rem`).

---

## 🎨 1. Localización y Textos (next-intl)

Se deben registrar los nuevos mensajes de error traducidos en los archivos de idioma de `next-intl`.

### 📂 Modificar `src/messages/es.json`
Añadir el objeto `errors` dentro del bloque `dashboard`:

```json
    "dashboard": {
      "control_console": "Consola de Control",
      "back_to_dashboard": "Volver al panel",
      ...
      "errors": {
        "SELECT_TENANT_REQUIRED": "Seleccione una organización activa para iniciar sesión en la aplicación.",
        "APPLICATION_NOT_LICENSED": "La aplicación no está licenciada para la organización seleccionada.",
        "UNAUTHORIZED_TENANT_ACCESS": "Acceso no autorizado a la organización seleccionada.",
        "APPLICATION_INACTIVE": "La aplicación seleccionada está fuera de línea o inactiva.",
        "DEFAULT": "Error al realizar el enlace SSO con la aplicación satélite."
      }
    }
```

### 📂 Modificar `src/messages/en.json`
Añadir el objeto `errors` equivalente dentro de `dashboard`:

```json
    "dashboard": {
      "control_console": "Control Console",
      "back_to_dashboard": "Back to dashboard",
      ...
      "errors": {
        "SELECT_TENANT_REQUIRED": "Please select an active organization to sign in to the application.",
        "APPLICATION_NOT_LICENSED": "The application is not licensed for the selected organization.",
        "UNAUTHORIZED_TENANT_ACCESS": "Unauthorized access to the selected organization.",
        "APPLICATION_INACTIVE": "The selected application is offline or inactive.",
        "DEFAULT": "Failed to establish SSO connection with the satellite application."
      }
    }
```

---

## 📊 2. Página del Dashboard

Se debe modificar el punto de entrada del dashboard para aceptar parámetros de búsqueda en la URL, renderizar la alerta de error, proveer la lista completa de Tenants al Super Administrador y listar las aplicaciones del ecosistema incluso estando en el contexto `GLOBAL`.

### 📂 Modificar `src/app/[locale]/dashboard/page.tsx`

#### A. Firma del Componente y Tipos
Modificar `DashboardPage` para que acepte `searchParams` asíncronos:

```typescript
export default async function DashboardPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations('dashboard');
  
  // ... comprobaciones de sesión y dbUser existentes ...
```

#### B. Importaciones Requeridas
Añadir el icono `ShieldAlert` de Lucide para la advertencia:
```typescript
import { LayoutDashboard, ShieldAlert } from "lucide-react";
```

#### C. Lógica del Selector de Contextos para Super Administrador
Reemplazar la sección de obtención de `userTenants` para diferenciar el comportamiento si el rol del operador es `SUPER_ADMIN`:

```typescript
  // 1. Fetch user memberships dynamically to check multi-tenancy / context switching
  let userTenants: Array<{ tenantId: string; name: string; industry?: string; active: boolean }> = [];
  
  if (user.role === 'SUPER_ADMIN') {
    const allDbTenants = await tenantRepository.listForCurrentSession(user);
    userTenants = [
      { 
        tenantId: 'GLOBAL', 
        name: 'CONSOLA DEL SISTEMA (GLOBAL)', 
        industry: 'SYSTEM', 
        active: true 
      },
      ...allDbTenants.map(t => ({
        tenantId: t.tenantId,
        name: t.name,
        industry: t.industry,
        active: t.active !== false
      }))
    ];
  } else {
    const targetTenantIds = Array.from(new Set([
      dbUser.tenantId, 
      ...(dbUser.tenantIds || []), 
      ...(dbUser.tenants?.map(t => t.tenantId) || [])
    ].filter(Boolean))) as TenantId[];

    const tenantsPromises = targetTenantIds.map(tid => tenantRepository.findByTenantId(tid));
    const dbTenants = (await Promise.all(tenantsPromises)).filter((t): t is Exclude<typeof t, null | undefined> => !!t);
    userTenants = dbTenants.map(t => ({ 
      tenantId: t.tenantId, 
      name: t.name, 
      industry: t.industry, 
      active: t.active !== false 
    }));
  }
```

#### D. Lógica de Aplicaciones: Carga para Contexto GLOBAL y Específico
Reemplazar la lógica de obtención de `allowedApps` para que, si el contexto es `GLOBAL`, cargue todas las aplicaciones activas del sistema (exclusivo para `SUPER_ADMIN`), y si es un Tenant específico, cargue únicamente las contratadas por dicho Tenant:

```typescript
  // 2. Fetch allowed apps for the currently active tenant (or all active apps if SUPER_ADMIN and context is GLOBAL)
  let allowedApps: Application[] = [];
  if (user.tenantId) {
    if (user.tenantId === 'GLOBAL') {
      if (user.role === 'SUPER_ADMIN') {
        // Solo el SUPER_ADMIN ve todas las aplicaciones en el contexto GLOBAL
        allowedApps = await applicationRepository.list({ active: true });
      } else {
        allowedApps = [];
      }
    } else {
      const activeTenant = await tenantRepository.findByTenantId(user.tenantId as TenantId);
      if (activeTenant && activeTenant.allowedApps) {
        const appsPromises = activeTenant.allowedApps.map(slug => applicationRepository.findOne({ slug } as SafeFilter<Application>));
        allowedApps = (await Promise.all(appsPromises)).filter((a): a is Application => !!a);
      }
    }
  }
```

#### E. Renderizado del Banner de Alerta Industrial (SSO Errors)
Insertar el banner de error antes de renderizar el `PageHeader` o justo debajo de este. El componente debe ser una alerta de tipo emergencia acorde a la guía de estilo (`STYLE_GUIDE.md` - Alertas Locales):

```tsx
      {/* ⚠️ Alerta de Error de Redirección SSO */}
      {error && (
        <div className="p-4 border border-red-500/15 bg-red-500/5 rounded-sm flex items-start gap-3 w-full text-red-500 font-mono text-[10px] font-black uppercase tracking-wider animate-in fade-in duration-300" role="alert">
          <ShieldAlert size={16} className="shrink-0 animate-pulse mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="text-red-500/60 font-mono text-[8px] tracking-[0.2em] font-black">
              SYSTEM_SSO_FAULT // ERR_CODE: {error}
            </div>
            <div>
              {['SELECT_TENANT_REQUIRED', 'APPLICATION_NOT_LICENSED', 'UNAUTHORIZED_TENANT_ACCESS', 'APPLICATION_INACTIVE'].includes(error)
                ? t(`errors.${error}`)
                : t('errors.DEFAULT')}
            </div>
          </div>
        </div>
      )}
```

#### F. Renderizado de Componentes en el JSX (TenantSelector y AppLauncherGrid)
Asegurar que el selector reciba el array unificado y que el lanzador de aplicaciones se dibuje **siempre** que exista un `user.tenantId` activo (eliminando la restricción de que sea distinto de `'GLOBAL'`):

```tsx
      {/* 🏢 Part 1: Tenant Switcher */}
      {userTenants.length > 1 && (
        <TenantSelector 
          tenants={userTenants}
          activeTenantId={user.tenantId}
          translations={getTenantSelectorTranslations(locale)}
        />
      )}

      {/* 🛰️ Part 2: Allowed Applications Launcher Grid */}
      {user.tenantId && (
        <AppLauncherGrid 
          apps={allowedApps}
          activeTenantId={user.tenantId}
          translations={getAppLauncherTranslations(locale)}
        />
      )}
```

---

## 📟 3. Selector de Contexto (TenantSelector)

Dado que `TenantSelector` ya está desarrollado como un componente de cliente (`"use client"`), procesará la opción virtual `'GLOBAL'` del Super Administrador sin requerir cambios estructurales adicionales, ya que el server action `switchTenantAction` en `actions.ts` ya permite procesar e identificar la conmutación a `'GLOBAL'`.

Solo verificar que las esquinas cumplan con `rounded-none` o `rounded-sm` (ya implementado en la base de código).

---

## 🏁 4. Plan de Verificación Técnica

Una vez que el agente/desarrollador de `ABDAuth` aplique los cambios anteriores, debe verificar lo siguiente:

1. **Compilación Estática**:
   * Ejecutar el typecheck y build del proyecto:
     ```powershell
     pnpm run tsc
     pnpm run build
     ```
2. **Pruebas de Flujo**:
   * **Usuario SUPER_ADMIN**:
     * Iniciar sesión. Debería mostrarse la opción `GLOBAL` activa y el selector con todos los tenants.
     * Conmutar a un tenant específico (ej. `Elevadores MX`). Comprobar que el dashboard y el grid de aplicaciones cambian a dicho contexto.
     * Conmutar de vuelta a `GLOBAL`.
   * **Simulación de Error**:
     * Navegar manualmente a `/api/auth/sso?appId=quiz` sin tener un tenant seleccionado.
     * Verificar que redirige a `/dashboard?error=SELECT_TENANT_REQUIRED` y se despliega la alerta roja estructurada y traducida correctamente.
