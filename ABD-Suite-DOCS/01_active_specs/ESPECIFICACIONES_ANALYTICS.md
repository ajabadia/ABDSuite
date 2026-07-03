# 📋 Especificaciones Técnicas: Portal de Analíticas Unificado de la Suite — ABDAnalytics (ABDBoard)

**Versión:** 1.1 — Ampliación Multi-Aplicación (Suite Consolidada)  
**Target:** Next.js 15+ (App Router), Tailwind CSS v4, MongoDB, `@abd/styles`, `@abd/satellite-sdk`  

---

## 🎯 Objetivo General
Definir la arquitectura, modelos de datos de solo lectura, rutas frontend, componentes visuales e integración con servicios transversales para **`ABDAnalytics`** (o **`ABDBoard`**), concebido como el "Cuarto de Guerra" (War Room) y cuadro de mando consolidado para **todas** las aplicaciones de la suite. Consolidará la telemetría operativa de accesos e identidad (**`ABDAuth`**), la gobernanza espacial y licenciamiento (**`ABDtenantGovernance`**), el progreso académico (**`ABDQuiz`**), y futuras aplicaciones del ecosistema.

---

## 📚 Documentos de Referencia a Considerar
El equipo de desarrollo debe respetar y aplicar obligatoriamente las directrices estéticas y técnicas establecidas en la suite:
1. **Guía de Estilos Visuales**: [STYLE_GUIDE.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/STYLE_GUIDE.md) — Estándares estéticos *Tech-Noir / Abisal* (paletas HSL, bordes `rounded-none`, grain, layouts superiores `SmartNavbar`, paddings `.navbar-top-layout` y reglas `FIRE:LAYOUT_VIOLATION`).
2. **Biblioteca de Estilos Consolidada**: **`@abd/styles`** (repositorio `ABDStyles`) — Es obligatorio utilizar los estilos y componentes definidos en este paquete central para cualquier interfaz de usuario nueva. Queda prohibido escribir CSS local ad-hoc.
3. **Especificaciones de Desarrollo Unificado**: [PROMPT_UNIFICADO_DESARROLLO.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/PROMPT_UNIFICADO_DESARROLLO.md) — Reglas de calidad (TypeScript estricto sin `any`, internacionalización con `next-intl`).
4. **Hoja de Ruta General**: [ROADMAP.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/ROADMAP.md).

---

## 🏗️ 1. Arquitectura y Modelo de Acceso a Datos

De acuerdo con el enfoque evolutivo acordado (Transición A $\rightarrow$ C), `ABDAnalytics` actúa estrictamente como un **Visualizador de Datos** (Data Visualizer) federado y no realiza procesamiento transaccional de escritura en ninguna aplicación operativa.

### A. Estrategia Multi-Tenant y Conexiones a Base de Datos
* **Multi-DB Pooling**: `ABDAnalytics` reutilizará la lógica de pools de conexión segregados de la suite para conectarse de manera aislada según el tenant del usuario.
* **Acceso de Solo Lectura**: Consumirá colecciones pre-agregadas y optimizadas (materializadas) de cada base de datos satélite:
  * **Desde `ABDQuiz`**: Progreso y rendimiento académico.
  * **Desde `ABDAuth`**: Estadísticas de sesiones y seguridad.
  * **Desde `ABDtenantGovernance`**: Utilización de espacios, recursos y estado de licencias.


### B. Esquema de Datos de Solo Lectura (`UserCourseSummary`)
Este modelo representa el avance consolidado de un estudiante en un curso específico:

```typescript
// Ubicación en ABDAnalytics: src/models/UserCourseSummary.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface IUserCourseSummary extends Document {
  tenantId: string;
  userId: string;
  courseId: mongoose.Types.ObjectId;
  courseName: string;
  completedAssignments: number;
  totalAssignments: number;
  averageGrade: number; // Porcentaje de 0 a 100
  timeSpentSeconds: number; // Tiempo total invertido en exámenes del curso
  lastAttemptAt?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  weakModules: string[]; // Módulos/Tags identificados para refuerzo
}

const UserCourseSummarySchema = new Schema<IUserCourseSummary>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    courseName: { type: String, required: true },
    completedAssignments: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started', index: true },
    weakModules: [String]
  },
  { timestamps: true }
);

// Índice compuesto para listados rápidos de alumnos por curso
UserCourseSummarySchema.index({ tenantId: 1, courseId: 1, averageGrade: -1 });

export default getTenantModel<IUserCourseSummary>('UserCourseSummary', UserCourseSummarySchema);
```

