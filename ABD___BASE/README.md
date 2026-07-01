# 🧬 ABD___BASE - Scaffold Base para Satélites del Ecosistema ABD

Plantilla base (`scaffold`) preconfigurada para la creación de nuevos satélites dentro del **Ecosistema ABD**. Proporciona toda la infraestructura compartida lista para usar, permitiendo enfocarse en la lógica de negocio específica del nuevo microservicio.

---

## 🚀 Propósito

`ABD___BASE` actúa como punto de partida oficial para cualquier nuevo satélite del ecosistema. Incluye:

- **Autenticación Federada**: Middleware `withIndustrialAuth` del SDK preconfigurado con `@ajabadia/satellite-sdk`.
- **Internacionalización**: `next-intl` configurado con enrutamiento por prefijo de idioma (`/[locale]`) y `@ajabadia/i18n` como fuente de traducciones.
- **Estilos Compartidos**: Integración completa con `@ajabadia/styles` (tema dinámico SSR, Zero-FOUC).
- **Componentes UI**: `@ajabadia/ecosystem-widgets` disponible para SmartNavbar y demás componentes de negocio.
- **Persistencia**: MongoDB/Mongoose con soporte multi-tenant (`getTenantModel`).
- **Validaciones**: Zod para esquemas de datos en runtime.
- **Proxy Guard**: Protección de rutas con `withIndustrialAuth` y paths públicos configurables.

---

## 🛠️ Guía de Inicio Rápido

### Requisitos Previos
Configurar las variables de entorno en el archivo `.env.local`:
```env
NEXT_PUBLIC_APP_ID="my-new-satellite"
MONGODB_URI=mongodb+srv://...
DATABASE_URL=mongodb+srv://...
AUTH_CLIENT_ID=your-client-id
AUTH_CLIENT_SECRET=your-client-secret
AUTH_JWT_SECRET=abd-suite-shared-secret
```

### Comandos de Desarrollo
```powershell
# Iniciar servidor de desarrollo en el puerto 3900
.\start.bat
```

```powershell
# Validar tipos y compilación
pnpm build
```

```powershell
# Ejecutar suite de tests
pnpm test
```

### Personalización para un Nuevo Satélite

1. **`package.json`**: Cambiar `name` y versión. Ajustar puerto en `dev` script.
2. **`src/proxy.ts`**: Actualizar `appId` y `publicPaths` según las rutas públicas del nuevo satélite.
3. **`src/i18n/`**: Añadir las traducciones específicas del nuevo módulo en los mensajes de `@ajabadia/i18n`.
4. **`src/models/`**: Definir los esquemas Mongoose propios del nuevo satélite.
5. **`src/app/[locale]/`**: Construir las páginas y layouts de la aplicación.

---

## 📁 Estructura del Proyecto (`src/`)

*   `src/app/[locale]/`: Enrutador Next.js localizado.
*   `src/actions/`: Server Actions (`'use server'`) para interacción con base de datos.
*   `src/components/`: Componentes de UI modulares.
*   `src/models/`: Esquemas Mongoose (vacíos por defecto — definir según el satélite).
*   `src/services/`: Capa de lógica de negocio.
*   `src/lib/`: Utilidades compartidas (`abac.ts`, `format.ts`, `tenant-context.ts`, `utils.ts`).
*   `src/i18n/`: Configuración de `next-intl` (`request.ts`, `routing.ts`).
*   `src/hooks/`: Hooks personalizados de React.
*   `src/proxy.ts`: Middleware de autenticación federada.

---

## 📜 Stack Tecnológico Preconfigurado

- **Framework**: Next.js 16 (App Router)
- **Autenticación**: `@ajabadia/satellite-sdk` (SSO federado con ABDAuth)
- **Estilos**: Tailwind CSS v4 + `@ajabadia/styles`
- **Componentes**: `@ajabadia/ecosystem-widgets`
- **i18n**: `next-intl` + `@ajabadia/i18n`
- **Persistencia**: Mongoose 9 + MongoDB
- **Validaciones**: Zod 4
- **Testing**: Vitest

---

## 📖 Documentación Relacionada

*   [Guía de Integración del SDK](https://github.com/ajabadia/ABDSatelliteSDK)
*   [Especificaciones Técnicas de la Suite](../ABD-Suite-DOCS/01_active_specs/)
*   [Roadmap Central del Ecosistema](../ABD-Suite-DOCS/01_active_specs/ROADMAP.md)
