# `@ajabadia/ecosystem-widgets`

Paquete de componentes React con lógica de negocio (*smart components*) centralizada para el ecosistema ABD. Estos widgets manejan estados, contextos (`next-intl`, temas), peticiones a APIs internas e lógica interactiva avanzada.

---

## SmartNavbar

Barra de navegación superior unificada que reemplaza `SidebarNavigation` + `IndustrialTopBar`. Estilo antigravity con mega-menú hover, modo público/privado y soporte mobile.

### Requisitos de Importación

```typescript
import { SmartNavbar } from "@ajabadia/ecosystem-widgets";
import type { GlobalNavbarSession, SidebarLink } from "@ajabadia/ecosystem-widgets";
import "@ajabadia/styles/dist/styles/industrial-core.css"; // CSS global: .navbar-top-layout, .smart-navbar, .smart-navbar-dropdown
```

### Props

```typescript
interface SmartNavbarProps {
  session: GlobalNavbarSession | null;
  links: SidebarLink[];
  logoUrl?: string | null;
  brandName?: string;
  activeHref?: string;
  locale?: string;
  onLogout: () => void;
  onLogin?: () => void;
  transformHref?: (href: string) => string;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  translations?: SmartNavbarTranslations;
  onSearchTrigger?: () => void;
}
```

| Prop | Tipo | Requerida | Descripción |
|------|------|-----------|-------------|
| `session` | `GlobalNavbarSession \| null` | ✅ | Sesión del usuario. `null` = modo público minimalista |
| `links` | `SidebarLink[]` | ✅ | Enlaces de navegación central (ocultos en modo público) |
| `logoUrl` | `string \| null` | — | URL del logo del tenant activo. Fallback: icono Shield |
| `brandName` | `string` | — | Texto identidad (tenantId, nombre app, etc.). Fallback: `"ABD SYSTEM"` |
| `activeHref` | `string` | — | Pathname actual para marcar el link activo |
| `locale` | `string` | — | Locale actual (afecta textos `BUSCAR...`/`SEARCH...`). Default: `"en"` |
| `onLogout` | `() => void` | ✅ | Callback al cerrar sesión |
| `onLogin` | `() => void` | — | Callback al pulsar "INICIAR SESIÓN" (solo en modo público) |
| `transformHref` | `(href: string) => string` | — | Transformador de rutas. Útil para propagar query params (`?tenantId=X`). Default: identidad |
| `tenantSelectorSlot` | `React.ReactNode` | — | Slot para `<TenantSelector />` del satélite. Inyectado con Error Boundary aislado |
| `settingsSlot` | `React.ReactNode` | — | Slot para `<SystemSettings />`. Inyectado con Error Boundary aislado |
| `translations` | `SmartNavbarTranslations` | — | Traducciones localizadas. Ver sección de i18n |
| `onSearchTrigger` | `() => void` | — | Callback al pulsar el buscador o `Ctrl+K` |

### Slots vs Props

Los slots (`tenantSelectorSlot`, `settingsSlot`) permiten que cada satélite inyecte sus propios componentes con lógica de datos local (TenantSelector con datos de BD, SystemSettings con cookies/theme local). Cada slot está envuelto en un `SlotErrorBoundary` independiente:

- Si un slot falla (ej. error de consulta), se muestra un fallback visual seguro sin afectar al resto de la navbar.
- La `SmartNavbar` no importa datos de negocio directamente — es 100% agnóstica.

### Modo Público vs Privado

La navbar reacciona automáticamente al estado de `session`:

| Estado | Logo | Links | Search | TenantSelector | Settings | User Menu | Login Btn |
|--------|------|-------|--------|----------------|----------|-----------|-----------|
| `null` o `session.authenticated === false` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ (si `onLogin` existe) |
| `session.authenticated === true` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Comportamiento Hover y Mega-Menú

- **Hover**: Al pasar el ratón sobre un enlace/icono se abre el panel desplegable correspondiente tras 200ms de safe timeout.
- **Click-to-Lock**: Al hacer clic, el panel se ancla (locked). Permanece abierto aunque el cursor salga. Se cierra con:
  - Clic fuera del panel (click outside)
  - Tecla `Escape`
  - Clic en la misma pestaña (toggle off)
- **Escala Z-Index**: `z-40` (navbar) → `z-45` (progress bar) → `z-50` (dropdowns).

### Internacionalización (i18n)

```typescript
interface SmartNavbarTranslations {
  brandFallback?: string;   // Default: "ABD SYSTEM"
  logoutBtn?: string;       // Default: "TERMINAR SESIÓN"
  loginBtn?: string;        // Default: "INICIAR SESIÓN"
  searchLabel?: string;     // Default: "BUSCAR..."
  themeLabel?: string;      // Default: "TEMA"
  themeLight?: string;      // Default: "CLARO"
  themeDark?: string;       // Default: "OSCURO"
  themeSystem?: string;     // Default: "SISTEMA"
  profileLabel?: string;    // Default: "MI PERFIL"
  identityProvider?: string;// Default: "PROVEEDOR"
  statusOnline?: string;    // Default: "ONLINE"
  emailLabel?: string;      // Default: "EMAIL"
}
```