### C. Esquema de Métricas Globales (`CourseAnalytics`)
Este modelo consolida estadísticas a nivel de curso y asignación para la explotación de los roles administradores y docentes:

```typescript
// Ubicación en ABDAnalytics: src/models/CourseAnalytics.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface ICourseAnalytics extends Document {
  tenantId: string;
  courseId: mongoose.Types.ObjectId;
  totalStudentsEnrolled: number;
  completionRate: number; // Porcentaje de alumnos que completaron el itinerario
  averageGrade: number; // Nota media global del curso
  gradeDistribution: {
    fail: number;      // < 50%
    pass: number;      // 50-70%
    remarkable: number;// 70-90%
    outstanding: number;// > 90%
  };
  learningCurve: {
    date: string; // Formato YYYY-MM-DD
    averageGrade: number;
  }[];
  distractorTelemetry: {
    questionId: string;
    questionText: string;
    totalAttempts: number;
    incorrectRate: number;
    optionsFrequency: {
      optionIndex: number;
      frequency: number; // Porcentaje de selección
    }[];
  }[];
}

const CourseAnalyticsSchema = new Schema<ICourseAnalytics>(
  {
    tenantId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, unique: true },
    totalStudentsEnrolled: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    gradeDistribution: {
      fail: { type: Number, default: 0 },
      pass: { type: Number, default: 0 },
      remarkable: { type: Number, default: 0 },
      outstanding: { type: Number, default: 0 }
    },
    learningCurve: [
      {
        date: { type: String, required: true },
        averageGrade: { type: Number, required: true }
      }
    ],
    distractorTelemetry: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        totalAttempts: { type: Number, required: true },
        incorrectRate: { type: Number, required: true },
        optionsFrequency: [
          {
            optionIndex: { type: Number, required: true },
            frequency: { type: Number, required: true }
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

export default getTenantModel<ICourseAnalytics>('CourseAnalytics', CourseAnalyticsSchema);
```

### D. Esquema de Métricas de Identidad y Seguridad (`AuthAnalytics` — de `ABDAuth`)
Mapea la telemetría operativa de accesos y seguridad del tenant:

```typescript
// Ubicación en ABDAnalytics: src/models/AuthAnalytics.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface IAuthAnalytics extends Document {
  tenantId: string;
  totalLogins24h: number;
  failedLogins24h: number;
  activeSessionsCount: number;
  mfaEnrolledRate: number; // Porcentaje de usuarios con MFA activado
  mfaBypassActiveCount: number; // Usuarios usando el período de gracia de MFA
  failedLoginsTimeline: {
    hour: string; // Formato HH:00
    count: number;
  }[];
}

const AuthAnalyticsSchema = new Schema<IAuthAnalytics>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    totalLogins24h: { type: Number, default: 0 },
    failedLogins24h: { type: Number, default: 0 },
    activeSessionsCount: { type: Number, default: 0 },
    mfaEnrolledRate: { type: Number, default: 0 },
    mfaBypassActiveCount: { type: Number, default: 0 },
    failedLoginsTimeline: [
      {
        hour: { type: String, required: true },
        count: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export default getTenantModel<IAuthAnalytics>('AuthAnalytics', AuthAnalyticsSchema);
```

### E. Esquema de Métricas de Gobernanza y Recursos (`GovernanceAnalytics` — de `ABDtenantGovernance`)
Consolida el uso de espacios, cuotas y licenciamiento del tenant:

