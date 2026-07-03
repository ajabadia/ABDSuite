# 🎮 INSTRUCCIONES DEL SISTEMA: Estandarización de Código y Estilo Industrial (Suite ABD)

Este prompt debe copiarse y pegarse al inicio del contexto de cualquier desarrollador o agente de IA encargado de **crear nuevas aplicaciones** o **implementar nuevas características** en el ecosistema de la Suite ABD. Garantiza el cumplimiento de las leyes de estilo de instrumentación técnica, la integración de dependencias centralizadas y el pase exitoso de los pipelines de auditoría.

---

```markdown
# ESPECIFICACIÓN TÉCNICA Y DE ESTILO GLOBAL: SUITE ABD

Estás trabajando en la suite de aplicaciones industriales de **ABD** (ej. ABDAuth, ABDQuiz, ABDtenantGovernance). Tu código debe cumplir estrictamente con el lenguaje estético de **consola técnica de alta precisión (Tech-Noir)**, las leyes de modularidad del ecosistema y los pipelines de validación automática.

---

## 🎨 1. INTEGRACIÓN CROMÁTICA Y DEPENDENCIAS DE ESTILOS

1. **Instalación de las Bibliotecas Centrales**:
   El ecosistema se apoya en tres paquetes publicados bajo el scope **npm** `@ajabadia/` (NO `@abd/`). Añade estas dependencias obligatorias a tu `package.json`:
   ```json
   "dependencies": {
     "@ajabadia/styles": "^1.0.15",
     "@ajabadia/satellite-sdk": "^1.0.11",
     "@ajabadia/ecosystem-widgets": "^1.0.10"
   }
   ```
   *Nota: Instala siempre con `pnpm install`. El paquete `@ajabadia/styles` contiene los tokens y CSS industriales; `@ajabadia/ecosystem-widgets` contiene los componentes SmartNavbar, CommandPalette, ConfirmDialog, etc.; y `@ajabadia/satellite-sdk` gestiona la autenticación federada.*

2. **Unificación de globals.css (Tailwind CSS v4)**:
   El archivo `src/app/globals.css` debe ser **mínimo**. Todo el diseño de tokens, temas y variables HSL se hereda del core centralizado. NO definas variables HSL locales ni `@theme inline`:
   ```css
   @import "tailwindcss";
   @import "tw-animate-css";
   @import "@ajabadia/styles/dist/styles/industrial-core.css";
   ```

3. **Prohibición de Colores Fijos**:
   *No utilices clases de Tailwind con colores hardcodeados (como `bg-neutral-900`, `text-blue-500` o `#ffffff`)*. Todos los componentes deben heredar de forma fluida los tokens cromáticos: `bg-background`, `bg-card`, `text-primary`, `text-muted-foreground`, `border-border`.

---

## 📐 2. LEYES DE DISEÑO Y MAQUETACIÓN (STYLE_GUIDE.md)

### A. El Contenedor Base
Todas las páginas operativas deben utilizar exactamente la misma envoltura de chasis superior para evitar colisiones físicas con la barra fija y asegurar alineación horizontal simétrica:
*   **Contenedor `<main>`**: `className="min-h-screen bg-background text-foreground navbar-top-layout px-6 lg:px-12 selection:bg-primary/30" role="main"`
    * *Nota: La clase `.navbar-top-layout` (de `@ajabadia/styles`) aplica `pt-24 pb-12` para separar la vista de la barra superior.*
*   **Envoltura Interna**: `className="max-w-7xl mx-auto flex flex-col gap-10"`

### B. Arquitectura de Cabeceras (`<header>`)
*   **Variante A (Dashboard / Raíz):**
    *   Flex container con `gap-2 mb-2` + `LucideIcon` de `size={14}` con animación `text-primary animate-pulse`.
    *   Breadcrumb: `{t('control_console')} • DASHBOARD` en `font-mono text-[10px] font-black uppercase tracking-[0.25em] text-primary`.
    *   Título: `text-3xl font-black uppercase italic tracking-tight text-foreground leading-none`.
    *   Subtítulo: `text-sm text-muted-foreground font-sans mt-2 leading-relaxed`.
*   **Variante B (Vista Detalle / Operativa con Retorno):**
    *   Mismo breadcrumb superior con el nombre de la página correspondiente.
    *   Fila del título con un botón de retroceso (`ArrowLeft` de `size={14}`) en un enlace `<Link>` estilizado:
        `className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"`
    *   Título alineado a la derecha del botón en `text-3xl font-black uppercase italic tracking-tight flex-1 truncate`.

