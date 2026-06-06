# ⚙️ PLAN DE ARQUITECTURA: Microservicio Central de Auditoría (ABDLogs)

Este documento especifica la estructura, el proceso de creación y las rutas de integración para el nuevo microservicio **`ABDLogs`**, el cual centralizará la ingesta, almacenamiento y visualización de logs de auditoría técnica y operacional de todo el ecosistema ABD.

---

## 🏗️ 1. Estrategia de Creación (Clonación de Carcasa)

Para mantener la consistencia estética y de linters de la suite Next.js 16 / Tailwind v4 / TypeScript / next-intl, **`ABDLogs`** se inicializará duplicando el repositorio de **`ABDtenantGobernance`**.

### 📋 Pasos de Preparación Inicial
1. Duplicar la carpeta completa `ABDtenantGobernance` y nombrarla `ABDLogs`.
2. En la raíz de `ABDLogs`, modificar `package.json` para renombrar el proyecto:
   ```json
   "name": "abd-logs"
   ```
3. Limpiar la carpeta `.next/` y ejecutar la instalación de dependencias:
   ```bash
   pnpm install
   ```

---

## 🧹 2. Manifiesto de Limpieza y Conservación

Para purgar el código de gobernanza y dejar la estructura limpia para el servicio de logs:

### 🔴 QUÉ BORRAR (Eliminar del proyecto)
*   **Modelos de Base de Datos**: Borrar todos los esquemas en `src/models/` excepto `AuditLog.ts` (eliminar `Space.ts`, `Organization.ts`, etc.).
*   **Server Actions**: Borrar todos los archivos en `src/actions/` (acciones de creación de espacios, invitaciones, etc.).
*   **Rutas de UI específicas**:
    *   Borrar las subcarpetas de rutas dentro de `src/app/[locale]/dashboard/` (como `spaces`, `settings`, `members`, etc.).
*   **Componentes Operativos**: Borrar los componentes de UI en `src/components/` que pertenezcan a la gobernanza (vistas de rejillas de espacios, formularios CRUD, etc.).

### 🟢 QUÉ CONSERVAR (Mantener intacto)
*   **Configuraciones de Base**: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs` y el script de auditoría `scripts/abd-audit.ps1`.
*   **Conexión a Base de Datos**: `src/lib/db.ts` (conexión Mongoose).
*   **Integración de Estilos**: El consumo de `@abd/styles` (`industrial-core.css`).
*   **Módulo de Seguridad SSO**:
    *   `src/proxy.ts` (validador de ruta y Cross-Tenant Guard).
    *   `src/lib/token-verifier.ts` y `src/lib/session.ts` (lectura y firma criptográfica del JWT de sesión).
*   **Idiomas / Localización**: La carpeta `messages/` y la configuración de `next-intl` (adaptando las claves de traducción del panel de visualización de logs).

---

## 💾 3. Diseño del Modelo de Datos Central (`AuditLog`)

En `src/models/AuditLog.ts`, mantener una única colección centralizada que unifique todas las operaciones del sistema.

### Esquema Mongoose (`src/models/AuditLog.ts`)
```typescript
import { Schema, model, models, Document } from 'mongoose';

export interface IAuditLog {
  appId: string;                        // Aplicación origen: 'auth', 'quiz', 'gobernanza'
  tenantId: string;                     // ID de la organización o 'SYSTEM' para operaciones globales
  action: string;                       // Ej: 'USER_LOGIN', 'SSO_HANDSHAKE_GRANTED', 'EXAM_CREATED'
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM';
  entityId: string;                     // ID de la entidad afectada
  userId: string;                       // ID del operador (actor)
  userEmail: string;                    // Email del operador
  changedFields: Record<string, unknown>; // Metadatos dinámicos del evento
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

const AuditLogSchema = new Schema<IAuditLog>({
  appId: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  changedFields: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Índice compuesto para telemetría rápida por organización y tiempo
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog = models.AuditLog || model<IAuditLogDocument>('AuditLog', AuditLogSchema, 'central_audit_logs');
```

---

## 📡 4. Desarrollo de Endpoints API de Ingesta

El microservicio expondrá una API REST protegida por un token secreto de comunicación inter-servicio.

### 📂 Crear `src/app/api/logs/route.ts`
Endpoint para la ingesta asíncrona de logs desde las aplicaciones satélite:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  // 🛡️ Seguridad Inter-servicio
  const authHeader = request.headers.get('Authorization');
  const systemToken = process.env.LOGS_SECRET_TOKEN || 'shared-system-token-2026';

  if (!authHeader || authHeader !== `Bearer ${systemToken}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED_SERVICE_REQUEST' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await connectToDatabase();
    
    const newLog = await AuditLog.create(body);
    return NextResponse.json({ success: true, id: newLog._id }, { status: 201 });
  } catch (error) {
    console.error('[INGEST_LOG_ERROR]', error);
    return NextResponse.json({ error: 'FAILED_TO_INGEST_LOG' }, { status: 500 });
  }
}
```

---

## 📟 5. Cliente Ingestor de Logs (`LogsClient`)

Para simplificar el envío de logs desde las otras aplicaciones de la suite, se creará una clase cliente reutilizable. **Este archivo se copiará en cada proyecto (`ABDAuth`, `ABDQuiz`, `ABDtenantGobernance`)**:

### 📂 Crear `src/lib/logs-client.ts` (En todos los proyectos)
```typescript
export interface LogPayload {
  tenantId: string;
  action: string;
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM';
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class LogsClient {
  private static getApiConfig() {
    return {
      endpoint: process.env.LOGS_SERVICE_URL || 'http://localhost:3600/api/logs',
      token: process.env.LOGS_SECRET_TOKEN || 'shared-system-token-2026',
      appId: process.env.NEXT_PUBLIC_APP_ID || 'unknown',
    };
  }

  /**
   * 📡 Envía un log de forma asíncrona (fire-and-forget) al microservicio ABDLogs
   */
  static async log(payload: LogPayload): Promise<void> {
    const { endpoint, token, appId } = this.getApiConfig();

    // Evitar bloqueos de ejecución en hilos principales del servidor
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        appId,
        createdAt: new Date(),
      }),
    }).catch(err => {
      console.error(`[LOGS_CLIENT_ERROR][${appId}] Failed to send log to central service:`, err);
    });
  }
}
```

---

## 🛠️ 6. Variables de Entorno del Ecosistema

### 📂 Configurar en `.env.local` de `ABDLogs`
```bash
# Puerto local exclusivo para evitar colisiones
PORT=3600

# Base de datos centralizada de logs
MONGODB_URI=mongodb://localhost:27017/abd-central-logs

# 🔑 Token de validación para las peticiones HTTP de los satélites (DEBE COINCIDIR)
LOGS_SECRET_TOKEN=abd-suite-shared-logs-secret-2026-prod

# Identidad SSO
AUTH_JWT_SECRET=abd-suite-shared-industrial-secret-2026-prod
AUTH_PROVIDER_URL=http://localhost:3400
```

### 📂 Configurar en `.env.local` de los Satélites y Gateway
Añadir las variables para conectar con el nuevo microservicio:
```bash
# Dirección del servicio de logs
LOGS_SERVICE_URL=http://localhost:3600/api/logs
LOGS_SECRET_TOKEN=abd-suite-shared-logs-secret-2026-prod

# Identidad de la aplicación emisora
NEXT_PUBLIC_APP_ID=quiz # o 'auth' o 'gobernanza'
```