```typescript
// Ubicación en ABDAnalytics: src/models/GovernanceAnalytics.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface IGovernanceAnalytics extends Document {
  tenantId: string;
  totalSpacesCreated: number;
  activeCollaboratorsCount: number;
  licensedApps: {
    appId: string;
    status: 'active' | 'suspended' | 'expired';
    expirationDate?: Date;
  }[];
  spaceUtilization: {
    spaceId: string;
    spaceName: string;
    totalAssetsCount: number; // Documentos, corpus vinculados
    storageBytesUsed: number;
  }[];
}

const GovernanceAnalyticsSchema = new Schema<IGovernanceAnalytics>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    totalSpacesCreated: { type: Number, default: 0 },
    activeCollaboratorsCount: { type: Number, default: 0 },
    licensedApps: [
      {
        appId: { type: String, required: true },
        status: { type: String, enum: ['active', 'suspended', 'expired'], required: true },
        expirationDate: { type: Date }
      }
    ],
    spaceUtilization: [
      {
        spaceId: { type: String, required: true },
        spaceName: { type: String, required: true },
        totalAssetsCount: { type: Number, required: true },
        storageBytesUsed: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export default getTenantModel<IGovernanceAnalytics>('GovernanceAnalytics', GovernanceAnalyticsSchema);
```

### F. Estrategia de Sincronización de Vistas Materializadas (The Sync Strategy)

Para garantizar que los datos mostrados en `ABDAnalytics` reflejen con precisión el estado real y evitar la desincronización (datos "sucios"), se establece un modelo de sincronización híbrido:

1. **Sincronización Basada en Eventos Transaccionales (Event-Driven Hooks)**:
   * Las aplicaciones origen (`ABDQuiz`, `ABDAuth`, `ABDtenantGovernance`) son responsables de ejecutar las funciones de sincronización en su propia capa de servicio inmediatamente después de persistir cambios en las entidades fuente.
   * **Flujo de Evento en Caliente (Sincronización Inmediata)**: Cuando un evento crítico ocurre (ej. entrega de examen o actualización de licencias), se emite un trigger que actualiza de inmediato las vistas materializadas.
   * **Manejo de Correcciones Manuales Tardías**: Si un profesor califica manualmente una pregunta abierta a posteriori a través de `submitManualGradingAction`, el backend de `ABDQuiz` recalcula el score y actualiza el estado de `ExamAttempt` a `manually_graded`. Inmediatamente después de persistir este cambio, se ejecuta un trigger asíncrono tipo *Fire-and-Forget* que actualiza las colecciones `UserCourseSummary` y `CourseAnalytics` en la base de datos compartida del tenant, asegurando que el dashboard de analíticas refleje la nota y el feedback actualizados en tiempo real sin requerir un recálculo masivo.
   * **Flujo en ABDQuiz**:
     * *Entrega de Examen*: `submitAnswer` / `autoGrading` $\rightarrow$ Actualiza `ExamAttempt` $\rightarrow$ Invoca `recalculateUserCourseSummary(userId, courseId)` y `recalculateCourseAnalytics(courseId)`.
     * *Corrección Manual*: `saveManualGrading` (Profesor modifica nota o añade puntos en pregunta abierta) $\rightarrow$ Actualiza `ExamAttempt` $\rightarrow$ Invoca `recalculateUserCourseSummary(userId, courseId)` y `recalculateCourseAnalytics(courseId)` de forma síncrona/asíncrona inmediata.
   * **Flujo en ABDAuth**:
     * *Eventos de Acceso / Bloqueo*: Al fallar un login o activar MFA $\rightarrow$ Se incrementan los contadores y se invoca la actualización incremental en `AuthAnalytics`.
   * **Flujo en ABDtenantGovernance**:
     * *Cambio de Licencias o Espacios*: Al modificar la vigencia de una app o añadir activos a un Space $\rightarrow$ Se recalculan y actualizan las filas correspondientes en `GovernanceAnalytics`.

2. **Mecanismo de Reconciliación (Fail-Safe Cron Job)**:
   * Para corregir posibles fallos de red, caídas de base de datos o excepciones en caliente, se ejecutará un **Job de Reconciliación Diario** (cron nocturno).
   * Este proceso recalculará de forma masiva y no bloqueante las métricas agregadas barriendo la base de datos operativa y sobreescribiendo las vistas materializadas con el valor real consolidado, asegurando una convergencia de datos del 100%.

### G. Gestión de la "Carga Fría" y Estrategia de Caché (Cold Start & Caching)

Dado que las consultas analíticas de agregación compleja (como histogramas de distribución de Gauss o líneas de tendencia temporal) consumen elevados recursos de CPU en MongoDB, se implementan las siguientes políticas de rendimiento:

