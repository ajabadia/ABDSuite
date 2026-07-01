# 📊 ABD Analytics Microservice (ABDBoard)

[![ERA 11 Certified](https://img.shields.io/badge/ERA%2011-CERTIFIED-brightgreen?style=for-the-badge&logo=shield)](../.github/workflows/audit.yml)

Consola unificada de analíticas, KPIs de negocio, reportes de cumplimiento y firma criptográfica de certificados para todo el ecosistema **ABD**.

---

## 🚀 Arquitectura y Tecnologías
El microservicio está desarrollado bajo los estándares de la suite y aprovecha la infraestructura compartida:

*   **Next.js 16.2.6 & React 19**: Server Components (RSC) y optimizaciones de renderizado.
*   **Mongoose & Multi-DB Pooling**: Conexión dinámica a bases de datos de inquilinos (`getTenantModel` y `AsyncLocalStorage`).
*   **Next-Intl**: Soporte multilingüe completo (Inglés / Español) mediante enrutamiento localizado con prefijos de idioma (`/[locale]`).
*   **Firma Criptográfica**: Generación de reportes PDF firmados con hash SHA-256 e integración con la blockchain de **ABDLogs** para verificación de autenticidad inmutable por código QR.

---

## 🛠️ Guía de Inicio Rápido

### Requisitos Previos
Configurar las variables de entorno en el archivo `.env.local`:
```env
NEXT_PUBLIC_APP_ID="analytics"
MONGODB_URI=mongodb+srv://...
DATABASE_URL=mongodb+srv://...
NEXT_PUBLIC_APP_URL=http://localhost:5004
```

### Comandos de Desarrollo
Para arrancar el servidor local en el puerto oficial **`5004`**:
```powershell
# Levantar el entorno local
.\start.bat
```

Para validar tipos estáticos, compilación y empaquetado de producción:
```powershell
pnpm build
```

---

## 📜 Manifestos del Proyecto
*   **[ROADMAP.md](file:///d:/desarrollos/ABDAnalytics/ROADMAP.md)**: Planificación estratégica y próximos hitos del portal de analítica.