### C. Mandos y Controles Industriales
*   **Bordes Afilados**: Todo elemento UI (botones, inputs, cards, dropdowns) debe usar esquinas afiladas `rounded-none` o `rounded-sm` (máx. `0.15rem`).
*   **Casing**: Los textos de botones de acción y tags de estado van obligatoriamente en **MAYÚSCULAS** (`uppercase`) y en tipografía `font-mono`.
*   **Inputs**: Contenedor con altura media (`h-10`), fondo ligeramente opaco (`bg-secondary/30`), borde fino (`border-border`), foco activo con anillo de luz difusa (`focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none`).
*   **Tablas Técnicas**: Bordes divisorios limpios (`divide-y divide-border/60`), fila de encabezado en `bg-secondary/40` con celdas `<th>` en `font-mono text-[9px] font-black text-muted-foreground uppercase`. Las columnas con UUIDs, IPs o códigos de máquina deben renderizarse en `font-mono text-[10px] text-muted-foreground/80`.

---

## ⚙️ 3. PATRÓN DE CONSUMO DEL CHASIS SUPERIOR UNIFICADO (`AppSidebarNavigation`)

**Queda PROHIBIDO** importar directamente `SmartNavbar` en el layout de una aplicación satélite. El ecosistema exige un **Wrapper Local Obligatorio** a través de `AppSidebarNavigation` desde el primer día de scaffolding para garantizar simetría absoluta, autenticación federada y branding sin parpadeos.

### A. Archivos Obligatorios del Layout Ecosistema

Cada satélite debe contener estos 8 archivos base para la estructura de layout:

| Archivo | Tipo | Propósito |
| :--- | :--- | :--- |
| `src/app/layout.tsx` | RSC | Layout raíz de Next.js. Obtiene sesión con `getIndustrialSession()`. Pasa `initialSession` a `<SessionProvider>` (cliente) y renderiza `<BrandingStyles />` en `<head>`. |
| `src/app/[locale]/layout.tsx` | RSC | Layout localizado. Envuelve el children con `<NextIntlClientProvider>`, inyecta `<SidebarNavigation>` (wrapper), `<TenantSelector>`, `<SystemSettings>` y `<LogsCommandPalette>`. Renderiza también `<NextTopLoader>` y `<Toaster>`. |
| `src/components/ThemeProvider.tsx` | RCC | Wrapper de `next-themes` con tema forzado `dark`. |
| `src/components/layout/SidebarNavigation.tsx` | RCC | **Wrapper OBLIGATORIO** de `<AppSidebarNavigation>` (de `@ajabadia/ecosystem-widgets`). Define los enlaces locales, las props de configuración y los overrides (sesión, `appBadge`, `transformHref`, `translations`). |
| `src/components/ui/SystemSettings.tsx` | RCC | Wrapper de `<SystemSettings>` compartido (de `@ajabadia/ecosystem-widgets`). Inyecta `next-themes`, `next-intl` y los handlers de login/logout locales. |
| `src/components/ui/TenantSelector.tsx` | RCC | Wrapper del componente compartido `<TenantSelectorConnector>`. |
| `src/components/layout/LogsCommandPalette.tsx` | RCC | Instancia local de `<CommandPalette>` que define los comandos de navegación específicos del satélite. |
| `src/app/api/auth/[...auth]/route.ts` | API | Catch-all de autenticación usando `createAuthRouteHandler()` del SDK. |

### B. Ejemplo de Layout Raíz (`src/app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getIndustrialSession, BrandingStyles } from "@ajabadia/satellite-sdk";
import { SessionProvider } from "@ajabadia/satellite-sdk/client";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NombreApp | Descripción de la suite",
  description: "Descripción SEO del satélite.",
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const session = await getIndustrialSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head><BrandingStyles /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SessionProvider initialSession={session}>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### C. Ejemplo de Layout Localizado (`src/app/[locale]/layout.tsx`)

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { LogsCommandPalette } from "@/components/layout/LogsCommandPalette";