1. **Caché en Servidor (Time-Based Caching)**:
   * Los KPIs globales del dashboard y los reportes de curso se servirán bajo una política de caché server-side estableciéndose un intervalo de refresco de **5 a 15 minutos** (por defecto `revalidate = 300` o `revalidate = 900` de Next.js).
   * Se asume que los datos analíticos no requieren consistencia inmediata al milisegundo, sino un estado de **"actualización estable"**.
2. **Pre-calentamiento de Caché (Cache Warming)**:
   * Al ejecutarse la actualización de una vista materializada (por ejemplo, al finalizar un examen), el trigger asíncrono también invalidará explícitamente las etiquetas de caché correspondientes (`revalidateTag(courseId)`) para evitar que el primer acceso de un administrador tras un evento masivo experimente un retardo por "carga fría" (cold start).
3. **Paginación y Proyección Estricta**:
   * Queda estrictamente prohibido cargar colecciones completas de intentos en memoria. Todas las consultas agregadas deben usar filtros de proyección (`$project` en MongoDB) y paginarse mediante cursores en el backend de `ABDAnalytics`.

---



## 📂 2. Estructura del Proyecto y Rutas (Next.js App Router)

La estructura organizativa del frontend hereda la modularidad de la suite ABD y se divide por roles contextuales:

```
ABDAnalytics/src/app/[locale]/
├── layout.tsx                # Layout raíz (BrandingStyles + session provider)
├── page.tsx                  # Redirección automática según el rol (CREATOR -> admin/dashboard, RECIPIENT -> student/progress)
├── admin/
│   ├── layout.tsx            # Chasis administrativo con SmartNavbar superior
│   └── dashboard/
│       ├── page.tsx          # Panel principal de instructores (KPIs de cursos y accesos)
│       └── courses/
│           └── [courseId]/
│               └── page.tsx  # Analítica detallada del curso, curva de aprendizaje y telemetría de distractores
├── student/
│   ├── layout.tsx            # Chasis del estudiante con SmartNavbar superior
│   └── progress/
│       ├── page.tsx          # Mi progreso por curso, certificados descargables y remediación de refuerzo
│       └── page.client.tsx   # Gráficos de evolución personal
└── api/
    └── reports/
        └── verify/
            └── route.ts      # Endpoint público de validación de hashes de firmas PDF contra ABDLogs
```

---

## 🎨 3. Especificaciones de Interfaz y Chasis Gráfico (STYLE_GUIDE)

### A. Directiva de Consistencia Visual (`@abd/styles` y `STYLE_GUIDE.md`)
* **Alineación Obligatoria**: Todas las vistas de la aplicación deben ceñirse estrictamente a las directrices de la [Guía de Estilos Visuales (STYLE_GUIDE.md)](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/STYLE_GUIDE.md). Cualquier desviación o violación de layout será reportada como `FIRE:LAYOUT_VIOLATION`.
* **Esquinas y Tipografía**: Se aplicará de forma consistente el redondeado nulo (`rounded-none` en Tailwind/CSS) y la tipografía Geist (Sans y Mono) provistas por `@abd/styles`.
* **Layout Padding**: Para evitar colisiones físicas con la barra superior fija, es obligatorio que el contenedor principal de todas las vistas del sistema declare la clase utilitaria layout de padding: `.navbar-top-layout` (equivalente a `pt-24 pb-12 px-6 lg:px-12`).
* **Componentes de UI Reutilizables**: Se debe importar el menú y dropdown de la barra superior utilizando el componente **`SmartNavbar`** provisto por `@abd/ecosystem-widgets`.
* **Tema y Color**: Se utilizará de forma exclusiva la paleta de tokens HSL definidos por `@abd/styles` (`bg-background`, `border-border`, `text-primary`, etc.). Queda estrictamente prohibido hardcodear códigos hexadecimales o usar clases de colores predeterminadas de Tailwind (ej. `bg-emerald-500` debe ser sustituido por `bg-primary/20` o variables del tema).


### B. Mapeo de Branding Dinámico (SSR)
El layout de la aplicación debe inyectar la hoja de estilos dinámica provista por el SDK para aplicar la personalización de marca sin parpadeo de pantalla (Zero-FOUC):

```tsx
// Ubicación: src/app/[locale]/layout.tsx
import { BrandingStyles } from '@abd/satellite-sdk';

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} className="dark">
      <head>
        {/* Inyecta variables CSS del inquilino en caliente */}
        <BrandingStyles />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        <main className="relative min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
```