### Selectores `data-testid` para E2E

| Elemento | `data-testid` |
|----------|---------------|
| Barra contenedora | `smart-navbar` |
| Logo / identidad | `navbar-logo` |
| Enlaces de navegación | `navbar-link-idx-{index}` (ej. `navbar-link-idx-0`) |
| Botón de tema | `navbar-menu-theme` |
| Botón de usuario | `navbar-menu-user` |
| Buscador | `navbar-search-trigger` |
| Botón hamburguesa móvil | `navbar-mobile-toggle` |
| Drawer móvil | `navbar-mobile-drawer` |
| Panel desplegable | `navbar-dropdown` |

---

### Plantilla de Integración Estándar (Layout Server Component)

```tsx
// app/[locale]/layout.tsx
import { SmartNavbar } from "@ajabadia/ecosystem-widgets";
import type { GlobalNavbarSession, SidebarLink } from "@ajabadia/ecosystem-widgets";
import { TenantSelector } from "@/identity/TenantSelector"; // local
import { SystemSettings } from "@ajabadia/ecosystem-widgets";
import { getIndustrialSession } from "@/lib/auth";
import { resolveTenantBranding } from "@/lib/branding";
import { buildSidebarLinks } from "@/lib/links";

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session: GlobalNavbarSession | null = await getIndustrialSession();
  const branding = await resolveTenantBranding(session?.user?.tenantId);
  const links: SidebarLink[] = await buildSidebarLinks(session);
  // En App Router, obtener el pathname requiere headers() del servidor
  // o pasarlo desde la página. Alternativa: usar middleware para exponer x-pathname.
  const pathname = "/"; // Reemplazar con la lógica de pathname del satélite

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased navbar-top-layout">
        <SmartNavbar
          session={session}
          links={links}
          logoUrl={branding?.logoUrl}
          brandName={session?.user?.tenantId}
          activeHref={pathname}
          locale={locale}
          onLogout={async () => {
            "use server";
            // Importar server action local:
            // import { logoutAction } from "@/lib/auth";
            // await logoutAction();
          }}
          tenantSelectorSlot={
            session?.authenticated
              ? <TenantSelector sessionUser={session.user!} />
              : undefined
          }
          settingsSlot={<SystemSettings isAuthenticated={session?.authenticated ?? false} />}
          onSearchTrigger={() => {
            document.getElementById("command-palette-trigger")?.click();
          }}
          translations={{
            brandFallback: "MI APP",
            searchLabel: locale === "es" ? "BUSCAR..." : "SEARCH...",
          }}
        />
        {children}
      </body>
    </html>
  );
}
```

---

### Reglas de Estilo y Clases de Margen

1. **`navbar-top-layout`** debe ir en la etiqueta `<body>` **desde el servidor** (SSR). Aplica:
   ```css
   .navbar-top-layout {
     padding-top: 56px;
     padding-left: 0 !important;
   }
   ```
   Esto garantiza que el contenido no quede oculto detrás de la navbar fixed desde el primer render (sin FOUC).

2. **Prohibido**: Aplicar `padding-left`, `margin-left` o `pt-*` manuales en contenedores raíz de páginas. Todo el espaciado vertical lo gestiona `navbar-top-layout`.

3. **Colores y tipografías**: Usar exclusivamente variables CSS de `ABDStyles` (`--primary`, `--border`, `--background`, etc.). La navbar hereda automáticamente el branding del tenant a través de `<BrandingStyles />`.

---

## Dominios de Widgets

1. **Identity (`src/identity/`)**
   - `TenantSelector`: Dropdown para cambiar de organización/grupo.
   - `UserIdentity`: Widget de perfil con avatar y rol de usuario.

2. **Audit (`src/audit/`)**
   - `LiveLogViewer`: Consola de logs en tiempo real (SSE/Polling).
   - `AuditHistoryModal`: Historial detallado de cambios de una entidad.
   - `ActionBadge`: Píldora de estado semántica.
   - `AuditDeltaViewer`: Comparador de deltas JSON.

3. **Navigation (`src/navigation/`)**
   - `SmartNavbar`: Barra de navegación superior unificada (reemplaza `GlobalNavbar` + `IndustrialTopBar`).
   - `CommandPalette`: Paleta de comandos (Ctrl+K) con búsqueda fuzzy.
   - `GlobalNavbar`: *(legacy)* Barra lateral colapsable — pendiente de migrar a `SmartNavbar`.
   - `GlobalFooter`: Pie de página global.
   - `IndustrialTopBar`: *(legacy)* Barra superior flotante — pendiente de migrar a `SmartNavbar`.
   - `buildSidebarLinks`: Helper para construir enlaces de navegación.

4. **Settings (`src/settings/`)**
   - `SystemSettings`: Preferencias de sistema, temas e idioma.

## Arquitectura

Para mantener la limpieza arquitectónica, los componentes de negocio (Widgets) se empaquetan y versionan independientemente de los tokens de estilo (`@ajabadia/styles`). Todos los widgets están protegidos con `'use client'` para garantizar compatibilidad con RSC.
