# ABDLanding

[![ERA 11 Certified](https://img.shields.io/badge/ERA%2011-CERTIFIED-brightgreen?style=for-the-badge&logo=shield)](../.github/workflows/audit.yml)

Esta es la landing page principal corporativa de **ABD Suite** (disponible en `abdia.es`).

## Propósito

Presentar el ecosistema **ABD Suite** como una suite empresarial multipropósito de alto rendimiento, proporcionando acceso centralizado y de marca blanca a las aplicaciones e infraestructuras del ecosistema.

## Especificaciones Técnicas

- **Framework:** Next.js 16 (App Router)
- **Tema:** Soporte nativo para modo claro y oscuro (`next-themes` y `@ajabadia/styles`)
- **i18n:** Soporte multilingüe completo (español e inglés) mediante `next-intl`
- **Puerto de desarrollo local:** `5000`

## Scripts disponibles

- `pnpm dev`: Inicia el servidor de desarrollo local en http://localhost:5000
- `pnpm build`: Genera la build de producción optimizada
- `pnpm start`: Arranca el servidor de producción
- `pnpm full-audit`: Ejecuta las pruebas estructurales de seguridad y calidad del código