### C. Experiencia ante la Ausencia de Datos (Zero-State & Demo Mode)

Para evitar la sensación de "sistema roto" cuando un Tenant nuevo o un curso recién creado no registran actividad, el equipo de desarrollo debe seguir los siguientes lineamientos UX/UI:

1. **Ilustración e Información (Empty States)**:
   * Los componentes de gráficos (`recharts`) y tablas analíticas no deben renderizar áreas en blanco o spinners de carga infinitos ante arreglos de datos vacíos (`UserCourseSummary.length === 0`).
   * Se deben mostrar contenedores de marcadores de posición estructurados bajo el estándar visual de `@abd/styles` que incorporen:
     * Una advertencia/icono de estado inerte en color apagado (`text-muted-foreground/30`).
     * Un texto explicativo claro (ej. *"No se registran intentos para esta convocatoria"*).
     * Una llamada a la acción contextual para guiar al usuario administrador (ej. *"Comparte el enlace del examen para iniciar la recolección"*).
2. **Modo Demostración Interactivo (Demo Mode)**:
   * El dashboard de `ABDAnalytics` incluirá un interruptor flotante localizado (`Switch`) para habilitar el **"Modo Demo"** en la interfaz.
   * Al activarse, las llamadas a las colecciones materializadas de la base de datos se desviarán localmente hacia un servicio de datos simulados (*mock data generators*). Esto cargará curvas de aprendizaje ficticias, histogramas de Gauss realistas y telemetría de distractores para simular visualmente el "War Room" en producción, permitiendo al nuevo cliente comprender el potencial del sistema de inmediato.

---

## 📊 4. Diseño del Dashboard del Administrador (`/admin/dashboard`)

El panel analítico de control (`CREATOR` / `AUDITOR`) se estructurará en una interfaz de alta densidad visual con **cuatro pestañas principales**, consolidando la información de toda la suite:

### Pestaña A: Resumen de la Suite (Cuarto de Guerra)
Ofrece una vista general del estado operacional del tenant:
* **KPIs Consolidados**:
  * *Usuarios Activos*: Total de usuarios únicos concurrentes o con login en las últimas 24 horas.
  * *Licencias de Aplicaciones*: Número de satélites activos frente a suspendidos.
  * *Progreso Académico General*: Promedio consolidado de notas e itinerarios completados.
* **Alertas Globales**: Avisos del sistema (ej. 3 bloqueos de cuenta recurrentes en `ABDAuth`, o espacio de almacenamiento al 90% en `ABDtenantGovernance`).

### Pestaña B: Capacitación y Desempeño (Módulo de `ABDQuiz`)
Métricas del ecosistema de aprendizaje (antiguo dashboard operativo):
* **Fila de KPIs**: Tasa de finalización, nota media general y alertas de inactividad de estudiantes.
* **Distribución de Calificaciones (Histograma de Gauss)**: Renderiza el campo `gradeDistribution` en un gráfico de barras horizontales con bordes rectos (`rounded-none`) y acentuado por la variable de marca (`border-primary bg-primary/10`).
* **Telemetría de Reactivos (Análisis de Distractores)**: Tabla de reactivos críticos ordenados por porcentaje de fallo, expandible para desplegar la frecuencia de selección de cada distractor (`optionsFrequency`).

### Pestaña C: Identidad y Seguridad (Módulo de `ABDAuth`)
Monitoriza los accesos e integridad de la seguridad del tenant:
* **KPIs de Seguridad**:
  * *Intentos fallidos*: Número absoluto de logins rechazados en las últimas 24 horas.
  * *Tasa de Adopción de MFA*: Porcentaje de usuarios que han enlazado MFA o Passkeys.
  * *Bypass Activos*: Alumnos en período de gracia de configuración de doble factor.
* **Gráfico de Línea Temporal (Fuerza Bruta)**: Muestra el histórico horario de logins fallidos (`failedLoginsTimeline`), facilitando la detección visual de ataques de diccionario o accesos no autorizados.

