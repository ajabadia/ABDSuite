# 📋 Especificaciones Técnicas: Ecosistema de Aprendizaje y Roles Contextuales en ABDQuiz

Este documento sirve como guía de implementación y especificaciones técnicas para el **equipo externo** encargado de llevar a cabo la re-arquitectura de **ABDQuiz**, evolucionándolo desde un motor de exámenes plano a un **Ecosistema de Aprendizaje** multi-tenant estructurado.

---

## 🎯 Objetivo General
Transformar el modelo plano actual (`ExamConfig` y `ExamAttempt`) en una estructura jerárquica y relacional que incorpore Unidades Académicas (o departamentos), Cursos, Asignaciones temporales con control de acceso, soporte para preguntas abiertas con revisión humana, y un sistema de roles contextuales "asépticos" configurables por Tenant.

---

## 📚 Documentos de Referencia a Considerar
El equipo externo debe respetar las directrices estéticas y técnicas establecidas en la suite:
1. **Biblioteca de Estilos Consolidada**: **`@abd/styles`** (repositorio `ABDStyles`) — **Es obligatorio utilizar los estilos y componentes definidos en este paquete central para cualquier interfaz de usuario nueva**. Queda terminantemente prohibido escribir estilos CSS propios o clases personalizadas ad-hoc. Se deben reutilizar los estilos globales existentes; la creación de estilos nuevos solo se autorizará de manera excepcional bajo justificación técnica.
2. **Guía de Estilos Visuales**: [STYLE_GUIDE.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/STYLE_GUIDE.md) — Estándares *Tech-Noir / Abisal* (paletas HSL, bordes `rounded-none`, grain, etc.).
3. **Especificaciones de Desarrollo Unificado**: [PROMPT_UNIFICADO_DESARROLLO.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/PROMPT_UNIFICADO_DESARROLLO.md) — Reglas de calidad (TypeScript estricto sin `any`, internacionalización con `next-intl`).
4. **Hoja de Ruta General**: [ROADMAP.md](file:///d:/desarrollos/ABDSuite/ABD-Suite-DOCS/01_active_specs/ROADMAP.md).

---

## 🏗️ 1. Re-arquitectura del Modelo de Datos (Jerarquía)

Para soportar la estructura organizativa sin duplicar la lógica de jerarquías y permisos, se integra la infraestructura de **Espacios (Spaces)** de `ABDtenantGobernance` en la jerarquía formativa de `ABDQuiz`:

$$\text{Tenant} \rightarrow \text{Space (Tipo TEAM)} \rightarrow \text{Course} \rightarrow \text{ExamConfig} \leftarrow \text{ExamAssignment} \leftarrow \text{ExamAttempt}$$

### A. Mapeo de AcademicUnit a Space (Espacios Existentes)
*   **Decisión Arquitectural**: **No se creará una colección nueva `AcademicUnit`**. En su lugar, se reutilizará directamente el modelo **`Space`** de `ABDtenantGobernance` (filtrando por tipo `TEAM` o equivalente).
*   **Motivación**: Reutilizar el modelo `Space` evita duplicar lógica de path materializado (`materializedPath`), herencia jerárquica de permisos y asignación de colaboradores (`collaborators`), los cuales ya están completamente funcionales en el Control Plane.
*   En los modelos de `ABDQuiz` (`Course`, `ExamAssignment`), las referencias a la estructura organizativa se harán mediante el campo **`spaceId`** (almacenando el identificador del espacio correspondiente).
*   **Acceso a Spaces desde ABDQuiz**: Para validar pertenencia y mostrar metadatos de los espacios sin duplicar lógica de creación, `ABDQuiz` definirá un modelo de Mongoose ligero de solo lectura (`getTenantModel<ISpace>('Space', SchemaLigero)`) apuntando a la misma base de datos compartida del tenant.
*   **Requisito de SchemaLigero**: Para evitar cuellos de botella y llamadas recursivas al validar jerarquías o permisos heredados, el `SchemaLigero` debe incluir de manera obligatoria al menos los campos: `name`, `parentSpaceId`, `materializedPath`, y la lista de `collaborators` (con sus respectivos identificadores de usuario y roles).


### B. Course (Curso / Materia / Módulo de Aprendizaje)
Agrupa las configuraciones de exámenes (`ExamConfig`) y define una ruta formativa (Learning Path) opcional dentro de un `Space`.

```typescript
// Nuevo modelo: Course.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface ICourse extends Document {
  tenantId: string;
  spaceId: string; // ID de Space (proveniente de ABDtenantGobernance)
  name: string;
  description?: string;
  tags: string[];
  learningPath: {
    examConfigId: mongoose.Types.ObjectId;
    prerequisites: mongoose.Types.ObjectId[]; // Exámenes que deben aprobarse previamente
  }[];
  active: boolean;
  createdBy: string;
}

const CourseSchema = new Schema<ICourse>(
  {
    tenantId: { type: String, required: true, index: true },
    spaceId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    tags: [String],
    learningPath: [
      {
        examConfigId: { type: Schema.Types.ObjectId, ref: 'ExamConfig', required: true },
        prerequisites: [{ type: Schema.Types.ObjectId, ref: 'ExamConfig' }]
      }
    ],
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

export default getTenantModel<ICourse>('Course', CourseSchema);
```

### C. Refactorización de `ExamConfig` (Quiz)
Se debe modificar el modelo actual [ExamConfig.ts](file:///d:/desarrollos/ABDSuite/ABDQuiz/src/models/ExamConfig.ts) para añadir la pertenencia a un curso:
*   **Nuevo Campo**: `courseId?: mongoose.Types.ObjectId` (Referencia a `Course`, indexado).
*   **Migración**: Crear un script de migración temporal que asigne los `ExamConfig` huérfanos actuales a un curso por defecto del tenant.

---

## 👥 2. Roles Contextuales "Asépticos" por Tenant

Para asegurar que el software sea white-label y se adapte tanto a universidades (Profesor/Alumno), empresas (Instructor/Operario) o corporaciones (Auditor/Empleado), el sistema de roles debe cumplir dos reglas:
1.  **Asepsia de Nombres**: Los roles funcionales internos del motor son genéricos, pero la visualización (literales y traducciones) se define por Tenant.
2.  **Contextualidad**: Los roles se tienen a nivel de curso o unidad académica, no solo globales.

### A. Los Tres Roles Funcionales (Backend)
*   `CREATOR`: Permiso de escritura. Crea exámenes, edita configuraciones, califica respuestas abiertas y accede al dashboard de estadísticas.
*   `RECIPIENT`: Permiso de ejecución. Realiza los intentos de examen asignados y ve su propio historial.
*   `AUDITOR`: Permiso de lectura. Puede auditar intentos, ver estadísticas y exportar reportes, sin poder modificar nada.

### B. Configuración de Literales por Tenant
Cada Tenant puede configurar en su portal de administración de **`ABDtenantGobernance`** cómo quiere mapear y nombrar estos roles. Esta configuración se almacenará directamente en el modelo de inquilino **`ITenant`** de `ABDtenantGobernance` como un nuevo campo opcional `roleCustomization` (siguiendo el patrón existente de los campos `branding` y `billing`):

```typescript
// Almacenado como campo 'roleCustomization' dentro de ITenant en ABDtenantGobernance
export interface ITenantRoleCustomization {
  roleLiterals: {
    CREATOR: { es: string; en: string };   // Ej: { es: "Profesor", en: "Teacher" } o { es: "Facilitador", en: "Facilitator" }
    RECIPIENT: { es: string; en: string }; // Ej: { es: "Alumno", en: "Student" } o { es: "Operario", en: "Operator" }
    AUDITOR: { es: string; en: string };   // Ej: { es: "Auditor", en: "Auditor" }
  };
}
```

### C. Mapeo Contextual de Usuarios
Colección encargada de asignar permisos específicos dentro de un curso o espacio:

```typescript
// Nuevo modelo en ABDQuiz: QuizUserRole.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface IQuizUserRole extends Document {
  tenantId: string;
  userId: string;
  scopeType: 'space' | 'course';
  scopeId: string; // ID de Space (ABDtenantGobernance) o ID de Course (local)
  roleType: 'CREATOR' | 'RECIPIENT' | 'AUDITOR';
}

const QuizUserRoleSchema = new Schema<IQuizUserRole>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    scopeType: { type: String, enum: ['space', 'course'], required: true },
    scopeId: { type: String, required: true },
    roleType: { type: String, enum: ['CREATOR', 'RECIPIENT', 'AUDITOR'], required: true }
  },
  { timestamps: true }
);

// Índice compuesto para evitar duplicidades de rol en un mismo scope
QuizUserRoleSchema.index({ userId: 1, scopeType: 1, scopeId: 1 }, { unique: true });

export default getTenantModel<IQuizUserRole>('QuizUserRole', QuizUserRoleSchema);
```

### D. Separación de Responsabilidades y Gestión de Roles en la Interfaz
Para evitar brechas de seguridad (escalada de privilegios) y sobrecargar al Superusuario con la administración diaria de cada inquilino, se establece un flujo segregado:

1.  **Exclusión de ABDAuth**:
    *   `ABDAuth` se reserva exclusivamente para la gestión de la identidad central del usuario, inicio de sesión federado, MFA y credenciales.
    *   **Ningún rol** (alumno, profesor, auditor) ni asignación académica se administra desde el portal de `ABDAuth`. Tampoco los usuarios pueden alterarse o asignarse roles a sí mismos para evitar auto-concesiones malintencionadas.
2.  **Propiedad Administrativa en `ABDtenantGobernance`**:
    *   La consola del administrador del Tenant se ubica exclusivamente en **`ABDtenantGobernance`**.
    *   Es el **Administrador del Tenant** (TenantAdmin) el encargado de entrar a este panel y mapear qué usuarios de su organización actúan como `CREATOR` (profesor), `RECIPIENT` (alumno) o `AUDITOR` en cada Curso o Unidad Académica.
    *   El Superusuario global (`SUPER_ADMIN`) tiene visibilidad de auditoría técnica general para resolver anomalías extremas de base de datos o fallos del sistema, pero el volumen operativo recae en los administradores locales del Tenant.

### E. Helper de Autorización Contextual (`requireQuizScope` y `assertQuizScope`)
Dado que los checkeos de rol a nivel global (`ensureIndustrialAccess`) del SDK de la suite solo validan los roles planos del JWT, se debe crear un helper local en `ABDQuiz` para evaluar permisos contextuales en Server Actions y endpoints API:

```typescript
// Helper en ABDQuiz: src/lib/auth/scope-guard.ts
import QuizUserRole from '@/models/QuizUserRole';

// Excepción con nombre específica para fallos de acceso contextual
export class QuizScopeDeniedError extends Error {
  constructor(message = 'ACCESO_DENEGADO: Rol contextual insuficiente en el espacio formativo') {
    super(message);
    this.name = 'QuizScopeDeniedError';
  }
}

// 1. Helper de validación condicional (booleano)
export async function requireQuizScope(
  userId: string,
  tenantId: string,
  scopeId: string,
  scopeType: 'space' | 'course',
  requiredRole: 'CREATOR' | 'RECIPIENT' | 'AUDITOR'
): Promise<boolean> {
  const mapping = await QuizUserRole.findOne({ userId, tenantId, scopeId, scopeType });
  if (!mapping) return false;
  
  if (mapping.roleType === 'CREATOR') return true; // Creador tiene acceso total
  if (mapping.roleType === requiredRole) return true; // Coincidencia exacta (ej: RECIPIENT === RECIPIENT)
  
  return false;
}

// 2. Helper de afirmación / aserción (lanza excepción con nombre)
export async function assertQuizScope(
  userId: string,
  tenantId: string,
  scopeId: string,
  scopeType: 'space' | 'course',
  requiredRole: 'CREATOR' | 'RECIPIENT' | 'AUDITOR'
): Promise<void> {
  const hasAccess = await requireQuizScope(userId, tenantId, scopeId, scopeType, requiredRole);
  if (!hasAccess) {
    throw new QuizScopeDeniedError();
  }
}
```
*   **Índice de Rendimiento**: Para mitigar el coste de queries adicionales a MongoDB en cada Server Action, se añade un índice compuesto prioritario `{ tenantId: 1, userId: 1, scopeId: 1 }` en `QuizUserRole`.

---

## 📅 3. Módulo de Asignaciones (`ExamAssignment`)

Un `ExamConfig` actúa ahora puramente como una plantilla reutilizable. Cuando se quiere calendarizar un examen para un grupo, se crea una **Asignación**.

```typescript
// Nuevo modelo: ExamAssignment.ts
import mongoose, { Schema, Document } from 'mongoose';
import { getTenantModel } from '@/lib/database/tenant-model';

export interface IExamAssignment extends Document {
  tenantId: string;
  examConfigId: mongoose.Types.ObjectId;
  assignedToType: 'group' | 'user' | 'space';
  assignedToId: string; // ID de Space (referencia a ABDtenantGobernance) o ID de PermissionGroup o ID de Usuario
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'published' | 'archived';
  maxAttempts: number; // Sobrescribe el valor de ExamConfig si es mayor a cero
  active: boolean;
  createdBy: string;
}

const ExamAssignmentSchema = new Schema<IExamAssignment>(
  {
    tenantId: { type: String, required: true, index: true },
    examConfigId: { type: Schema.Types.ObjectId, ref: 'ExamConfig', required: true, index: true },
    assignedToType: { type: String, enum: ['group', 'user', 'space'], required: true },
    assignedToId: { type: String, required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    maxAttempts: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

export default getTenantModel<IExamAssignment>('ExamAssignment', ExamAssignmentSchema);
```

### Reglas de Negocio en la Asignación:
*   **Mapeo de Destinatarios**:
    *   `assignedToType === 'space'`: Hace referencia directa al ID de `Space` en `ABDtenantGobernance`. Todos los miembros/colaboradores del espacio tienen acceso al examen.
    *   `assignedToType === 'group'`: Hace referencia directa al ID de un `PermissionGroup` o grupo de usuarios dentro del tenant.
*   **Fechas y Horas por Rango (Timeframes Exactos)**: `startDate` y `endDate` se almacenan como objetos `Date` de Mongoose (que incluyen fecha, hora, minutos y segundos). Esto permite configurar rangos estrechos y exactos de ejecución (ej: "Solo el 1 de mayo de 2026 de 18:00 a 19:00") o rangos muy amplios (ej: "Desde el 1 de enero hasta el 31 de diciembre de 2026").
*   Un usuario final (`RECIPIENT`) solo verá y podrá iniciar exámenes si existe un `ExamAssignment` activo (`status === 'published'`), y la fecha/hora del servidor actual se encuentra estrictamente dentro del rango `[startDate, endDate]`.
*   Se debe validar el número de intentos acumulados en `ExamAttempt` vinculados a ese `examAssignmentId` específico.

---

## 🎲 4. Motor de Aleatoriedad y Selección Dinámica de Preguntas y Respuestas

Para enriquecer los exámenes y evitar memorización de patrones, el motor debe soportar lógica avanzada de aleatoriedad configurada en `ExamConfig`:

### A. Selección de Subconjuntos de Preguntas (Pools)
*   **Funcionalidad**: Poder definir un banco o pool de preguntas muy amplio (ej: 100 preguntas) asociado al Curso o módulo, pero configurar en `ExamConfig` que solo se seleccionen `N` preguntas aleatorias cada vez (ej: `questionCount: 30`).
*   **Persistencia de Aciertos (Progresión Eficiente)**: Opción en la configuración del examen (`excludePreviouslyCorrect: boolean`). Si se activa, al generar un nuevo intento, el motor consulta los intentos anteriores aprobados/completados del usuario para ese curso/asignación y filtra las preguntas que ya fueron respondidas correctamente en el pasado. De este modo, el pool dinámico del que se extraen las `N` preguntas se va reduciendo a aquellas que el usuario aún no ha dominado.

### B. Aleatoriedad Dinámica de Opciones (Slicing de Respuestas)
*   **Barajado de Opciones**: Soporte para desordenar las opciones presentadas (ya contemplado en `shuffleOptions`).
*   **Reducción Dinámica de Respuestas**: Capacidad de tener preguntas con un número elevado de respuestas opcionales (ej: 6 respuestas, donde solo 1 es correcta) pero configurar el motor para que en cada intento se muestren únicamente `X` opciones (ej: 3 opciones).
    *   **Lógica de Renderizado**: Al generar la pregunta para el intento, el backend selecciona la única opción válida (obligatoria) y añade `X - 1` opciones incorrectas elegidas al azar de entre el resto de opciones incorrectas definidas en la base de datos de esa pregunta.

---

## 📥 5. Motor de Ingesta, Conciliación y Versionado de Corpus

Para garantizar la pureza de los datos formativos y permitir actualizaciones ágiles en el banco de preguntas (como corregir una errata en directo), el ingestor de `ABDQuiz` se amplía con lógica estructurada de validación de jerarquías, hashing de datos crudos y flujo interactivo de remediación de colisiones:

### A. Plantillas de Ingesta Redefinidas (Formatos)
Se actualiza la estructura de entrada de los archivos para soportar los metadatos de jerarquía organizativa y control de auditoría temporal:

*   **Esquema JSON**:
    ```json
    [
      {
        "pregunta": "¿Qué puerto utiliza el protocolo HTTPS por defecto?",
        "opciones": ["80", "8080", "443", "22"],
        "respuesta_correcta": 2,
        "explicacion": "El protocolo HTTPS utiliza el puerto seguro 443.",
        "modulo": "Redes",
        "fuente": "Examen A",
        "difficulty": "easy",
        "tags": ["seguridad", "puertos"],
        "spaceId": "space-it-dept-123", // Opcional
        "courseId": "651a238fb0c5b4d7e8912345", // Opcional
        
        // --- Metadatos de Auditoría Temporal y Versionado ---
        "loadedAt": "2026-05-27T10:49:45Z", // Opcional (ISO 8601)
        "generatedAt": "2026-05-27T08:00:00Z", // Opcional (ISO 8601)
        "importVersion": "v1.2.0" // Opcional (String/Versión)
      }
    ]
    ```
*   **Esquema CSV**:
    Debe contar con las columnas: `pregunta`, `opcion_a`, `opcion_b`, `opcion_c`, `opcion_d`, `opcion_e`, `opcion_f`, `respuesta_correcta` (ej: `C` o `2`), `explicacion`, `modulo`, `fuente`, `difficulty`, `tags` (separados por comas), `spaceId`, `courseId`, `loadedAt`, `generatedAt` y `importVersion`.

*   **Lógica de Inferencia de Metadatos (Fallbacks)**:
    Si alguno de los campos de metadatos temporales o de versionado no viene definido en el archivo importado (JSON o CSV) o está vacío, el motor de ingesta aplicará la siguiente lógica de inferencia:
    1.  **`loadedAt` (Fecha de Carga)**: Se establece automáticamente con el timestamp actual del servidor (`new Date()`) en el momento en que se procesa el lote.
    2.  **`generatedAt` (Fecha de Generación)**: Se establece por defecto igual al timestamp de carga del servidor (`loadedAt`).
    3.  **`importVersion` (Versión de Importación)**: Si no se especifica una versión semántica o de etiqueta, se infiere una etiqueta temporal única basada en el momento de la carga en formato ISO (ej: `IMPORT-2026-05-27T104945Z`).
    *Todos estos metadatos deben guardarse de forma estructurada en un objeto `metadata` dentro del registro de cada pregunta en la base de datos para garantizar la trazabilidad.*

### B. Matriz de Decisiones del Parser e Integridad Jerárquica
Cuando el parser procesa un lote de preguntas, aplica las siguientes reglas de resolución e integridad:

1.  **Ambos IDs presentes (`spaceId` y `courseId`)**:
    *   *Validación*: Se verifica que el `spaceId` exista y tenga `isActive === true`. Se verifica que el `courseId` exista, tenga `active === true` y pertenezca jerárquicamente a dicho `spaceId`. Ambas entidades deben coincidir con el `tenantId` activo.
    *   *Acción*: Si las validaciones pasan, se asocia la pregunta a ambos. Si falla alguna validación, se abre el **Wizard de Remediación de IDs**.
2.  **Solo uno de los dos IDs presente**:
    *   *Si es `courseId`*: El backend resuelve e infiere el `spaceId` asociado al curso. Se pregunta al operador en la UI: *¿Deseas asociar también estas preguntas a otro Espacio de trabajo del tenant?*
        *   Si responde **Sí**: Se muestra el selector de Spaces activos para completar el dato.
        *   Si responde **No**: Se continúa la ingesta asociándola al curso e infiriendo su espacio.
    *   *Si es `spaceId`*: Se pregunta al operador en la UI: *¿Deseas asociar también estas preguntas a un Curso formativo dentro de este espacio?*
        *   Si responde **Sí**: Se muestra el selector de cursos activos pertenecientes a ese espacio.
        *   Si responde **No**: Se asocia la pregunta únicamente al Space (queda en el pool general del departamento).
3.  **Ningún ID presente (Subsanación Obligatoria)**:
    *   El Wizard interrumpe y muestra la pantalla `wizardState: 'select_context'`.
    *   Se obliga al operador a elegir, al menos, un destino (`spaceId` y/o `courseId`) mediante selectores interactivos que cargan únicamente Espacios y Cursos activos.

#### Wizard de Remediación de IDs (Caso de Fallo de Jerarquía):
Si la validación de jerarquía falla (ej: el curso en el JSON no pertenece al espacio indicado, o el destino está inactivo):
*   El operador puede **reasignar a mano** usando selectores de elementos activos.
*   El operador puede **anular el estamento jerárquico más bajo** (ej: borrar la referencia a `courseId` y subir la pregunta solo al `spaceId`).
*   **Acción en Lote**: El operador puede marcar la opción *"Recordar decisión para el resto de conflictos de este lote"* para no tener que responder por cada pregunta si todo el archivo viene con el mismo ID erróneo.

### C. Hash Semántico Canónico (Agnóstico del Formato)
Para evitar que el hash varíe por diferencias estéticas o de orden en las opciones, se calcula de la siguiente manera:

1.  **Aplanamiento de Texto (Texto Crudo)**:
    Antes de hashear, los textos de la pregunta y las opciones se limpian de la siguiente forma:
    *   Conversión completa a mayúsculas.
    *   Eliminación de todos los espacios en blanco, tabulaciones y saltos de línea.
    *   Eliminación de caracteres de puntuación (`. , ; : - _ ? ! ( )`).
    *   Normalización Unicode para quitar tildes/acentos (ej: `á` $\rightarrow$ `a`) y caracteres especiales (ej: `ñ` $\rightarrow$ `n`).
2.  **Estrategia de Sub-Hash y Ordenamiento de Opciones**:
    Para anular el orden del array de opciones sin perder la correspondencia de la correcta:
    *   Se genera el hash SHA-256 de la pregunta aplanada ($H_{\text{pregunta}}$).
    *   Se genera el hash SHA-256 individual de cada una de las opciones aplanadas ($H_{\text{opcion}_1}, H_{\text{opcion}_2}$, etc.).
    *   **Se ordenan matemáticamente** los hashes de las opciones (de mayor a menor en valor hexadecimal).
    *   Se calcula el hash maestro final:
        $$H_{\text{maestro}} = \text{SHA-256}(H_{\text{pregunta}} \mathbin{\Vert} \text{Sorted}(H_{\text{opcion}_1}, H_{\text{opcion}_2}, \dots) \mathbin{\Vert} \text{RespuestaCorrecta})$$
    *   **Almacenamiento de Sub-Hashes en Base de Datos**: Para simplificar la búsqueda y comparación de discrepancias sin recalcular en memoria, el esquema de **`Question`** guardará de forma persistente cada una de las partes:
        *   `questionTextHash: string` (el hash $H_{\text{pregunta}}$ del enunciado aplanado).
        *   `optionHashes: string[]` (los hashes individuales aplanados de las opciones).
        *   `contentHash: string` (el hash maestro final).
        Esto permite buscar coincidencias parciales directamente mediante queries de Mongoose (ej: buscar si ya existe la pregunta buscando por `questionTextHash` para saltar al Wizard de nivel 2 o 3 si las opciones o la respuesta varían).


### D. Los Tres Niveles de Colisión y Versionado Interactivo
Cuando se realiza la ingesta, se cruza el hash semántico de la pregunta entrante con los existentes en el tenant:

*   **Nivel 1: Duplicidad Absoluta (Match de Pregunta, Opciones y Respuesta)**:
    *   *Bifurcación en UI*: El Wizard de colisiones avisa y da la opción de:
        *   **[Omitir y Continuar]**: Ignora este duplicado y continúa.
        *   **[Abortar Importación]**: Cancela el proceso completo de subida.
*   **Nivel 2: Discrepancia de Respuesta Correcta (Corrección de Clave)**:
    *   Misma pregunta y opciones, pero diferente respuesta correcta en el archivo entrante.
    *   *Acción*:
        1.  **[Corregir Existente]**: Reemplaza el `correctOptionIndex` de la pregunta guardada.
        2.  **[Nueva Versión]**: Crea un nuevo registro incrementando `version` (de `v1` a `v2`) y marca la anterior como `active: false` (inactiva para nuevos exámenes, pero preservada para integridad histórica de intentos pasados).
        3.  **[Bifurcar]**: Crear pregunta nueva e independiente.
*   **Nivel 3: Discrepancia de Opciones (Texto Alterado o Edición)**:
    *   Misma pregunta, pero los textos de las opciones varían o se corrigió una errata de redacción.
    *   *Acción*:
        1.  **[Actualizar Existente]**: Sobrescribe las opciones de la pregunta existente.
        2.  **[Nueva Versión]**: Guarda el registro con versión incrementada desactivando el antiguo.
        3.  **[Descartar]**: Ignorar la modificación entrante.

### E. Reutilización Cross-Space (Pool de Preguntas Compartido)
Para permitir el aprovechamiento del conocimiento entre diferentes departamentos sin necesidad de re-importar archivos:
1.  **Buscador de Corpus Compartido**: Se habilitará una interfaz en la consola de corpus que permita buscar preguntas del mismo `tenantId` pero asignadas a otros `spaceId` (usando el modelo ligero `Space` para listar solo espacios activos).
2.  **Acción de Vinculación/Copiado**: El evaluador selecciona las preguntas deseadas de otros espacios y elige:
    *   **Copiar al contexto actual**: Genera un duplicado referencial de las preguntas asignándoles el `spaceId` y/o `courseId` de destino y recalculando sus hashes para este nuevo espacio.

### F. Buenas Prácticas de Robustez y Seguridad en Ingesta
Para blindar el sistema frente a importaciones incorrectas o inestabilidades en la base de datos, el equipo de desarrollo debe implementar las siguientes medidas:
1.  **Validación de Esquema con Zod**:
    Se debe validar la estructura de cada objeto del corpus (JSON/CSV) utilizando un esquema Zod antes de guardarlo en la base de datos. Si una pregunta contiene inconsistencias (como un `correctOptionIndex` fuera del rango de la lista de opciones), la fila debe ser rechazada y reportada de inmediato en la pantalla de errores.
2.  **Operaciones Masivas Transaccionales**:
    Para evitar estados de "carga parcial" (dirty writes) en los que solo algunas preguntas del lote se insertan si ocurre un error a mitad de camino, se deben agrupar las operaciones de base de datos en una **sesión transaccional de MongoDB** (`conn.startSession()`). Si el operador decide abortar la importación debido a conflictos, se ejecutará un rollback total.
3.  **Librerías Oficiales de Parseo (Evitar .split() manual)**:
    Queda terminantemente prohibido utilizar lógica manual como `line.split(',')` para parsear archivos CSV, ya que esto fallará si los enunciados contienen comas, saltos de línea o comillas escapadas. Se debe utilizar **`papaparse`** con soporte para multilíneas y parseo de strings complejos habilitado.
4.  **Sanitización y Prevención de NoSQL Injection / XSS**:
    Todos los textos importados deben ser sanitizados para mitigar ataques NoSQL Injection (en caso de queries dinámicas) y XSS. Al renderizar preguntas o explicaciones en el frontend, se debe evitar el uso inseguro de HTML directo sin sanitización previa.

---

---

## ✍️ 6. Preguntas Abiertas y Calificación Humana

Para soportar preguntas complejas que no puedan evaluarse automáticamente por patrón/regex:

### A. Cambios en el Esquema de Preguntas (`Question`)
*   Se añade un nuevo tipo de pregunta: `'open_text'`.
*   Estas preguntas no tienen respuestas correctas automáticas parametrizadas.

### B. Modificación en `ExamAttempt`
El cálculo del score del intento ya no puede ser inmediato tras guardar la última respuesta si contiene preguntas abiertas.

```diff
// Modificaciones en IExamAttempt (en ExamAttempt.ts)
  status: 'in_progress' | 'completed' | 'timeout';
+ gradingStatus: 'auto_graded' | 'pending_manual_review' | 'manually_graded';
+ gradedBy?: string; // ID del usuario (CREATOR) que corrigió
+ gradedAt?: Date;
  questions: {
    questionId: string | mongoose.Types.ObjectId;
    questionSnapshot: QuizQuestionSnapshot;
    selectedOptionIndex?: number | null;
+   manualTextAnswer?: string; // Para guardar la respuesta a la pregunta abierta
+   manualPointsAwarded?: number; // Puntos asignados por el revisor
+   feedback?: string; // Comentario del evaluador a la respuesta
    isCorrect: boolean;
    timeSpentSeconds: number;
    status: 'correcta' | 'incorrecta' | 'no_respondida' | 'no_respondida_por_tiempo';
  }[];
```

### C. Panel de Auditoría y Corrección
1.  **Dashboard de Pendientes**: El rol `CREATOR` debe disponer de una bandeja de entrada con los intentos que tengan `gradingStatus === 'pending_manual_review'`.
2.  **Vista de Corrección**: Permite al evaluador ver el enunciado, la respuesta escrita del alumno, asignar una puntuación (`0` a `maxPoints` de la pregunta) y añadir un comentario de feedback.
3.  **Cálculo Final**: Al enviar la corrección manual de todas las preguntas abiertas de un intento, el sistema recalcula el score acumulado, actualiza el `percentage` y cambia el estado a `manually_graded`.

### D. Optimización y Rendimiento (Indexación Obligatoria)
Con la introducción de asignaciones masivas y el aumento exponencial esperado en el volumen de `ExamAttempt`, para asegurar que las consultas del Panel de Auditoría y los agregados de analíticas no sufran degradación, el equipo debe definir los siguientes índices compuestos en el esquema Mongoose de `ExamAttempt`:
*   `ExamAttemptSchema.index({ tenantId: 1, courseId: 1, groupId: 1, createdAt: -1 })` (Para optimizar listados y analíticas segmentadas).
*   `ExamAttemptSchema.index({ tenantId: 1, userId: 1, examAssignmentId: 1, createdAt: -1 })` (Para agilizar la validación de límites de intentos del usuario).

### E. Tutoría y Retroalimentación con IA (Lineamientos Técnicos)
Para el desarrollo futuro del Hito 7.3, se establecen de manera inmutable las siguientes directrices de arquitectura para la retroalimentación asistida por LLMs:

1. **Human-in-the-Loop Enforced**: 
   - La IA **nunca** modificará el estado del intento a `manually_graded` ni aplicará notas de forma directa y autónoma.
   - Actuará estrictamente como un **sugeridor de calificación borrador** (`draftScore` y `draftFeedback`). El evaluador (`CREATOR`) es el único con la autoridad de aceptar, editar o rechazar la propuesta antes de consolidar el cambio en base de datos.
2. **Mitigación y Control de Alucinaciones**:
   - El prompt del evaluador LLM debe estar blindado estructuralmente mediante técnicas de *Few-Shot Prompting* y validaciones con rúbricas de corrección pre-cargadas en `ExamConfig`.
   - Se prohíbe evaluar argumentos con información externa al corpus del examen o la explicación técnica asignada a la pregunta original en `Question`.
3. **Optimización de Latencia y Costes (Background Worker)**:
   - Las solicitudes de feedback a la API del LLM no deben realizarse en caliente durante la navegación web del usuario o del profesor.
   - Se resolverán de forma asíncrona mediante tareas en background encoladas tras la finalización del examen (`QUIZ_ATTEMPT_COMPLETED`), almacenando las propuestas borrador en la colección del intento para que estén pre-cargadas en 10ms al abrir la vista de corrección.

---

## 📊 7. Learning Analytics (Módulo de Analítica)

Se deben crear endpoints de agregación específicos en el backend de `ABDQuiz` para que los roles `CREATOR`, `AUDITOR` y `RECIPIENT` puedan explotar la información estructurada mediante interfaces y consultas optimizadas:

### A. Métricas de Rendimiento Organizativo y Aprendizaje
*   **Rendimiento por Unidad Académica / Space**: Consultas de agregación que comparan la nota media y la tasa de aprobados (`passThreshold`) entre diferentes Espacios (ej: Departamento de Ventas vs Departamento de IT).
*   **Curva de Aprendizaje del Alumno**: Muestra la evolución temporal del porcentaje medio de aciertos de un mismo usuario (`userId`) a lo largo de sus intentos sucesivos dentro de un Curso formativo.

### B. Rankings de Alumnos por Examen (Leaderboards con Gamificación)
*   **La Métrica**: Listado ordenado de alumnos basado en sus resultados para un `examConfigId` o `examAssignmentId` específico.
*   **Algoritmo de Clasificación**:
    1.  **Puntuación más alta / Porcentaje de acierto** (Orden descendente).
    2.  **Menor tiempo empleado (`timeSpentSeconds`)** en resolver el examen (Como criterio de desempate en caso de empate a puntos).
    3.  **Número de intentos utilizados** (Premiando al alumno que alcanza la nota en el primer intento).
*   **Privacidad e Integridad (RGPD)**:
    *   Los roles `CREATOR` y `AUDITOR` ven el ranking con nombre completo y correo de los estudiantes.
    *   Los alumnos (`RECIPIENT`) verán un ranking de gamificación **anonimizado** (mostrando solo iniciales, alias o los primeros caracteres del email) a menos que el Administrador del Tenant active explícitamente el ranking público nominal para su organización.

### C. Control del Estado de Convocatorias (Completion Tracking)
Permite a los instructores (`CREATOR`) monitorizar la participación en una asignación de examen activa:
*   **Tasa de Finalización**: Gráfico de sectores que muestra los alumnos asignados que ya han completado el examen (`gradingStatus === 'auto_graded' || 'manually_graded'`) frente a los que tienen intentos pendientes o no lo han iniciado.
*   **Distribución de Notas (Campana de Gauss)**: Histograma dinámico de calificaciones agrupadas por rangos (ej: Suspenso $<50\%$, Aprobado Raspado $50-70\%$, Notable $70-90\%$, Sobresaliente $>90\%$) para calibrar la dificultad de la prueba.
*   **Alertas de Inactividad**: Tabla de alumnos que aún no han iniciado su intento con una fecha límite de finalización próxima (menos de 48 horas), permitiendo disparar notificaciones de recordatorio automáticas.
*   **Tasa de Deserción y Abandono**: Detección de intentos que pasaron a `in_progress` pero que no registran actividad en los últimos 15 minutos, identificando posibles fallos de conexión o abandonos.

### D. Analítica del Corpus y Distractores (Question Telemetry)
Ayuda a evaluar y mejorar la calidad de las preguntas importadas en la base de datos:
*   **Índice de Discriminación de Pregunta**: Métrica que evalúa si una pregunta es errada sistemáticamente tanto por los alumnos con notas más altas como por los de notas más bajas (lo que suele indicar una pregunta ambigua o mal formulada).
*   **Tiempo Medio por Reactivo**: Promedio del tiempo en segundos consumido por los usuarios para resolver una pregunta específica, útil para ajustar los temporizadores de los exámenes.
*   **Análisis de Distractores**: Gráfico de frecuencia sobre la opción incorrecta elegida por los usuarios que fallan la pregunta. Si un distractor "B" es seleccionado por el 90% de los alumnos fallidos, el distractor está excelentemente planteado. Si el distractor "D" tiene un 0% de selección tras 1000 intentos, es un distractor ineficaz que requiere edición.

### E. Comparativa de Rendimiento Inter-Versiones (A/B Testing de Reactivos)
*   Al aplicar el versionado de preguntas (Copy-On-Write), el sistema debe permitir a los evaluadores comparar visualmente y estadísticamente el ratio de éxito de una misma pregunta entre sus diferentes versiones (ej: comprobar si tras corregir una errata en la versión `v2`, la tasa de acierto subió del 30% al 75% respecto a `v1`).

### F. Motor de Recomendación de Refuerzo Personalizado (Remediation Loop)
*   **Lógica**: Al completarse un examen, el backend analiza las respuestas incorrectas agrupadas por `module` o `tags`.
*   **Feedback en Dashboard**: Si el alumno aprueba el examen pero falla la mayoría de las preguntas de una temática en particular, el `/dashboard` del estudiante generará una tarjeta de refuerzo dinámica: *"¡Buen trabajo! Has aprobado, pero te sugerimos reforzar el Módulo de [Nombre del Módulo]. Haz clic aquí para practicar preguntas similares."*
*   El motor priorizará de forma automática las preguntas de dichos módulos en los siguientes exámenes generados para la modalidad de *Entrenamiento Libre*.

### G. Optimización del Rendimiento y Transición Arquitectónica (El Puente A $\rightarrow$ C)

Para evitar la degradación del motor de exámenes de `ABDQuiz` ante consultas concurrentes de analítica (el peligro del "Monolito Analítico" de la Opción A) y al mismo tiempo no sobrecargar el sistema de trazas de `ABDLogs` con lógica de negocio específica (la "Anemia de Datos" de la Opción B), se implementa un modelo de **Vistas Materializadas / Caché de Agregación** utilizando el satélite centralizado:

1. **Estado del Despliegue (Opción C - Completado)**: Se ha creado y desplegado el satélite dedicado **ABDAnalytics (ABDBoard)**, ejecutándose en el puerto `3700`. Este servicio actúa como la central de inteligencia ("War Room") y visualización analítica de toda la suite.
2. **Rol de ABDQuiz como "Proveedor de Datos"**:
   * `ABDQuiz` **no realiza cálculos en caliente ni agregaciones en tiempo real** sobre las colecciones principales (`ExamAttempt`) al abrir paneles de rendimiento.
   * `ABDQuiz` calcula métricas consolidadas al finalizar intentos y las guarda en las colecciones optimizadas de lectura analítica de `ABDAnalytics`.
3. **Modelos y Colecciones Consolidadas (Implementadas en ABDAnalytics)**:
   * **`UserCourseSummary`**: Almacena el progreso académico consolidado y estado por estudiante y curso (nota media, tiempo invertido, módulos débiles para refuerzo).
   * **`CourseAnalytics`**: Métricas globales de curso para profesores/administradores (distribución de notas Gauss, tasas de compleción y telemetría de distractores/errores frecuentes).
   * **`AuthAnalytics`**: Telemetría de accesos, tasas de enrolamiento de MFA e historial de fallos/bloqueos en últimas 24h.
   * **`GovernanceAnalytics`**: Utilización espacial de archivos y estado del licenciamiento y aplicaciones activas de la suite por tenant.
4. **Acceso e Integración Frontend**:
   * `ABDAnalytics` expone una interfaz rica en gráficos (usando `recharts` y el sistema de estilos unificado).
   * Se diseñará un punto de acceso directo (botón/enlace seguro) en el panel de control del usuario/profesor en la aplicación principal (`ABDQuiz`/LMS) que redirigirá dinámicamente al War Room de `ABDAnalytics` bajo contexto federado y con aislamiento estricto por tenant.
5. **Actualización Asíncrona (Event-Driven)**: Estas colecciones de agregados se actualizan de forma incremental reaccionando a los eventos de entrega de examen (`QUIZ_ATTEMPT_COMPLETED` y `QUIZ_ATTEMPT_MANUALLY_GRADED`), evitando bloqueos en la base de datos transaccional.


### H. Generación Asíncrona de Reportes de Cumplimiento y Firma Criptográfica
Para auditorías de cumplimiento normativo (ej. ISO 9001/27001), los administradores del inquilino podrán exportar actas de capacitación consolidadas:
1.  **Procesamiento Asíncrono**: Los reportes que superen los 50 registros se encolarán para generación asíncrona. El archivo final (PDF/Excel) se almacenará en Cloudinary a través de la aplicación de gestión documental del ecosistema.
2.  **Diseño Agradable y Personalización del Inquilino (Branding Dinámico)**:
    *   **Tecnología de Renderizado**: Se utilizará una biblioteca de HTML-to-PDF basada en navegador sin cabeza (ej. **Puppeteer**) para renderizar plantillas HTML/CSS de alta calidad, evitando convertidores planos de texto o librerías que limiten el diseño.
    *   **Enfoque de Plantilla Maestra Única (Sin Complejidad de Drag-and-Drop)**:
        *   Para evitar complicaciones excesivas de desarrollo, **no se implementará un constructor de plantillas visuales**.
        *   El sistema dispondrá de **una única plantilla HTML/CSS base estándar** integrada en el código (muy limpia, minimalista y profesional).
        *   Esta plantilla base se reutilizará para todos los tipos de informes, inyectando de manera dinámica en la estructura:
            *   *Tipo de Reporte*: Títulos dinámicos según el contexto (ej: "Diploma de Aprovechamiento", "Acta de Intento", "Informe General de Convocatoria").
            *   *Logotipo del Tenant*: Cargado en la cabecera (URL de imagen provista por la base de datos).
            *   *Paleta de Colores*: Los colores primarios/secundarios del tenant se inyectarán en la cabecera del HTML como **variables CSS** (ej. `--brand-primary`, `--brand-background`).
            *   *Metadatos de Cabecera*: Nombre del Tenant, identificación fiscal e información legal.
            *   *Datos y Tablas*: El contenido en sí (listado de alumnos, respuestas detalladas o agregados estadísticos).
3.  **Firma e Integridad Criptográfica (Integración con ABDLogs)**: 
    *   Cada reporte PDF generado incluirá en su pie de página un **código de verificación QR** y un hash criptográfico único.
    *   Este hash se generará cruzando la firma digital del log correspondiente almacenado en la blockchain de **ABDLogs** para ese examen/usuario.
    *   Cualquier tercero (auditor externo) podrá escanear el QR o verificar el hash para validar que los resultados plasmados en el reporte PDF coinciden exactamente con la traza inmutable registrada en el sistema de logs, imposibilitando la falsificación de notas en la base de datos operativa.

### I. Calibración Dinámica de Dificultad (Teoría de Respuesta al Ítem - IRT)
Para evitar la asignación subjetiva y estática de la dificultad en el banco de preguntas:
1.  **Calibración Dinámica Semanal**: Un job programado (cron) en el backend analizará semanalmente el rendimiento estadístico de cada reactivo en base a los intentos finalizados.
2.  **Ajuste Automático de Dificultad**: La dificultad de la pregunta en la base de datos se actualizará según el ratio real de aciertos:
    *   Ratio de acierto $> 75\%$ $\rightarrow$ Se actualiza a `difficulty: 'easy'`.
    *   Ratio de acierto $30-75\%$ $\rightarrow$ Se actualiza a `difficulty: 'medium'`.
    *   Ratio de acierto $< 30\%$ $\rightarrow$ Se actualiza a `difficulty: 'hard'`.
3.  **Preservación de Hashing**: Los cambios automáticos de dificultad calculados por el motor IRT modifican la propiedad del esquema de la pregunta pero **no alteran su hash semántico canónico** (`contentHash`), ya que el nivel de dificultad se trata como un metadato dinámico de control estadístico y no como parte del contenido fundamental del enunciado o alternativas de respuesta.

---

## 📊 8. Trazabilidad Completa con ABDLogs (Gobernanza y Auditoría)

Para asegurar el control de gobernanza y auditoría en la suite, **todos** los eventos del ciclo de vida del Ecosistema de Aprendizaje deben emitir logs estructurados y persistirse en **ABDLogs** consumiendo el SDK satélite (`@abd/satellite-sdk`).

Se clasifican los eventos en tres categorías principales:

### A. Eventos de Configuración e Ingesta (Acción de Administradores/Creators)
Cada vez que se modifica la estructura formativa, se debe registrar el cambio indicando el usuario responsable, el tenant y los metadatos de la entidad:
*   `QUIZ_SPACE_LINK_CREATE` / `QUIZ_SPACE_LINK_UPDATE`: Registro del enlace o vinculación de un Space (desde `ABDtenantGobernance`) como entorno activo dentro del ecosistema de aprendizaje de `ABDQuiz`.
*   `QUIZ_COURSE_CREATE` / `QUIZ_COURSE_UPDATE` / `QUIZ_COURSE_DELETE`: Cambios en la malla formativa, definición del `learningPath` y prerrequisitos.
*   `QUIZ_EXAM_CONFIG_CREATE` / `QUIZ_EXAM_CONFIG_UPDATE`: Configuración de las plantillas de examen, incluyendo los parámetros de aleatoriedad, pools de preguntas y exclusión de respuestas correctas previas.
*   `QUIZ_ASSIGNMENT_CREATE` / `QUIZ_ASSIGNMENT_PUBLISHED`: Creación o publicación de convocatorias de examen con sus ventanas temporales y grupos asignados.

### B. Eventos del Alumno (Acción del Recipient)
Toda interacción del candidato debe ser auditable para prevenir fraudes, analizar problemas técnicos y calcular analíticas de esfuerzo:
*   `QUIZ_ATTEMPT_STARTED`: Disparado al iniciar el examen. Debe incluir en el payload el `examAssignmentId`, `examConfigId` y la lista de IDs de las preguntas seleccionadas para ese intento (demostrando la aleatoriedad aplicada).
*   `QUIZ_ANSWER_SUBMITTED`: Disparado cada vez que el alumno responde o salta una pregunta. Debe capturar:
    *   `questionId`.
    *   `selectedOptionIndex` (o `manualTextAnswer` si es abierta).
    *   `timeSpentSeconds` (tiempo dedicado a esa pregunta).
    *   `isCorrect` (para preguntas automáticas).
*   `QUIZ_ATTEMPT_COMPLETED` / `QUIZ_ATTEMPT_TIMEOUT`: Fin del intento, detallando el porcentaje de acierto, preguntas acertadas/falladas y si requiere revisión manual (`pending_manual_review`).

### C. Eventos de Calificación y Auditoría (Acción del Creator/Auditor)
*   `QUIZ_ATTEMPT_MANUALLY_GRADED`: Emitido cuando un evaluador finaliza la corrección de respuestas abiertas. Debe registrar el ID del evaluador, puntos asignados por pregunta y comentarios aportados.
*   `QUIZ_ATTEMPT_INVALIDATED`: En caso de que se invalide un examen por comportamiento sospechoso o problemas técnicos. Debe registrar el autor de la invalidación y el motivo.

---

## 📂 9. Guía de Enrutamiento Frontend y Arquitectura UI (Foco Junior)

> [!IMPORTANT]
> **DIRECTIVA DE ESTILOS OBLIGATORIA (ABDStyles)**: Todas las nuevas páginas, modales, botones y componentes interactivos creados en Next.js deben implementarse consumiendo exclusivamente la biblioteca centralizada **`@abd/styles`** (del paquete `@abd/styles`).
> *   Queda **estrictamente prohibido** escribir archivos CSS locales, clases personalizadas ad-hoc o estilos propios fuera del estándar de la suite.
> *   El equipo debe reutilizar de forma prioritaria los estilos y tokens ya provistos por la biblioteca.
> *   La adición de cualquier estilo nuevo en `@abd/styles` o localmente en el proyecto se limitará a casos de extrema excepcionalidad y requerirá justificación y aprobación técnica previa.

Para guiar al equipo de desarrollo y asegurar que las nuevas interfaces se ubiquen en el lugar adecuado respetando las convenciones de Next.js (App Router y localización), se detalla el siguiente mapa de rutas y estados:

### A. Estructura de Carpetas y Rutas Next.js

El equipo debe crear o extender las páginas en los siguientes directorios de cada proyecto:

#### 1. En `ABDQuiz` (Portal de Aprendizaje y Exámenes):
*   **Portal de Inicio Unificado del Estudiante (Student Dashboard)**:
    *   *Ruta*: `/src/app/[locale]/dashboard/page.tsx`
    *   *Función*: Unificar en una sola vista del alumno (Recipient) sus exámenes asignados y pendientes (llamando a `getAvailableExamsAction`), su historial de calificaciones recientes y estadísticas de intentos (unificando la analítica de `/history`), y el listado de Cursos a los que pertenece.
*   **Gestión de Cursos y Caminos Formativos**:
    *   *Ruta*: `/src/app/[locale]/admin/courses/page.tsx`
    *   *Función*: Listar cursos y abrir modales de edición del itinerario formativo (`learningPath`).
*   **Gestión de Asignaciones (Plazos e Intentos)**:
    *   *Ruta*: `/src/app/[locale]/admin/assignments/page.tsx`
    *   *Función*: Asignar plantillas de examen (`ExamConfig`) a grupos/spaces.
*   **Bandeja de Entrada de Corrección Manual**:
    *   *Ruta*: `/src/app/[locale]/admin/grading/page.tsx`
    *   *Función*: Tabla con intentos pendientes (`gradingStatus === 'pending_manual_review'`) y acceso a la vista de corrección.

#### 2. En `ABDtenantGobernance` (Consola del Administrador del Tenant):
*   **Mapeo de Literales de Rol por Tenant**:
    *   *Ruta*: `/src/app/[locale]/admin/branding/page.tsx` (o extender en la vista de configuración).
    *   *Función*: Formulario de texto para guardar las equivalencias idiomáticas de `ITenantRoleCustomization`.
*   **Asignación de Roles Contextuales**:
    *   *Ruta*: `/src/app/[locale]/admin/quiz-roles/page.tsx`
    *   *Función*: Grid interactivo para asignar usuarios a roles `CREATOR`, `RECIPIENT` o `AUDITOR` filtrados por Espacio o Curso.

### B. Mapeo de Estados del Módulo de Ingesta (`IngestDialog.tsx`)
Para implementar la lógica de conciliación y prompts interactivos, se deben estructurar los siguientes estados del Wizard en el cliente React:

1.  `'upload'`: Pantalla de drop/selección del archivo (JSON/CSV).
2.  `'select_context'`: Se activa si el archivo no trae IDs. Muestra desplegables interactivos de Spaces y Courses activos.
3.  `'remediation_ids'`: Se activa si la validación de jerarquía falla. Permite reasignar a mano o prunar de forma masiva.
4.  `'remediation_conflicts'`: Pantalla interactiva "lado a lado" que muestra la pregunta de base de datos y la entrante con resaltado de diferencias de contenido para resolver colisiones de Nivel 2 y 3.
5.  `'remediation_choice'`: Selección general para campos faltantes (Bulk, interactivo o por defecto).
6.  `'bulk_form'`: Formulario para aplicar datos en lote a campos vacíos de las preguntas.
7.  `'interactive_steps'`: Carrusel interactivo paso a paso para corregir manualmente una a una las preguntas erróneas.

### C. Nota sobre Mongoose y Multi-DB (Cómo funciona el modelo Space)
Dado que `Space` se origina en `ABDtenantGobernance` y se lee en `ABDQuiz`, los desarrolladores junior deben tener claro:
*   Ambas aplicaciones se ejecutan bajo el mismo motor multi-base de datos `getTenantModel` y usan la misma URI de conexión de MongoDB del Tenant activo en la sesión.
*   Por lo tanto, registrar el modelo en `ABDQuiz` usando `getTenantModel('Space', SpaceLiteSchema)` conectará **automáticamente** a la misma base de datos del Tenant y leerá de la colección física `spaces`. No es necesario configurar llamadas HTTP adicionales entre backend.

---

## 🚀 10. Fases de Implementación Sugeridas

El equipo de desarrollo externo debe seguir estrictamente este plan secuencial para no comprometer el estado del sistema en producción:

### Fase 1: Capa de Datos y Migración Estructural
*   Creación del esquema `Course` (integrando `Space` de `ABDtenantGobernance` como estructura organizativa en lugar de crear un modelo local `AcademicUnit`).
*   Modificación de `ExamConfig` para soportar `courseId`.
*   Script de migración para indexar de forma segura las configuraciones existentes bajo cursos por defecto de cada Tenant.

### Fase 2: Lógica de Asignaciones (`ExamAssignment`) y Timeframes
*   Creación del esquema de Asignaciones con soporte para ventanas horarias exactas.
*   Modificación del middleware o servicio de obtención de exámenes disponibles para alumnos: ahora debe listar solo asignaciones activas filtrando por el grupo del usuario y la ventana temporal/horaria vigente.

### Fase 3: Motor de Aleatoriedad y Pools Dinámicos
*   Implementación de la exclusión de preguntas ya acertadas anteriormente.
*   Desarrollo de la lógica de *slicing* de respuestas incorrectas de forma dinámica al instanciar el intento de examen.

### Fase 4: Integración del Core de Telemetría (ABDLogs)
*   Integrar las llamadas de auditoría del SDK satélite en las acciones de creación y actualización (Fase 1 y 2).
*   Implementar la traza de respuestas del alumno en tiempo real (`QUIZ_ANSWER_SUBMITTED`).

### Fase 5: Capa de Autorización Contextual (Roles Asépticos)
*   Creación de `QuizUserRole` y los mapeos en el portal de administración del Tenant.
*   Implementación de helpers de validación de políticas (ej: `hasCoursePermission(userId, courseId, 'CREATOR')`).
*   Pruebas de white-labeling en front-end para renderizar los literales del Tenant en lugar de los textos genéricos.

### Fase 6: Motor de Ingesta y Versionado de Corpus
*   Implementación del aplanamiento canónico y hashing libre de orden.
*   Desarrollo de las interfaces del diálogo interactivo de colisiones y versionado.

### Fase 7: Módulo de Preguntas Abiertas e Interfaz de Revisión
*   Añadir tipo de pregunta `'open_text'`.
*   Modificar la interfaz de realización del test para soportar inputs de texto largo (`textarea`).
*   Desarrollar la pantalla de bandeja de entrada y formulario de revisión para evaluadores (emitiendo `QUIZ_ATTEMPT_MANUALLY_GRADED`).

### Fase 8: Dashboards y Telemetría Analítica
*   Desarrollo de las vistas estadísticas con agregaciones en MongoDB.
*   Triggers avanzados a `ABDLogs` cuando se completan cursos o fallan intentos críticos de forma reiterada.

---

## 🐛 Incidencia Crítica: Desconexión del Aislamiento de Datos en Context Shift (SUPER_ADMIN)

> [!IMPORTANT]
> **BLOQUEO OPERATIVO**: Esta incidencia debe ser resuelta de manera prioritaria antes de continuar con el desarrollo de nuevas fases (como asignaciones o ingesta), ya que afecta directamente al mecanismo de seguridad y multi-inquilinato (multi-tenancy) de la plataforma para roles administrativos globales.

### Descripción del Comportamiento Anómalo
Al cambiar de Tenant utilizando el selector de inquilinos (`TenantSelector`) en el portal de administración (`/admin/exams`), la lista de exámenes mostrada sigue siendo la misma del Tenant original del usuario o se mantiene inalterada. El cambio de contexto no se refleja en los datos cargados en pantalla, a pesar de que el parámetro `tenantId` en la URL cambia correctamente (`?tenantId=NEW_ID`).

### Análisis Técnico y Causa Raíz
El flujo de resolución de base de datos en `ABDQuiz` utiliza un sistema híbrido (`getTenantModel` + `AsyncLocalStorage`) para aislar los datos de cada inquilino de forma transparente mediante prefijos de colección o bases de datos dedicadas. El fallo se debe a una desconexión entre la resolución del contexto del usuario y el almacenamiento asíncrono del hilo de ejecución:

1. **Resolución Inicial en Server Actions:**
   Al llamar a una acción del servidor para obtener configuraciones (por ejemplo, `getExamConfigsAction(resolvedTenantId)` en `page.tsx`), la acción ejecuta la utilidad `withTenantContext`:
   ```typescript
   export async function getExamConfigsAction(tenantIdParam?: string) {
     return withTenantContext(async () => { ... })
   }
   ```
2. **Establecimiento del Contexto Inalterable:**
   `withTenantContext` comprueba la sesión activa (`getIndustrialSession`) del usuario autenticado. Al detectar que hay una sesión iniciada, guarda en el almacén local asíncrono (`AsyncLocalStorage`) los metadatos de aislamiento (`dbPrefix`, `isolationStrategy`) del **inquilino de origen del usuario** (el del Super Admin, ej: `SYSTEM` o similar).
3. **Invalidez de Sobrescritura del Contexto:**
   Dentro de la acción de servidor, el código intenta aplicar la lógica de cambio de tenant para Super Administradores:
   ```typescript
   let activeTenantId = session.user.tenantId;
   if (session.user.role === 'SUPER_ADMIN' && tenantIdParam) {
     activeTenantId = tenantIdParam; // Cambia el ID de filtrado
   }
   ```
   Aunque la consulta a Mongoose se filtra con `activeTenantId` (el tenant de destino), el Proxy del modelo (`getTenantModel`) intercepta la petición y lee el `dbPrefix` desde el `AsyncLocalStorage` (el del Super Admin).
4. **Consecuencia de la Desconexión:**
   Mongoose realiza la consulta física en la colección/base de datos del **Super Admin** en lugar de cambiar la conexión o el prefijo al del **Tenant Destino**. Al buscar el `tenantId` destino en la colección física incorrecta, no se encuentran registros o se muestran datos erróneos de la colección origen.

### Solución Técnica Propuesta para el Equipo de Desarrollo

Para corregir esta vulnerabilidad de arquitectura de datos sin comprometer la seguridad de aislamiento, el equipo de desarrollo debe realizar las siguientes modificaciones:

#### 1. Ampliación de `withTenantContext` para Contexto Explícito
El helper `withTenantContext` ya soporta opcionalmente un segundo parámetro `explicitContext?: TenantContext`. Si este parámetro está definido y el usuario tiene privilegios de `SUPER_ADMIN`, se debe forzar su inicialización sobrepasando la sesión por defecto.

#### 2. Resolución de Metadatos de Tenant Destino
Se debe implementar un helper en el backend (por ejemplo, `resolveTargetTenantContext(tenantIdParam: string)`) que:
* Realice una consulta rápida a la conexión central de autenticación (`ABDElevators-Auth`, colección `tenants`) utilizando el `tenantIdParam`.
* Extraiga los campos `dbPrefix` y la estrategia de aislamiento (`isolationStrategy`) correspondientes a ese tenant destino.
* Retorne un objeto estructurado `TenantContext`.

#### 3. Modificación del Flujo de Ejecución en Actions
En todos los Server Actions que requieran soporte para cambio de tenant por parte de Super Administradores (por ejemplo, `getExamConfigsAction`, `getQuestionsAction`, `getAttemptsAction`), se debe pre-calcular el contexto explícito del tenant destino **antes** de invocar a `withTenantContext`:

```typescript
export async function getExamConfigsAction(tenantIdParam?: string) {
  const session = await getIndustrialSession();
  let explicitContext;

  // Si el usuario es SUPER_ADMIN y se ha solicitado un tenant alternativo, resolvemos su configuración física
  if (session?.user?.role === 'SUPER_ADMIN' && tenantIdParam) {
    const targetTenant = await fetchTenantConfigFromAuth(tenantIdParam);
    if (targetTenant) {
      explicitContext = {
        tenantId: tenantIdParam,
        dbPrefix: targetTenant.dbPrefix,
        isolationStrategy: targetTenant.isolationStrategy || 'COLLECTION_PREFIX'
      };
    }
  }

  // Se ejecuta la acción bajo el contexto físico (BD/colección) del tenant seleccionado
  return withTenantContext(async () => {
    await connectDB();
    const activeTenantId = explicitContext ? explicitContext.tenantId : session.user.tenantId;
    
    let configs = await ExamConfig.find({ 
      tenantId: activeTenantId,
      active: true 
    }).sort({ createdAt: -1 }).lean();
    
    return configs;
  }, explicitContext);
}
```

---

## 🛠️ 12. Especificaciones de Robustez Industrial, Seguridad e Integridad de Datos

Para alcanzar el nivel de cumplimiento de nivel Enterprise en la suite, el equipo de desarrollo debe implementar las siguientes especificaciones avanzadas en la persistencia, telemetría y seguridad del examen:

### A. Gestión de Adjuntos en Preguntas (Roadmap Documental)
*   **Alcance Actual**: Queda como especificación abierta a realizar. No se integrará almacenamiento de binarios directamente en el backend de `ABDQuiz`.
*   **Diseño de Integración**: Se implementará un campo `attachments: [String]` (URLs) en el esquema de `Question`. Estas imágenes y diagramas se alojarán en **Cloudinary** a través de una nueva aplicación centralizada de gestión documental de la suite.

### B. Control de Concurrencia al Editar Preguntas (Optimistic Locking & Versionado)
*   **Recálculo de Hashes**: Al realizar cualquier modificación sobre el enunciado (`questionText`) o el listado de opciones de una pregunta, el backend debe recalcular de forma obligatoria todos sus hashes semánticos asociados (`questionTextHash`, `optionHashes` y `contentHash`) y actualizarlos en la base de datos.
*   **Integridad Histórica (Copy-On-Write)**: Si se edita una pregunta que **ya ha sido publicada o utilizada en algún examen/intento previo**:
    *   No se permite la sobreescritura directa del documento de base de datos.
    *   El sistema debe forzar una bifurcación o versionado (crear un nuevo registro con versión incrementada, ej. de `v1` a `v2`, y marcar la anterior como `active: false`). Esto garantiza que los intentos pasados retengan el contenido exacto con el que fueron realizados.

### C. Integración de Logs con ABDLogs y Resiliencia de Conexión (Fail-Safe)
La telemetría de exámenes debe apoyarse en la infraestructura y funciones estándar provistas por **ABDLogs**.

1.  **Validación de Conectividad (Pre-flight Check)**:
    *   Antes de iniciar oficialmente cualquier intento de examen (`QUIZ_ATTEMPT_STARTED`), `ABDQuiz` debe realizar un chequeo de conexión con la aplicación `ABDLogs`.
    *   Si el servicio `ABDLogs` no responde o no está disponible, el sistema debe pausar el inicio del examen y mostrar una advertencia al usuario, garantizando que no se inicien pruebas sin trazabilidad activa.
2.  **Amortiguación de Logs en Modo Offline (Offline Buffering)**:
    *   Dado que `ABDLogs` incorpora un sistema de encadenamiento de firmas (blockchain de logs), si la red del cliente sufre una desconexión o caída intermedia durante el examen, los eventos de telemetría (tales como `QUIZ_ANSWER_SUBMITTED`) no deben descartarse.
    *   Se deben amortiguar (almacenar temporalmente) en el almacenamiento local del cliente (`localStorage` o similar). Una vez restablecida la conexión, se enviarán en ráfaga para re-sincronizar y firmar en la blockchain de `ABDLogs`.
3.  **Políticas de Retención**:
    *   El borrado periódico, la compresión de logs antiguos en formato ZIP y su puesta a disposición de los administradores de cada inquilino a través del gestor documental se delegan directamente en la lógica global del componente **ABDAgRAG** dentro de `ABDLogs`.

### D. Seguridad de Tiempos y Prevención de Abuso (Anti-Clock Tampering)
1.  **Protección contra Alteración del Reloj Local**:
    *   Queda estrictamente prohibido que el frontend dependa exclusivamente del reloj del cliente (`new Date()`) para controlar la expiración de un intento.
    *   El servidor debe validar la hora de recepción de cada respuesta. Si se detecta una respuesta con fecha/hora incoherente o posterior al margen de gracia otorgado (`attemptStartedAt + limitSeconds + 30s de gracia`), el backend invalidará la pregunta y forzará el estado `timeout` del intento completo.
    *   La interfaz debe sincronizar periódicamente (cada 30s) el contador de tiempo con el servidor mediante heartbeats ligeros.
2.  **Protección de Doble Envío (Double Submission Guard)**:
    *   Todos los botones y llamadas de API de finalización de examen deben bloquearse en la interfaz tras el primer clic para evitar envíos dobles.
    *   El backend debe impedir la creación de un nuevo intento (`ExamAttempt`) si el usuario ya cuenta con un intento activo (`in_progress`) para la misma asignación.

### E. Coherencia de Datos y Políticas de Preservación
1.  **Inactivación en Cascada (Soft-Delete Cascade)**:
    *   Para evitar datos huérfanos o pantallas vacías en el alumno, la desactivación lógica de un `Space` o `Course` (`active: false`) debe propagar automáticamente su estado inactivando todas las asignaciones de exámenes (`ExamAssignment`) asociadas.
    *   Se deben implementar middlewares o hooks en Mongoose (`pre('save')` o `pre('findOneAndUpdate')`) para garantizar esta consistencia en cascada.
2.  **Política de No-Borrado Físico (Archive-Only)**:
    *   Queda totalmente prohibido el uso de borrados físicos (`deleteOne`/`deleteMany`) para preguntas, cursos o asignaciones que cuenten con datos relacionados.
    *   Cualquier eliminación se tratará como un cambio de estado a `active: false` o `status: 'archived'`, asegurando que los intentos del pasado (`ExamAttempt`) sigan conservando sus referencias a nivel de base de datos para auditorías de aprendizaje.

### F. Comportamiento y UX de la Interfaz (UX Reactiva)
1.  **Modo de Alerta de Temporizador**:
    *   Cuando el tiempo restante de un examen caiga por debajo del 10% del total (o resten menos de 2 minutos), la interfaz del examen debe transicionar visualmente a un estado de alta urgencia: contador parpadeante en tono rojo/naranja HSL y visualización detallada de segundos en lugar de minutos.
2.  **Auto-guardado Tácito con Feedback de Sincronización**:
    *   No se forzará al alumno a hacer clic en "Guardar" de forma manual. La UI enviará automáticamente las respuestas seleccionadas al servidor en segundo plano.
    *   Se mostrará un indicador de estado dinámico en la barra superior: `[Sincronizando...]` $\rightarrow$ `[Guardado]`. Si se detecta pérdida de red, el indicador cambiará a `[Guardado en local - Sin conexión]`.
3.  **Detección de Pérdida de Foco (Blur Warning)**:
    *   El frontend del examen debe interceptar la pérdida de foco de la pestaña (`window.onblur`).
    *   Al perderse el foco (por cambiar de pestaña o de aplicación), la UI del examen se pausará temporalmente mostrando una advertencia de bloqueo a pantalla completa: *"Atención: El foco del examen se ha perdido. El evento ha sido reportado en la auditoría del sistema."*
4.  **Virtualización de Renderizado en Exámenes Extensos**:
    *   Para evitar caídas de rendimiento en el navegador al renderizar exámenes de alta densidad (ej: más de 50 preguntas), el equipo de frontend debe utilizar virtualización de componentes React o paginación por bloques, cargando en el DOM únicamente lo visible o necesario.

---

## 🛠️ Andamiaje de Desarrollo y Tareas Atómicas para Equipos Junior

Para facilitar la ejecución por parte de perfiles junior y asegurar que no se comprometa la arquitectura multi-base de datos, se divide la hoja de ruta en tareas altamente acotadas e independientes.

### 📋 Reglas de Calidad Obligatorias (Control de Cambios)
1. **Protección de Contexto**: Queda prohibido omitir o remover los wrappers `withTenantContext` en los Server Actions o API routes. Cualquier consulta directa a Mongoose sin este wrapper creará brechas de aislamiento.
2. **TypeScript Estricto**: No se permite el uso del tipo `any`. Todo modelo Mongoose, respuesta de acción y parámetro de función debe definir sus interfaces específicas (extendiendo de `Document` o `Serialized*` cuando corresponda).
3. **No Duplicidad de Modelos Compartidos**: No se creará la base de datos o colección `AcademicUnit`. Se debe consumir el modelo `Space` mediante el esquema ligero `SchemaLigero` (solo lectura) tal como se especifica en la Sección 1.A.
4. **Uso Obligatorio de `@abd/styles` (ABDStyles)**: Queda estrictamente prohibido escribir hojas de estilo locales (`.css`), estilos inline o clases personalizadas ad-hoc para nuevos desarrollos. Toda interfaz de usuario nueva (vistas, modales, formularios, componentes) se debe estructurar utilizando las clases, tokens visuales y componentes exportados de `@abd/styles`. Solo se autorizará de manera excepcional la creación de nuevos estilos locales bajo rigurosa justificación y revisión del Lead Architect.

---

### 🏃 Sprints y Desglose de Tareas

#### 📅 Sprint 1: Estructura de Datos Básica y Modelos
* **Tarea 1.1**: Crear el archivo `Course.ts` en `src/models/` replicando exactamente el esquema e interfaz provistos en la Sección 1.B.
* **Tarea 1.2**: Modificar `ExamConfig.ts` para agregar el campo `courseId` de tipo `Schema.Types.ObjectId` (apuntando a `Course`) e indexarlo.
* **Tarea 1.3**: Diseñar y ejecutar un script de migración en NodeJS que cargue todos los `ExamConfig` activos actuales y les asocie un curso genérico temporal (usando la ID por defecto del tenant).

#### 📅 Sprint 2: Integración de Espacios e Integridad Jerárquica
* **Tarea 2.1**: Implementar el modelo de solo lectura `Space` en `ABDQuiz` importando el esquema ligero y limitando su compilación mediante `getTenantModel`.
* **Tarea 2.2**: Crear la vista de administración `/admin/courses` que liste los cursos existentes consumiendo el listado de Espacios (`Space`) activos para filtrar y validar su procedencia.
* **Tarea 2.3**: Escribir los tests unitarios en Vitest para asegurar que `QuizUserRole` no permite registrar accesos duplicados del mismo usuario para un mismo curso o espacio (índice único compuesto).

#### 📅 Sprint 3: Flujo de Context Shift Seguro (SUPER_ADMIN)
* **Tarea 3.1**: Implementar la función `resolveTargetTenantContext(tenantIdParam)` resolviendo la conexión central de autenticación para obtener el `dbPrefix` correspondiente.
* **Tarea 3.2**: Refactorizar **todas las Server Actions administrativas** (24 en total) para inyectar el `explicitContext` según el patrón descrito en la Sección 10. Esto incluye `examConfig.ts` (5), `examAssignment.ts` (7), `quiz.ts` (3), `question.ts` (3), `grading.ts` (3) y `allegations.ts` (3) — más 71 tests unitarios que validan context shift, anti-IDOR y recalculo de score.
* **Tarea 3.3**: Adaptar la interfaz `ExamsList` para renderizar el listado en base al tenant seleccionado en la barra superior.
* **Tarea 3.4**: Crear la página `/dashboard/page.tsx` para unificar exámenes asignados/pendientes, historial de notas y cursos del estudiante en un panel de inicio integrado.

---

---

# 📋 Auditoría de Implementación vs. Especificaciones

> Auditoría generada el 27 de mayo de 2026 tras inspeccionar toda la base de código.

## ✅ Desarrollos que SÍ están en el spec y están implementados

| Sección | Feature | Archivos |
|---|---|---|
| **1.A** | Space — modelo read-only en ABDQuiz con `parentSpaceId` + `materializedPath` | `ABDQuiz/src/models/Space.ts` |
| **1.A** | SchemaLigero completo: `name`, `parentSpaceId`, `materializedPath`, `collaborators` | `ABDQuiz/src/models/Space.ts` |
| **6.A** | Tipo de pregunta `open_text` — Modelo Question.ts + UI alumno con textarea y estado de texto | `Question.ts`, `QuizQuestion.tsx`, `QuizInterface.tsx` |
| **6.B** | Campos `manualTextAnswer`, `manualPointsAwarded`, `feedback`, `gradingStatus`, `gradedBy`, `gradedAt` en ExamAttempt | `ExamAttempt.ts` |
| **6.C** | Panel de auditoría y corrección (`/admin/grading`) | `GradingManager.tsx`, `grading/page.tsx`, `grading.ts` |
| **8.C** | Log: `QUIZ_ATTEMPT_MANUALLY_GRADED` | `grading.ts` (vía `LogsClient.log()`) |
| **9.A** | Ruta `/admin/grading` con GradingManager | `ABDQuiz/src/app/[locale]/admin/grading/page.tsx` |
| **9.A** | Dashboard card "Calificación Manual" en admin dashboard | `admin/page.tsx` |
| **1.B** | Course — modelo completo con learningPath | `ABDQuiz/src/models/Course.ts` |
| **1.C** | ExamConfig — campo `courseId` agregado | `ABDQuiz/src/models/ExamConfig.ts` |
| **2.A** | Roles funcionales CREATOR / RECIPIENT / AUDITOR | `ABDQuiz/src/models/QuizUserRole.ts` |
| **2.C** | QuizUserRole — modelo + índices únicos | `ABDQuiz/src/models/QuizUserRole.ts`, `ABDtenantGobernance/src/models/QuizUserRole.ts` |
| **2.D** | UI de asignación de roles en ABDtenantGobernance (`/admin/quiz-roles`) | `ABDtenantGobernance/src/app/[locale]/admin/quiz-roles/page.tsx`, `actions.ts` |
| **2.B** | `roleCustomization` en ITenant — interfaz, Mongoose schema, Zod validation | `Tenant.ts`, `tenant.ts` |
| **2.B** | UI de literales de roles contextuales (CREATOR/RECIPIENT/AUDITOR × ES/EN) en branding | `TenantBrandingForm.tsx`, `branding/page.tsx`, `branding.ts` |
| **2.B** | Traducciones `roleLiteralsTitle` / `roleLiteralsDesc` | `en.json`, `es.json` |
| **2.E** | Scope Guard — `requireQuizScope` / `assertQuizScope` | `ABDQuiz/src/lib/auth/scope-guard.ts` |
| **3** | ExamAssignment — modelo, CRUD, publicación, archivado | `ExamAssignment.ts`, `examAssignment.ts`, `AssignmentsList.tsx` |
| **3** | Fechas como rangos exactos con server-side validation | `examAssignment.ts` |
| **3** | Validación de fechas (endDate > startDate) | `examAssignment.ts` |
| **4.A** | `questionCount` + selección en quizService | `ExamConfig.ts`, `quizService.ts` |
| **4.B** | `shuffleOptions` | `ExamConfig.ts` |
| **5.A** | Ingesta JSON + CSV (PapaParse) | `CorpusImporter.ts` |
| **5.C** | Hash SHA-256 de preguntas | `hash.ts` |
| **5.D** | Detección de duplicados por hash | `CorpusImporter.ts` |
| **5.F** | Zod validation (`IngestQuestionSchema`) | `corpusSchema.ts` |
| **5.F** | PapaParse para CSV (no `.split()`) | `CorpusImporter.ts` |
| **6.D** | Índices compuestos en `ExamAttempt` | `ExamAttempt.ts` |
| **8.A** | Logs: `QUIZ_EXAM_CONFIG_CREATE/UPDATE` | `examConfig.ts` |
| **8.A** | Logs: `QUIZ_ASSIGNMENT_CREATE/PUBLISHED` | `examAssignment.ts` |
| **8.B** | Logs: `QUIZ_ATTEMPT_STARTED/COMPLETED/TIMEOUT/ANSWER_SUBMITTED` | `quiz.ts` |
| **8.C** | Logs: `EXAM_ATTEMPT_INVALIDATED` | `quiz.ts` |
| **9.A** | Ruta `/admin/assignments` | `ABDQuiz/src/app/[locale]/admin/assignments/page.tsx` |
| **9.A** | Ruta `/admin/exams/[id]/edit` | `ABDQuiz/src/app/[locale]/admin/exams/[id]/edit/page.tsx` |
| **9.A** | UI de ingesta: estados Upload, RemediationChoice, InteractiveSteps | `ABDQuiz/src/components/admin/ingest/*.tsx` |
| **9.C** | Nota multi-DB: `getTenantModel` + `AsyncLocalStorage` | `tenant-model.ts` |
| **10 / 3.1** | `resolveTargetTenantContext(tenantId?)` — resuelve dbPrefix/isolationStrategy desde la BD central de auth | `ABDQuiz/src/lib/tenant-resolver.ts` |
| **10 / Tests** | `tenant-resolver.test.ts` — 13 tests (empty passthrough, connection errors, ambas estrategias, not found, defaults, errores DB) | `ABDQuiz/src/lib/tenant-resolver.test.ts` |
| **10 / Tests** | `examConfig.test.ts` — 13 tests (update/delete/clone: unauthorized, same-tenant, cross-tenant rejection, SUPER_ADMIN shift) | `ABDQuiz/src/actions/examConfig.test.ts` |
| **10 / Tests** | `quiz.test.ts` — 14 tests (finishQuizAction: 6, invalidateAttemptAction: 8 — context shift, anti-IDOR, errores) | `ABDQuiz/src/actions/quiz.test.ts` |
| **10 / Tests** | `grading.test.ts` — 28 tests (getAttemptsForGradingAction: 7, getAttemptDetailAction: 8, submitManualGradingAction: 13 — recalculo, shift, anti-IDOR) | `ABDQuiz/src/actions/grading.test.ts` |
| **2.E (ext)** | `ensureAdminOrProfessor` con scope fallback — USER+PROFESSOR vía `requireQuizScope` | `ensureQuizAccess.ts`, `ensureQuizAccess.test.ts` |
| **10 / Tests** | `examAssignment.test.ts` — 3 context-shift tests añadidos (SUPER_ADMIN otro tenant, passthrough, non-SUPER_ADMIN shift) | `ABDQuiz/src/actions/examAssignment.test.ts` |
| **10 / 3.2** | **24 Server Actions** refactorizadas con `explicitContext` para context shift cross-tenant: `getExamConfigsAction`, `createExamConfigAction`, `updateExamConfigAction`, `deleteExamConfigAction`, `cloneExamConfigAction`, `listAssignmentsAction`, `getAvailableExamsAction`, `createAssignmentAction`, `updateAssignmentAction`, `publishAssignmentAction`, `archiveAssignmentAction`, `deleteAssignmentAction`, `getAttemptsAction`, `finishQuizAction`, `invalidateAttemptAction`, `getQuestionsAction`, `checkQuestionTraceabilityAction`, `saveQuestionAction`, `getAttemptsForGradingAction`, `getAttemptDetailAction`, `submitManualGradingAction`, `resolveAllegationAction`, `rejectAllegationAction`, `getTenantAllegationsAction` | `examConfig.ts`, `examAssignment.ts`, `quiz.ts`, `question.ts`, `grading.ts`, `allegations.ts` |
| **12.D** | `isInvalidated` / `invalidatedBy` / `invalidatedAt` en ExamAttempt | `ExamAttempt.ts` |
| **12.E** | Soft-delete (`active: false`) en acciones de asignación | `examAssignment.ts` |
| **5.F** | Transacciones MongoDB — Mongo `startSession` con fallback de compensación en Standalone | `CorpusImporter.ts` |
| **9.B** | Wizard: `select_context` — selector interactivo Space/Course para preguntas sin IDs jerárquicos | `SelectContextState.tsx`, `corpus.ts` |
| **9.B** | Wizard: `remediation_ids` — validación jerárquica server-side con reasignación manual y "recordar decisión" | `RemediationIdsState.tsx`, `corpus.ts` |
| **9.B** | Wizard: `remediation_conflicts` — detección de colisiones semánticas (N2/N3) con comparación lateral | `RemediationConflictsState.tsx`, `conflictDetector.ts` |
| **5.D** | Detector de colisiones intra-lote — N2 (texto normalizado) + N3 (Dice ≥ 0.75) — 17 tests | `conflictDetector.ts` |
| **5.A/5.B** | Persistencia jerárquica `spaceId`/`courseId` en Question model + CSV mapping | `Question.ts`, `CorpusImporter.ts` |
| **5.B** | Validación de jerarquía — `validateHierarchyAction` con 8 casos de error tipificados | `corpus.ts` |
| **5.B** | Server Actions de contexto: `getActiveSpacesAction` y `getCoursesBySpaceAction` | `corpus.ts` |
| **Testing** | Test de integración del wizard completo (6 escenarios: flujo completo, clean import, skip context, remember, nullify course, filter courses) | `ingestionWizard.integration.test.ts` |
| **12.B** | Copy-On-Write — `version` en Question, bifurcación forzada si `checkTraceability()` (pregunta usada en intentos previos). Preserva `spaceId`/`courseId`/`originImportId` en COW. | `Question.ts`, `QuestionService.ts` |

## ⚠️ Desarrollos Parciales / Con diferencias respecto al spec

| Sección | Detalle |
|---|---|

| **5.A (temporal)** | `loadedAt`/`generatedAt`/`importVersion` — Parseados por Zod schema (`IngestQuestionSchema`) y extraídos del input por `IngestDialog.tsx`, pero **NO persistidos** en el modelo Question (`CorpusImporter.ts` los ignora). Desviación del spec. |
| **2.A** — RECIPIENT en Gobernance | El spec define `CREATOR \| RECIPIENT \| AUDITOR`. El modelo de `ABDtenantGobernance` solo tiene `CREATOR \| AUDITOR` (sin RECIPIENT). En `ABDQuiz` sí está completo. |
| **5.D** — Tres niveles de colisión | ⚠️ **Implementado pero con desviaciones del spec.** `conflictDetector.ts` detecta N2 (mismo texto normalizado) y N3 (Dice ≥ 0.75), pero no verifica `opciones`/`respuesta_correcta`. El spec define N2 como "misma pregunta+opciones, answer diferente" y N3 como "mismas pregunta, opciones diferentes". La implementación no discrimina estos casos correctamente. |
| **5.F** — Sanitización XSS/NoSQL | El spec pide sanitización de textos importados. No se ha implementado capa de sanitización explícita. |
| **6.D** — Indexación en ExamAttempt | El spec pide índices `{ tenantId, courseId, groupId, createdAt }` y `{ tenantId, userId, examAssignmentId, createdAt }`. El modelo real tiene índices similares pero con variaciones en los campos exactos. |
| **8.A** — Eventos QUIZ_SPACE_LINK / QUIZ_COURSE | El spec lista `QUIZ_SPACE_LINK_CREATE/UPDATE` y `QUIZ_COURSE_CREATE/UPDATE/DELETE`. No se emiten estos eventos (no hay lógica de vinculación de Spaces ni acciones CRUD de Courses implementadas aún). |
| **9.A** — Rutas faltantes | `/admin/grading` ✅, `/admin/courses` ❌, `/admin/branding` (roleCustomization) ✅, `/admin/quiz-roles` ✅ en Gobernance. |
| **9.B** — Estados Wizard de ingesta | ✅ **7/7 completados**: `upload`, `select_context`, `remediation_ids`, `remediation_conflicts`, `remediation_choice`, `bulk_form`, `interactive_steps`. |
| **12.E** — Soft-delete cascade | No hay hooks/middlewares Mongoose que propaguen `active: false` de Space/Course a ExamAssignments asociados. |

## ❌ Desarrollos NO Implementados (spec puro)

| Sección | Feature |
|---|---|
| **1.C** | Script de migración para ExamConfigs huérfanos → curso por defecto |
| ~~**2.B**~~ | ~~`roleCustomization` en ITenant (literales por tenant) + UI en branding~~ |
| **4.A** | `excludePreviouslyCorrect` — filtrar preguntas ya acertadas |
| **4.B** | Dynamic slicing de opciones — mostrar subconjunto de opciones incorrectas |
| **5.B** | Inferencia automática de `spaceId` desde `courseId` cuando solo `courseId` está presente (el spec dice "backend resuelve e infiere el spaceId asociado al curso") — `validateHierarchyAction` requiere `spaceId` como parámetro obligatorio. Sin implementar. |
| **5.E** | Reutilización Cross-Space (pool compartido) |
| **7** | Learning Analytics (endpoints de agregación, mapas de calor, curvas de aprendizaje) |
| **12.A** | Adjuntos en preguntas (`attachments: [String]`) |
| **12.C.1** | Pre-flight check de conectividad con ABDLogs |
| **12.C.2** | Offline buffering de logs en localStorage |
| **12.D.1** | Anti-clock tampering (heartbeats cada 30s, validación server-side) |
| **12.D.2** | Double submission guard (backend bloquea intentos duplicados activos) |
| **12.F.1** | Modo alerta de temporizador (<10% tiempo) |
| **12.F.2** | Auto-guardado tácito con feedback de sincronización |
| **12.F.3** | Detección de pérdida de foco (blur warning) |
| **12.F.4** | Virtualización de renderizado en exámenes extensos |

## 🚀 Desarrollos ADICIONALES (NO contemplados en el spec pero implementados)

| Feature | Archivos | Detalle |
|---|---|---|
| **Audit Trail inline en ExamAssignment** | `ExamAssignment.ts`, `examAssignment.ts`, `AssignmentsList.tsx`, `messages/*.json` | Historial de cambios embebido en cada asignación con `auditTrail: IAuditEntry[]`, colapsable en tarjeta con línea de tiempo visual, acción, usuario, fecha y detalle. |
| **Modal de edición de asignaciones** | `AssignmentsList.tsx`, `examAssignment.ts`, `messages/*.json` | Botón Pencil en cada tarjeta → modal precargado con datos existentes, llama a `updateAssignmentAction`. |
| **Filtro por configuración de examen** | `AssignmentsList.tsx`, `messages/*.json` | Select en header de asignaciones para filtrar por `examConfigId`, derivado vía `useMemo`. |
| **Bloqueo de campos en asignaciones publicadas** | `AssignmentsList.tsx`, `examAssignment.ts`, `messages/*.json` | Al editar asignación publicada, `examConfigId`, `assignedToType`, `assignedToId` aparecen deshabilitados con candado y tooltip. Validación server-side. |
| **AssignmentsList.test.tsx (14 tests)** | `AssignmentsList.test.tsx` | Tests para listado vacío, renderizado, creación, edición, validación, filtro, bloqueo de campos publicados, y audit trail. |
| **Modelo QuizUserRole en ABDtenantGobernance** | `ABDtenantGobernance/src/models/QuizUserRole.ts` | Modelo duplicado en Gobernance con scope extendido (`exam_config` adicional). Server Actions con `getExplicitContext` + `withTenantContext`. |
| **Normalización de texto para hash** | `normalize.ts` | Funciones `normalizeString` y `normalizeOptions` para estandarizar contenido semántico (trim, lowercase, unificación espacios, normalización Unicode NFC). |
| **LogsClient multi-evento** | `quiz.ts`, `examConfig.ts`, `examAssignment.ts` | Logs estructurados con `changedFields` y `previousState` en create, update, publish, archive, delete, start quiz, submit answer, finish quiz, invalidate. |
| **Cleanup script `cleanup-all.mjs`** | `ABDQuiz/scripts/cleanup-all.mjs` | Script Node.js que limpia todas las colecciones de ABDQuiz del tenant activo. Soporta flags `--tenant`, `--all`, `--drop-collections`. Ejecutado con éxito (78 docs eliminados). |
| **Tests unitarios: `quiz.test.ts`** | `ABDQuiz/src/actions/quiz.test.ts` | 14 tests para `finishQuizAction` (6) e `invalidateAttemptAction` (8): no session, same-tenant, SUPER_ADMIN shift, anti-IDOR, not found, previous state, fallback invalidatedBy. |
| **Tests unitarios: `grading.test.ts`** | `ABDQuiz/src/actions/grading.test.ts` | 28 tests para `getAttemptsForGradingAction` (7), `getAttemptDetailAction` (8), `submitManualGradingAction` (13): recalculo de score, context shift, anti-IDOR, negative fallback, empty feedback skip. |
| **Tests unitarios: `examConfig.test.ts`** | `ABDQuiz/src/actions/examConfig.test.ts` | 13 tests para update/delete/clone: unauthorized, same-tenant, cross-tenant rejection, SUPER_ADMIN shift, bypass. |
| **Tests unitarios: `tenant-resolver.test.ts`** | `ABDQuiz/src/lib/tenant-resolver.test.ts` | 13 tests para `resolveTargetTenantContext`: empty passthrough, connection errors, ambas estrategias de aislamiento, not found, defaults. |
| **Tests unitarios: `ensureQuizAccess.test.ts` (20 tests)** | `ensureQuizAccess.test.ts` | Tests unitarios: roles de sistema ADMIN/PROFESSOR/SUPER_ADMIN/USER/AUDITOR/OPERATOR (7) + scope fallback USER+PROFESSOR en course/space, CREATOR bypass, edge cases (13). |
| **Rol PROFESSOR en ABDAuth** | `ABDAuth` (8 archivos: UserRoleSchema, roles.ts, proxy, api-auth, sidebar, dashboard, users page, messages) + `scratch/seed-professor.mjs` | Nuevo rol de sistema PROFESSOR con acceso a dashboard admin de ABDAuth. Seed: profesor@test.com / 11111111. |
| **UI alumno para open_text** | `QuizQuestion.tsx`, `QuizInterface.tsx`, `actions/quiz.ts`, `services/quiz/quizService.ts`, `messages/es.json`, `messages/en.json` | Textarea en QuizQuestion con badge DESARROLLO + contador caracteres; estado textAnswers en QuizInterface; persistencia manualTextAnswer en submitAnswer; traducciones yourAnswer/openTextBadge/openTextPlaceholder/characters. |
| **SelectContextState** | `SelectContextState.tsx` | Selector interactivo de Space/Course con carga asíncrona, skip mode y auto-selección si solo hay 1 opción. |
| **RemediationIdsState** | `RemediationIdsState.tsx` | Resolución de conflictos jerárquicos: reasignación manual, nullify course, recordar decisión batch. |
| **RemediationConflictsState** | `RemediationConflictsState.tsx` | Comparación side-by-side con opciones resaltadas, radio keep_both/skip_second, progress bar. |
| **conflictDetector.ts** | `conflictDetector.ts` | Colisiones N2 (texto normalizado) + N3 (Dice ≥ 0.75). 17 tests unitarios. |
| **Persistencia jerárquica** | `Question.ts`, `CorpusImporter.ts`, `QuestionService.ts` | `spaceId`/`courseId` en Question model + preservación en import JSON/CSV + herencia en COW. |
| **validateHierarchyAction** | `corpus.ts` | 8 casos de error tipificados: space_not_found, space_inactive, course_not_found, course_inactive, course_not_in_space. |
| **Integration test wizard completo** | `ingestionWizard.integration.test.ts` | 6 escenarios con mocks vi.hoisted() y mockFindOneResult helper. |
| **Bugfix: CSV mapping** | `CorpusImporter.ts` | importFromCsv ahora mapea spaceId/courseId de las filas CSV. |

## 🏃 Estado de los Sprints

| Tarea | Estado |
|---|---|
| **Sprint 1.1** — Course.ts | ✅ |
| **Sprint 1.2** — courseId en ExamConfig | ✅ |
| **Sprint 1.3** — Migración ExamConfigs huérfanos | ⚠️ Sustituido — no hay datos legacy en pruebas. Se creó `cleanup-all.mjs` para limpiar BD. |
| **Sprint 2.1** — Space modelo ligero read-only con `parentSpaceId` + `materializedPath` | ✅ |
| **Sprint 2.2** — /admin/courses page | ❌ |
| **Sprint 2.3** — QuizUserRole índice único | ✅ |
| **Sprint 3.1** — resolveTargetTenantContext | ✅ |
| **Sprint 3.2** — Refactorizar **24 Server Actions** con explicitContext (examConfig: 5, examAssignment: 7, quiz: 3, question: 3, grading: 3, allegations: 3) | ✅ |
| **Sprint 3.3** — ExamsList adaptado a tenant selector | ✅ |
| **Sprint 3.4** — /dashboard page (Portal del Estudiante) | ❌ |
| **Sprint 5.1** — Rol PROFESSOR en ABDAuth (sistema + seed script) | ✅ |
| **Sprint 5.2** — ensureAdminOrProfessor con scope fallback (USER+PROFESSOR vía requireQuizScope) | ✅ |
| **Sprint 7.1** — open_text tipo de pregunta en Question.ts + backend (quizService, finishQuiz) | ✅ |
| **Sprint 7.2** — UI alumno para open_text (textarea, estado textAnswers, envío, traducciones) | ✅ |

---

*Última actualización: 27 de mayo de 2026 (v7) — Auditoría completa: 108 tests unitarios (+17 conflictDetector + tests integración) + 14 tests UI = 122 tests totales. Wizard de ingesta 7/7 completado (select_context, remediation_ids, remediation_conflicts). Persistencia jerárquica spaceId/courseId en Question model + CorpusImporter + CSV. conflictDetector con 3 niveles de colisión. Test de integración del wizard (6 escenarios). Bugfix: importFromCsv ahora mapea spaceId/courseId.*

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]
	* [[01_active_specs/ESPECIFICACIONES_ANALYTICS.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDQuiz.md]]