import { getIndustrialSession } from '@ajabadia/satellite-sdk';
import { resolveTenantBranding } from "@ajabadia/satellite-sdk";

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }>; }) {
  const { locale } = await params;
  const messages = await getMessages();
  const session = await getIndustrialSession();
  const branding = await resolveTenantBranding();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <NextTopLoader color="hsl(var(--primary))" height={2} showSpinner={false} zIndex={45} speed={200} />
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
        <SidebarNavigation
          session={session}
          logoUrl={branding?.logoUrl}
          tenantSelectorSlot={<TenantSelector sessionUser={session?.user} />}
          settingsSlot={<SystemSettings isAuthenticated={session.authenticated} />}
        />
        <LogsCommandPalette />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </div>
    </NextIntlClientProvider>
  );
}
```

### D. Ejemplo de Wrapper `SidebarNavigation.tsx`

Este archivo **NO** debe importar directamente `SmartNavbar`. Es un wrapper local obligatorio que mapea los enlaces y configuraciones del satélite al componente genérico `AppSidebarNavigation`. El componente compartido maneja internamente el RBAC, locale stripping, cambio de idioma y búsqueda.

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { AppSidebarNavigation, type AppSidebarLink } from '@ajabadia/ecosystem-widgets';
import { Home } from 'lucide-react';

interface SidebarNavigationProps {
  session: any;
  logoUrl?: string | null;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  notificationsSlot?: React.ReactNode;
  onLogin?: () => void;
  onLogout?: () => void;
  transformHref?: (href: string) => string;
  appBadge?: string;
  translations?: Record<string, string>;
}

export function SidebarNavigation({ session, logoUrl, tenantSelectorSlot, settingsSlot, notificationsSlot, onLogin, onLogout, transformHref, appBadge, translations }: SidebarNavigationProps) {
  const t = useTranslations('common');

  // Define los enlaces locales del satélite (sin prefijo locale, AppSidebarNavigation lo añade)
  const allLinks: AppSidebarLink[] = [
    { href: '/', label: t('home'), icon: <Home size={14} /> },
    // Añade aquí los enlaces propios del satélite (ej. /dashboard, /admin, etc.)
  ];

  return (
    <AppSidebarNavigation
      session={session}
      logoUrl={logoUrl || null}
      links={allLinks}
      brandName={t('appTitle') || 'ABD SYSTEM'}
      appBadge={appBadge}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
      notificationsSlot={notificationsSlot}
      onLogin={onLogin}
      onLogout={onLogout}
      transformHref={transformHref}
      translations={translations}
    />
  );
}
```

> **Nota**: `AppSidebarNavigation` se encarga automáticamente de:
> *   Stripping del prefijo locale del pathname
> *   Filtrado RBAC via `buildSidebarLinks(links, user?.role, isLoggedIn)`
> *   Cambio de locale (cookie `NEXT_LOCALE` + navegación)
> *   Dispatch de `CustomEvent('abd-command-palette-open')` para la paleta de comandos
> *   Traducciones por defecto ES/EN con merge de overrides vía prop `translations`

---

## 🛡️ 4. REGLAS DE CONSTRUCCIÓN E HIGIENE ESTÁTICA (FIRE RULES)

1. **`FIRE:MAX_LINES`**: Ningún componente o archivo de código de UI debe superar las **150 líneas**. Divide y modulariza los subcomponentes de forma lógica (extrayendo cuadros de diálogo, modales, formularios o tarjetas a subcarpetas dedicadas).
2. **`FIRE:I18N_VIOLATION`**: Queda prohibido hardcodear cadenas literales visibles en el JSX. Todo texto descriptivo, etiqueta de breadcrumb o mensaje de error debe resolverse a través de `useTranslations` (`next-intl`).
   *Al tipar hooks o funciones de traducción, utiliza firmas estrictas para evitar `any`:*
   ```typescript
   t: (key: string, values?: Record<string, string | number | Date>) => string;
   ```
3. **`FIRE:A11Y_VIOLATION`**: Los elementos interactivos interactivos sin texto deben tener un atributo descriptivo `aria-label` (como los botones de retroceso o descartes) y todas las etiquetas `<img>` deben incluir una descripción de accesibilidad `alt`.
4. **`FIRE:NO_EMBEDDED_CSS/SCRIPTS`**: No inyectes bloques locales `<style>` ni scripts inline dentro de las páginas o layouts. Las texturas visuales complejas (como la rejilla o grain) deben consumirse a través de las clases utilitarias provistas por `@ajabadia/styles`.
5. **Sanitización del Backend:** Al recibir configuraciones visuales del Tenant, valida siempre las propiedades usando los esquemas de Zod expuestos por la biblioteca (`brandingSchema`) para evitar inyecciones maliciosas de CSS perimetral.

---

## 📝 5. CONFIGURACIÓN DE LINTERS Y VALIDACIONES

*   **Configuración de ESLint 9 (Flat Config):**
    Para evitar bucles de serialización circular en Next.js 15+, no uses wrappers de compatibilidad retroactiva (`FlatCompat`) para las reglas integradas de Next.js. Decláralo directamente en tu `eslint.config.mjs`:
    ```javascript
    import nextConfig from 'eslint-config-next/core-web-vitals';

    const eslintConfig = [
      ...nextConfig,
      {
        rules: {
          "no-console": "warn",
          "@typescript-eslint/no-explicit-any": "error"
        }
      },
      {
        ignores: ["**/.next/**", "**/node_modules/**", "eslint.config.mjs"]
      }
    ];

    export default eslintConfig;
    ```

