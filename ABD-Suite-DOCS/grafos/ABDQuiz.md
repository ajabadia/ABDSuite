# 🎓 Grafo de Interrelaciones: ABDQuiz (Ecosistema de Aprendizaje)

Este documento representa el mapa de interrelaciones, flujos de importación de corpus normativos, generación de preguntas mediante IA, gestión de exámenes y sincronización de analíticas del componente **ABDQuiz**, estructurado con enlaces `[[WikiLinks]]` para **Obsidian**.

---

## 🏗️ Puntos de Entrada e Integraciones

### 🛰️ Proxy y Middleware de Locale
* [[src/proxy.ts]]
	* Configura la internacionalización de la aplicación y valida que el usuario posea roles y sesiones válidas de la suite usando `[[@ajabadia/satellite-sdk]]`.

### 🛣️ Endpoints y Acciones de Servidor (Server Actions)
* [[src/actions/quiz-actions.ts]] (si aplica)
	* Enlaza la UI con la lógica de envío de intentos de examen (`submitAttempt`), selección de respuestas y carga de ficheros normativos.

---

## 🛠️ Servicios de Negocio e Ingestión de Contenidos

### 📚 Gestión de Exámenes e Intentos
* [[src/services/quiz/quizService.ts]]
	* Orquesta la lógica de creación y corrección de cuestionarios, cálculo de notas y límites de tiempo.
	* Consume `[[src/services/quiz/quizAttemptBuilder.ts]]` para estructurar los intentos.
	* Delega las reglas de selección aleatoria al planificador `[[src/services/quiz/questionSelectionStrategies.ts]]`.
* [[src/services/quiz/analyticsSyncService.ts]]
	* Sincroniza en segundo plano las métricas de exámenes completados y las remite a `[[ABDAnalytics]]`.
	* Actualiza los agregados en `[[src/models/UserCourseSummary.ts]]` y `[[src/models/CourseAnalytics.ts]]`.

### 📂 Ingestión y Procesamiento de Corpus
* [[src/services/corpus/CorpusImporter.ts]]
	* Importa archivos JSON/CSV con normativas, políticas y leyes del sector.
	* Valida el formato y lo inserta en `[[src/models/CorpusImport.ts]]` e indexa filas individuales en `[[src/models/CorpusImportRow.ts]]`.
* [[src/services/corpus/QuestionService.ts]]
	* Permite consultar y administrar las preguntas del corpus.
	* Interactúa directamente con el repositorio `[[src/models/Question.ts]]`.
* [[src/services/ai/aiService.ts]] (si aplica)
	* Invoca a LLM externos/internos para la generación automatizada de preguntas de opción múltiple a partir de un fragmento de texto normativo importado.

---

## 📂 Modelos de Datos (Mongoose)

* [[src/models/Course.ts]]
	* Representa un curso o programa formativo asociado a un Tenant.
* [[src/models/Question.ts]]
	* Banco de preguntas del ecosistema (enunciado, alternativas de respuesta, explicación y tags).
* [[src/models/ExamConfig.ts]]
	* Parámetros de examen (preguntas mínimas requeridas, nota de aprobación, penalizaciones y límites de tiempo).
* [[src/models/ExamAssignment.ts]]
	* Asignaciones de exámenes a usuarios específicos con fechas límite.
* [[src/models/ExamAttempt.ts]]
	* Registro detallado de cada intento de examen (respuestas del usuario, tiempo consumido, puntuación final y estado).
* [[src/models/CorpusImport.ts]]
	* Registro de control de la importación masiva de documentos regulatorios.
* [[src/models/CorpusImportRow.ts]]
	* Cada una de las secciones/artículos importados del corpus normativo.
* [[src/models/Allegation.ts]]
	* Gestión de reclamaciones e impugnaciones presentadas por los alumnos sobre preguntas específicas.
* [[src/models/UserCourseSummary.ts]]
	* Progreso general consolidado del alumno en sus cursos asignados.

## 🎨 Interfaces de UI e Interacción

* [[src/app/[locale]/logout-success/page.tsx]]
	* Renderiza la pantalla unificada de despedida delegando en el widget `[[ABDEcosystemWidgets|LogoutSuccessView]]`.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ESPECIFICACIONES_ECOSISTEMA_APRENDIZAJE.md]] (Estructura de cuestionarios, asignación de cursos e IA generator).
	* [[01_active_specs/ROADMAP.md]] (Hitos del desarrollo del motor de entrenamiento normativo).

