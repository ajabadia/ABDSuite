# 🚀 PROMPT 2: Integración Gráfica de Satélites (`ABDAuth`, `ABDQuiz`, `ABDtenantGobernance`)

**Objetivo**: Sincronizar y limpiar los estilos locales en cada aplicación satélite consumiendo el core centralizado de la librería.

---

## 🛠️ Tareas a Ejecutar en Cada Satélite (Una a una)

### Paso 1: Actualizar la Dependencia
Actualiza la versión de la librería instalada en tu repositorio local para forzar a npm a descargar la última versión de la rama principal de GitHub:
```powershell
# Borra la caché e instala la última referencia
npm install github:ajabadia/ABDStyles#main
```

### Paso 2: Limpieza de Estilos Locales y Mapeo en `globals.css`
Abre `src/app/globals.css` (o `src/app/[locale]/globals.css` según corresponda). 

1. **Importación del Core**: Si utilizas Next.js 16 con Turbopack, la resolución directa de subpath exports de `@import "@abd/styles/..."` puede fallar. En su lugar, importa el CSS con la ruta relativa directa al directorio `node_modules`:
```css
@import "tailwindcss";

/* 🛠️ Carga del Core de Estilos Unificados de la Suite */
@import "../../node_modules/@abd/styles/dist/styles/industrial-core.css";
```

2. **Mapeo de Variables de Tema en Tailwind v4**: Dado que Tailwind v4 no utiliza un archivo `tailwind.config.js` y procesa todo en CSS, debes mapear de forma explícita las variables HSL de `:root` de la librería compartida a las clases de utilidad en el bloque `@theme inline`:
```css
@theme inline {
  --radius-xl: calc(var(--radius) + 1px);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 1px);
  --radius-sm: calc(var(--radius) - 2px);

  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
}

@layer base {
  body {
    @apply bg-background text-foreground antialiased selection:bg-primary/30 transition-colors duration-300;
  }
}
```

### Paso 3: Consumo de Componentes de UI Compartidos (Patrón Wrapper Cliente)
Dado que los layouts principales suelen ser Server Components, no pueden pasar funciones interactivas ni consumir hooks del lado del cliente de forma directa. La mejor práctica es mantener los archivos locales `src/components/TacticalSidebar.tsx` y `src/components/ui/SystemSettings.tsx` como **wrappers cliente** (`"use client"`) que importen las implementaciones correspondientes de `@abd/styles` y les inyecten los hooks y traducciones locales de la aplicación:

```tsx
// src/components/ui/SystemSettings.tsx
"use client";

import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSession, signIn, signOut } from "next-auth/react";
import { SystemSettings as SharedSystemSettings } from "@abd/styles";

export function SystemSettings() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const { status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SharedSystemSettings
      locale={locale}
      onLocaleChange={(newLoc) => router.replace(pathname, { locale: newLoc })}
      theme={theme}
      onThemeChange={setTheme}
      isAuthenticated={status === "authenticated"}
      onLogin={() => signIn()}
      onLogout={() => signOut({ callbackUrl: "/" })}
      translations={{
        title: t("title"),
        close: t("close"),
        language: t("language"),
        theme: t("theme"),
        // Mapeo seguro de claves locales (ej. snake_case en archivos locales de i18n)
        themeLight: t("theme_light"),
        themeDark: t("theme_dark"),
        themeSystem: t("theme_system"),
        logout: t("logout"),
        login: t("login"),
      }}
    />
  );
}
```

```tsx
// src/components/TacticalSidebar.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import { TacticalSidebar as SharedTacticalSidebar } from "@abd/styles";
import { LayoutDashboard, Users, Shield, ScrollText, Key } from "lucide-react";

export function TacticalSidebar({ user, logoUrl, locale }: { user: any; logoUrl?: string | null; locale: string }) {
  const t = useTranslations("dashboard.menu");
  const common = useTranslations("common");
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: t("overview"), icon: <LayoutDashboard size={14} /> },
    { href: "/dashboard/security", label: t("security"), icon: <Key size={14} /> },
  ];

  return (
    <SharedTacticalSidebar
      user={user}
      links={links}
      logoUrl={logoUrl}
      onLogout={() => signOut({ callbackUrl: "/" })}
      brandName={user.tenantId || common("brand")}
      LinkComponent={Link as any}
      activeHref={pathname}
      translations={{
        brandFallback: common("brand"),
        logoutBtn: "TERMINAR SESIÓN",
        identityProvider: "IDENTITY PROVIDER",
        statusOnline: "ONLINE",
        emailLabel: "EMAIL",
      }}
    />
  );
}
```

Luego, en el Server Layout de tu satélite, simplemente instancia los componentes locales wrapper:
```tsx
import { TacticalSidebar } from "@/components/TacticalSidebar";
import { SystemSettings } from "@/components/ui/SystemSettings";
```

### Paso 4: Ajustar Cabeceras a variante de `STYLE_GUIDE.md`
Alinea todas las cabeceras (`<header>`) de tus vistas internas para que utilicen exactamente las clases y los breadcrumbs con animaciones descritos en el estándar de la guía de estilos del ecosistema:
*   Variante A (Dashboard): Con breadcrumb monospace parpadeante y sin botón de retorno.
*   Variante B (Detalles): Con botón de retorno aséptico de bordes afilados (`ArrowLeft`).

### Paso 5: Ejecutar Auditoría
Una vez integrados los cambios visuales, ejecuta el comando de auditoría local de tu proyecto para certificar que todo compile y no existan errores de lintado o tipos:
```powershell
npm run dev
# Verifica visualmente que la tipografía Geist, el fondo y la rejilla se apliquen perfectamente
```

### Paso 6: Migración de Linter a ESLint 9 (Flat Config)
Si el satélite se encuentra en Next.js 15+ / ESLint 9+, evita el uso de `FlatCompat` de `@eslint/eslintrc` para importar las reglas de Next.js, ya que provoca un crash de tipo `Converting circular structure to JSON` cuando el linter intenta formatear errores. 

Utiliza la integración directa de flat config en `eslint.config.mjs`:
```javascript
import nextConfig from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "eslint.config.mjs"
    ]
  }
];

export default eslintConfig;
```

### Paso 7: Validación de Esquemas e Incompatibilidades de Tipos
1. **Esquema de Tenant:** Asegúrate de que `TenantIdSchema` en Zod permita de forma explícita el valor centinela `'GLOBAL'` para super-administradores y `'system'` para integraciones internas. De lo contrario, las sesiones activas fallarán silenciosamente al persistir en MongoDB.
2. **Tipado de la función `t`:** Al pasar funciones de traducción a componentes hijos en TypeScript, evita el uso de `any`. Declara el tipo del parámetro de valores como `Record<string, string | number | Date>` para coincidir exactamente con el tipado de `Translator` de `next-intl`:
   ```typescript
   t: (key: string, values?: Record<string, string | number | Date>) => string;
   ```