### Pestaña D: Espacios y Recursos (Módulo de `ABDtenantGovernance`)
Audita el uso de la estructura organizativa y las cuotas de almacenamiento:
* **Tabla de Espacios**: Listado de unidades (Spaces) mostrando el total de colaboradores y volumen de activos/documentos enlazados.
* **Uso de Almacenamiento (Barra de Progreso)**: Mapeo de `spaceUtilization` de cada Espacio para visualizar qué departamentos consumen más recursos.
* **Resumen de Licencias**: Listado de satélites autorizados (`allowedApps`), su estado actual y fechas de vencimiento del licenciamiento.

---

## 🎓 5. Panel del Estudiante y Bucle de Remediación (`/student/progress`)

El portal del estudiante (`RECIPIENT`) se enfoca en la transparencia formativa y gamificación anonimizada.

### A. Mi Curva de Aprendizaje
* Gráfico de líneas temporales que mapea el porcentaje de acierto de los intentos sucesivos del estudiante.
* **Privacidad**: Leaderboard lateral que muestra la posición del alumno en el ranking general del curso, anonimizando a los demás participantes (ej. `J. D. ***` o alias autogenerados) en cumplimiento estricto de la RGPD, a menos de que el tenant configure visualización pública nominal.

### B. Bucle de Recomendación (Remediation Loop)
* Si `weakModules` contiene elementos, se mostrará una advertencia destacada en el dashboard:
  > **Recomendación de Refuerzo**:
  > Hemos detectado que te vendría bien repasar los conceptos de: **[Módulos en weakModules]**.
  > [Botón: Iniciar Entrenamiento Libre de Refuerzo]

---

## 🔒 6. Firma Criptográfica de Reportes y Validación (Integración con ABDLogs)

Para evitar la alteración fraudulenta de notas impresas o digitales, la generación de reportes en PDF se asegura mediante un modelo de doble verificación enlazado con la blockchain de **ABDLogs**:

1. **Generación del Hash**: Al exportar el acta en PDF, el backend calcula un hash criptográfico SHA-256 único a partir del contenido del reporte inyectando la clave interna del sistema.
2. **Registro de Firma en Blockchain**: Se emite una petición al servicio central de logs (`ABDLogs`) con el evento de tipo `REPORT_GENERATED` cuyo payload contiene:
   * `reportHash` (SHA-256 generado).
   * `generatedBy` (ID del Administrador).
   * `timestamp`.
   * `tenantId`.
3. **QR de Validación**: El PDF incluye en el encabezado o pie de página un código QR que apunta a la URL pública:
   `https://analytics.tudominio.com/api/reports/verify?hash=[REPORT_HASH]`
4. **Verificación Inmutable**:
   * El endpoint `/api/reports/verify` consulta al API de `ABDLogs` buscando un log firmado coincidente con ese hash.
   * Si el log existe y la firma criptográfica acumulativa de la base de datos de logs es válida, el portal de validación muestra una pantalla verde de confirmación: **"Documento Auténtico - Verificado Inmutable"**.
   * Si no hay coincidencia, muestra una alerta roja: **"Documento Inválido o Modificado"**.

---

## 🌐 7. Plan de Localización (i18n)

Se deben incluir los namespaces en los archivos JSON de traducción de la suite:

### Claves i18n requeridas en `es.json`
```json
{
  "analytics": {
    "title": "Centro de Analíticas y Rendimiento",
    "kpi": {
      "completionRate": "Tasa de Finalización",
      "averageGrade": "Calificación Promedio",
      "activeAlerts": "Alertas de Inactividad"
    },
    "remediation": {
      "title": "Refuerzo Recomendado",
      "body": "Hemos identificado áreas de oportunidad en las siguientes temáticas:",
      "action": "Iniciar práctica guiada"
    },
    "verification": {
      "success": "Reporte certificado. La firma del documento coincide con el registro inmutable de ABDLogs.",
      "failure": "Advertencia: El documento no ha podido ser validado o ha sido alterado post-generación."
    }
  }
}
```

---

## 🗺️ 8. Alineación con la Hoja de Ruta (ROADMAP.md)

