# Walkthrough: Validación E2E Dura (Fase 24)

Siguiendo el diseño de la **Opción 2**, hemos preparado el entorno para una validación integral del motor de orquestación, permitiendo estresar la lógica de resolución de metadatos ante escenarios reales de "suciedad" en los datos.

## Componentes Entregados

### 1. Seeder de Alta Fidelidad (`hard-e2e-tester.ts`)
He implementado una suite que prepara automáticamente tres escenarios críticos en la base de datos Dexie:
- **X00054**: Escenario nominal (Golden Master + CATDOC Activo y completo).
- **X00055**: Escenario degradado (CATDOC Inactivo y sin recursos vinculados).
- **X00056**: Escenario ausente (Sin metadatos registrados).

### 2. Generador de GAWEB Mixto
He desarrollado un generador que produce un archivo canónico `.txt` con registros intercalados de los tres códigos anteriores, permitiendo observar la transición del motor entre "Modo Automático" y "Manual Fallback" en una sola pasada.

### 3. Consola de Diagnóstico en LetterStation
He integrado dos nuevos botones en la consola técnica de la UI:
- `[HARD E2E SEED]`: Prepara los datos en la DB.
- `[MIXED GAWEB E2E]`: Genera y descarga el fichero de prueba.

---

## Guía de Validación (Manual)

Sigue estos pasos para completar la validación E2E:

1. **Activar Modo Técnico**: Presiona `Ctrl + Shift + F12` (si no está activo).
2. **Sembrar Datos**: En Letter Station, pulsa el botón **HARD E2E SEED**. Verifica en System Audit que aparezca el evento `LETTERHARDSEEDREADY`.
3. **Obtener Archivo**: Pulsa **MIXED GAWEB E2E** y descarga el fichero `.txt`.
4. **Ejecutar Motor**:
    - Carga el archivo recién descargado.
    - Asegúrate de que el toggle **"AUTO-CATDOC"** esté activado.
    - Pulsa **INICIAR MOTOR**.
5. **Observar Resultados**:
    - Los registros de **X00054** deben procesarse automáticamente con estatus verde.
    - Los registros de **X00055** y **X00056** deben generar logs de aviso/error pidiendo recursos, ya que sus metadatos están rotos o ausentes.

---

> [!NOTE]
> Nota técnica: Este bypass utiliza el directorio local `.BRAIN` para los logs de tareas debido a restricciones actuales en la persistencia de artefactos del sistema.