---

## 🏁 6. PIPELINE DE AUDITORÍA Y CERTIFICACIÓN

Antes de dar por completada una tarea o hacer push de los cambios, es obligatorio ejecutar la herramienta local de certificación de calidad en la raíz del proyecto para asegurar que no se introducen regresiones de tipo, sintaxis o estilo:

```powershell
# En entornos locales (delega al script centralizado en ABD Suite\utilidades\scripts\)
powershell -File scripts/abd-audit.ps1
# O a través del script de package.json
pnpm run full-audit
```

Si el pipeline no devuelve `SYSTEM CERTIFIED [OK]`, debes corregir de forma inmediata los errores indicados en `abd-audit-results.log`. El motor centralizado valida automáticamente si el proyecto actual es una librería o una aplicación cliente para ajustar las fases de certificación.

---

## 7. INTEGRACIÓN Y SEGURIDAD DE SESIÓN SSO (SATELLITE SPECS)

Todas las aplicaciones satélite del ecosistema ABD (ej. `ABDQuiz`, `ABDtenantGovernance`) deben utilizar de forma obligatoria el SDK centralizado **`@ajabadia/satellite-sdk`** en lugar de duplicar lógica de desencriptado JWT o comprobación de dominios.

1. **Instalación y Variables**:
   * Agrega la dependencia en `package.json`: `"@ajabadia/satellite-sdk": "github:ajabadia/ABDSatelliteSDK#main"`.
   * Variables requeridas en `.env`: `NEXT_PUBLIC_APP_ID`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_JWT_SECRET` y `AUTH_PROVIDER_URL`.
2. **Next.js proxy.ts (antes middleware.ts)**:
   * Envuelve tu middleware con `withIndustrialAuth(options)` exportándolo desde `src/proxy.ts` para proteger de forma centralizada todas las rutas y realizar la verificación del `allowedApps` y la validación de expiración/firma.
3. **Manejador de Rutas de Autenticación**:
   * Crea un archivo catch-all en `src/app/api/auth/[...auth]/route.ts` usando `createAuthRouteHandler(options)` para automatizar callbacks OAuth2, solicitudes de estado de sesión y borrado seguro de cookies.
4. **Branding e Inyección Dinámica sin parpadeos (Zero-FOUC)**:
   * El layout raíz del proyecto debe incluir el componente servidor `<BrandingStyles />` importado de `@ajabadia/satellite-sdk` dentro de la etiqueta `<head>`. Esto resuelve el branding del subdominio actual de forma síncrona en el servidor para evitar saltos estéticos.
5. **Acceso a Sesión**:
   * **Server-Side**: Usa `getIndustrialSession()` o `ensureIndustrialAccess(role)` para proteger de forma declarativa layouts y Server Actions.
   * **Client-Side**: Envuelve el árbol del DOM con `<SessionProvider>` y consume la sesión usando el hook `useSession()`.
6. **Aislamiento Físico en Base de Datos**:
   * Todas las consultas del backend a bases de datos compartidas que traten con entidades de negocio deben incluir explícitamente el filtro por el Tenant de la sesión verificada obtenida del SDK:
     ```typescript
     const data = await Model.find({ tenantId: session.user.tenantId });
     ```
7. **Prevención de Bucles de Redirección (SSO Loop Prevention)**:
   * El SDK gestiona internamente la limpieza de cookies y la redirección con parámetros de error hacia `ABDAuth` para evitar bucles infinitos.
   * Adicionalmente, el resolutor de subdominios excluye explícitamente los subdominios de sistema (`auth`, `logs`, `quiz`, `analytics`, `tenantgovernance`, `www`, `landing`) para que no se traten erróneamente como nombres de tenant, previniendo fallos de `tenant_not_found` y bucles infinitos en redirecciones de logout.
8. **Referencia Completa**:
   * Para consultar la guía de integración rápida y firmas de API, lee `D:\desarrollos\ABDSuite\ABDSatelliteSDK\docs\INTEGRATION_PROMPT.md` y `D:\desarrollos\ABDSuite\ABDSatelliteSDK\docs\TECHNICAL_DOCUMENTATION.md`.
9. **Separación Server / Client en el SDK**:
   * `BrandingStyles` es un **React Server Component** — importar desde `@ajabadia/satellite-sdk` (nunca en archivos `'use client'`).
   * `SessionProvider` y `useSession` son client-only — importar desde `@ajabadia/satellite-sdk/client`.
   * En el layer RSC de Turbopack, evita `import React from 'react'`; usa siempre el shorthand JSX `<>...</>` que solo depende de `react/jsx-runtime`.

```

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/Mapa_Global_Suite.md]]