La creación de `ABDAnalytics` absorbe directamente varios hitos planificados en la suite:
* **Hito 7.5 (Certificación de Resultados con PDF Firmado)**: Se asume completamente en el módulo de firma criptográfica y el validador público de hashes integrado en esta aplicación.
* **Hito 7.6 (Cuadro de Mando de KPIs Académicos y Facturación)**: Se ubica en `/admin/dashboard` de esta aplicación, sumando los reportes de rendimiento a las métricas del tenant (consumo de licencias y límites de facturación).
* **Hito 5.9 (Reportes de Inteligencia y Heurísticas SOC2)**: Se consolida en el dashboard de administrador como una pestaña técnica ("Seguridad y Cumplimiento") para centralizar la visualización de anomalías reportadas por los análisis de `ABDLogs`.

---

## 🔒 9. Delimitación de Responsabilidades y Migración de Gráficos con `ABDLogs`

Para mantener la separación de responsabilidades y evitar el acoplamiento cruzado de funciones:

### A. Gráficos de Telemetría Técnica (Permanecen en `ABDLogs`)
* Los gráficos representados por [TelemetryDashboard.tsx](file:///d:/desarrollos/ABDSuite/ABDLogs/src/components/admin/dashboard/TelemetryDashboard.tsx), [ActivityChart.tsx](file:///d:/desarrollos/ABDSuite/ABDLogs/src/components/admin/dashboard/ActivityChart.tsx) y [AppDistributionChart.tsx](file:///d:/desarrollos/ABDSuite/ABDLogs/src/components/admin/dashboard/AppDistributionChart.tsx) de `ABDLogs` (volumen de peticiones de API, errores de sistema, streaming de logs e IPs de logins) **NO se migran a ABDAnalytics**.
* **Motivación**: Estos gráficos representan el estado de salud de la infraestructura y seguridad (SOC2) y son de uso exclusivo para SysAdmins y Auditores de Sistemas en la consola de gobernanza técnica.

### B. Gráficos de Explotación de Negocio y Desempeño (Se implementan en `ABDAnalytics`)
* Gráficos como la curva de aprendizaje del estudiante, campanas de Gauss de calificaciones, y telemetría de distractores se crearán en `ABDAnalytics` desde cero utilizando las colecciones materializadas de solo lectura.
* **Consumo Indirecto**: En caso de que el administrador necesite ver logs de auditoría cruzados en `ABDAnalytics` (como quién modificó la licencia de un curso), la interfaz invocará de forma asíncrona la API REST de `ABDLogs` (`GET /api/logs`) en lugar de consultar la base de datos de logs directamente.

---

## 👥 10. Directrices de Onboarding y Prevención de Errores Comunes (Foco Junior)

Para guiar a desarrolladores con perfil junior durante la implementación de esta arquitectura, se deben auditar y evitar estrictamente los siguientes tres errores típicos de diseño:

### A. Error de Comunicación: Creación de API REST Redundante
* **El Pitfall**: Intentar crear endpoints REST en `ABDQuiz` (ej. `GET /api/admin/metrics`) para ser consumidos mediante peticiones `fetch` desde `ABDAnalytics`.
* **La Directriz**: **Prohibido**. `ABDAnalytics` debe consultar las colecciones materializadas (`UserCourseSummary` y `CourseAnalytics`) directamente en la base de datos compartida usando la infraestructura de multi-db pooling (`getTenantModel` y `AsyncLocalStorage`). Esto reduce latencias y elimina la dependencia de red entre satélites.

### B. Error de Trazabilidad: Persistencia Local de Firmas
* **El Pitfall**: Almacenar el hash del reporte PDF generado únicamente en la base de datos operativa de `ABDAnalytics`.
* **La Directriz**: **Incumplimiento de Seguridad**. Para garantizar la inmutabilidad de la auditoría y evitar la falsificación interna de actas en bases de datos operativas, el hash debe enviarse a **ABDLogs** como un evento `REPORT_GENERATED` inmutable. El portal de validación `/api/reports/verify` consultará la traza histórica en `ABDLogs` para dar validez oficial al reporte.

### C. Error de Context Shift: Fugas de Datos Cross-Tenant
* **El Pitfall**: Consultar bases de datos globales u omitir el wrapper `withTenantContext` al realizar consultas agregadas nocturnas.
* **La Directriz**: Todo Server Action, query de base de datos o reconciliación debe heredar la sesión o contexto resuelto mediante `resolveTargetTenantContext(tenantIdParam)` para evitar la exposición accidental de datos entre diferentes organizaciones del sistema.

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDAnalytics.md]]
