**hay bases muy buenas para no empezar desde cero**. Lo más razonable es tomar un DMS maduro como referencia funcional y, sobre esa base, construir vuestro satélite documental propio con las reglas de ABDSuite.

## Candidatos que encajan

**OpenKM** encaja bien si quieres un DMS clásico de empresa: repositorio central, control de versiones, workflow, RBAC, logs de actividad y automatización. Su material público destaca gestión segura, control de acceso, actividad auditada y automatización de tareas, que se alinean bastante con lo que queréis para `documents.abdia.es`.

**Mayan EDMS** también encaja como referencia si priorizas archivado, categorización, OCR, preview, etiquetado, firma y workflows; además se presenta como muy maduro y escalable. Es una buena inspiración para el bloque de clasificación, OCR y trazabilidad documental.

**Nextcloud** funciona mejor como referencia de colaboración y versionado de archivos que como DMS documental profundo. Aporta versionado, historial y control de crecimiento de versiones, pero no cubre tan bien la parte de OCR, gobernanza documental y flujos de aprobación avanzada que vosotros queréis.

## Qué reutilizaría

Yo no copiaría una plataforma entera tal cual; reutilizaría **patrones**. En concreto: repositorio central con versionado, ACL/RBAC, auditoría, workflow, OCR, búsqueda, retención y políticas de expiración de versiones. Es justo el conjunto que aparece repetidamente en OpenKM, Mayan EDMS y Nextcloud, con OpenKM y Mayan más cerca del caso de uso documental corporativo.

## Qué construiría vosotros

Construiría vosotros mismos el **núcleo de dominio** de ABDSuite: `assetRef`, multi-tenant estricto, deduplicación por tenant, `assetSpaceLink`, integración con `ABDLogs`, integración con `ABDAnalytics`, y la separación clara entre `documents`, `docs` y `templates`. Esa parte es específica de vuestra arquitectura y no encaja bien con un producto estándar sin mucha adaptación.

## Recomendación práctica

La opción más sensata sería esta:

- **Base conceptual/funcional**: OpenKM + Mayan EDMS.
    
- **Referencias de UX y colaboración/versionado**: Nextcloud.
    
- **Implementación real**: satélite propio en ABDSuite, porque necesitáis `assetRef`, multi-tenant, cross-cluster IAM y trazabilidad integrada con vuestro ecosistema.
    

## Decisión que yo tomaría

Si el objetivo es velocidad, empezaría con un **MVP propio** pero inspirado en OpenKM/Mayan, no con una integración pesada de un tercero. Si el objetivo es salir antes con un producto usable, incluso podríais montar una primera capa sobre un DMS existente solo para validar flujo y UX, pero a medio plazo el satélite propio os dará mucha más coherencia con ABDSuite.

Si quieres, el siguiente paso útil es que te haga una **comparativa cerrada OpenKM vs Mayan EDMS vs Nextcloud vs “hacerlo propio”** con pros, contras y encaje exacto con vuestra spec.

----------

Aquí tienes una comparativa práctica para decidir. Mi lectura corta es: **OpenKM** sirve mejor como DMS corporativo clásico, **Mayan EDMS** como base moderna para archivo + OCR + workflows, **Nextcloud** como colaboración y versionado ligero, y **desarrollo propio** como la mejor opción si queréis encajar multi-tenant, `assetRef`, trazabilidad e IAM a medida.

## Comparativa rápida

|Opción|Mejor para|Puntos fuertes|Límites|
|---|---|---|---|
|OpenKM|DMS corporativo tradicional|Control documental, versionado, workflow, seguridad, auditoría|Más pesado de adaptar a vuestro modelo multi-tenant y a `assetRef`|
|Mayan EDMS|Archivo documental con OCR y workflows|OCR, metadata, versionado, permisos granulares, audit trail, flujos documentales|Sigue siendo una plataforma genérica; adaptar vuestro IAM y satélites requerirá bastante integración|
|Nextcloud|Colaboración y versionado de ficheros|Versionado simple, restauración, cuotas, colaboración|No está pensada como DMS profundo con gobernanza documental avanzada|
|Desarrollo propio|ABDSuite nativa|Encaje perfecto con multi-tenant, `assetRef`, `ABDLogs`, `ABDAnalytics`, Spaces, políticas de sync|Más coste inicial y más tiempo de entrega; hay que construir todo el flujo [](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEXSK2YQB6&Signature=z1Y8R0b%2FDsgdEHBDQVPVA7nXvDA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCQaYa5nRTaWgPZWTZuRSOG05DUJ9hxBQ7hgOuCwnVjvAIhAP7or29aFMTW1PDVlTe0UmXf2YHGDh3Vpi2NXB2gz4jbKvMECFgQARoMNjk5NzUzMzA5NzA1IgxL4vl%2BQVZe4SK%2FfJQq0ATJFkisaHH6pLcFI%2BIXYvqgpa6fwGzGlwChd4KgoZG3ULPZiESBYmOwiIoNUD8dD29TswJbrcnZ4SjrDwySCAO0SoZ0NX448pGoi8kjyUUoUOyZWv%2F9buWfDL4Kx8wKAdZwUaJLY6eZpKRMpGuF1Dq%2FjFYdeNA5mo%2FoekhqPrl6ybBFGIVI0jiAkXqLC3bGhTspD08lqyQAnhw5Y%2FP5X3APu5LUsrxgYaMVfTOvOZBKh2lh8tJuE02dCS%2FcsbM%2FyJMBi6dYCVNA2sAxjEf%2B6p6CnNqBwpazCAz2bxwZCGRbyXXO%2FZDMwKaK08nO1wK056zoGB7imegn5LWfe5tPreGVuCoy2DnKR5e3fW1B5o61DcuaQscC%2BbKaNK4orqYg6Pdl%2FPIXBmApnndnwZh36KALIFbVNO5rSMVfPvnKGibT5Wz4b3TNCGDoW62oPR0HPr73GpromMZtePyEJvcyy%2Fva9wox3oZ9923YADnxe7lqOP9AOvJq9yCBSp5WWTDak7KU9d35VXcSufGHgYkaj5utBjoC%2FmGeRB6X0RIPJKQdSAuhjBW5afSv4l%2B9SO4bxP%2FeagW%2F2YTiXxdV74krqpJ7jadEi%2Fh9dth3YmsudB6k8ZE%2BIm76STt3HOihrcEEw5FWDSNlcpFNNH%2BEbtuUGzNACyPrdQqSRojOR5IRYVT%2BkU2enPiYebijAYk7VH21RMVqOnVHNkfooCg%2BUakUQrbL3gGRWH2AxqeWdJWc%2FgtaoaTf%2FZuhEWsGGoBkwsTq7KFsf2oAXfOfB3UEdQP380brMNqihtEGOpcBp%2BeytmKgiV7gCi2OcdS%2BqxATCdYJESYr2q0POS25zEgefUZSsLCYHVPat7Ftr9fsVyqKG%2BsfidpozWo723aSsIZjXvB2xJEUNWcSUfPs5CWbcS%2FX1fbTwpYM1%2FdYLRYSEOwJ%2Fk4xygrrgmCND2nPIZIdvt4T41ueib%2FcAGZFn5ctdAB5WvHf%2FW8lqq%2Bcfdr0IziwG%2BBPZA%3D%3D&Expires=1780588333)|

## Gobernanza y cumplimiento

Si vuestro foco es gobernanza, auditoría y cumplimiento, **Mayan EDMS y OpenKM** son los candidatos más cercanos porque ambos enfatizan workflow, control de versiones, permisos y trazabilidad. OpenKM se presenta explícitamente como un sistema con almacenamiento seguro, control de versiones y automatización de workflows, y Mayan EDMS destaca OCR, metadatos, control fino de permisos y auditoría completa.

Para un entorno multi-tenant como ABDSuite, sin embargo, el problema no es solo “guardar documentos”, sino **aislar por tenant, versionar, deduplicar, auditar y sincronizar selectivamente**. Esa combinación ya aparece en tu spec como contratos propios: `assetRef`, `asset_space_links`, sync policy, eventos en `ABDLogs` y separación cliente/backend; eso hace que un producto genérico encaje solo parcialmente.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEXSK2YQB6&Signature=z1Y8R0b%2FDsgdEHBDQVPVA7nXvDA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCQaYa5nRTaWgPZWTZuRSOG05DUJ9hxBQ7hgOuCwnVjvAIhAP7or29aFMTW1PDVlTe0UmXf2YHGDh3Vpi2NXB2gz4jbKvMECFgQARoMNjk5NzUzMzA5NzA1IgxL4vl%2BQVZe4SK%2FfJQq0ATJFkisaHH6pLcFI%2BIXYvqgpa6fwGzGlwChd4KgoZG3ULPZiESBYmOwiIoNUD8dD29TswJbrcnZ4SjrDwySCAO0SoZ0NX448pGoi8kjyUUoUOyZWv%2F9buWfDL4Kx8wKAdZwUaJLY6eZpKRMpGuF1Dq%2FjFYdeNA5mo%2FoekhqPrl6ybBFGIVI0jiAkXqLC3bGhTspD08lqyQAnhw5Y%2FP5X3APu5LUsrxgYaMVfTOvOZBKh2lh8tJuE02dCS%2FcsbM%2FyJMBi6dYCVNA2sAxjEf%2B6p6CnNqBwpazCAz2bxwZCGRbyXXO%2FZDMwKaK08nO1wK056zoGB7imegn5LWfe5tPreGVuCoy2DnKR5e3fW1B5o61DcuaQscC%2BbKaNK4orqYg6Pdl%2FPIXBmApnndnwZh36KALIFbVNO5rSMVfPvnKGibT5Wz4b3TNCGDoW62oPR0HPr73GpromMZtePyEJvcyy%2Fva9wox3oZ9923YADnxe7lqOP9AOvJq9yCBSp5WWTDak7KU9d35VXcSufGHgYkaj5utBjoC%2FmGeRB6X0RIPJKQdSAuhjBW5afSv4l%2B9SO4bxP%2FeagW%2F2YTiXxdV74krqpJ7jadEi%2Fh9dth3YmsudB6k8ZE%2BIm76STt3HOihrcEEw5FWDSNlcpFNNH%2BEbtuUGzNACyPrdQqSRojOR5IRYVT%2BkU2enPiYebijAYk7VH21RMVqOnVHNkfooCg%2BUakUQrbL3gGRWH2AxqeWdJWc%2FgtaoaTf%2FZuhEWsGGoBkwsTq7KFsf2oAXfOfB3UEdQP380brMNqihtEGOpcBp%2BeytmKgiV7gCi2OcdS%2BqxATCdYJESYr2q0POS25zEgefUZSsLCYHVPat7Ftr9fsVyqKG%2BsfidpozWo723aSsIZjXvB2xJEUNWcSUfPs5CWbcS%2FX1fbTwpYM1%2FdYLRYSEOwJ%2Fk4xygrrgmCND2nPIZIdvt4T41ueib%2FcAGZFn5ctdAB5WvHf%2FW8lqq%2Bcfdr0IziwG%2BBPZA%3D%3D&Expires=1780588333)

## Arquitectura de almacenamiento

Si usáis un DMS existente, lo normal es que el almacenamiento quede más pegado al producto y al modelo de usuario del sistema. Nextcloud versiona archivos en rutas por usuario y aplica un esquema de retención automático basado en tiempo y cuota, lo que funciona bien para colaboración, pero no resuelve por sí solo vuestra lógica de assets compartidos entre espacios y tenants.

En vuestro caso, la arquitectura que ya estáis dibujando es más potente: binario primario en `Document Manager`, referencias lógicas en `assetRef`, y vínculos lógicos con `AssetSpaceLink` para evitar duplicar físicamente un mismo PDF en varios contextos. Esa separación es muy buena para multi-tenant y para reutilización documental sin duplicación.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEXSK2YQB6&Signature=z1Y8R0b%2FDsgdEHBDQVPVA7nXvDA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCQaYa5nRTaWgPZWTZuRSOG05DUJ9hxBQ7hgOuCwnVjvAIhAP7or29aFMTW1PDVlTe0UmXf2YHGDh3Vpi2NXB2gz4jbKvMECFgQARoMNjk5NzUzMzA5NzA1IgxL4vl%2BQVZe4SK%2FfJQq0ATJFkisaHH6pLcFI%2BIXYvqgpa6fwGzGlwChd4KgoZG3ULPZiESBYmOwiIoNUD8dD29TswJbrcnZ4SjrDwySCAO0SoZ0NX448pGoi8kjyUUoUOyZWv%2F9buWfDL4Kx8wKAdZwUaJLY6eZpKRMpGuF1Dq%2FjFYdeNA5mo%2FoekhqPrl6ybBFGIVI0jiAkXqLC3bGhTspD08lqyQAnhw5Y%2FP5X3APu5LUsrxgYaMVfTOvOZBKh2lh8tJuE02dCS%2FcsbM%2FyJMBi6dYCVNA2sAxjEf%2B6p6CnNqBwpazCAz2bxwZCGRbyXXO%2FZDMwKaK08nO1wK056zoGB7imegn5LWfe5tPreGVuCoy2DnKR5e3fW1B5o61DcuaQscC%2BbKaNK4orqYg6Pdl%2FPIXBmApnndnwZh36KALIFbVNO5rSMVfPvnKGibT5Wz4b3TNCGDoW62oPR0HPr73GpromMZtePyEJvcyy%2Fva9wox3oZ9923YADnxe7lqOP9AOvJq9yCBSp5WWTDak7KU9d35VXcSufGHgYkaj5utBjoC%2FmGeRB6X0RIPJKQdSAuhjBW5afSv4l%2B9SO4bxP%2FeagW%2F2YTiXxdV74krqpJ7jadEi%2Fh9dth3YmsudB6k8ZE%2BIm76STt3HOihrcEEw5FWDSNlcpFNNH%2BEbtuUGzNACyPrdQqSRojOR5IRYVT%2BkU2enPiYebijAYk7VH21RMVqOnVHNkfooCg%2BUakUQrbL3gGRWH2AxqeWdJWc%2FgtaoaTf%2FZuhEWsGGoBkwsTq7KFsf2oAXfOfB3UEdQP380brMNqihtEGOpcBp%2BeytmKgiV7gCi2OcdS%2BqxATCdYJESYr2q0POS25zEgefUZSsLCYHVPat7Ftr9fsVyqKG%2BsfidpozWo723aSsIZjXvB2xJEUNWcSUfPs5CWbcS%2FX1fbTwpYM1%2FdYLRYSEOwJ%2Fk4xygrrgmCND2nPIZIdvt4T41ueib%2FcAGZFn5ctdAB5WvHf%2FW8lqq%2Bcfdr0IziwG%2BBPZA%3D%3D&Expires=1780588333)

## Versionado y trazabilidad

Nextcloud tiene un versionado simple y práctico, con restauración de versiones previas y políticas automáticas de expiración basadas en tiempo y cuota, pero está pensado para ficheros de usuario, no para una cadena documental con auditoría forense y estados de lifecycle.

Mayan EDMS y OpenKM están más cerca de lo que necesitáis porque admiten historiales, workflows y auditoría, aunque vuestra spec va más lejos al exigir `DOCUMENT_ASSET_CREATED`, `DOCUMENT_RENDER_COMPLETED`, hashes, correlación y validación cruzada con `ABDLogs`. Eso significa que, si hacéis desarrollo propio, el versionado debería modelarse como una entidad de dominio con: identidad del asset, versión, hash, storageRef, timestamps, actor y evento de auditoría asociado.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEXSK2YQB6&Signature=z1Y8R0b%2FDsgdEHBDQVPVA7nXvDA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCQaYa5nRTaWgPZWTZuRSOG05DUJ9hxBQ7hgOuCwnVjvAIhAP7or29aFMTW1PDVlTe0UmXf2YHGDh3Vpi2NXB2gz4jbKvMECFgQARoMNjk5NzUzMzA5NzA1IgxL4vl%2BQVZe4SK%2FfJQq0ATJFkisaHH6pLcFI%2BIXYvqgpa6fwGzGlwChd4KgoZG3ULPZiESBYmOwiIoNUD8dD29TswJbrcnZ4SjrDwySCAO0SoZ0NX448pGoi8kjyUUoUOyZWv%2F9buWfDL4Kx8wKAdZwUaJLY6eZpKRMpGuF1Dq%2FjFYdeNA5mo%2FoekhqPrl6ybBFGIVI0jiAkXqLC3bGhTspD08lqyQAnhw5Y%2FP5X3APu5LUsrxgYaMVfTOvOZBKh2lh8tJuE02dCS%2FcsbM%2FyJMBi6dYCVNA2sAxjEf%2B6p6CnNqBwpazCAz2bxwZCGRbyXXO%2FZDMwKaK08nO1wK056zoGB7imegn5LWfe5tPreGVuCoy2DnKR5e3fW1B5o61DcuaQscC%2BbKaNK4orqYg6Pdl%2FPIXBmApnndnwZh36KALIFbVNO5rSMVfPvnKGibT5Wz4b3TNCGDoW62oPR0HPr73GpromMZtePyEJvcyy%2Fva9wox3oZ9923YADnxe7lqOP9AOvJq9yCBSp5WWTDak7KU9d35VXcSufGHgYkaj5utBjoC%2FmGeRB6X0RIPJKQdSAuhjBW5afSv4l%2B9SO4bxP%2FeagW%2F2YTiXxdV74krqpJ7jadEi%2Fh9dth3YmsudB6k8ZE%2BIm76STt3HOihrcEEw5FWDSNlcpFNNH%2BEbtuUGzNACyPrdQqSRojOR5IRYVT%2BkU2enPiYebijAYk7VH21RMVqOnVHNkfooCg%2BUakUQrbL3gGRWH2AxqeWdJWc%2FgtaoaTf%2FZuhEWsGGoBkwsTq7KFsf2oAXfOfB3UEdQP380brMNqihtEGOpcBp%2BeytmKgiV7gCi2OcdS%2BqxATCdYJESYr2q0POS25zEgefUZSsLCYHVPat7Ftr9fsVyqKG%2BsfidpozWo723aSsIZjXvB2xJEUNWcSUfPs5CWbcS%2FX1fbTwpYM1%2FdYLRYSEOwJ%2Fk4xygrrgmCND2nPIZIdvt4T41ueib%2FcAGZFn5ctdAB5WvHf%2FW8lqq%2Bcfdr0IziwG%2BBPZA%3D%3D&Expires=1780588333)

## Qué haría yo

Para ABDSuite, yo no elegiría una sola herramienta como “base técnica” completa. Haría esto:

- **Referencia funcional**: Mayan EDMS para OCR, metadata, permisos y workflow.
    
- **Referencia de DMS clásico**: OpenKM para control documental, aprobaciones y auditoría.
    
- **Referencia de colaboración/versionado simple**: Nextcloud para UX de archivos y versionado.
    
- **Implementación real**: desarrollo propio sobre vuestra arquitectura de `assetRef`, multi-tenant, `ABDLogs`, `ABDAnalytics` y `Spaces`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEXSK2YQB6&Signature=z1Y8R0b%2FDsgdEHBDQVPVA7nXvDA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCQaYa5nRTaWgPZWTZuRSOG05DUJ9hxBQ7hgOuCwnVjvAIhAP7or29aFMTW1PDVlTe0UmXf2YHGDh3Vpi2NXB2gz4jbKvMECFgQARoMNjk5NzUzMzA5NzA1IgxL4vl%2BQVZe4SK%2FfJQq0ATJFkisaHH6pLcFI%2BIXYvqgpa6fwGzGlwChd4KgoZG3ULPZiESBYmOwiIoNUD8dD29TswJbrcnZ4SjrDwySCAO0SoZ0NX448pGoi8kjyUUoUOyZWv%2F9buWfDL4Kx8wKAdZwUaJLY6eZpKRMpGuF1Dq%2FjFYdeNA5mo%2FoekhqPrl6ybBFGIVI0jiAkXqLC3bGhTspD08lqyQAnhw5Y%2FP5X3APu5LUsrxgYaMVfTOvOZBKh2lh8tJuE02dCS%2FcsbM%2FyJMBi6dYCVNA2sAxjEf%2B6p6CnNqBwpazCAz2bxwZCGRbyXXO%2FZDMwKaK08nO1wK056zoGB7imegn5LWfe5tPreGVuCoy2DnKR5e3fW1B5o61DcuaQscC%2BbKaNK4orqYg6Pdl%2FPIXBmApnndnwZh36KALIFbVNO5rSMVfPvnKGibT5Wz4b3TNCGDoW62oPR0HPr73GpromMZtePyEJvcyy%2Fva9wox3oZ9923YADnxe7lqOP9AOvJq9yCBSp5WWTDak7KU9d35VXcSufGHgYkaj5utBjoC%2FmGeRB6X0RIPJKQdSAuhjBW5afSv4l%2B9SO4bxP%2FeagW%2F2YTiXxdV74krqpJ7jadEi%2Fh9dth3YmsudB6k8ZE%2BIm76STt3HOihrcEEw5FWDSNlcpFNNH%2BEbtuUGzNACyPrdQqSRojOR5IRYVT%2BkU2enPiYebijAYk7VH21RMVqOnVHNkfooCg%2BUakUQrbL3gGRWH2AxqeWdJWc%2FgtaoaTf%2FZuhEWsGGoBkwsTq7KFsf2oAXfOfB3UEdQP380brMNqihtEGOpcBp%2BeytmKgiV7gCi2OcdS%2BqxATCdYJESYr2q0POS25zEgefUZSsLCYHVPat7Ftr9fsVyqKG%2BsfidpozWo723aSsIZjXvB2xJEUNWcSUfPs5CWbcS%2FX1fbTwpYM1%2FdYLRYSEOwJ%2Fk4xygrrgmCND2nPIZIdvt4T41ueib%2FcAGZFn5ctdAB5WvHf%2FW8lqq%2Bcfdr0IziwG%2BBPZA%3D%3D&Expires=1780588333)
    

## Recomendación final

Si queréis **velocidad de salida**, podéis inspiraros en Mayan EDMS y OpenKM y construir una primera versión propia con un scope reducido. Si queréis **coherencia de plataforma a largo plazo**, lo mejor es desarrollo propio desde el principio, porque vuestro modelo documental no es un simple DMS: es un subsistema de la suite con aislamiento por tenant, sincronización selectiva y trazabilidad integrada.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEXSK2YQB6&Signature=z1Y8R0b%2FDsgdEHBDQVPVA7nXvDA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCQaYa5nRTaWgPZWTZuRSOG05DUJ9hxBQ7hgOuCwnVjvAIhAP7or29aFMTW1PDVlTe0UmXf2YHGDh3Vpi2NXB2gz4jbKvMECFgQARoMNjk5NzUzMzA5NzA1IgxL4vl%2BQVZe4SK%2FfJQq0ATJFkisaHH6pLcFI%2BIXYvqgpa6fwGzGlwChd4KgoZG3ULPZiESBYmOwiIoNUD8dD29TswJbrcnZ4SjrDwySCAO0SoZ0NX448pGoi8kjyUUoUOyZWv%2F9buWfDL4Kx8wKAdZwUaJLY6eZpKRMpGuF1Dq%2FjFYdeNA5mo%2FoekhqPrl6ybBFGIVI0jiAkXqLC3bGhTspD08lqyQAnhw5Y%2FP5X3APu5LUsrxgYaMVfTOvOZBKh2lh8tJuE02dCS%2FcsbM%2FyJMBi6dYCVNA2sAxjEf%2B6p6CnNqBwpazCAz2bxwZCGRbyXXO%2FZDMwKaK08nO1wK056zoGB7imegn5LWfe5tPreGVuCoy2DnKR5e3fW1B5o61DcuaQscC%2BbKaNK4orqYg6Pdl%2FPIXBmApnndnwZh36KALIFbVNO5rSMVfPvnKGibT5Wz4b3TNCGDoW62oPR0HPr73GpromMZtePyEJvcyy%2Fva9wox3oZ9923YADnxe7lqOP9AOvJq9yCBSp5WWTDak7KU9d35VXcSufGHgYkaj5utBjoC%2FmGeRB6X0RIPJKQdSAuhjBW5afSv4l%2B9SO4bxP%2FeagW%2F2YTiXxdV74krqpJ7jadEi%2Fh9dth3YmsudB6k8ZE%2BIm76STt3HOihrcEEw5FWDSNlcpFNNH%2BEbtuUGzNACyPrdQqSRojOR5IRYVT%2BkU2enPiYebijAYk7VH21RMVqOnVHNkfooCg%2BUakUQrbL3gGRWH2AxqeWdJWc%2FgtaoaTf%2FZuhEWsGGoBkwsTq7KFsf2oAXfOfB3UEdQP380brMNqihtEGOpcBp%2BeytmKgiV7gCi2OcdS%2BqxATCdYJESYr2q0POS25zEgefUZSsLCYHVPat7Ftr9fsVyqKG%2BsfidpozWo723aSsIZjXvB2xJEUNWcSUfPs5CWbcS%2FX1fbTwpYM1%2FdYLRYSEOwJ%2Fk4xygrrgmCND2nPIZIdvt4T41ueib%2FcAGZFn5ctdAB5WvHf%2FW8lqq%2Bcfdr0IziwG%2BBPZA%3D%3D&Expires=1780588333)

Si quieres, el siguiente paso útil es que te prepare una **propuesta de arquitectura propia** para `documents.abdia.es` con módulos, entidades y flujo de versionado desde cero.

-----------------
para files.abdia.es` yo lo diseñaría como un **satélite propio** con almacenamiento multi-tenant, `assetRef` como contrato central, versionado nativo y trazabilidad obligatoria desde el inicio. La clave es no pensar en “subir PDFs” sino en un sistema de activos documentales con lifecycle, aislamiento y gobernanza integrados.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

## Propuesta de arquitectura

El satélite tendría cinco capas: **API/UX**, **dominio documental**, **almacenamiento físico**, **auditoría**, e **integración con IAM/gobernanza**. El binario vive en storage, pero la verdad del sistema vive en el modelo de `DocumentAsset`, sus versiones y sus enlaces con espacios; `assetRef` sería la unidad que consumen `docs` y `templates` para operar sin tocar rutas físicas.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

La idea es usar una arquitectura de multi-tenancy con aislamiento fuerte por `tenantId`, y dependiendo del volumen, evolucionar de colección compartida con `tenantId` a particionado/sharding o incluso bases separadas por tenant de alto volumen. MongoDB recomienda que en arquitecturas multi-tenant los datos de un tenant se mantengan juntos para facilitar el aislamiento y el reparto de carga, y que el diseño dependa del workload real.

## Esquema de datos

Yo separaría el modelo en estas entidades:

- `tenants`: identidad lógica del cliente y límites de almacenamiento.
    
- `document_assets`: metadata del asset maestro.
    
- `document_versions`: historial inmutable de versiones del asset.
    
- `asset_space_links`: relación entre asset y espacios lógicos.
    
- `storage_connectors`: configuración del backend físico por tenant.
    
- `document_events`: auditoría de lifecycle, cambios, descargas y borrados.
    
- `deletion_jobs`: borrado diferido/retención/cleanup.
    
- `locks` o `jobs`: para evitar carreras en subida, versionado y GC.
    

En `document_assets`, yo guardaría `tenantId`, `assetId`, `assetRef`, `currentVersionId`, `latestHash`, `storageProvider`, `storageRef`, `status`, `retentionClass`, `sensitivityLevel`, `ownerUserId`, `createdAt` y `updatedAt`. En `document_versions`, guardaría `versionId`, `assetId`, `tenantId`, `versionNumber`, `hash`, `storageRef`, `sizeBytes`, `mimeType`, `createdBy`, `createdAt`, `checksumAlgorithm`, `isCurrent`, `supersedesVersionId` y `deletionState`.[](https://www.folderit.com/glossary/what-is-an-audit-trail-in-document-management/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

## `assetRef` y versionado

`assetRef` debería ser un identificador estable, no una ruta física. Mi recomendación es que sea un identificador compuesto o serializado que apunte a `assetId + tenantId + currentVersionId` y que, si quieres máxima legibilidad, pueda resolverse a una forma tipo `doc:{tenant}:{asset}:{version}`. Lo importante es que `docs.abdia.es` y `templates.abdia.es` nunca dependan de `storageRef` directo; solo el manager resuelve la ubicación física.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

El versionado debería ser **append-only**: cada cambio relevante crea una nueva versión inmutable, y el documento maestro solo actualiza el puntero a `currentVersionId`. Esto permite comparar, restaurar y auditar versiones sin sobrescribir la historia; además, encaja bien con el enfoque de audit trail y con políticas de retención.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

## Retos de escalar el almacenamiento

El primer reto es el **aislamiento multi-tenant sin explosión operativa**: si separas por base de datos desde el principio, ganas privacidad pero complicas operaciones y coste; si compartes demasiado, simplificas la plataforma pero sube el riesgo de ruido y fuga lógica. MongoDB sugiere elegir entre colección compartida, base por tenant o sharding según el patrón de carga, y mover colecciones/calentar shards cuando el workload lo exige.

El segundo reto es el **crecimiento de versiones**: cada versión ocupa espacio y puede disparar costes si no hay políticas de aging, limpieza y compactación. Nextcloud y sistemas de retención empresarial muestran que versionado y lifecycle deben ir juntos, porque el histórico puede crecer más rápido que el uso real del negocio.

El tercer reto es la **entrega segura del binario**: necesitarás URLs firmadas, expiración corta, control de acceso por token y, en algunos casos, separación entre almacenamiento público, autenticado y privado. Cloudinary y S3 ya trabajan con estos patrones de forma nativa, así que el satélite debería modelar el delivery como una capa formal, no como un simple link.

## Gobernanza prioritaria

Desde el inicio metería cuatro bloques de gobernanza:

- **IAM y autorización**: validación de tenant, roles y permisos por acción.
    
- **Auditoría inmutable**: quién sube, ve, versiona, aprueba, mueve o borra.
    
- **Políticas de retención y clasificación**: sensibilidad, clase legal, caducidad, legal hold.
    
- **Gobernanza de conectores**: qué storage usa cada tenant y con qué scopes.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)
    

También añadiría desde el principio el concepto de **space/partition** o ámbito lógico, porque evita que un mismo asset se duplique si vive en varios contextos. Ese desacoplo entre binario maestro y relación lógica es una buena práctica para una arquitectura documental multiuso.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

## Borrado seguro

Yo no haría borrado físico inmediato salvo que sea obligatorio por política. Haría primero un **soft delete** con estado `deleted_pending_retention`, luego un job diferido que respete retención y legal hold, y por último el purgado físico del binario y de las versiones no corrientes cuando corresponda. En sistemas con versionado y retención, borrar no es solo “eliminar un archivo”, sino gestionar qué versiones sobreviven y bajo qué restricción.

Para el borrado seguro, el patrón correcto es: marcar el asset como borrado, retirar accesos, invalidar enlaces firmados, registrar auditoría, y luego purgar físicamente cuando la política lo permita. Si el storage soporta versionado nativo, conviene usarlo con mucho cuidado porque el borrado real de versiones requiere tratar explícitamente los `versionId` o los delete markers.

## Mi recomendación

Si vuestro objetivo es construir algo alineado con ABDSuite, **sí merece la pena hacerlo propio**. Usaría una base funcional inspirada en DMS maduros, pero el núcleo del sistema debería ser vuestro: `assetRef`, multi-tenant, `Spaces`, `ABDLogs`, `ABDAnalytics`, retención, borrado seguro y versionado inmutable.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEV7XAFP2L&Signature=19Hl6LYCHELvDcKdXJ%2Bi8eBbrfQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQD6VBobxqKcUjivMAqJzsDKUSgu%2BDj%2FlO6Jsjw11zhEFwIhAMzPCZhfpWt9a78OiGtez54qtOgEUi6okZF8yqAWxIfrKvMECFgQARoMNjk5NzUzMzA5NzA1IgyRxU7CET%2Bge21TnZkq0ASqZzlTO9QJLE6TmxYO5PGGVAdBAKf%2BKmry7r7NomE3PqsrvdvBXRmsWPWSEyC6f0cPYx%2Fk09Bw46DPJ9CI1ro%2BV0kOt6tagiDbmzpgMQXAhYX9d6trZwRkmnQY3gFOEnunwIcNO7hWat8zpjwt4K3Ng1nmRYAlpQbWxxIPOynlg33B9AS%2FjjLD%2FDrJBtwlFAuBsyiL6mDtymrjnHx9aEIcsVYyu2N%2BShGpMgQBGQU%2Fd8H2oSUuOiC2RZ57JixtKflAmTRqz%2BJvBA1Nvftdujgs6r4WY3oe6JJrmB7SRP47DHp4hPuI9tPYn%2FIyrc7WkiAFufY3FMyMMO8euyc5gOJTLsiMZokztpz5eZ1dG%2FiRTPVr7hCwnycC8ZZQ92oEu9DCiCHqfnaVNV%2FmN4niMA1FzLNNiAuXqRPbbOkWWCZLDmwSDGORV%2Bfof3xevg%2FsnCQr8FV0gQdm2PgjOPzqQXxehBSh52vyGl32Gd%2BzlsDUqO2ajWWRa1dM9pZc25JyjninJ3L2YSSZ%2BwgjooTfulqATf5bwMBSxqN0jhOG0k0lIcy2jNkTUwTdMZmNlG9fX91fWWpt%2BsOXOGIYPLRofudeg6UK1c58B%2FBKpgDBKYX89EcBCF3w38TFARLZ0pOmYc02AupzU%2FYJlrxry4wohVCzl6Ao7a5PPn31T%2FkjmEPtpAg6nG9SwpffLdhGmUgGuiKkiJWeAS59C5Q7JsHhYavYrxciriyUpyi%2F6uBNN6WSBAS1UKC1XW%2Fwu%2FhS4%2FIHwc3Wrk8KFntzsJ%2BKfWZjgv34MKanhtEGOpcBAATAWW7bo6jWiCninN6CbRpcVOL%2BL05JN94LOgYdnUQgyuo47gE8g4Cvipmb%2FpK07HIWV0Sm8sD52huuJo5cyYzQD%2FY%2BxTeRuVQ13g9zWayBxeq%2Fi3wHaBVla4kYn9bRB%2BYUlChy2JbTGdE1S877efhOVnH3LZdo7psvWBsBUmIIcI45%2FuYvES5%2FsgUDyu51qGp2M8qvFA%3D%3D&Expires=1780588921)

Si quieres, el siguiente paso útil es que te lo convierta en un **modelo técnico formal** con:

1. colecciones MongoDB,
    
2. tipos TypeScript,
    
3. flujo de subida/versionado/borrado, y
    
4. reglas de permisos y auditoría.
---------------------

**ABDFiles** será el nombre del satélite y `files.abdia.es` su subdominio. Con Cloudinary como storage y MongoDB como base, la arquitectura correcta es un DMS propio con `assetRef` estable, versionado inmutable, borrado lógico y retención legal desde el diseño.

## Arquitectura base

Yo lo montaría con cuatro capas: API del satélite, dominio documental, persistencia en MongoDB y almacenamiento físico en Cloudinary. El backend será la fuente de verdad para metadatos, versiones, estados, auditoría y lifecycle; Cloudinary solo guardará binarios y derivados firmados cuando haga falta.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

La unidad de trabajo no será el archivo, sino el **asset documental**: un documento maestro con múltiples versiones, referencias a espacios y estados de retención. Eso os permite compartir binario lógico entre vistas/espacios sin duplicarlo físicamente.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)[](https://www.mongodb.com/docs/manual/core/moveable-collections/multi-tenant/)

## Modelo de datos

Yo usaría estas colecciones:

- `tenants`.
    
- `documents`.
    
- `document_versions`.
    
- `asset_space_links`.
    
- `storage_connectors`.
    
- `document_events`.
    
- `retention_policies`.
    
- `legal_holds`.
    
- `deletion_jobs`.
    

En `documents` guardaría `tenantId`, `assetId`, `assetRef`, `title`, `status`, `currentVersionId`, `latestHash`, `storageProvider`, `retentionClass`, `sensitivityLevel`, `createdAt`, `updatedAt`, `deletedAt?`, `deletedBy?`, `purgeAt?` y `legalHoldStatus`. En `document_versions` guardaría `versionId`, `assetId`, `tenantId`, `versionNumber`, `storageRef`, `hash`, `sizeBytes`, `mimeType`, `createdBy`, `createdAt`, `isCurrent`, `deletedAt?` y `supersedesVersionId?`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

## `assetRef`

`assetRef` debería ser un identificador lógico estable, no una ruta física. Yo lo haría resolvible como `files:{tenantId}:{assetId}:{versionNumber}` o similar, para que el resto del ecosistema opere siempre sobre una referencia uniforme y no sobre `storageRef`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

La regla es simple: `assetRef` identifica; `storageRef` localiza; `versionId` preserva historia; `hash` valida integridad. Esa separación reduce acoplamiento y hace posible cambiar de proveedor de storage sin romper contratos.[](https://cloudinary.com/documentation/delivery_url_signatures)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

## Versionado inmutable

El versionado debe ser **append-only**: cada modificación crea una nueva versión, y el documento maestro solo actualiza el puntero a la última versión. Eso encaja con patrones de control documental y evita sobrescribir historia, que es clave para auditoría y recuperación.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

La forma práctica de implementarlo en MongoDB es:

- insertar una nueva fila en `document_versions`;
    
- calcular y guardar `hash` y `checksumAlgorithm`;
    
- actualizar `documents.currentVersionId`;
    
- registrar el evento en `document_events`;
    
- no modificar el contenido histórico salvo por estados administrativos como `deletedAt` o `retentionState`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)
    

## Sharding multi-tenant

Para un sistema multi-tenant, la recomendación general es mantener los datos del mismo tenant juntos y escalar por shards cuando el volumen lo exija. MongoDB indica que, en arquitecturas multi-tenant, suele convenir que los datos de un tenant estén en un mismo shard para mejorar operaciones cruzadas y aislamiento lógico.

Yo usaría una estrategia progresiva:

- **fase 1**: colección compartida con `tenantId` indexado;
    
- **fase 2**: sharding por `tenantId` para tenants grandes;
    
- **fase 3**: override por tenant “hot” con routing dedicado si un cliente concentra demasiada carga.
    

La clave es que el shard key no debe romper el patrón de acceso más común. Si casi todas las consultas siempre filtran por `tenantId` y `assetId`, ese campo debe estar presente en índices compuestos y en la estrategia de particionado.

## Almacenamiento jerárquico

Para documentos jerárquicos, yo usaría un patrón de **materialized path** para los espacios y una tabla de relación `asset_space_links` para desacoplar binario y ubicación lógica. Así un PDF puede estar en varios contextos sin duplicación física, y moverlo entre carpetas no implica mover el binario.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

Ese patrón es especialmente útil cuando el mismo activo vive en `GLOBAL`, `TENANT`, `TEAM` o `PERSONAL`. El storage sigue plano y el árbol lo resuelven metadatos y relaciones, no el filesystem físico.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

## Borrado lógico y retención

Yo separaría tres estados: `active`, `deleted_pending_retention` y `purged`. Primero haces **borrado lógico** con `deletedAt`, `deletedBy`, `deleteReason` y `purgeAt`; después bloqueas edición, descarga pública y nuevas referencias; y por último un job elimina el binario cuando la retención lo permite.

La **retención legal** debe tener prioridad sobre cualquier TTL o limpieza automática. Si existe `legalHold = true`, el documento no se puede editar, reemplazar ni purgar hasta levantar la orden; eso es coherente con sistemas de retención documental empresariales.

## Integración con ABDAuth

El satélite debería confiar en ABDAuth para identidad, tenant activo y scopes, pero validar la autorización siempre en backend. El flujo correcto es: `withIndustrialAuth` o middleware equivalente, sesión firmada, claims validados, tenant cruzado contra subdominio, y luego autorización por acción sobre asset, space o versión.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

Yo añadiría también un `principalId`, `tenantId`, `roles`, `scopes`, `sessionId` y `correlationId` en cada operación sensible. Eso te permite auditar quién hizo qué, bajo qué tenant y con qué contexto, sin depender de la UI.[](https://www.folderit.com/glossary/what-is-an-audit-trail-in-document-management/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

## Prioridades iniciales

Si lo lanzáis desde cero, el orden correcto sería:

1. autenticación y tenant guard;
    
2. modelo `documents` + `document_versions`;
    
3. subida segura a Cloudinary con URL firmada;
    
4. auditoría central;
    
5. borrado lógico y retención;
    
6. `asset_space_links` y jerarquía;
    
7. sharding cuando el volumen lo pida.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)
    

## Decisión recomendada

Mi recomendación es clara: **sí, hacedlo propio**. Ya tenéis el nombre, el dominio, el contrato `assetRef` y la arquitectura de satélites; lo que os falta no es un producto genérico, sino un DMS nativo de ABDSuite que respete multi-tenant, trazabilidad y gobernanza desde la primera versión.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5SAW23&Signature=HzfJsRn%2BaHURw1mWw0E%2FyrkpYDY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFRB5wJiEw1srmdvNWgUzxHqYMPebh9N9JZ5oVpqi%2BrLAiBkCiZl9hEYdEXNgpERLx%2Bbc6ah8Dz4cy%2FTHPRlFb7kqirzBAhYEAEaDDY5OTc1MzMwOTcwNSIMwT7WA7iLm6R4QyWQKtAE%2B9IZ4ssDmJqTtQxWwrV63UqPUD3WKOSgaJ2vwjIPk4H8eEXJgi7t9V%2FSJMKhoMNyWhwT677sNnMpMraU7cm4wC06GNb0GLDdS6qaGemGhPPu%2Fm5kAV8F7Sj%2BrMIOv5wYVyPLHCrg5azn7JztyFXBaY1VUCBB1nSWeN7Afk7qolICqzC9wuXXhqrKyg%2FWAy2anx%2BMIdn9nuBmCYvUkI5jwuJqbZVx0lG%2Bv3oXe%2BwmJciJFcGuw3EbeDvKTvxRxZFDcd6HVQ7HtferdA69KF19SUS5CUWGT0gsZRm%2Bm797Bx41W8vofa8OEMWKKiF%2Fo1qkK8%2BLFqLJSbq8xwba68R7kR525nGuhKPz7tiDFthM04D2IJPOu5bKETZjEYYZfc%2BVEx%2Bdyecbr1tPPI7rPTUlbN9rvAW3RPOd4sfvu5U7b%2FNa768WHvT3ZER4sypgMcBFeQMj06j8IfBtKRx8dLiVa1MPsgg6U57dfPCBM8pgugVabRUzrMFEQ8Ictqfey4g%2FNnvW1CmdKbenbA6k7eQ5ocklkQ%2FVb%2B5G9RLHn0YpuKqVNlUdHpFz3V2ndh%2B%2BLfGflQ%2Bv%2Fq1FUQCFvKxD7ejEMOjHXQQuPQffv%2Bz2Oy222QeomNFf9%2B7sEzNfUlOoJ2DIyHW5zfJzMe%2BNpCRmkI%2BEeqn7rQNTbQowTWC%2BVk8zqrNHyGEkUrdeIRFvd%2B9JtEouSdeskGvLM2RSAtca1FhpS8x16qElFFpU0PpRQ5oOOMBLSLtZ2AuSVbMUwbRQ5wyGNcbnIY6V8%2F9zGZsRr8jiVjCYo4bRBjqZAZzQwsYolb0Ii5UTqvdfg0eI8n%2BRAVpJbUGO83fHYAshSZTdbsRb1bjY5%2Bp5JhEVKWTIqRku38a%2BReVT3Spg6JpDhpFSrCh7EpTFrz4HGe85W%2Fvy3IpT%2BfvFoIr18J2SN9hcFkTK7VXncUAIdGbu5txo4YjVeqxpyp%2F%2FUXfgi7fiTb%2B%2Bz66fIWCc8FQ%2BpkfnVBqpQ2BZyWq%2FUQ%3D%3D&Expires=1780588395)

Puedo darte el siguiente paso en formato más técnico: **esquema de colecciones MongoDB + tipos TypeScript + flujo de subida/versionado/borrado** para ABDFiles.

_______________________
Para **ABDFiles** haría una base muy clara: MongoDB como verdad de negocio, Cloudinary como storage, y un modelo append-only para versiones, auditoría y borrado lógico. En el satélite todo debe girar alrededor de `assetRef`, `document_versions`, `legal_hold` y `document_events`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEZMZFKUD7&Signature=2kIYybSXCJZoQOYcqrmuqkGwMTs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCF2224WI5iRJJGW4bgfTKh69tdL4Z2T3VHcw%2Btpo8U%2FAIgfD6mhin98n2li3KdNaYzwV9%2ByeKh6a3srk6kuJErvaIq8wQIWBABGgw2OTk3NTMzMDk3MDUiDJO5bizKpDLNQQw7SyrQBJaYZoCebB%2FYRYr6ZoSdfmINEYW9K2vvCU5uvxMsQmrq3KRH7KfYdkwXi1AjINRvAb3CZ0%2Fco8OQgDLwoP6X%2FVbxyuoSVPly5qrd7LxfDtGUGM4zVqIO8w59jOtpJJZbQEwvQ0%2BH7MWIxcEtYVsBVtEWsZCHwRwpoQpq0hjTfKgWx52FeHA%2BNK2EVzVaNw0oPeWMi43PZbnoLafj5%2BUKBIYjN98W1AESRj4SttB%2FnTUW3CyNzALonmchU96pW8uHa8YBwtp%2BGjgW8%2B9OH9jXgGqJvBn%2BI%2F3NbflHYHBc2gU7%2FF8IYqH97TGfgwjyR%2Fqr7p9mAVQxOnl%2FgHw2vpF7FPiXzPU7y2xhlnUngQQ9SsB1Cy1B5JkgxStOlNB3MfmVYR8WTDBjCVMOu7IEbfcSa%2BRaYwe3LzUaiS%2FuxMBP0SIV9%2B%2BcieTLabz4GjDLyK%2BJrVrfDfqjeh1Vyq20Av260fxx6rLBH7HQOFzS8hnAzIWLbYWrs7p4udO0Q7tNONdayJeJVh6f2cPmO6Xlk1Bgs%2BZZvbaVy6%2FRWIi8xuhfTY%2FHmetrGdI75%2BH6eO0xd7mx0J7vYmgP8XyVzEXyIukaRzNmeUpOOpaWk5wexlY66L8N%2FZBgMbYT8wpo3qCcTaWAdVyLNRYAhXNQxdIV7Qg4Mtih3NxxMT2ySkr2YsJvDGQEyNosa8u3oIxaiBb3dNGD1LXjVK3WvkxtBQ4JEnOln4mJZeb5vQKIRYZcaHAabG7ghIhy17MozZCN8Eb7Fi55DiYvtQykuStr%2FhBt1%2Bhae4Iw5ZiG0QY6mAGIB5iuHyD%2BASr871HQbyPC4DN8phVtuuG5szKET7ob9GYiClv7nrM3B33Jp7mYwx9tfQOyJps9aw9oBwk51JdXkodJd7HjtUWICHyD5YqtmnVJ1Oz3xnKr5KSM4rCi5MzJGnUTs9k%2B173tHGJJCLjMawzdxrXUlNavdpfSKuoLmNmfJm%2FKZ2QTgnH%2B3SCXanvxCYeYdk9RGw%3D%3D&Expires=1780587064)

## Colecciones MongoDB

Usaría estas colecciones:

- `tenants`.
    
- `documents`.
    
- `document_versions`.
    
- `document_events`.
    
- `asset_space_links`.
    
- `storage_connectors`.
    
- `retention_policies`.
    
- `legal_holds`.
    
- `deletion_jobs`.
    
- `document_locks` o `command_idempotency`.
    

La idea de separar documento activo, versiones históricas y eventos de auditoría encaja con patrones de event log y con el consejo general de no hacer crecer demasiado un documento embebido cuando el historial crece mucho.

## Tipos TypeScript

ts

`export type TenantId = string; export type AssetId = string; export type VersionId = string; export type AssetRef = string; export type DocumentStatus =   | 'active'  | 'deleted_pending_retention'  | 'purged'; export type RetentionState =   | 'none'  | 'retention'  | 'legal_hold'; export interface DocumentAsset {   assetId: AssetId;  assetRef: AssetRef;  tenantId: TenantId;  title: string;  description?: string;  status: DocumentStatus;  currentVersionId: VersionId;  latestHash: string;  storageProvider: 'cloudinary';  retentionClass: string;  sensitivityLevel: 'low' | 'medium' | 'high' | 'restricted';  legalHold: boolean;  retentionState: RetentionState;  ownerUserId: string;  createdAt: Date;  updatedAt: Date;  deletedAt?: Date;  deletedBy?: string;  purgeAt?: Date; } export interface DocumentVersion {   versionId: VersionId;  tenantId: TenantId;  assetId: AssetId;  versionNumber: number;  hash: string;  checksumAlgorithm: 'SHA-256';  storageRef: string;  mimeType: string;  sizeBytes: number;  createdBy: string;  createdAt: Date;  isCurrent: boolean;  supersedesVersionId?: VersionId;  deletedAt?: Date; } export interface DocumentEvent {   eventId: string;  tenantId: TenantId;  assetId: AssetId;  versionId?: VersionId;  type:    | 'DOCUMENT_CREATED'    | 'DOCUMENT_VERSION_CREATED'    | 'DOCUMENT_DELETED_LOGICAL'    | 'DOCUMENT_PURGED'    | 'LEGAL_HOLD_SET'    | 'LEGAL_HOLD_RELEASED'    | 'DOCUMENT_RESTORED';  actorId: string;  correlationId: string;  payload: Record<string, unknown>;  createdAt: Date; }`

Ese esquema separa identidad, historia e impacto operativo, que es lo que necesitas para versionado inmutable y trazabilidad seria.

## `assetRef` y verdad

Yo haría `assetRef` como un identificador lógico estable que no cambia cuando cambia el storage físico. Puede derivarse de `tenantId`, `assetId` y `currentVersionId`, pero nunca debe apuntar de forma directa al bucket o al path físico.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEZMZFKUD7&Signature=2kIYybSXCJZoQOYcqrmuqkGwMTs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCF2224WI5iRJJGW4bgfTKh69tdL4Z2T3VHcw%2Btpo8U%2FAIgfD6mhin98n2li3KdNaYzwV9%2ByeKh6a3srk6kuJErvaIq8wQIWBABGgw2OTk3NTMzMDk3MDUiDJO5bizKpDLNQQw7SyrQBJaYZoCebB%2FYRYr6ZoSdfmINEYW9K2vvCU5uvxMsQmrq3KRH7KfYdkwXi1AjINRvAb3CZ0%2Fco8OQgDLwoP6X%2FVbxyuoSVPly5qrd7LxfDtGUGM4zVqIO8w59jOtpJJZbQEwvQ0%2BH7MWIxcEtYVsBVtEWsZCHwRwpoQpq0hjTfKgWx52FeHA%2BNK2EVzVaNw0oPeWMi43PZbnoLafj5%2BUKBIYjN98W1AESRj4SttB%2FnTUW3CyNzALonmchU96pW8uHa8YBwtp%2BGjgW8%2B9OH9jXgGqJvBn%2BI%2F3NbflHYHBc2gU7%2FF8IYqH97TGfgwjyR%2Fqr7p9mAVQxOnl%2FgHw2vpF7FPiXzPU7y2xhlnUngQQ9SsB1Cy1B5JkgxStOlNB3MfmVYR8WTDBjCVMOu7IEbfcSa%2BRaYwe3LzUaiS%2FuxMBP0SIV9%2B%2BcieTLabz4GjDLyK%2BJrVrfDfqjeh1Vyq20Av260fxx6rLBH7HQOFzS8hnAzIWLbYWrs7p4udO0Q7tNONdayJeJVh6f2cPmO6Xlk1Bgs%2BZZvbaVy6%2FRWIi8xuhfTY%2FHmetrGdI75%2BH6eO0xd7mx0J7vYmgP8XyVzEXyIukaRzNmeUpOOpaWk5wexlY66L8N%2FZBgMbYT8wpo3qCcTaWAdVyLNRYAhXNQxdIV7Qg4Mtih3NxxMT2ySkr2YsJvDGQEyNosa8u3oIxaiBb3dNGD1LXjVK3WvkxtBQ4JEnOln4mJZeb5vQKIRYZcaHAabG7ghIhy17MozZCN8Eb7Fi55DiYvtQykuStr%2FhBt1%2Bhae4Iw5ZiG0QY6mAGIB5iuHyD%2BASr871HQbyPC4DN8phVtuuG5szKET7ob9GYiClv7nrM3B33Jp7mYwx9tfQOyJps9aw9oBwk51JdXkodJd7HjtUWICHyD5YqtmnVJ1Oz3xnKr5KSM4rCi5MzJGnUTs9k%2B173tHGJJCLjMawzdxrXUlNavdpfSKuoLmNmfJm%2FKZ2QTgnH%2B3SCXanvxCYeYdk9RGw%3D%3D&Expires=1780587064)

Ese contrato permite cambiar de Cloudinary a otro backend sin romper consumidores, y hace que `docs.abdia.es` y `templates.abdia.es` trabajen siempre sobre una referencia uniforme.[](https://cloudinary.com/documentation/delivery_url_signatures)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEZMZFKUD7&Signature=2kIYybSXCJZoQOYcqrmuqkGwMTs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCF2224WI5iRJJGW4bgfTKh69tdL4Z2T3VHcw%2Btpo8U%2FAIgfD6mhin98n2li3KdNaYzwV9%2ByeKh6a3srk6kuJErvaIq8wQIWBABGgw2OTk3NTMzMDk3MDUiDJO5bizKpDLNQQw7SyrQBJaYZoCebB%2FYRYr6ZoSdfmINEYW9K2vvCU5uvxMsQmrq3KRH7KfYdkwXi1AjINRvAb3CZ0%2Fco8OQgDLwoP6X%2FVbxyuoSVPly5qrd7LxfDtGUGM4zVqIO8w59jOtpJJZbQEwvQ0%2BH7MWIxcEtYVsBVtEWsZCHwRwpoQpq0hjTfKgWx52FeHA%2BNK2EVzVaNw0oPeWMi43PZbnoLafj5%2BUKBIYjN98W1AESRj4SttB%2FnTUW3CyNzALonmchU96pW8uHa8YBwtp%2BGjgW8%2B9OH9jXgGqJvBn%2BI%2F3NbflHYHBc2gU7%2FF8IYqH97TGfgwjyR%2Fqr7p9mAVQxOnl%2FgHw2vpF7FPiXzPU7y2xhlnUngQQ9SsB1Cy1B5JkgxStOlNB3MfmVYR8WTDBjCVMOu7IEbfcSa%2BRaYwe3LzUaiS%2FuxMBP0SIV9%2B%2BcieTLabz4GjDLyK%2BJrVrfDfqjeh1Vyq20Av260fxx6rLBH7HQOFzS8hnAzIWLbYWrs7p4udO0Q7tNONdayJeJVh6f2cPmO6Xlk1Bgs%2BZZvbaVy6%2FRWIi8xuhfTY%2FHmetrGdI75%2BH6eO0xd7mx0J7vYmgP8XyVzEXyIukaRzNmeUpOOpaWk5wexlY66L8N%2FZBgMbYT8wpo3qCcTaWAdVyLNRYAhXNQxdIV7Qg4Mtih3NxxMT2ySkr2YsJvDGQEyNosa8u3oIxaiBb3dNGD1LXjVK3WvkxtBQ4JEnOln4mJZeb5vQKIRYZcaHAabG7ghIhy17MozZCN8Eb7Fi55DiYvtQykuStr%2FhBt1%2Bhae4Iw5ZiG0QY6mAGIB5iuHyD%2BASr871HQbyPC4DN8phVtuuG5szKET7ob9GYiClv7nrM3B33Jp7mYwx9tfQOyJps9aw9oBwk51JdXkodJd7HjtUWICHyD5YqtmnVJ1Oz3xnKr5KSM4rCi5MzJGnUTs9k%2B173tHGJJCLjMawzdxrXUlNavdpfSKuoLmNmfJm%2FKZ2QTgnH%2B3SCXanvxCYeYdk9RGw%3D%3D&Expires=1780587064)

## Versionado inmutable

El versionado debe ser **append-only**: no se edita una versión, se crea una nueva. Cada subida genera una fila nueva en `document_versions`, se recalcula hash, se marca la nueva como `isCurrent = true` y la anterior pasa a histórica.

En MongoDB, para evitar carreras, usaría una transacción o una secuencia lógica protegida por lock por `assetId`. Así evitas que dos usuarios creen la misma `versionNumber` o que el puntero `currentVersionId` quede inconsistente.

## Flujo de subida

ts

`type UploadDocumentInput = {   tenantId: string;  actorId: string;  title: string;  file: Buffer;  mimeType: string;  correlationId: string;  retentionClass: string;  sensitivityLevel: DocumentAsset['sensitivityLevel'];  spaceIds: string[]; }; type UploadDocumentResult = {   assetRef: string;  assetId: string;  versionId: string;  versionNumber: number;  storageRef: string;  hash: string; };`

Flujo:

1. validar tenant, permisos y cuota;
    
2. subir binario a Cloudinary con URL o firma segura;
    
3. calcular hash;
    
4. crear `documents` si es nuevo asset;
    
5. insertar `document_versions`;
    
6. actualizar puntero `currentVersionId`;
    
7. escribir `document_events`;
    
8. crear `asset_space_links`.[](https://cloudinary.com/documentation/signatures)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEZMZFKUD7&Signature=2kIYybSXCJZoQOYcqrmuqkGwMTs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCF2224WI5iRJJGW4bgfTKh69tdL4Z2T3VHcw%2Btpo8U%2FAIgfD6mhin98n2li3KdNaYzwV9%2ByeKh6a3srk6kuJErvaIq8wQIWBABGgw2OTk3NTMzMDk3MDUiDJO5bizKpDLNQQw7SyrQBJaYZoCebB%2FYRYr6ZoSdfmINEYW9K2vvCU5uvxMsQmrq3KRH7KfYdkwXi1AjINRvAb3CZ0%2Fco8OQgDLwoP6X%2FVbxyuoSVPly5qrd7LxfDtGUGM4zVqIO8w59jOtpJJZbQEwvQ0%2BH7MWIxcEtYVsBVtEWsZCHwRwpoQpq0hjTfKgWx52FeHA%2BNK2EVzVaNw0oPeWMi43PZbnoLafj5%2BUKBIYjN98W1AESRj4SttB%2FnTUW3CyNzALonmchU96pW8uHa8YBwtp%2BGjgW8%2B9OH9jXgGqJvBn%2BI%2F3NbflHYHBc2gU7%2FF8IYqH97TGfgwjyR%2Fqr7p9mAVQxOnl%2FgHw2vpF7FPiXzPU7y2xhlnUngQQ9SsB1Cy1B5JkgxStOlNB3MfmVYR8WTDBjCVMOu7IEbfcSa%2BRaYwe3LzUaiS%2FuxMBP0SIV9%2B%2BcieTLabz4GjDLyK%2BJrVrfDfqjeh1Vyq20Av260fxx6rLBH7HQOFzS8hnAzIWLbYWrs7p4udO0Q7tNONdayJeJVh6f2cPmO6Xlk1Bgs%2BZZvbaVy6%2FRWIi8xuhfTY%2FHmetrGdI75%2BH6eO0xd7mx0J7vYmgP8XyVzEXyIukaRzNmeUpOOpaWk5wexlY66L8N%2FZBgMbYT8wpo3qCcTaWAdVyLNRYAhXNQxdIV7Qg4Mtih3NxxMT2ySkr2YsJvDGQEyNosa8u3oIxaiBb3dNGD1LXjVK3WvkxtBQ4JEnOln4mJZeb5vQKIRYZcaHAabG7ghIhy17MozZCN8Eb7Fi55DiYvtQykuStr%2FhBt1%2Bhae4Iw5ZiG0QY6mAGIB5iuHyD%2BASr871HQbyPC4DN8phVtuuG5szKET7ob9GYiClv7nrM3B33Jp7mYwx9tfQOyJps9aw9oBwk51JdXkodJd7HjtUWICHyD5YqtmnVJ1Oz3xnKr5KSM4rCi5MzJGnUTs9k%2B173tHGJJCLjMawzdxrXUlNavdpfSKuoLmNmfJm%2FKZ2QTgnH%2B3SCXanvxCYeYdk9RGw%3D%3D&Expires=1780587064)[](https://cloudinary.com/documentation/delivery_url_signatures)
    

## Sharding multi-tenant

Para alto volumen, yo empezaría con colección compartida y luego shardearía. En MongoDB, la lógica multi-tenant suele empezar con shared collections y evolucionar a sharding o separación por bases/colecciones según crecimiento y patrón de acceso.

Mi estrategia sería:

- shard key primario: `{ tenantId: 1, assetId: 1 }`;
    
- índices compuestos por `tenantId + status + updatedAt`;
    
- si un tenant se vuelve muy grande, moverlo a un shard preferente o a una base aislada.
    

Eso mantiene locality por tenant y minimiza consultas dispersas, que es lo crítico cuando el sistema crece.

## Cloudinary seguro

Para documentos privados, el patrón correcto es usar **signed delivery URLs** y expiración corta. Cloudinary documenta firmas de entrega y acceso firmado, y eso encaja mejor que links públicos si el documento es sensible.

Yo haría que ABDFiles genere enlaces firmados solo tras autorización backend, con TTL corto y opcionalmente token por sesión. El cliente nunca debería construir la URL final por su cuenta.

## Retención legal y legal hold

La base de datos debería tener un estado explícito `legalHold` o una colección `legal_holds` separada. Cuando un documento entra en legal hold, se bloquea borrado, sobrescritura y purga hasta que se levante la orden, incluso si la retención estándar ya venció.

Yo modelaría:

- `retention_policies`: reglas por clase documental;
    
- `legal_holds`: orden activa con motivo, origen y fechas;
    
- `deletion_jobs`: ejecución diferida cuando la política lo permita.
    

## Borrado lógico

El borrado debe ser primero lógico, no físico. El documento pasa a `deleted_pending_retention`, se anulan enlaces visibles, se revocan firmas, y se programa purga física para `purgeAt` solo si no hay retención ni legal hold.

Eso te da trazabilidad, posibilidad de recuperación accidental y cumplimiento legal más sólido que borrar de inmediato.

## Auditoría y event sourcing

Para la auditoría, yo usaría un **event log append-only** separado del modelo de lectura. Cada operación sensible crea un evento: subida, nueva versión, cambio de metadatos, borrado lógico, hold, release y purga.

Este enfoque te da:

- historial completo;
    
- reconstrucción de estado;
    
- trazabilidad por `correlationId`;
    
- integración natural con `ABDLogs`.
    

## Mi recomendación final

Para ABDFiles, la arquitectura más sana es:

- **MongoDB** como metadatos, versiones y eventos;
    
- **Cloudinary** solo como binario y delivery firmado;
    
- **versionado append-only**;
    
- **borrado lógico con retención/legal hold**;
    
- **event sourcing para auditoría**;
    
- **sharding por tenant** cuando el volumen lo exija.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEZMZFKUD7&Signature=2kIYybSXCJZoQOYcqrmuqkGwMTs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCF2224WI5iRJJGW4bgfTKh69tdL4Z2T3VHcw%2Btpo8U%2FAIgfD6mhin98n2li3KdNaYzwV9%2ByeKh6a3srk6kuJErvaIq8wQIWBABGgw2OTk3NTMzMDk3MDUiDJO5bizKpDLNQQw7SyrQBJaYZoCebB%2FYRYr6ZoSdfmINEYW9K2vvCU5uvxMsQmrq3KRH7KfYdkwXi1AjINRvAb3CZ0%2Fco8OQgDLwoP6X%2FVbxyuoSVPly5qrd7LxfDtGUGM4zVqIO8w59jOtpJJZbQEwvQ0%2BH7MWIxcEtYVsBVtEWsZCHwRwpoQpq0hjTfKgWx52FeHA%2BNK2EVzVaNw0oPeWMi43PZbnoLafj5%2BUKBIYjN98W1AESRj4SttB%2FnTUW3CyNzALonmchU96pW8uHa8YBwtp%2BGjgW8%2B9OH9jXgGqJvBn%2BI%2F3NbflHYHBc2gU7%2FF8IYqH97TGfgwjyR%2Fqr7p9mAVQxOnl%2FgHw2vpF7FPiXzPU7y2xhlnUngQQ9SsB1Cy1B5JkgxStOlNB3MfmVYR8WTDBjCVMOu7IEbfcSa%2BRaYwe3LzUaiS%2FuxMBP0SIV9%2B%2BcieTLabz4GjDLyK%2BJrVrfDfqjeh1Vyq20Av260fxx6rLBH7HQOFzS8hnAzIWLbYWrs7p4udO0Q7tNONdayJeJVh6f2cPmO6Xlk1Bgs%2BZZvbaVy6%2FRWIi8xuhfTY%2FHmetrGdI75%2BH6eO0xd7mx0J7vYmgP8XyVzEXyIukaRzNmeUpOOpaWk5wexlY66L8N%2FZBgMbYT8wpo3qCcTaWAdVyLNRYAhXNQxdIV7Qg4Mtih3NxxMT2ySkr2YsJvDGQEyNosa8u3oIxaiBb3dNGD1LXjVK3WvkxtBQ4JEnOln4mJZeb5vQKIRYZcaHAabG7ghIhy17MozZCN8Eb7Fi55DiYvtQykuStr%2FhBt1%2Bhae4Iw5ZiG0QY6mAGIB5iuHyD%2BASr871HQbyPC4DN8phVtuuG5szKET7ob9GYiClv7nrM3B33Jp7mYwx9tfQOyJps9aw9oBwk51JdXkodJd7HjtUWICHyD5YqtmnVJ1Oz3xnKr5KSM4rCi5MzJGnUTs9k%2B173tHGJJCLjMawzdxrXUlNavdpfSKuoLmNmfJm%2FKZ2QTgnH%2B3SCXanvxCYeYdk9RGw%3D%3D&Expires=1780587064)
    

Si quieres, el siguiente paso útil es que te lo deje como **especificación técnica completa con diagramas de colecciones y pseudoflujo de subida/versionado/borrado**.

---------------------
Aquí tienes la propuesta técnica para **ABDFiles** como satélite de documentos, con MongoDB + Cloudinary, versionado inmutable, retención legal, sharding y auditoría. La planteo para que puedas llevarla a implementación sin rehacer la base luego.

## Arquitectura general

ABDFiles debería separar claramente **metadatos**, **versiones**, **eventos** y **storage físico**. MongoDB guarda la verdad de negocio y la historia; Cloudinary guarda el binario y entrega URLs firmadas; ABDAuth decide identidad y permisos; ABDLogs recibe la trazabilidad.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWOGTRNN7&Signature=bmp9EuLUtEEtaY91BP6EBjqXmco%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDUeMggMdcED1MHJkPGhWc%2FrWUFLVnoM3%2Ff%2BUfy7cz71wIhAJZddsA6ruhGrHe1xN5V1ygJ1OeJ%2B96a57dDcBa5LbzzKvMECFgQARoMNjk5NzUzMzA5NzA1Igz2RwS6ycqsCtbvRyYq0ASArGGd08eQ9%2B%2BwlaftyfT%2FQE%2BprfVmtXtdlqPSLWrxWeKO5WF3wDa0xODb5AP1XZ%2FY3B4XtqmK1Q2VQhVWQPgWRKWP%2Bb0m07NFc7jbvvH4MfgVuG3G%2BHbXAcgrr%2FdOpjq0ztMl%2BznkOBGpuJQa2cEHt0RLtAhfWFmkUdg8zqgYK86XzutVNzudXvFwLfdqrWbMglCFKfFWU12GQvzrfbDvIhoYwKnvaZWjw%2F8UHCV8J5qL4k99roMuVeiF155I88lreCYg2V30mX9vHR2b9RqQA4eCVxKTyzV%2B9IVSx5dMTyuDwbjSXajXvUJSCvCzLAlg%2B%2FO1dN0gAAmsiVeGB8rMmTzXq8aUuoe%2BR2h6qEsou3twG4jBiytF%2B8%2BPmlp%2FuqZoMEwBQNQKmbmqwX0byzkZj2Np0iwSjG9oQTRmjU%2BosTelJN9FJBzIwYWXpj%2Bnx983InGbk7yiaoM67Wg70CFAsnFpZY%2BLVg9Vz8E66asbWPt2AfGNO7x2ChLFZk6fr%2BAm11rMcyLHXmh2td1dEqJhwpT61IjsIKBtAB8egTLn0TFtgw2MiNXyW4ePvZ5aGDi77ozpIIUHofRKPAmXf0SIB0vqiUCCPYCgpDfp1BZRZyQgyDc9qjanaorvEyqylyUOJVOwOPEalqDvGI54x6idc6UgKAEiNQ4LZraGkTVd5P8bmr%2BWfBsgW75Q6ePiKfvWHAKIuqeuC91aVG6rZjlo6l3YNIGGPRKfVzM719OV7Aoteqk9ivfnGAVvH%2B3f7%2B8Rd0uoEXLBzH1tVD7es%2FN3MNKshtEGOpcBCN%2F7o4uFGgLHW1C%2BRRgRKDHePTsV0ElNzEsxuY7G%2FZeJv2330SOw13EWlxFpoku6ye9OFLf%2FwiFhaIstcYM8XaA4Ukp2apP6nZNmhSd82lz7B1Ui1jCqALR%2BJPxH%2BVZim1S5KjHqrzFn%2FNgPgntbi0MfnvxGGrFV4GH5TyILpGXvJ2DSumENpP4nPavb8SqeCoeLhtcPlg%3D%3D&Expires=1780589605)

La regla principal es que ningún consumidor externo manipula `storageRef` directamente: solo usa `assetRef`. Eso hace que el satélite pueda cambiar de proveedor físico sin romper contratos del resto de la suite.[](https://cloudinary.com/documentation/delivery_url_signatures)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWOGTRNN7&Signature=bmp9EuLUtEEtaY91BP6EBjqXmco%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDUeMggMdcED1MHJkPGhWc%2FrWUFLVnoM3%2Ff%2BUfy7cz71wIhAJZddsA6ruhGrHe1xN5V1ygJ1OeJ%2B96a57dDcBa5LbzzKvMECFgQARoMNjk5NzUzMzA5NzA1Igz2RwS6ycqsCtbvRyYq0ASArGGd08eQ9%2B%2BwlaftyfT%2FQE%2BprfVmtXtdlqPSLWrxWeKO5WF3wDa0xODb5AP1XZ%2FY3B4XtqmK1Q2VQhVWQPgWRKWP%2Bb0m07NFc7jbvvH4MfgVuG3G%2BHbXAcgrr%2FdOpjq0ztMl%2BznkOBGpuJQa2cEHt0RLtAhfWFmkUdg8zqgYK86XzutVNzudXvFwLfdqrWbMglCFKfFWU12GQvzrfbDvIhoYwKnvaZWjw%2F8UHCV8J5qL4k99roMuVeiF155I88lreCYg2V30mX9vHR2b9RqQA4eCVxKTyzV%2B9IVSx5dMTyuDwbjSXajXvUJSCvCzLAlg%2B%2FO1dN0gAAmsiVeGB8rMmTzXq8aUuoe%2BR2h6qEsou3twG4jBiytF%2B8%2BPmlp%2FuqZoMEwBQNQKmbmqwX0byzkZj2Np0iwSjG9oQTRmjU%2BosTelJN9FJBzIwYWXpj%2Bnx983InGbk7yiaoM67Wg70CFAsnFpZY%2BLVg9Vz8E66asbWPt2AfGNO7x2ChLFZk6fr%2BAm11rMcyLHXmh2td1dEqJhwpT61IjsIKBtAB8egTLn0TFtgw2MiNXyW4ePvZ5aGDi77ozpIIUHofRKPAmXf0SIB0vqiUCCPYCgpDfp1BZRZyQgyDc9qjanaorvEyqylyUOJVOwOPEalqDvGI54x6idc6UgKAEiNQ4LZraGkTVd5P8bmr%2BWfBsgW75Q6ePiKfvWHAKIuqeuC91aVG6rZjlo6l3YNIGGPRKfVzM719OV7Aoteqk9ivfnGAVvH%2B3f7%2B8Rd0uoEXLBzH1tVD7es%2FN3MNKshtEGOpcBCN%2F7o4uFGgLHW1C%2BRRgRKDHePTsV0ElNzEsxuY7G%2FZeJv2330SOw13EWlxFpoku6ye9OFLf%2FwiFhaIstcYM8XaA4Ukp2apP6nZNmhSd82lz7B1Ui1jCqALR%2BJPxH%2BVZim1S5KjHqrzFn%2FNgPgntbi0MfnvxGGrFV4GH5TyILpGXvJ2DSumENpP4nPavb8SqeCoeLhtcPlg%3D%3D&Expires=1780589605)

## Colecciones MongoDB

## `documents`

Guarda el estado actual del activo documental.  
Campos clave: `tenantId`, `assetId`, `assetRef`, `title`, `status`, `currentVersionId`, `latestHash`, `storageProvider`, `retentionClass`, `sensitivityLevel`, `legalHold`, `createdAt`, `updatedAt`, `deletedAt`, `purgeAt`.[](https://doc.nuxeo.com/nxdoc/nuxeo-retention-management/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWOGTRNN7&Signature=bmp9EuLUtEEtaY91BP6EBjqXmco%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDUeMggMdcED1MHJkPGhWc%2FrWUFLVnoM3%2Ff%2BUfy7cz71wIhAJZddsA6ruhGrHe1xN5V1ygJ1OeJ%2B96a57dDcBa5LbzzKvMECFgQARoMNjk5NzUzMzA5NzA1Igz2RwS6ycqsCtbvRyYq0ASArGGd08eQ9%2B%2BwlaftyfT%2FQE%2BprfVmtXtdlqPSLWrxWeKO5WF3wDa0xODb5AP1XZ%2FY3B4XtqmK1Q2VQhVWQPgWRKWP%2Bb0m07NFc7jbvvH4MfgVuG3G%2BHbXAcgrr%2FdOpjq0ztMl%2BznkOBGpuJQa2cEHt0RLtAhfWFmkUdg8zqgYK86XzutVNzudXvFwLfdqrWbMglCFKfFWU12GQvzrfbDvIhoYwKnvaZWjw%2F8UHCV8J5qL4k99roMuVeiF155I88lreCYg2V30mX9vHR2b9RqQA4eCVxKTyzV%2B9IVSx5dMTyuDwbjSXajXvUJSCvCzLAlg%2B%2FO1dN0gAAmsiVeGB8rMmTzXq8aUuoe%2BR2h6qEsou3twG4jBiytF%2B8%2BPmlp%2FuqZoMEwBQNQKmbmqwX0byzkZj2Np0iwSjG9oQTRmjU%2BosTelJN9FJBzIwYWXpj%2Bnx983InGbk7yiaoM67Wg70CFAsnFpZY%2BLVg9Vz8E66asbWPt2AfGNO7x2ChLFZk6fr%2BAm11rMcyLHXmh2td1dEqJhwpT61IjsIKBtAB8egTLn0TFtgw2MiNXyW4ePvZ5aGDi77ozpIIUHofRKPAmXf0SIB0vqiUCCPYCgpDfp1BZRZyQgyDc9qjanaorvEyqylyUOJVOwOPEalqDvGI54x6idc6UgKAEiNQ4LZraGkTVd5P8bmr%2BWfBsgW75Q6ePiKfvWHAKIuqeuC91aVG6rZjlo6l3YNIGGPRKfVzM719OV7Aoteqk9ivfnGAVvH%2B3f7%2B8Rd0uoEXLBzH1tVD7es%2FN3MNKshtEGOpcBCN%2F7o4uFGgLHW1C%2BRRgRKDHePTsV0ElNzEsxuY7G%2FZeJv2330SOw13EWlxFpoku6ye9OFLf%2FwiFhaIstcYM8XaA4Ukp2apP6nZNmhSd82lz7B1Ui1jCqALR%2BJPxH%2BVZim1S5KjHqrzFn%2FNgPgntbi0MfnvxGGrFV4GH5TyILpGXvJ2DSumENpP4nPavb8SqeCoeLhtcPlg%3D%3D&Expires=1780589605)[](https://oneuptime.com/blog/post/2026-03-31-mongodb-how-to-implement-document-soft-delete-and-recovery-in-mongod/view)

## `document_versions`

Guarda cada versión de forma inmutable.  
Campos clave: `versionId`, `tenantId`, `assetId`, `versionNumber`, `hash`, `checksumAlgorithm`, `storageRef`, `mimeType`, `sizeBytes`, `createdBy`, `createdAt`, `isCurrent`, `supersedesVersionId`, `deletedAt`.

## `document_events`

Evento append-only para auditoría y reconstrucción de historia.  
Campos clave: `eventId`, `tenantId`, `assetId`, `versionId`, `type`, `actorId`, `correlationId`, `payload`, `createdAt`.

## `asset_space_links`

Relación entre un asset y uno o varios espacios lógicos.  
Campos clave: `linkId`, `tenantId`, `assetId`, `spaceId`, `spacePath`, `isPrimary`, `createdAt`, `createdBy`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWOGTRNN7&Signature=bmp9EuLUtEEtaY91BP6EBjqXmco%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDUeMggMdcED1MHJkPGhWc%2FrWUFLVnoM3%2Ff%2BUfy7cz71wIhAJZddsA6ruhGrHe1xN5V1ygJ1OeJ%2B96a57dDcBa5LbzzKvMECFgQARoMNjk5NzUzMzA5NzA1Igz2RwS6ycqsCtbvRyYq0ASArGGd08eQ9%2B%2BwlaftyfT%2FQE%2BprfVmtXtdlqPSLWrxWeKO5WF3wDa0xODb5AP1XZ%2FY3B4XtqmK1Q2VQhVWQPgWRKWP%2Bb0m07NFc7jbvvH4MfgVuG3G%2BHbXAcgrr%2FdOpjq0ztMl%2BznkOBGpuJQa2cEHt0RLtAhfWFmkUdg8zqgYK86XzutVNzudXvFwLfdqrWbMglCFKfFWU12GQvzrfbDvIhoYwKnvaZWjw%2F8UHCV8J5qL4k99roMuVeiF155I88lreCYg2V30mX9vHR2b9RqQA4eCVxKTyzV%2B9IVSx5dMTyuDwbjSXajXvUJSCvCzLAlg%2B%2FO1dN0gAAmsiVeGB8rMmTzXq8aUuoe%2BR2h6qEsou3twG4jBiytF%2B8%2BPmlp%2FuqZoMEwBQNQKmbmqwX0byzkZj2Np0iwSjG9oQTRmjU%2BosTelJN9FJBzIwYWXpj%2Bnx983InGbk7yiaoM67Wg70CFAsnFpZY%2BLVg9Vz8E66asbWPt2AfGNO7x2ChLFZk6fr%2BAm11rMcyLHXmh2td1dEqJhwpT61IjsIKBtAB8egTLn0TFtgw2MiNXyW4ePvZ5aGDi77ozpIIUHofRKPAmXf0SIB0vqiUCCPYCgpDfp1BZRZyQgyDc9qjanaorvEyqylyUOJVOwOPEalqDvGI54x6idc6UgKAEiNQ4LZraGkTVd5P8bmr%2BWfBsgW75Q6ePiKfvWHAKIuqeuC91aVG6rZjlo6l3YNIGGPRKfVzM719OV7Aoteqk9ivfnGAVvH%2B3f7%2B8Rd0uoEXLBzH1tVD7es%2FN3MNKshtEGOpcBCN%2F7o4uFGgLHW1C%2BRRgRKDHePTsV0ElNzEsxuY7G%2FZeJv2330SOw13EWlxFpoku6ye9OFLf%2FwiFhaIstcYM8XaA4Ukp2apP6nZNmhSd82lz7B1Ui1jCqALR%2BJPxH%2BVZim1S5KjHqrzFn%2FNgPgntbi0MfnvxGGrFV4GH5TyILpGXvJ2DSumENpP4nPavb8SqeCoeLhtcPlg%3D%3D&Expires=1780589605)

## `retention_policies` y `legal_holds`

Controlan expiración, conservación obligatoria y bloqueo legal.  
Campos clave de política: `tenantId`, `retentionClass`, `keepVersionsDays`, `purgeAfterDays`, `archiveAfterDays`, `legalBasis`.  
Campos clave de hold: `tenantId`, `assetId`, `reason`, `startsAt`, `endsAt?`, `status`, `createdBy`.

## Tipos TypeScript

ts

`export type TenantId = string; export type AssetId = string; export type VersionId = string; export type SpaceId = string; export type AssetRef = string; export type DocumentStatus =   | 'active'  | 'deleted_pending_retention'  | 'purged'; export type DocumentEventType =   | 'DOCUMENT_CREATED'  | 'DOCUMENT_VERSION_CREATED'  | 'DOCUMENT_METADATA_UPDATED'  | 'DOCUMENT_LOGICAL_DELETED'  | 'DOCUMENT_PURGED'  | 'DOCUMENT_RESTORED'  | 'LEGAL_HOLD_APPLIED'  | 'LEGAL_HOLD_RELEASED'; export interface DocumentAsset {   assetId: AssetId;  assetRef: AssetRef;  tenantId: TenantId;  title: string;  description?: string;  status: DocumentStatus;  currentVersionId: VersionId;  latestHash: string;  storageProvider: 'cloudinary';  storageRefCurrent: string;  retentionClass: string;  sensitivityLevel: 'low' | 'medium' | 'high' | 'restricted';  legalHold: boolean;  createdAt: Date;  updatedAt: Date;  deletedAt?: Date;  deletedBy?: string;  purgeAt?: Date; } export interface DocumentVersion {   versionId: VersionId;  tenantId: TenantId;  assetId: AssetId;  versionNumber: number;  hash: string;  checksumAlgorithm: 'SHA-256';  storageRef: string;  mimeType: string;  sizeBytes: number;  createdBy: string;  createdAt: Date;  isCurrent: boolean;  supersedesVersionId?: VersionId;  deletedAt?: Date; } export interface DocumentEvent {   eventId: string;  tenantId: TenantId;  assetId: AssetId;  versionId?: VersionId;  type: DocumentEventType;  actorId: string;  correlationId: string;  payload: Record<string, unknown>;  createdAt: Date; } export interface LegalHold {   holdId: string;  tenantId: TenantId;  assetId: AssetId;  reason: string;  status: 'active' | 'released';  createdBy: string;  createdAt: Date;  releasedAt?: Date; }`

## Inmutabilidad real

La inmutabilidad no se logra con “no tocar el documento” solo por convención; se logra con **append-only + transacciones + validación de concurrencia**. Cada subida genera una nueva fila en `document_versions`, el documento maestro solo cambia el puntero `currentVersionId`, y el historial anterior nunca se sobrescribe.

Además, yo prohibiría `update` sobre versiones históricas desde la capa de dominio y validaría en MongoDB que `versionNumber` sea monotónico por `assetId`. Si quieres reforzarlo aún más, usa un lock transaccional o una colección de idempotencia por `correlationId` para evitar duplicados en retries.

## Sharding a escala

Para multi-tenant a gran escala, empezaría con colección compartida y `tenantId` como eje principal de índices. Cuando el volumen crezca, movería a sharding con un shard key que preserve locality por tenant y minimice scatter-gather.

Mi propuesta:

- shard key base: `{ tenantId: 1, assetId: 1 }`.
    
- índices secundarios: `{ tenantId: 1, status: 1, updatedAt: -1 }`, `{ tenantId: 1, currentVersionId: 1 }`.
    
- para tenants muy grandes, mover a un shard preferente o partición dedicada.
    

La regla práctica es simple: si la mayoría de consultas siempre filtran por tenant, el shard key debe reflejarlo; si no, acabarás con scatter-gather y un cuello de botella por shard caliente.

## Subida a Cloudinary

La subida debería ser idempotente y resiliente a fallos. La forma correcta es generar un `uploadId` o `idempotencyKey`, reservar un evento de creación, subir el binario a Cloudinary con firma segura y solo confirmar la versión cuando Cloudinary responde correctamente.

Si la subida falla:

1. el asset queda en estado `upload_pending` o `failed`;
    
2. el cliente puede reintentar con el mismo `idempotencyKey`;
    
3. el backend recupera la operación previa si ya existía;
    
4. si el binario quedó huérfano en Cloudinary, un cleanup job lo elimina.
    

## Retención y borrado lógico

Yo separaría `deletedAt`, `purgeAt` y `legalHold`. El borrado lógico marca el documento como no visible, revoca acceso y planifica purga; la retención decide cuánto tiempo sobrevive; el legal hold bloquea toda purga hasta liberación expresa.

En práctica:

- `active` → visible y operable.
    
- `deleted_pending_retention` → oculto, no operable, esperando purga.
    
- `purged` → sin binario ni versiones recuperables.
    
- `legalHold = true` → todo lo anterior bloqueado.
    

## Auditoría y trazabilidad

La auditoría debe ser **event sourcing ligero**: cada acción sensible genera un evento append-only, y ese stream se usa para reconstruir historia y alimentar ABDLogs. No confiaría solo en `updatedAt` o en logs de aplicación, porque eso no te da trazabilidad completa ni recuperación formal.

Eventos mínimos:

- subida creada;
    
- versión creada;
    
- metadatos cambiados;
    
- hold aplicado;
    
- hold liberado;
    
- borrado lógico;
    
- purga física;
    
- restauración.
    

## Flujo de trabajo ante fallo

Si falla la subida a Cloudinary, yo haría esto:

- marcar la operación como fallida pero no eliminar contexto;
    
- conservar el `correlationId`;
    
- no crear versión “activa”;
    
- si hubo binario parcial, limpiar con job diferido;
    
- permitir retry idempotente;
    
- auditar tanto el fallo como el eventual retry exitoso.
    

## Cierre de diseño

La versión más sólida para ABDFiles es: **MongoDB para la historia y el control, Cloudinary para el binario, event sourcing para auditoría, versionado append-only, legal hold explícito y sharding por tenant cuando el volumen lo pida**. Esa combinación te da control documental serio sin perder velocidad de desarrollo.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWOGTRNN7&Signature=bmp9EuLUtEEtaY91BP6EBjqXmco%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDUeMggMdcED1MHJkPGhWc%2FrWUFLVnoM3%2Ff%2BUfy7cz71wIhAJZddsA6ruhGrHe1xN5V1ygJ1OeJ%2B96a57dDcBa5LbzzKvMECFgQARoMNjk5NzUzMzA5NzA1Igz2RwS6ycqsCtbvRyYq0ASArGGd08eQ9%2B%2BwlaftyfT%2FQE%2BprfVmtXtdlqPSLWrxWeKO5WF3wDa0xODb5AP1XZ%2FY3B4XtqmK1Q2VQhVWQPgWRKWP%2Bb0m07NFc7jbvvH4MfgVuG3G%2BHbXAcgrr%2FdOpjq0ztMl%2BznkOBGpuJQa2cEHt0RLtAhfWFmkUdg8zqgYK86XzutVNzudXvFwLfdqrWbMglCFKfFWU12GQvzrfbDvIhoYwKnvaZWjw%2F8UHCV8J5qL4k99roMuVeiF155I88lreCYg2V30mX9vHR2b9RqQA4eCVxKTyzV%2B9IVSx5dMTyuDwbjSXajXvUJSCvCzLAlg%2B%2FO1dN0gAAmsiVeGB8rMmTzXq8aUuoe%2BR2h6qEsou3twG4jBiytF%2B8%2BPmlp%2FuqZoMEwBQNQKmbmqwX0byzkZj2Np0iwSjG9oQTRmjU%2BosTelJN9FJBzIwYWXpj%2Bnx983InGbk7yiaoM67Wg70CFAsnFpZY%2BLVg9Vz8E66asbWPt2AfGNO7x2ChLFZk6fr%2BAm11rMcyLHXmh2td1dEqJhwpT61IjsIKBtAB8egTLn0TFtgw2MiNXyW4ePvZ5aGDi77ozpIIUHofRKPAmXf0SIB0vqiUCCPYCgpDfp1BZRZyQgyDc9qjanaorvEyqylyUOJVOwOPEalqDvGI54x6idc6UgKAEiNQ4LZraGkTVd5P8bmr%2BWfBsgW75Q6ePiKfvWHAKIuqeuC91aVG6rZjlo6l3YNIGGPRKfVzM719OV7Aoteqk9ivfnGAVvH%2B3f7%2B8Rd0uoEXLBzH1tVD7es%2FN3MNKshtEGOpcBCN%2F7o4uFGgLHW1C%2BRRgRKDHePTsV0ElNzEsxuY7G%2FZeJv2330SOw13EWlxFpoku6ye9OFLf%2FwiFhaIstcYM8XaA4Ukp2apP6nZNmhSd82lz7B1Ui1jCqALR%2BJPxH%2BVZim1S5KjHqrzFn%2FNgPgntbi0MfnvxGGrFV4GH5TyILpGXvJ2DSumENpP4nPavb8SqeCoeLhtcPlg%3D%3D&Expires=1780589605)

Si quieres, en el siguiente mensaje te lo convierto en un **documento de especificación completo** con secciones formales, diagramas ASCII de colecciones y pseudocódigo de `uploadDocument()`, `createNewVersion()` y `logicalDeleteDocument()`.

--------------

 te dejo una **especificación técnica base** para ABDFiles, ya pensada para implementación real. Está organizada para que sirva como documento de arquitectura, con colecciones, estados, flujos, pseudocódigo y decisiones de diseño sobre inmutabilidad, sharding, auditoría, retención, webhooks y migración de storage.

## 1. Alcance

**ABDFiles** será el satélite documental de ABDSuite en `files.abdia.es`. Su función es recibir, versionar, servir, auditar y retirar documentos de forma multi-tenant, usando Cloudinary como almacenamiento físico y MongoDB como base de metadatos, historia y trazabilidad.[](https://cloudinary.com/documentation/control_access_to_media)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZNUQBW2&Signature=WoefcV6hy6kCr5yMC0V8DGkdsQg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGwDltT7OGU0VlQvBN9wrDLWV5%2BvqP%2BUfDftbaTRgqoIAiAubsDi%2BZDh85fJcHyIIToxLhv2VxT8vMaPv%2F%2FCTSZjeSrzBAhYEAEaDDY5OTc1MzMwOTcwNSIMjv36bbjrtV6RduT2KtAE0gZbGDdBMaT5GdBhGH5vNj0oS%2FzfdWcrt4VQrF2B%2BGJAxjR8ufbWfRBPRwg61uf8R7KYfyRw%2BRPvNstHQ6%2FiCUKSXA06%2FzH1Wurf5tmfRYBKb%2FVnwJpLG33eOPyF9m667tBIcozKEXI6gxL87U9ul2%2F4dKXVFnUZ%2FOC0QFeBKwa47bv4jTy40r9zKCz7vM0heCXNtlhUQHoOxl76LnyN7JWSVW1piQZA9Yk4oeWQGBvsI09h82zOs77dVffJqjmXA909dx3obFQz4FblgJfC19wGV2qvtL%2BB256ISKMqzlCRlg4WmcYvmGplhfG4ciERJQS4rWw%2FbmYe2ss%2FZ2%2Bn7uFubX2o7UcpDhCWaU6nrXPnRX2xiyDxRzllcvTkCNj68a6Ixl5vazKcjPgKOBcwEH7k%2FDx2G0dMXXqYzGE5SgawmaxRRET%2F0H%2Bln5ZgDuQzmmPrP6%2BDGKvNMyctGCkWkOdUQbYWd5C5UHlaEcQGvSam2ljbJVaUHN5bth5FGykd1cS9ErqMlwB9GOZ8GgktzIw8HESZCT6z278Muv4583Zd9fuWoFfTERBc6CAUEcq9I4avvqz41rQ1%2BcDAcvPj1eJvsXgNxei967U%2BxROpk%2Blfa8dtYwZefMRBtRhTPZL8eg0MMvnHxKJ4pKg%2BL0IWvLh64AMl5dktphtwghbzlXuiX46mHBj7yIs43ain7PRpdQJ5m9rLeFX7PQpEIXgkSOSzMG1VEu4Gjef9ZR3P%2B4UYKBrwCXxE4O%2BRpoontuWKmDw8aTusbgdRGmm3v4HFXDCipIbRBjqZAYkZxvq%2B9VI3aFD9rITmAjA3u9%2FYKviyJQB4%2F6DTebuDvVfR7hWcDE33yPpyHeYPpWiRtWKaQ24RrXcFVGYR%2FVknfAj6YJINn6BQs9Z79LNrQ005ZEL6rhtK08MoVEJK7GIaDJAL1cpidytAiuuPJltXnAQ4RAMD5R6vamFBnv8nxEh%2Bt5y%2FIgYrY7FYLQiexD85125qE5HDag%3D%3D&Expires=1780588533)[](https://www.mongodb.com/docs/manual/core/auditing/)

El principio rector es que el binario no es la fuente de verdad; la verdad del sistema vive en `documents`, `document_versions`, `document_events` y `legal_holds`. Eso permite versionado inmutable, retención legal, borrado lógico y migración entre proveedores sin romper contratos.[](https://www.mongodb.com/docs/manual/core/transactions/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZNUQBW2&Signature=WoefcV6hy6kCr5yMC0V8DGkdsQg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGwDltT7OGU0VlQvBN9wrDLWV5%2BvqP%2BUfDftbaTRgqoIAiAubsDi%2BZDh85fJcHyIIToxLhv2VxT8vMaPv%2F%2FCTSZjeSrzBAhYEAEaDDY5OTc1MzMwOTcwNSIMjv36bbjrtV6RduT2KtAE0gZbGDdBMaT5GdBhGH5vNj0oS%2FzfdWcrt4VQrF2B%2BGJAxjR8ufbWfRBPRwg61uf8R7KYfyRw%2BRPvNstHQ6%2FiCUKSXA06%2FzH1Wurf5tmfRYBKb%2FVnwJpLG33eOPyF9m667tBIcozKEXI6gxL87U9ul2%2F4dKXVFnUZ%2FOC0QFeBKwa47bv4jTy40r9zKCz7vM0heCXNtlhUQHoOxl76LnyN7JWSVW1piQZA9Yk4oeWQGBvsI09h82zOs77dVffJqjmXA909dx3obFQz4FblgJfC19wGV2qvtL%2BB256ISKMqzlCRlg4WmcYvmGplhfG4ciERJQS4rWw%2FbmYe2ss%2FZ2%2Bn7uFubX2o7UcpDhCWaU6nrXPnRX2xiyDxRzllcvTkCNj68a6Ixl5vazKcjPgKOBcwEH7k%2FDx2G0dMXXqYzGE5SgawmaxRRET%2F0H%2Bln5ZgDuQzmmPrP6%2BDGKvNMyctGCkWkOdUQbYWd5C5UHlaEcQGvSam2ljbJVaUHN5bth5FGykd1cS9ErqMlwB9GOZ8GgktzIw8HESZCT6z278Muv4583Zd9fuWoFfTERBc6CAUEcq9I4avvqz41rQ1%2BcDAcvPj1eJvsXgNxei967U%2BxROpk%2Blfa8dtYwZefMRBtRhTPZL8eg0MMvnHxKJ4pKg%2BL0IWvLh64AMl5dktphtwghbzlXuiX46mHBj7yIs43ain7PRpdQJ5m9rLeFX7PQpEIXgkSOSzMG1VEu4Gjef9ZR3P%2B4UYKBrwCXxE4O%2BRpoontuWKmDw8aTusbgdRGmm3v4HFXDCipIbRBjqZAYkZxvq%2B9VI3aFD9rITmAjA3u9%2FYKviyJQB4%2F6DTebuDvVfR7hWcDE33yPpyHeYPpWiRtWKaQ24RrXcFVGYR%2FVknfAj6YJINn6BQs9Z79LNrQ005ZEL6rhtK08MoVEJK7GIaDJAL1cpidytAiuuPJltXnAQ4RAMD5R6vamFBnv8nxEh%2Bt5y%2FIgYrY7FYLQiexD85125qE5HDag%3D%3D&Expires=1780588533)

## 2. Principios

1. Inmutabilidad por versión, nunca por sobrescritura.
    
2. Multi-tenancy por `tenantId`, con aislamiento lógico y capacidad de sharding posterior.
    
3. Auditoría por eventos append-only, no por updates silenciosos.
    
4. Retención legal y legal hold por base de datos, no solo por convención de aplicación.
    
5. Cloudinary solo como storage/ delivery, nunca como fuente de verdad del estado documental.
    

## 3. Modelo de datos

## `documents`

Documento maestro con estado actual, puntero a versión activa y control de lifecycle.

ts

`export interface DocumentAsset {   assetId: string;  assetRef: string;  tenantId: string;  title: string;  description?: string;  status: 'active' | 'deleted_pending_retention' | 'purged';  currentVersionId: string;  latestHash: string;  storageProvider: 'cloudinary';  storageRefCurrent: string;  retentionClass: string;  sensitivityLevel: 'low' | 'medium' | 'high' | 'restricted';  legalHold: boolean;  createdAt: Date;  updatedAt: Date;  deletedAt?: Date;  deletedBy?: string;  purgeAt?: Date; }`

## `document_versions`

Historial inmutable de versiones.

ts

`export interface DocumentVersion {   versionId: string;  tenantId: string;  assetId: string;  versionNumber: number;  hash: string;  checksumAlgorithm: 'SHA-256';  storageRef: string;  mimeType: string;  sizeBytes: number;  createdBy: string;  createdAt: Date;  isCurrent: boolean;  supersedesVersionId?: string;  deletedAt?: Date; }`

## `document_events`

Log de eventos para auditoría y reconstrucción de estado.

ts

`export interface DocumentEvent {   eventId: string;  tenantId: string;  assetId: string;  versionId?: string;  type:    | 'DOCUMENT_CREATED'    | 'DOCUMENT_VERSION_CREATED'    | 'DOCUMENT_METADATA_UPDATED'    | 'DOCUMENT_LOGICAL_DELETED'    | 'DOCUMENT_PURGED'    | 'DOCUMENT_RESTORED'    | 'LEGAL_HOLD_APPLIED'    | 'LEGAL_HOLD_RELEASED'    | 'UPLOAD_FAILED'    | 'STORAGE_MIGRATED';  actorId: string;  correlationId: string;  payload: Record<string, unknown>;  createdAt: Date; }`

## `legal_holds`

Bloqueos legales explícitos.

ts

`export interface LegalHold {   holdId: string;  tenantId: string;  assetId: string;  reason: string;  status: 'active' | 'released';  createdBy: string;  createdAt: Date;  releasedAt?: Date; }`

## `asset_space_links`

Relación lógica entre assets y espacios.

ts

`export interface AssetSpaceLink {   linkId: string;  tenantId: string;  assetId: string;  spaceId: string;  spacePath: string;  isPrimary: boolean;  createdAt: Date;  createdBy?: string; }`

## 4. Diagrama lógico

text

`TENANTS   |  +--> DOCUMENTS (1)          |          +--> DOCUMENT_VERSIONS (N)          |          +--> DOCUMENT_EVENTS (N)          |          +--> LEGAL_HOLDS (0..N)          |          +--> ASSET_SPACE_LINKS (N) STORAGE CONNECTOR   |  +--> CLOUDINARY ASSET / DERIVED URL`

Y más detallado:

text

`[tenantId]    |   +-- documents --------------------+   |   assetId                       |   |   assetRef                      |   |   currentVersionId --------+    |   |   legalHold                |    |   +----------------------------|----+                                |                                v                     document_versions (append-only)                                |                                v                       document_events (append-only)    +-- legal_holds (block purge/update)   +-- asset_space_links (logical placement)   +-- storage_connectors (cloudinary)`

## 5. `assetRef`

`assetRef` debe ser un identificador lógico estable, por ejemplo:

text

`files:{tenantId}:{assetId}:{currentVersion}`

O una variante serializada equivalente. No debe depender del `storageRef` físico ni del path del bucket. Su objetivo es que todo el ecosistema opere sobre la misma referencia aunque el binario cambie de proveedor o ubicación.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZNUQBW2&Signature=WoefcV6hy6kCr5yMC0V8DGkdsQg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGwDltT7OGU0VlQvBN9wrDLWV5%2BvqP%2BUfDftbaTRgqoIAiAubsDi%2BZDh85fJcHyIIToxLhv2VxT8vMaPv%2F%2FCTSZjeSrzBAhYEAEaDDY5OTc1MzMwOTcwNSIMjv36bbjrtV6RduT2KtAE0gZbGDdBMaT5GdBhGH5vNj0oS%2FzfdWcrt4VQrF2B%2BGJAxjR8ufbWfRBPRwg61uf8R7KYfyRw%2BRPvNstHQ6%2FiCUKSXA06%2FzH1Wurf5tmfRYBKb%2FVnwJpLG33eOPyF9m667tBIcozKEXI6gxL87U9ul2%2F4dKXVFnUZ%2FOC0QFeBKwa47bv4jTy40r9zKCz7vM0heCXNtlhUQHoOxl76LnyN7JWSVW1piQZA9Yk4oeWQGBvsI09h82zOs77dVffJqjmXA909dx3obFQz4FblgJfC19wGV2qvtL%2BB256ISKMqzlCRlg4WmcYvmGplhfG4ciERJQS4rWw%2FbmYe2ss%2FZ2%2Bn7uFubX2o7UcpDhCWaU6nrXPnRX2xiyDxRzllcvTkCNj68a6Ixl5vazKcjPgKOBcwEH7k%2FDx2G0dMXXqYzGE5SgawmaxRRET%2F0H%2Bln5ZgDuQzmmPrP6%2BDGKvNMyctGCkWkOdUQbYWd5C5UHlaEcQGvSam2ljbJVaUHN5bth5FGykd1cS9ErqMlwB9GOZ8GgktzIw8HESZCT6z278Muv4583Zd9fuWoFfTERBc6CAUEcq9I4avvqz41rQ1%2BcDAcvPj1eJvsXgNxei967U%2BxROpk%2Blfa8dtYwZefMRBtRhTPZL8eg0MMvnHxKJ4pKg%2BL0IWvLh64AMl5dktphtwghbzlXuiX46mHBj7yIs43ain7PRpdQJ5m9rLeFX7PQpEIXgkSOSzMG1VEu4Gjef9ZR3P%2B4UYKBrwCXxE4O%2BRpoontuWKmDw8aTusbgdRGmm3v4HFXDCipIbRBjqZAYkZxvq%2B9VI3aFD9rITmAjA3u9%2FYKviyJQB4%2F6DTebuDvVfR7hWcDE33yPpyHeYPpWiRtWKaQ24RrXcFVGYR%2FVknfAj6YJINn6BQs9Z79LNrQ005ZEL6rhtK08MoVEJK7GIaDJAL1cpidytAiuuPJltXnAQ4RAMD5R6vamFBnv8nxEh%2Bt5y%2FIgYrY7FYLQiexD85125qE5HDag%3D%3D&Expires=1780588533)[](https://cloudinary.com/documentation/delivery_url_signatures)

## 6. Inmutabilidad real

La inmutabilidad se implementa con tres reglas:

- No se actualiza una versión histórica.
    
- Cada cambio crea una nueva entrada en `document_versions`.
    
- El `documents.currentVersionId` cambia dentro de una transacción controlada.
    

Además, conviene tener una clave de idempotencia por operación para evitar duplicados ante reintentos o caídas parciales. MongoDB soporta transacciones, y para una operación de subida/versionado conviene usar transacción multi-documento cuando cambias `documents`, `document_versions` y `document_events` a la vez.

## 7. Sharding

## Estrategia recomendada

text

`shard key = { tenantId: 1, assetId: 1 }`

Eso favorece localización por tenant y evita que la mayoría de operaciones se conviertan en scatter-gather. MongoDB recomienda evitar consultas que no incluyan la shard key y procurar una distribución uniforme del tráfico.

## Cuándo activarlo

- cuando el volumen de un tenant empieza a dominar la carga;
    
- cuando la colección de `document_versions` crece demasiado;
    
- cuando el rendimiento de lecturas/escrituras por tenant se vuelve desigual.
    

## Riesgos

- hot shards si un tenant concentra demasiado tráfico;
    
- consultas de mantenimiento que cruzan todos los shards;
    
- necesidad de reintentos más robustos en el cliente y en los jobs.
    

## 8. Cloudinary y retención

Cloudinary debe tratarse como storage privado con delivery firmado. Las URLs firmadas y la autenticación de media son apropiadas para restringir acceso a binarios privados; aun así, el backend debe decidir cuándo emitirlas y por cuánto tiempo.

Para retención legal, el binario no debe eliminarse mientras exista legal hold. El estado de retención se decide en MongoDB, y Cloudinary solo ejecuta la remoción física cuando la política y el hold lo permiten.

## 9. Webhooks

ABDFiles debería emitir webhooks para:

- `document.created`
    
- `document.version.created`
    
- `document.deleted.logical`
    
- `document.deleted.purged`
    
- `document.legal_hold.applied`
    
- `document.legal_hold.released`
    
- `document.upload.failed`
    
- `document.storage.migrated`
    

Cada webhook debe ser idempotente. La clave es usar `eventId` o `correlationId` como clave única de procesamiento, guardar el evento recibido antes de ejecutar side effects y devolver 2xx si el evento ya fue procesado.

## 10. Migración entre storage providers

La migración debe ser una operación de dos fases:

1. copiar binario al destino;
    
2. validar hash y solo entonces conmutar `storageRefCurrent` y registrar evento `STORAGE_MIGRATED`.
    

Eso evita dejar el sistema en un estado mixto. Durante la migración, la versión anterior sigue viva hasta que la nueva queda verificada; después puedes actualizar la ruta activa y, si todo está bien, retirar la copia antigua en un cleanup posterior.

## 11. Pseudocódigo

## `uploadDocument()`

ts

`async function uploadDocument(input) {   const key = input.idempotencyKey ?? crypto.randomUUID();   await beginTransaction();   if (await existsProcessedCommand(key)) return await getResult(key);   assertTenantAccess(input.tenantId, input.actorId);  assertQuota(input.tenantId, input.file.size);   const hash = await sha256(input.file);  const storage = await cloudinaryUploadSigned(input.file, input.tenantId);   const asset = await upsertDocumentAsset({    tenantId: input.tenantId,    title: input.title,    retentionClass: input.retentionClass,    sensitivityLevel: input.sensitivityLevel,    latestHash: hash,    storageProvider: 'cloudinary',    storageRefCurrent: storage.storageRef,    status: 'active'  });   const nextVersionNumber = await getNextVersionNumber(asset.assetId);   const version = await insertDocumentVersion({    assetId: asset.assetId,    tenantId: input.tenantId,    versionNumber: nextVersionNumber,    hash,    checksumAlgorithm: 'SHA-256',    storageRef: storage.storageRef,    mimeType: input.mimeType,    sizeBytes: input.file.size,    createdBy: input.actorId,    isCurrent: true  });   await markPreviousVersionsNotCurrent(asset.assetId, version.versionId);   await updateDocumentCurrentVersion(asset.assetId, version.versionId, hash);   await insertDocumentEvent({    tenantId: input.tenantId,    assetId: asset.assetId,    versionId: version.versionId,    type: 'DOCUMENT_VERSION_CREATED',    actorId: input.actorId,    correlationId: input.correlationId,    payload: { storageRef: storage.storageRef, hash }  });   await linkSpaces(asset.assetId, input.spaceIds, input.actorId);  await storeProcessedCommand(key, asset.assetRef, version.versionId);   await commitTransaction();   return { assetRef: asset.assetRef, assetId: asset.assetId, versionId: version.versionId }; }`

## `createNewVersion()`

ts

`async function createNewVersion(input) {   await beginTransaction();   const asset = await getDocumentAsset(input.assetId);  assertNotDeleted(asset);  assertNoLegalHoldBlocking(asset);   const hash = await sha256(input.file);  const storage = await cloudinaryUploadSigned(input.file, input.tenantId);   const versionNumber = asset.latestVersionNumber + 1;   const version = await insertDocumentVersion({    assetId: asset.assetId,    tenantId: input.tenantId,    versionNumber,    hash,    checksumAlgorithm: 'SHA-256',    storageRef: storage.storageRef,    mimeType: input.mimeType,    sizeBytes: input.file.size,    createdBy: input.actorId,    isCurrent: true,    supersedesVersionId: asset.currentVersionId  });   await markPreviousVersionsNotCurrent(asset.assetId, version.versionId);  await updateDocumentCurrentVersion(asset.assetId, version.versionId, hash);   await insertDocumentEvent({    tenantId: input.tenantId,    assetId: asset.assetId,    versionId: version.versionId,    type: 'DOCUMENT_VERSION_CREATED',    actorId: input.actorId,    correlationId: input.correlationId,    payload: { previousVersionId: asset.currentVersionId }  });   await commitTransaction();  return version; }`

## `logicalDeleteDocument()`

ts

`async function logicalDeleteDocument(input) {   await beginTransaction();   const asset = await getDocumentAsset(input.assetId);  assertTenantAccess(input.tenantId, input.actorId);  assertNotLegalHold(asset);   const purgeAt = computePurgeAt(asset.retentionClass, input.now);   await setDocumentDeleted({    assetId: asset.assetId,    tenantId: input.tenantId,    status: 'deleted_pending_retention',    deletedAt: input.now,    deletedBy: input.actorId,    purgeAt  });   await revokePublicLinks(asset.assetId);  await invalidateSignedUrls(asset.assetId);   await insertDocumentEvent({    tenantId: input.tenantId,    assetId: asset.assetId,    type: 'DOCUMENT_LOGICAL_DELETED',    actorId: input.actorId,    correlationId: input.correlationId,    payload: { purgeAt }  });   await scheduleDeletionJob({    tenantId: input.tenantId,    assetId: asset.assetId,    purgeAt,    reason: 'retention'  });   await commitTransaction(); }`

## 12. Borrado seguro

El borrado no debe ser inmediato salvo obligación legal. El patrón sano es:

1. borrado lógico;
    
2. revocación de acceso;
    
3. espera por retención;
    
4. comprobación de legal hold;
    
5. purga física;
    
6. evento de cierre.
    

Si falla la purga física, el sistema debe reintentar sin reactivar el documento. El estado debe permanecer en `deleted_pending_retention` hasta completar el cleanup.

## 13. Auditoría y trazabilidad

La auditoría debe seguir un patrón append-only basado en eventos. Eso te permite reconstruir el estado del documento en cualquier punto temporal, auditar accesos, y emitir notificaciones externas por webhook sin depender del modelo de lectura.

## 14. Resumen operativo

- MongoDB guarda metadatos, versiones, holds y eventos.
    
- Cloudinary guarda el binario.
    
- `assetRef` es el contrato estable.
    
- Versionado = append-only.
    
- Borrado = lógico primero, físico después.
    
- Sharding = por `tenantId` cuando la escala lo pida.
    
- Webhooks = idempotentes.
    
- Migración = copia + validación + corte.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZNUQBW2&Signature=WoefcV6hy6kCr5yMC0V8DGkdsQg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGwDltT7OGU0VlQvBN9wrDLWV5%2BvqP%2BUfDftbaTRgqoIAiAubsDi%2BZDh85fJcHyIIToxLhv2VxT8vMaPv%2F%2FCTSZjeSrzBAhYEAEaDDY5OTc1MzMwOTcwNSIMjv36bbjrtV6RduT2KtAE0gZbGDdBMaT5GdBhGH5vNj0oS%2FzfdWcrt4VQrF2B%2BGJAxjR8ufbWfRBPRwg61uf8R7KYfyRw%2BRPvNstHQ6%2FiCUKSXA06%2FzH1Wurf5tmfRYBKb%2FVnwJpLG33eOPyF9m667tBIcozKEXI6gxL87U9ul2%2F4dKXVFnUZ%2FOC0QFeBKwa47bv4jTy40r9zKCz7vM0heCXNtlhUQHoOxl76LnyN7JWSVW1piQZA9Yk4oeWQGBvsI09h82zOs77dVffJqjmXA909dx3obFQz4FblgJfC19wGV2qvtL%2BB256ISKMqzlCRlg4WmcYvmGplhfG4ciERJQS4rWw%2FbmYe2ss%2FZ2%2Bn7uFubX2o7UcpDhCWaU6nrXPnRX2xiyDxRzllcvTkCNj68a6Ixl5vazKcjPgKOBcwEH7k%2FDx2G0dMXXqYzGE5SgawmaxRRET%2F0H%2Bln5ZgDuQzmmPrP6%2BDGKvNMyctGCkWkOdUQbYWd5C5UHlaEcQGvSam2ljbJVaUHN5bth5FGykd1cS9ErqMlwB9GOZ8GgktzIw8HESZCT6z278Muv4583Zd9fuWoFfTERBc6CAUEcq9I4avvqz41rQ1%2BcDAcvPj1eJvsXgNxei967U%2BxROpk%2Blfa8dtYwZefMRBtRhTPZL8eg0MMvnHxKJ4pKg%2BL0IWvLh64AMl5dktphtwghbzlXuiX46mHBj7yIs43ain7PRpdQJ5m9rLeFX7PQpEIXgkSOSzMG1VEu4Gjef9ZR3P%2B4UYKBrwCXxE4O%2BRpoontuWKmDw8aTusbgdRGmm3v4HFXDCipIbRBjqZAYkZxvq%2B9VI3aFD9rITmAjA3u9%2FYKviyJQB4%2F6DTebuDvVfR7hWcDE33yPpyHeYPpWiRtWKaQ24RrXcFVGYR%2FVknfAj6YJINn6BQs9Z79LNrQ005ZEL6rhtK08MoVEJK7GIaDJAL1cpidytAiuuPJltXnAQ4RAMD5R6vamFBnv8nxEh%2Bt5y%2FIgYrY7FYLQiexD85125qE5HDag%3D%3D&Expires=1780588533)
    

Si quieres, el siguiente paso útil es que te lo convierta en un **documento formal listo para pegar en la spec**, con numeración, tablas y bloques de código ya ordenados como sección 1–12.

___________________________

te dejo el bloque ya en formato de **especificación formal** para pegar en la spec de ABDFiles. Incluye numeración, tablas y pseudocódigo, y cubre auditoría, migración de storage, roles en API, webhooks e índices por `tenantId`.

## 1. Objetivo

ABDFiles (`files.abdia.es`) será el satélite documental de ABDSuite responsable de la ingesta, versionado, entrega, auditoría, retención y borrado de documentos multi-tenant. El sistema usará Cloudinary como almacenamiento físico inicial y MongoDB como base de metadatos, historial, retención, permisos y auditoría.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5KD3ZY&Signature=G1x%2FNuQ9%2FE0COx6jFV24RtvJsDE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDXepibztOwhu5Cyr4kyJtyaH79gRIyFwR36N%2FqmXVn3gIgUL1jLOK8pTRES8B8vuGrJEJ%2FdEpLk9xH4R8o8JSHZqsq8wQIWBABGgw2OTk3NTMzMDk3MDUiDDh5gav7RKjXwtcXuirQBLD3Rxc3vsDHklX0x63uB7XTjnpKcjo1oIHWDy0%2B9YXuhggjCsBGrSG0llr9ElHx%2F6s%2Brf3AYWKNyoAZUfc5eQdqqaHh53afnbZj1QAMRxTsdMXZOGOIhLhTTYKooXhbk7%2BrrEIGkzhklaiZcl5ttpsbn0ob2M01V9dqZbDUr9NFpLItWkoVRdQB6296k2JpyDW3XJtWQzl5OpvJ2KuT78Gvl3WkaKBcGqrOXBvGzV4BpnYShOx3TFLjE97BLg%2B4dx%2Bj3jbNWUXBqQjTMq3kKOw%2FjJblj41h%2FP16S5e0zbpYra3LP0F4E33u00hWApN7Uu0FGLiOHLMQTZsLYxaHMqEUOQjCCGlfs3QIbSKFNELcZ7CGAZIcYY3v1%2FN5hb1ATQ%2F4tMIH0pItmiz6cm5YJCH5LA3a3s8mdHsgObqK4UoRJHSdiD%2FXXMcOBfjUwLa1EtPIXky4b5D79DTB64hPaC9JLQKs27jeeSwnX8CVgCOlbERjhsKrBN2QDJLXNavCE7AzY3TzXBA1hY1nIjErcz%2FObhGU1848v%2FjtQkTeJNEGLzOkx%2FnJtgVJLjcKQIQkKYvdemv2HgUjHHuRREzsuJNayOoy0uiJnvkaZdLXVfLALnYyWJPm6M55iJxZD21j%2FnOBBaK14FpvjM9wXGQ1raajusdXuj3RLV8IcMAgwsyYn7cn3LsRtFING%2F4lNO%2Fw5II%2FPoWq6UUESeHETqsLWbyOS9eWaiif38uF%2FWxd4zSyOnFklyy6UL75a%2BpBlwzDWDUFjdNSjGqe9Y39oxGfkrUw%2Bq2G0QY6mAHsWOgj%2Bwd7KwZHI%2BrwxAt%2Bi%2FjyNL3Em8Fc%2BBMRKMF%2FQL%2FBdZYcRT4nQ%2FPXNisHQ4eIXOmQYwBs87K21LjuDUHZgbMoALeCIMK5ChbJ%2BgZHH8Nwd6U9EA9uL6SeLK2VXPl4NsV95k3ojO%2Fg84teybFp5hEjzEneb7bOajMpBvp2or7dCRmVcOzTWAWHWwE7KY8f0eYN9HKbsQ%3D%3D&Expires=1780589773)

La arquitectura debe garantizar inmutabilidad por versión, separación entre identidad lógica y ubicación física, trazabilidad completa y capacidad de migrar el storage sin afectar a los consumidores del contrato `assetRef`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5KD3ZY&Signature=G1x%2FNuQ9%2FE0COx6jFV24RtvJsDE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDXepibztOwhu5Cyr4kyJtyaH79gRIyFwR36N%2FqmXVn3gIgUL1jLOK8pTRES8B8vuGrJEJ%2FdEpLk9xH4R8o8JSHZqsq8wQIWBABGgw2OTk3NTMzMDk3MDUiDDh5gav7RKjXwtcXuirQBLD3Rxc3vsDHklX0x63uB7XTjnpKcjo1oIHWDy0%2B9YXuhggjCsBGrSG0llr9ElHx%2F6s%2Brf3AYWKNyoAZUfc5eQdqqaHh53afnbZj1QAMRxTsdMXZOGOIhLhTTYKooXhbk7%2BrrEIGkzhklaiZcl5ttpsbn0ob2M01V9dqZbDUr9NFpLItWkoVRdQB6296k2JpyDW3XJtWQzl5OpvJ2KuT78Gvl3WkaKBcGqrOXBvGzV4BpnYShOx3TFLjE97BLg%2B4dx%2Bj3jbNWUXBqQjTMq3kKOw%2FjJblj41h%2FP16S5e0zbpYra3LP0F4E33u00hWApN7Uu0FGLiOHLMQTZsLYxaHMqEUOQjCCGlfs3QIbSKFNELcZ7CGAZIcYY3v1%2FN5hb1ATQ%2F4tMIH0pItmiz6cm5YJCH5LA3a3s8mdHsgObqK4UoRJHSdiD%2FXXMcOBfjUwLa1EtPIXky4b5D79DTB64hPaC9JLQKs27jeeSwnX8CVgCOlbERjhsKrBN2QDJLXNavCE7AzY3TzXBA1hY1nIjErcz%2FObhGU1848v%2FjtQkTeJNEGLzOkx%2FnJtgVJLjcKQIQkKYvdemv2HgUjHHuRREzsuJNayOoy0uiJnvkaZdLXVfLALnYyWJPm6M55iJxZD21j%2FnOBBaK14FpvjM9wXGQ1raajusdXuj3RLV8IcMAgwsyYn7cn3LsRtFING%2F4lNO%2Fw5II%2FPoWq6UUESeHETqsLWbyOS9eWaiif38uF%2FWxd4zSyOnFklyy6UL75a%2BpBlwzDWDUFjdNSjGqe9Y39oxGfkrUw%2Bq2G0QY6mAHsWOgj%2Bwd7KwZHI%2BrwxAt%2Bi%2FjyNL3Em8Fc%2BBMRKMF%2FQL%2FBdZYcRT4nQ%2FPXNisHQ4eIXOmQYwBs87K21LjuDUHZgbMoALeCIMK5ChbJ%2BgZHH8Nwd6U9EA9uL6SeLK2VXPl4NsV95k3ojO%2Fg84teybFp5hEjzEneb7bOajMpBvp2or7dCRmVcOzTWAWHWwE7KY8f0eYN9HKbsQ%3D%3D&Expires=1780589773)

## 2. Principios

|Principio|Regla|
|---|---|
|Inmutabilidad|Ninguna versión histórica se sobrescribe.|
|Multi-tenancy|Toda entidad relevante incluye `tenantId` y se indexa por tenant.|
|Trazabilidad|Toda operación sensible genera un evento append-only.|
|Retención legal|Legal holds bloquean borrado, purga y migración destructiva.|
|Storage desacoplado|Cloudinary es una implementación física, no la fuente de verdad.|

## 3. Colecciones

## 3.1 `documents`

Guarda el estado maestro del asset documental.

|Campo|Tipo|Descripción|
|---|---|---|
|`assetId`|string|Identificador interno del asset.|
|`assetRef`|string|Contrato lógico estable consumido por otros satélites. [](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5KD3ZY&Signature=G1x%2FNuQ9%2FE0COx6jFV24RtvJsDE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDXepibztOwhu5Cyr4kyJtyaH79gRIyFwR36N%2FqmXVn3gIgUL1jLOK8pTRES8B8vuGrJEJ%2FdEpLk9xH4R8o8JSHZqsq8wQIWBABGgw2OTk3NTMzMDk3MDUiDDh5gav7RKjXwtcXuirQBLD3Rxc3vsDHklX0x63uB7XTjnpKcjo1oIHWDy0%2B9YXuhggjCsBGrSG0llr9ElHx%2F6s%2Brf3AYWKNyoAZUfc5eQdqqaHh53afnbZj1QAMRxTsdMXZOGOIhLhTTYKooXhbk7%2BrrEIGkzhklaiZcl5ttpsbn0ob2M01V9dqZbDUr9NFpLItWkoVRdQB6296k2JpyDW3XJtWQzl5OpvJ2KuT78Gvl3WkaKBcGqrOXBvGzV4BpnYShOx3TFLjE97BLg%2B4dx%2Bj3jbNWUXBqQjTMq3kKOw%2FjJblj41h%2FP16S5e0zbpYra3LP0F4E33u00hWApN7Uu0FGLiOHLMQTZsLYxaHMqEUOQjCCGlfs3QIbSKFNELcZ7CGAZIcYY3v1%2FN5hb1ATQ%2F4tMIH0pItmiz6cm5YJCH5LA3a3s8mdHsgObqK4UoRJHSdiD%2FXXMcOBfjUwLa1EtPIXky4b5D79DTB64hPaC9JLQKs27jeeSwnX8CVgCOlbERjhsKrBN2QDJLXNavCE7AzY3TzXBA1hY1nIjErcz%2FObhGU1848v%2FjtQkTeJNEGLzOkx%2FnJtgVJLjcKQIQkKYvdemv2HgUjHHuRREzsuJNayOoy0uiJnvkaZdLXVfLALnYyWJPm6M55iJxZD21j%2FnOBBaK14FpvjM9wXGQ1raajusdXuj3RLV8IcMAgwsyYn7cn3LsRtFING%2F4lNO%2Fw5II%2FPoWq6UUESeHETqsLWbyOS9eWaiif38uF%2FWxd4zSyOnFklyy6UL75a%2BpBlwzDWDUFjdNSjGqe9Y39oxGfkrUw%2Bq2G0QY6mAHsWOgj%2Bwd7KwZHI%2BrwxAt%2Bi%2FjyNL3Em8Fc%2BBMRKMF%2FQL%2FBdZYcRT4nQ%2FPXNisHQ4eIXOmQYwBs87K21LjuDUHZgbMoALeCIMK5ChbJ%2BgZHH8Nwd6U9EA9uL6SeLK2VXPl4NsV95k3ojO%2Fg84teybFp5hEjzEneb7bOajMpBvp2or7dCRmVcOzTWAWHWwE7KY8f0eYN9HKbsQ%3D%3D&Expires=1780589773)|
|`tenantId`|string|Inquilino propietario.|
|`title`|string|Nombre funcional del documento.|
|`status`|enum|`active`, `deleted_pending_retention`, `purged`.|
|`currentVersionId`|string|Puntero a la versión vigente.|
|`latestHash`|string|Hash de la versión activa.|
|`storageProvider`|enum|`cloudinary` inicialmente.|
|`storageRefCurrent`|string|Referencia física activa.|
|`retentionClass`|string|Clase de retención aplicable.|
|`sensitivityLevel`|enum|`low`, `medium`, `high`, `restricted`.|
|`legalHold`|boolean|Bloqueo legal activo.|
|`deletedAt`|date?|Fecha de borrado lógico.|
|`purgeAt`|date?|Fecha planificada de purga.|

## 3.2 `document_versions`

Historial inmutable de versiones.

|Campo|Tipo|Descripción|
|---|---|---|
|`versionId`|string|Identificador de versión.|
|`tenantId`|string|Inquilino.|
|`assetId`|string|Documento al que pertenece.|
|`versionNumber`|number|Secuencia creciente.|
|`hash`|string|SHA-256 del binario.|
|`checksumAlgorithm`|string|`SHA-256`.|
|`storageRef`|string|Ruta física de esa versión.|
|`mimeType`|string|Tipo MIME.|
|`sizeBytes`|number|Tamaño del binario.|
|`createdBy`|string|Actor que generó la versión.|
|`createdAt`|date|Fecha de creación.|
|`isCurrent`|boolean|Indica si es la vigente.|
|`supersedesVersionId`|string?|Versión anterior sustituida.|
|`deletedAt`|date?|Solo si la versión fue marcada para limpieza administrativa.|

## 3.3 `document_events`

Auditoría por eventos.

|Campo|Tipo|Descripción|
|---|---|---|
|`eventId`|string|Identificador único del evento.|
|`tenantId`|string|Inquilino.|
|`assetId`|string|Asset afectado.|
|`versionId`|string?|Versión implicada.|
|`type`|enum|Tipo de evento.|
|`actorId`|string|Usuario o servicio responsable.|
|`correlationId`|string|Correlación extremo a extremo.|
|`payload`|object|Detalle del evento.|
|`createdAt`|date|Momento de ocurrencia.|

## 3.4 `legal_holds`

Bloqueos legales explícitos.

|Campo|Tipo|Descripción|
|---|---|---|
|`holdId`|string|Identificador del hold.|
|`tenantId`|string|Inquilino.|
|`assetId`|string|Documento bloqueado.|
|`reason`|string|Motivo legal.|
|`status`|enum|`active`, `released`.|
|`createdBy`|string|Actor que lo aplica.|
|`createdAt`|date|Inicio del hold.|
|`releasedAt`|date?|Fin del hold.|

## 3.5 `asset_space_links`

Relación entre assets y espacios lógicos.

|Campo|Tipo|Descripción|
|---|---|---|
|`linkId`|string|Identificador del vínculo.|
|`tenantId`|string|Inquilino.|
|`assetId`|string|Asset.|
|`spaceId`|string|Espacio lógico destino.|
|`spacePath`|string|Ruta denormalizada para lectura rápida.|
|`isPrimary`|boolean|Indica el espacio principal.|
|`createdAt`|date|Alta del vínculo.|
|`createdBy`|string?|Autor del vínculo.|

## 3.6 `storage_connectors`

Configuración del backend físico.

|Campo|Tipo|Descripción|
|---|---|---|
|`connectorId`|string|Identificador del conector.|
|`tenantId`|string|Inquilino.|
|`providerType`|enum|`cloudinary` o futuro `s3Compatible`.|
|`status`|enum|`active`, `inactive`.|
|`credentialsRef`|string|Referencia segura a credenciales.|
|`allowedScopes`|array|Operaciones permitidas.|
|`retentionPolicy`|object|Política aplicada.|
|`auditMode`|string|Modo de auditoría.|

## 4. Índices

|Colección|Índice|Objetivo|
|---|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|Búsqueda y unicidad por tenant.|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|Listados de activos recientes por tenant.|
|`documents`|`{ tenantId: 1, currentVersionId: 1 }`|Resolución rápida de versión activa. [](https://www.mongodb.com/docs/manual/applications/indexes/)|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|Secuencia inmutable por asset.|
|`document_versions`|`{ tenantId: 1, hash: 1 }`|Detección de duplicados por tenant. [](https://www.mongodb.com/docs/manual/applications/indexes/)|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|Auditoría cronológica por documento.|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|Trazado extremo a extremo.|
|`legal_holds`|`{ tenantId: 1, assetId: 1, status: 1 }`|Bloqueo legal por documento.|
|`asset_space_links`|`{ tenantId: 1, spaceId: 1, assetId: 1 }`|Navegación por espacios.|
|`deletion_jobs`|`{ tenantId: 1, purgeAt: 1 }`|Limpieza automática y retención. [](https://oneuptime.com/blog/post/2026-03-31-mongodb-implement-data-retention-policies-in-mongodb/view)|

## 5. `assetRef`

`assetRef` es el identificador lógico estable del documento y no debe depender del path físico de Cloudinary. La forma recomendada es una cadena resolvible como `files:{tenantId}:{assetId}:{versionNumber}`, aunque cualquier representación equivalente es válida mientras mantenga estabilidad y no exponga `storageRef`.[](https://cloudinary.com/documentation/delivery_url_signatures)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5KD3ZY&Signature=G1x%2FNuQ9%2FE0COx6jFV24RtvJsDE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDXepibztOwhu5Cyr4kyJtyaH79gRIyFwR36N%2FqmXVn3gIgUL1jLOK8pTRES8B8vuGrJEJ%2FdEpLk9xH4R8o8JSHZqsq8wQIWBABGgw2OTk3NTMzMDk3MDUiDDh5gav7RKjXwtcXuirQBLD3Rxc3vsDHklX0x63uB7XTjnpKcjo1oIHWDy0%2B9YXuhggjCsBGrSG0llr9ElHx%2F6s%2Brf3AYWKNyoAZUfc5eQdqqaHh53afnbZj1QAMRxTsdMXZOGOIhLhTTYKooXhbk7%2BrrEIGkzhklaiZcl5ttpsbn0ob2M01V9dqZbDUr9NFpLItWkoVRdQB6296k2JpyDW3XJtWQzl5OpvJ2KuT78Gvl3WkaKBcGqrOXBvGzV4BpnYShOx3TFLjE97BLg%2B4dx%2Bj3jbNWUXBqQjTMq3kKOw%2FjJblj41h%2FP16S5e0zbpYra3LP0F4E33u00hWApN7Uu0FGLiOHLMQTZsLYxaHMqEUOQjCCGlfs3QIbSKFNELcZ7CGAZIcYY3v1%2FN5hb1ATQ%2F4tMIH0pItmiz6cm5YJCH5LA3a3s8mdHsgObqK4UoRJHSdiD%2FXXMcOBfjUwLa1EtPIXky4b5D79DTB64hPaC9JLQKs27jeeSwnX8CVgCOlbERjhsKrBN2QDJLXNavCE7AzY3TzXBA1hY1nIjErcz%2FObhGU1848v%2FjtQkTeJNEGLzOkx%2FnJtgVJLjcKQIQkKYvdemv2HgUjHHuRREzsuJNayOoy0uiJnvkaZdLXVfLALnYyWJPm6M55iJxZD21j%2FnOBBaK14FpvjM9wXGQ1raajusdXuj3RLV8IcMAgwsyYn7cn3LsRtFING%2F4lNO%2Fw5II%2FPoWq6UUESeHETqsLWbyOS9eWaiif38uF%2FWxd4zSyOnFklyy6UL75a%2BpBlwzDWDUFjdNSjGqe9Y39oxGfkrUw%2Bq2G0QY6mAHsWOgj%2Bwd7KwZHI%2BrwxAt%2Bi%2FjyNL3Em8Fc%2BBMRKMF%2FQL%2FBdZYcRT4nQ%2FPXNisHQ4eIXOmQYwBs87K21LjuDUHZgbMoALeCIMK5ChbJ%2BgZHH8Nwd6U9EA9uL6SeLK2VXPl4NsV95k3ojO%2Fg84teybFp5hEjzEneb7bOajMpBvp2or7dCRmVcOzTWAWHWwE7KY8f0eYN9HKbsQ%3D%3D&Expires=1780589773)

## 6. Roles y permisos

## 6.1 Roles operativos

|Rol|Permisos|
|---|---|
|`FILE_VIEWER`|Ver metadatos y descargar versiones autorizadas.|
|`FILE_EDITOR`|Subir nuevas versiones y editar metadatos no protegidos.|
|`FILE_ADMIN`|Gestionar conectores, retención, holds y borrado lógico.|
|`FILE_AUDITOR`|Leer eventos y trazabilidad, sin mutar datos.|

## 6.2 Reglas de autorización

Toda decisión sensible debe validarse en backend con ABDAuth y claims firmados; la UI solo refleja permisos, no los sustituye. El middleware debe validar `tenantId`, `roles`, `scopes` y correspondencia entre subdominio y tenant del JWT.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYESH5KD3ZY&Signature=G1x%2FNuQ9%2FE0COx6jFV24RtvJsDE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDXepibztOwhu5Cyr4kyJtyaH79gRIyFwR36N%2FqmXVn3gIgUL1jLOK8pTRES8B8vuGrJEJ%2FdEpLk9xH4R8o8JSHZqsq8wQIWBABGgw2OTk3NTMzMDk3MDUiDDh5gav7RKjXwtcXuirQBLD3Rxc3vsDHklX0x63uB7XTjnpKcjo1oIHWDy0%2B9YXuhggjCsBGrSG0llr9ElHx%2F6s%2Brf3AYWKNyoAZUfc5eQdqqaHh53afnbZj1QAMRxTsdMXZOGOIhLhTTYKooXhbk7%2BrrEIGkzhklaiZcl5ttpsbn0ob2M01V9dqZbDUr9NFpLItWkoVRdQB6296k2JpyDW3XJtWQzl5OpvJ2KuT78Gvl3WkaKBcGqrOXBvGzV4BpnYShOx3TFLjE97BLg%2B4dx%2Bj3jbNWUXBqQjTMq3kKOw%2FjJblj41h%2FP16S5e0zbpYra3LP0F4E33u00hWApN7Uu0FGLiOHLMQTZsLYxaHMqEUOQjCCGlfs3QIbSKFNELcZ7CGAZIcYY3v1%2FN5hb1ATQ%2F4tMIH0pItmiz6cm5YJCH5LA3a3s8mdHsgObqK4UoRJHSdiD%2FXXMcOBfjUwLa1EtPIXky4b5D79DTB64hPaC9JLQKs27jeeSwnX8CVgCOlbERjhsKrBN2QDJLXNavCE7AzY3TzXBA1hY1nIjErcz%2FObhGU1848v%2FjtQkTeJNEGLzOkx%2FnJtgVJLjcKQIQkKYvdemv2HgUjHHuRREzsuJNayOoy0uiJnvkaZdLXVfLALnYyWJPm6M55iJxZD21j%2FnOBBaK14FpvjM9wXGQ1raajusdXuj3RLV8IcMAgwsyYn7cn3LsRtFING%2F4lNO%2Fw5II%2FPoWq6UUESeHETqsLWbyOS9eWaiif38uF%2FWxd4zSyOnFklyy6UL75a%2BpBlwzDWDUFjdNSjGqe9Y39oxGfkrUw%2Bq2G0QY6mAHsWOgj%2Bwd7KwZHI%2BrwxAt%2Bi%2FjyNL3Em8Fc%2BBMRKMF%2FQL%2FBdZYcRT4nQ%2FPXNisHQ4eIXOmQYwBs87K21LjuDUHZgbMoALeCIMK5ChbJ%2BgZHH8Nwd6U9EA9uL6SeLK2VXPl4NsV95k3ojO%2Fg84teybFp5hEjzEneb7bOajMpBvp2or7dCRmVcOzTWAWHWwE7KY8f0eYN9HKbsQ%3D%3D&Expires=1780589773)

## 7. Inmutabilidad

La inmutabilidad real se implementa con un patrón append-only y transacciones multi-documento. La versión antigua nunca cambia; la nueva versión se inserta, el puntero maestro se actualiza y el evento se registra en la misma unidad lógica de operación.

Reglas:

1. Nunca hacer `update` sobre `document_versions` históricas.
    
2. Crear una nueva versión para cualquier cambio material.
    
3. Marcar versiones previas como `isCurrent = false`.
    
4. Mantener `document_events` como stream append-only.
    

## 8. Pseudocódigo

## 8.1 `uploadDocument()`

ts

`async function uploadDocument(input) {   const commandId = input.idempotencyKey ?? crypto.randomUUID();   if (await processedCommandExists(commandId)) {    return await getProcessedResult(commandId);  }   await beginTransaction();   assertTenantAccess(input.tenantId, input.actorId);  assertUploadQuota(input.tenantId, input.file.size);   const hash = await sha256(input.file);  const uploaded = await uploadToCloudinarySigned(input.file, input.tenantId);   const asset = await createDocumentAsset({    tenantId: input.tenantId,    title: input.title,    retentionClass: input.retentionClass,    sensitivityLevel: input.sensitivityLevel,    latestHash: hash,    storageProvider: 'cloudinary',    storageRefCurrent: uploaded.storageRef,    status: 'active'  });   const versionNumber = await nextVersionNumber(asset.assetId);   const version = await createDocumentVersion({    assetId: asset.assetId,    tenantId: input.tenantId,    versionNumber,    hash,    checksumAlgorithm: 'SHA-256',    storageRef: uploaded.storageRef,    mimeType: input.mimeType,    sizeBytes: input.file.size,    createdBy: input.actorId,    isCurrent: true  });   await demotePreviousVersions(asset.assetId, version.versionId);  await updateCurrentAssetPointer(asset.assetId, version.versionId, hash);  await writeEvent('DOCUMENT_VERSION_CREATED', asset.assetId, version.versionId, input);  await linkSpaces(asset.assetId, input.spaceIds, input.actorId);   await storeProcessedCommand(commandId, {    assetRef: asset.assetRef,    assetId: asset.assetId,    versionId: version.versionId  });   await commitTransaction();  return { assetRef: asset.assetRef, assetId: asset.assetId, versionId: version.versionId }; }`

## 8.2 `createNewVersion()`

ts

`async function createNewVersion(input) {   await beginTransaction();   const asset = await getDocumentAsset(input.assetId);  assertTenantAccess(input.tenantId, input.actorId);  assertNotPurged(asset);  assertNoActiveLegalHold(asset);   const hash = await sha256(input.file);  const uploaded = await uploadToCloudinarySigned(input.file, input.tenantId);   const versionNumber = asset.latestVersionNumber + 1;   const version = await createDocumentVersion({    assetId: asset.assetId,    tenantId: input.tenantId,    versionNumber,    hash,    checksumAlgorithm: 'SHA-256',    storageRef: uploaded.storageRef,    mimeType: input.mimeType,    sizeBytes: input.file.size,    createdBy: input.actorId,    isCurrent: true,    supersedesVersionId: asset.currentVersionId  });   await demotePreviousVersions(asset.assetId, version.versionId);  await updateCurrentAssetPointer(asset.assetId, version.versionId, hash);  await writeEvent('DOCUMENT_VERSION_CREATED', asset.assetId, version.versionId, input);   await commitTransaction();  return version; }`

## 8.3 `logicalDeleteDocument()`

ts

`async function logicalDeleteDocument(input) {   await beginTransaction();   const asset = await getDocumentAsset(input.assetId);  assertTenantAccess(input.tenantId, input.actorId);  assertNoActiveLegalHold(asset);   const purgeAt = computePurgeAt(asset.retentionClass, input.now);   await markDocumentDeleted({    assetId: asset.assetId,    tenantId: input.tenantId,    status: 'deleted_pending_retention',    deletedAt: input.now,    deletedBy: input.actorId,    purgeAt  });   await revokeAllSignedUrls(asset.assetId);  await writeEvent('DOCUMENT_LOGICAL_DELETED', asset.assetId, undefined, {    ...input,    purgeAt  });   await scheduleDeletionJob({    tenantId: input.tenantId,    assetId: asset.assetId,    purgeAt  });   await commitTransaction(); }`

## 9. Webhooks

ABDFiles deberá emitir webhooks firmados para cambios relevantes. Los eventos deben ser idempotentes y reintentables con el mismo identificador.

|Evento|Disparo|
|---|---|
|`document.created`|Se crea el asset maestro.|
|`document.version.created`|Se añade una versión nueva.|
|`document.deleted.logical`|Se marca borrado lógico.|
|`document.deleted.purged`|Se elimina físicamente el binario.|
|`document.legal_hold.applied`|Se activa el hold.|
|`document.legal_hold.released`|Se libera el hold.|
|`document.storage.migrated`|Se conmuta el proveedor físico.|
|`document.upload.failed`|Falla la ingesta.|

## Payload base

json

`{   "eventId": "uuid",  "tenantId": "tenant-123",  "assetId": "asset-456",  "assetRef": "files:tenant-123:asset-456:7",  "type": "document.version.created",  "correlationId": "corr-789",  "createdAt": "2026-06-04T17:21:00Z",  "data": {} }`

## 10. Migración de Cloudinary

La migración futura hacia un storage S3-compatible debe hacerse en dos fases: copiar primero, validar después, conmutar al final. Cloudinary ya contempla guías de migración y conservación de metadatos; por tanto, el satélite debe mantener `storageRef` por versión para permitir una transición sin pérdida de historia.

Regla:

1. se copia el binario y metadatos;
    
2. se valida hash;
    
3. se registra evento `STORAGE_MIGRATED`;
    
4. se actualiza la referencia activa;
    
5. se pospone la limpieza del origen hasta confirmar estabilidad.
    

## 11. Índices y rendimiento

Para consultas por `tenantId`, el diseño debe favorecer igualdad, orden y rangos frecuentes. MongoDB recomienda indexar según patrones reales de consulta y mantener los índices alineados con `tenantId`, filtros habituales y ordenaciones críticas.

Prácticas clave:

- un índice compuesto por `tenantId` primero;
    
- evitar sobreindexación;
    
- usar índices parciales para estados activos;
    
- revisar índices no usados regularmente;
    
- incluir la shard key en índices de colecciones shardizadas.
    

## 12. Retención y borrado

El borrado en ABDFiles será siempre lógico primero. Si hay `legalHold = true`, no se puede purgar, ni aunque la retención estándar haya expirado; solo un cambio explícito de estado permite seguir el ciclo.

La purga automática se ejecutará por jobs programados, aplicando el ciclo: `active` → `deleted_pending_retention` → `purged`, con eventos auditables en cada transición.

## 13. Cierre operativo

ABDFiles debe operar como un sistema documental con verdad transaccional en MongoDB, delivery privado en Cloudinary, control de acceso por ABDAuth, eventos append-only y una migración futura preparada para storage S3-compatible. La base del diseño es simple: identidad lógica estable, versiones inmutables, webhooks idempotentes, auditoría inmutable y retención legal bloqueante.

______________________

Aquí tienes el bloque listo para pegar en la spec de **ABDFiles**. Está orientado a operación real: purging automático, webhooks, RBAC granular y disaster recovery del metadato en MongoDB.

## 1. Purging automático

ABDFiles ejecutará un proceso periódico de limpieza para documentos que ya no tengan `Legal Hold` activo y cuya retención haya expirado. El purging físico nunca será inmediato por defecto; primero se aplicará borrado lógico, y solo después el job de retención eliminará versiones y binarios cuando la política lo permita.

|Estado|Acción|Condición|
|---|---|---|
|`active`|Sin cambios|Documento operativo.|
|`deleted_pending_retention`|Espera purga|Borrado lógico realizado, retención aún vigente.|
|`purge_due`|Elegible para eliminación física|Retención vencida y sin legal hold.|
|`purged`|Eliminado|Binario borrado y metadato cerrado.|

## Reglas de purging

1. Si `legalHold = true`, el documento no puede purgarse.
    
2. Si existe retención activa, el binario se conserva hasta `purgeAt`.
    
3. Si el job de purga falla, el documento permanece en `deleted_pending_retention` y se reintenta con backoff.
    
4. Toda purga exitosa genera un evento `DOCUMENT_PURGED` y un webhook firmado.
    

## Pseudocódigo

ts

`async function purgeExpiredDocuments(now: Date) {   const candidates = await findDocuments({    status: 'deleted_pending_retention',    purgeAt: { $lte: now },    legalHold: false  });   for (const doc of candidates) {    try {      await beginTransaction();      await deleteCloudinaryAsset(doc.storageRefCurrent);      await markDocumentPurged(doc.assetId, now);      await writeEvent('DOCUMENT_PURGED', doc.assetId, undefined, { now });      await commitTransaction();      await emitWebhook('document.deleted.purged', doc);    } catch (err) {      await rollbackTransaction();      await scheduleRetry(doc.assetId);    }  } }`

## 2. Webhooks de estado

ABDFiles emitirá webhooks firmados para todo cambio relevante de estado documental. El diseño debe ser idempotente, tolerante a reintentos y seguro ante duplicados, usando un `eventId` estable y una tabla de deduplicación o `processed_webhook_events`.

|Evento|Cuándo se emite|
|---|---|
|`document.created`|Alta del asset maestro.|
|`document.version.created`|Nueva versión inmutable creada.|
|`document.deleted.logical`|Documento marcado para retención/purga.|
|`document.deleted.purged`|Binario físicamente eliminado.|
|`document.legal_hold.applied`|Se activa un hold.|
|`document.legal_hold.released`|Se libera el hold.|
|`document.storage.migrated`|Cambio de proveedor físico.|
|`document.upload.failed`|Fallo de subida o validación.|

## Reglas de entrega

- Firmar cada payload con HMAC o firma equivalente.
    
- Reintentar con backoff exponencial y jitter.
    
- Considerar 2xx como entrega aceptada.
    
- Guardar `eventId` procesado para evitar dobles efectos.
    

## Payload base

json

`{   "eventId": "uuid",  "tenantId": "tenant-123",  "assetId": "asset-456",  "assetRef": "files:tenant-123:asset-456:7",  "type": "document.version.created",  "correlationId": "corr-789",  "createdAt": "2026-06-04T17:24:00Z",  "data": {    "versionNumber": 7,    "hash": "sha256..."  } }`

## 3. RBAC granular

ABDFiles debe usar RBAC por archivo, pero con scope por tenant, espacio y acción. Lo recomendable es mantener roles **coarse-grained** y permisos como conjunto efectivo calculado por backend; así evitas permisos demasiado fragmentados y mantienes mantenibilidad.

## Roles propuestos

|Rol|Permisos|
|---|---|
|`FILE_VIEWER`|Ver metadatos, listar versiones autorizadas, descargar.|
|`FILE_EDITOR`|Subir nuevas versiones, editar metadatos no bloqueados.|
|`FILE_ADMIN`|Gestionar retención, legal hold, migraciones y borrado lógico.|
|`FILE_AUDITOR`|Leer eventos y trazabilidad, sin mutación.|

## Scope de autorización

- `tenantId`.
    
- `assetId`.
    
- `spaceId`.
    
- `action` (`read`, `write`, `delete`, `publish`, `manage_hold`, `manage_connector`).
    

## Regla de decisión

ts

`authorize(user, action, resource) {   return hasTenantAccess(user, resource.tenantId) &&         hasRolePermission(user.roles, action) &&         hasScopePermission(user.scopes, resource.assetId, resource.spaceId); }`

La eliminación debe ser siempre una capacidad privilegiada, no delegada de forma amplia.

## 4. Disaster Recovery

El protocolo de recuperación debe cubrir tanto MongoDB como Cloudinary, pero el metadato es la pieza crítica porque define qué existe, qué versión es vigente y qué debe purgarse. MongoDB recomienda estrategias de restauración basadas en RPO/RTO, backups regulares y pruebas de restore; en sistemas multi-tenant conviene además mantener partición lógica clara por tenant.

## Objetivos

|Objetivo|Definición|
|---|---|
|RPO|Pérdida máxima aceptable de datos de metadato.|
|RTO|Tiempo máximo para volver a operar.|
|DR Drill|Prueba periódica de restauración.|
|Restore Scope|Restauración parcial por tenant o global.|

## Recomendaciones

1. Backup diario de `documents`, `document_versions`, `document_events`, `legal_holds` y `asset_space_links`.
    
2. Backup incremental o PITR si la infraestructura lo soporta.
    
3. Restauraciones de prueba automáticas en entorno aislado.
    
4. Separación entre recuperación de metadatos y rehidratación de binarios.
    
5. Mantener catálogo de checksums para validar integridad tras restore.
    

## Flujo DR

ts

`async function restoreMetadata(snapshotId: string) {   const snapshot = await locateBackup(snapshotId);  await provisionIsolatedMongo();  await restoreMongoSnapshot(snapshot);  await validateCollections([    'documents',    'document_versions',    'document_events',    'legal_holds',    'asset_space_links'  ]);  await reconcileStorageRefsWithCloudinary();  await reindexTenantCollections(); }`

## 5. Índices recomendados

Para optimizar consultas por `tenantId`, el patrón debe empezar por ese campo y seguir con la cardinalidad que más filtra. MongoDB recomienda diseñar índices según patrones reales de acceso, evitando sobreindexación.

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|
|`documents`|`{ tenantId: 1, currentVersionId: 1 }`|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|
|`document_versions`|`{ tenantId: 1, hash: 1 }`|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|
|`legal_holds`|`{ tenantId: 1, assetId: 1, status: 1 }`|

## 6. Fallos en subida

Si falla la subida a Cloudinary, ABDFiles debe conservar el contexto de la operación y permitir reintento idempotente. No debe crear una versión vigente si el upload no se completó correctamente.

## Estados de fallo

|Estado|Significado|
|---|---|
|`upload_pending`|Petición iniciada.|
|`upload_failed`|Fallo antes de confirmar binario.|
|`upload_retriable`|Puede reintentarse con el mismo `eventId`.|
|`active`|Subida válida y confirmada.|

## Pseudocódigo de reintento

ts

`async function handleUploadFailure(commandId: string, err: unknown) {   await writeEvent('UPLOAD_FAILED', undefined, undefined, {    commandId,    error: serializeError(err)  });   await storeRetryableCommand(commandId, {    status: 'upload_retriable',    retryAfter: Date.now() + backoffMs()  }); }`

## 7. Migración de storage

La futura migración desde Cloudinary a un proveedor S3-compatible debe ser gradual, verificable y reversible. Cloudinary documenta procesos de migración de assets y preservación de metadatos, por lo que el satélite debe modelar cada versión con su `storageRef` propio para permitir coexistencia temporal entre orígenes.

## Estrategia

1. Copiar binario y metadatos al destino.
    
2. Verificar hash y tamaño.
    
3. Registrar `STORAGE_MIGRATED`.
    
4. Conmutar `storageProvider` y `storageRefCurrent`.
    
5. Mantener el origen hasta completar validación y rollback window.
    

## Webhook asociado

json

`{   "type": "document.storage.migrated",  "data": {    "fromProvider": "cloudinary",    "toProvider": "s3Compatible",    "oldStorageRef": "...",    "newStorageRef": "...",    "versionId": "..."  } }`

## 8. Trazabilidad

Toda acción sensible debe generar un evento en `document_events` y, en paralelo, un webhook de notificación hacia ABDSuite cuando el estado cambie. Así se desacopla la auditoría interna del sistema de integración externa.

## 9. Reglas de acceso

- Ninguna operación destructiva se permite sin rol explícito y scope de tenant.
    
- `FILE_AUDITOR` no puede mutar datos.
    
- `FILE_EDITOR` no puede aplicar `legal_hold`.
    
- `FILE_ADMIN` requiere validación reforzada en backend.
    
- La visibilidad de UI nunca sustituye la autorización del servicio.
    

## 10. Políticas de retención

La retención se evalúa por `retentionClass`, estado del documento y existencia de `legalHold`. Si un documento no tiene hold y su `purgeAt` ya venció, entra en el ciclo de purging automático.

## 11. Recuperación ante desastre

El plan de recuperación debe priorizar metadatos antes que binarios. Primero se restaura MongoDB, después se reconcilian referencias con Cloudinary o el storage secundario, y finalmente se reactivan jobs, webhooks e índices.

## 12. Cierre

Esta especificación deja ABDFiles preparado para operar como un DMS multi-tenant con borrado controlado, auditoría fuerte, webhooks idempotentes, DR real y una ruta clara de migración futura de Cloudinary a S3-compatible sin romper `assetRef` ni el histórico de versiones.[](https://www.mongodb.com/docs/manual/core/transactions/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZAHV4ML&Signature=P5c0ewufNZxErCwnZlyOuy5sDqg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCP3OKVZ5RrPVhikv1tz67ztE67Z4eeo2IRrkryA7zRlgIhANyKjyYOdnbxcNCMsRvitJz1ajASYWJwEDVON%2FaJ2vDFKvMECFgQARoMNjk5NzUzMzA5NzA1Igy4Rjffbs3MpLyPpjEq0ATkDc6qWWpKrmSwTsgFF1dSTZqeRgGYr5scATy9uc9nryf5zlUH%2BWAWcOsRp07Y5i620il15S%2BsfMDRyITFVKYAsvVVNn8kdSp9wTr0ogOH32WGBnfCFWUyF9Amt1JIVOzvGJD8tuGMsxmnYzYMXzhLl4BG39kIGYTAtj3taRu3u%2BpQwrWFa0jCqpIm8tv6Ag8ssJR2EfvRG%2BorkA3UGZtU%2B%2BL2thBkgm79kt7Zu6Dyr9n234ON2XMGDRCMLJ9Tfb4%2FhRHaE%2FYlYVwMN9bVASWcNrRhl8u02Oh3BOHkswUrnXa8L9Q%2BBISZFtToupfp4AFPk1nBSQ%2BouYgoOyFtUYOvLD8PWSnaqVC3v9JPtQu4iPvW86tXomLrNA0mwe63SHyzrDyVfdn82cvuZORetdk2wntZYiU9zZNzP%2F%2Fg9hI5Si7voweAZAhAIJTUf6Zh9RaKiLM%2BBavzCB0ySfFL0IYDDkgAA7rTH7No%2B36bvSL71jZc%2BAfJOKIKxkkG9UgPUOsXnjkx1gAnysxIaL8fmSYhqP%2Be%2BHjrxr4vXBS3dK17qKSfewOo8P4GBV2b8KlQFtlcsmEHwPEq2QsWZVeScibdgMyyZGAfpPtOWEgdz34gk%2Fe2U0wcVuO6BjPiGV9y9navu4D6BIieZJpOAHuPpI5rcm6UMvNV8XgQaM0QDL%2FW5umb5oL94v9tsQI%2FAokjMxNtbXy9JG%2BxGWA8CfbmZ2xAbMkVMsg1hUhi7jOaqdOm6t4OkhVfQ7hj7eIfED27A2lWhRlZ2dpsDJbuRqJArXVuMOCohtEGOpcBvC7ZW38tYEehJ0zDEiTe%2FvV%2BaORUH86PYHe52Ei8RbCopTP4bKddyL1R02dk1Z5r5VEb4uND16oEaMT2SVuPTNImyHU2NdzzZ04wvl23bf0RO0XkSkN6WnuZgJtR73CTl%2FeHGKppuDSFzStbu2HMz7owyGElbrlycc3TtrUzEkutLFpD8pVNY7tGj3v1Jwu2lqr0SPFbkQ%3D%3D&Expires=1780589107)


Aquí tienes el bloque listo para pegar en la spec de **ABDFiles**. Está orientado a operación real: purging automático, webhooks, RBAC granular y disaster recovery del metadato en MongoDB.

## 1. Purging automático

ABDFiles ejecutará un proceso periódico de limpieza para documentos que ya no tengan `Legal Hold` activo y cuya retención haya expirado. El purging físico nunca será inmediato por defecto; primero se aplicará borrado lógico, y solo después el job de retención eliminará versiones y binarios cuando la política lo permita.

|Estado|Acción|Condición|
|---|---|---|
|`active`|Sin cambios|Documento operativo.|
|`deleted_pending_retention`|Espera purga|Borrado lógico realizado, retención aún vigente.|
|`purge_due`|Elegible para eliminación física|Retención vencida y sin legal hold.|
|`purged`|Eliminado|Binario borrado y metadato cerrado.|

## Reglas de purging

1. Si `legalHold = true`, el documento no puede purgarse.
    
2. Si existe retención activa, el binario se conserva hasta `purgeAt`.
    
3. Si el job de purga falla, el documento permanece en `deleted_pending_retention` y se reintenta con backoff.
    
4. Toda purga exitosa genera un evento `DOCUMENT_PURGED` y un webhook firmado.
    

## Pseudocódigo

ts

`async function purgeExpiredDocuments(now: Date) {   const candidates = await findDocuments({    status: 'deleted_pending_retention',    purgeAt: { $lte: now },    legalHold: false  });   for (const doc of candidates) {    try {      await beginTransaction();      await deleteCloudinaryAsset(doc.storageRefCurrent);      await markDocumentPurged(doc.assetId, now);      await writeEvent('DOCUMENT_PURGED', doc.assetId, undefined, { now });      await commitTransaction();      await emitWebhook('document.deleted.purged', doc);    } catch (err) {      await rollbackTransaction();      await scheduleRetry(doc.assetId);    }  } }`

## 2. Webhooks de estado

ABDFiles emitirá webhooks firmados para todo cambio relevante de estado documental. El diseño debe ser idempotente, tolerante a reintentos y seguro ante duplicados, usando un `eventId` estable y una tabla de deduplicación o `processed_webhook_events`.

|Evento|Cuándo se emite|
|---|---|
|`document.created`|Alta del asset maestro.|
|`document.version.created`|Nueva versión inmutable creada.|
|`document.deleted.logical`|Documento marcado para retención/purga.|
|`document.deleted.purged`|Binario físicamente eliminado.|
|`document.legal_hold.applied`|Se activa un hold.|
|`document.legal_hold.released`|Se libera el hold.|
|`document.storage.migrated`|Cambio de proveedor físico.|
|`document.upload.failed`|Fallo de subida o validación.|

## Reglas de entrega

- Firmar cada payload con HMAC o firma equivalente.
    
- Reintentar con backoff exponencial y jitter.
    
- Considerar 2xx como entrega aceptada.
    
- Guardar `eventId` procesado para evitar dobles efectos.
    

## Payload base

json

`{   "eventId": "uuid",  "tenantId": "tenant-123",  "assetId": "asset-456",  "assetRef": "files:tenant-123:asset-456:7",  "type": "document.version.created",  "correlationId": "corr-789",  "createdAt": "2026-06-04T17:24:00Z",  "data": {    "versionNumber": 7,    "hash": "sha256..."  } }`

## 3. RBAC granular

ABDFiles debe usar RBAC por archivo, pero con scope por tenant, espacio y acción. Lo recomendable es mantener roles **coarse-grained** y permisos como conjunto efectivo calculado por backend; así evitas permisos demasiado fragmentados y mantienes mantenibilidad.

## Roles propuestos

|Rol|Permisos|
|---|---|
|`FILE_VIEWER`|Ver metadatos, listar versiones autorizadas, descargar.|
|`FILE_EDITOR`|Subir nuevas versiones, editar metadatos no bloqueados.|
|`FILE_ADMIN`|Gestionar retención, legal hold, migraciones y borrado lógico.|
|`FILE_AUDITOR`|Leer eventos y trazabilidad, sin mutación.|

## Scope de autorización

- `tenantId`.
    
- `assetId`.
    
- `spaceId`.
    
- `action` (`read`, `write`, `delete`, `publish`, `manage_hold`, `manage_connector`).
    

## Regla de decisión

ts

`authorize(user, action, resource) {   return hasTenantAccess(user, resource.tenantId) &&         hasRolePermission(user.roles, action) &&         hasScopePermission(user.scopes, resource.assetId, resource.spaceId); }`

La eliminación debe ser siempre una capacidad privilegiada, no delegada de forma amplia.

## 4. Disaster Recovery

El protocolo de recuperación debe cubrir tanto MongoDB como Cloudinary, pero el metadato es la pieza crítica porque define qué existe, qué versión es vigente y qué debe purgarse. MongoDB recomienda estrategias de restauración basadas en RPO/RTO, backups regulares y pruebas de restore; en sistemas multi-tenant conviene además mantener partición lógica clara por tenant.

## Objetivos

|Objetivo|Definición|
|---|---|
|RPO|Pérdida máxima aceptable de datos de metadato.|
|RTO|Tiempo máximo para volver a operar.|
|DR Drill|Prueba periódica de restauración.|
|Restore Scope|Restauración parcial por tenant o global.|

## Recomendaciones

1. Backup diario de `documents`, `document_versions`, `document_events`, `legal_holds` y `asset_space_links`.
    
2. Backup incremental o PITR si la infraestructura lo soporta.
    
3. Restauraciones de prueba automáticas en entorno aislado.
    
4. Separación entre recuperación de metadatos y rehidratación de binarios.
    
5. Mantener catálogo de checksums para validar integridad tras restore.
    

## Flujo DR

ts

`async function restoreMetadata(snapshotId: string) {   const snapshot = await locateBackup(snapshotId);  await provisionIsolatedMongo();  await restoreMongoSnapshot(snapshot);  await validateCollections([    'documents',    'document_versions',    'document_events',    'legal_holds',    'asset_space_links'  ]);  await reconcileStorageRefsWithCloudinary();  await reindexTenantCollections(); }`

## 5. Índices recomendados

Para optimizar consultas por `tenantId`, el patrón debe empezar por ese campo y seguir con la cardinalidad que más filtra. MongoDB recomienda diseñar índices según patrones reales de acceso, evitando sobreindexación.

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|
|`documents`|`{ tenantId: 1, currentVersionId: 1 }`|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|
|`document_versions`|`{ tenantId: 1, hash: 1 }`|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|
|`legal_holds`|`{ tenantId: 1, assetId: 1, status: 1 }`|

## 6. Fallos en subida

Si falla la subida a Cloudinary, ABDFiles debe conservar el contexto de la operación y permitir reintento idempotente. No debe crear una versión vigente si el upload no se completó correctamente.

## Estados de fallo

|Estado|Significado|
|---|---|
|`upload_pending`|Petición iniciada.|
|`upload_failed`|Fallo antes de confirmar binario.|
|`upload_retriable`|Puede reintentarse con el mismo `eventId`.|
|`active`|Subida válida y confirmada.|

## Pseudocódigo de reintento

ts

`async function handleUploadFailure(commandId: string, err: unknown) {   await writeEvent('UPLOAD_FAILED', undefined, undefined, {    commandId,    error: serializeError(err)  });   await storeRetryableCommand(commandId, {    status: 'upload_retriable',    retryAfter: Date.now() + backoffMs()  }); }`

## 7. Migración de storage

La futura migración desde Cloudinary a un proveedor S3-compatible debe ser gradual, verificable y reversible. Cloudinary documenta procesos de migración de assets y preservación de metadatos, por lo que el satélite debe modelar cada versión con su `storageRef` propio para permitir coexistencia temporal entre orígenes.

## Estrategia

1. Copiar binario y metadatos al destino.
    
2. Verificar hash y tamaño.
    
3. Registrar `STORAGE_MIGRATED`.
    
4. Conmutar `storageProvider` y `storageRefCurrent`.
    
5. Mantener el origen hasta completar validación y rollback window.
    

## Webhook asociado

json

`{   "type": "document.storage.migrated",  "data": {    "fromProvider": "cloudinary",    "toProvider": "s3Compatible",    "oldStorageRef": "...",    "newStorageRef": "...",    "versionId": "..."  } }`

## 8. Trazabilidad

Toda acción sensible debe generar un evento en `document_events` y, en paralelo, un webhook de notificación hacia ABDSuite cuando el estado cambie. Así se desacopla la auditoría interna del sistema de integración externa.

## 9. Reglas de acceso

- Ninguna operación destructiva se permite sin rol explícito y scope de tenant.
    
- `FILE_AUDITOR` no puede mutar datos.
    
- `FILE_EDITOR` no puede aplicar `legal_hold`.
    
- `FILE_ADMIN` requiere validación reforzada en backend.
    
- La visibilidad de UI nunca sustituye la autorización del servicio.
    

## 10. Políticas de retención

La retención se evalúa por `retentionClass`, estado del documento y existencia de `legalHold`. Si un documento no tiene hold y su `purgeAt` ya venció, entra en el ciclo de purging automático.

## 11. Recuperación ante desastre

El plan de recuperación debe priorizar metadatos antes que binarios. Primero se restaura MongoDB, después se reconcilian referencias con Cloudinary o el storage secundario, y finalmente se reactivan jobs, webhooks e índices.

## 12. Cierre

Esta especificación deja ABDFiles preparado para operar como un DMS multi-tenant con borrado controlado, auditoría fuerte, webhooks idempotentes, DR real y una ruta clara de migración futura de Cloudinary a S3-compatible sin romper `assetRef` ni el histórico de versiones.[](https://www.mongodb.com/docs/manual/core/transactions/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZAHV4ML&Signature=P5c0ewufNZxErCwnZlyOuy5sDqg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCP3OKVZ5RrPVhikv1tz67ztE67Z4eeo2IRrkryA7zRlgIhANyKjyYOdnbxcNCMsRvitJz1ajASYWJwEDVON%2FaJ2vDFKvMECFgQARoMNjk5NzUzMzA5NzA1Igy4Rjffbs3MpLyPpjEq0ATkDc6qWWpKrmSwTsgFF1dSTZqeRgGYr5scATy9uc9nryf5zlUH%2BWAWcOsRp07Y5i620il15S%2BsfMDRyITFVKYAsvVVNn8kdSp9wTr0ogOH32WGBnfCFWUyF9Amt1JIVOzvGJD8tuGMsxmnYzYMXzhLl4BG39kIGYTAtj3taRu3u%2BpQwrWFa0jCqpIm8tv6Ag8ssJR2EfvRG%2BorkA3UGZtU%2B%2BL2thBkgm79kt7Zu6Dyr9n234ON2XMGDRCMLJ9Tfb4%2FhRHaE%2FYlYVwMN9bVASWcNrRhl8u02Oh3BOHkswUrnXa8L9Q%2BBISZFtToupfp4AFPk1nBSQ%2BouYgoOyFtUYOvLD8PWSnaqVC3v9JPtQu4iPvW86tXomLrNA0mwe63SHyzrDyVfdn82cvuZORetdk2wntZYiU9zZNzP%2F%2Fg9hI5Si7voweAZAhAIJTUf6Zh9RaKiLM%2BBavzCB0ySfFL0IYDDkgAA7rTH7No%2B36bvSL71jZc%2BAfJOKIKxkkG9UgPUOsXnjkx1gAnysxIaL8fmSYhqP%2Be%2BHjrxr4vXBS3dK17qKSfewOo8P4GBV2b8KlQFtlcsmEHwPEq2QsWZVeScibdgMyyZGAfpPtOWEgdz34gk%2Fe2U0wcVuO6BjPiGV9y9navu4D6BIieZJpOAHuPpI5rcm6UMvNV8XgQaM0QDL%2FW5umb5oL94v9tsQI%2FAokjMxNtbXy9JG%2BxGWA8CfbmZ2xAbMkVMsg1hUhi7jOaqdOm6t4OkhVfQ7hj7eIfED27A2lWhRlZ2dpsDJbuRqJArXVuMOCohtEGOpcBvC7ZW38tYEehJ0zDEiTe%2FvV%2BaORUH86PYHe52Ei8RbCopTP4bKddyL1R02dk1Z5r5VEb4uND16oEaMT2SVuPTNImyHU2NdzzZ04wvl23bf0RO0XkSkN6WnuZgJtR73CTl%2FeHGKppuDSFzStbu2HMz7owyGElbrlycc3TtrUzEkutLFpD8pVNY7tGj3v1Jwu2lqr0SPFbkQ%3D%3D&Expires=1780589107)Aquí tienes el bloque listo para pegar en la spec de **ABDFiles**. Está orientado a operación real: purging automático, webhooks, RBAC granular y disaster recovery del metadato en MongoDB.

## 1. Purging automático

ABDFiles ejecutará un proceso periódico de limpieza para documentos que ya no tengan `Legal Hold` activo y cuya retención haya expirado. El purging físico nunca será inmediato por defecto; primero se aplicará borrado lógico, y solo después el job de retención eliminará versiones y binarios cuando la política lo permita.

|Estado|Acción|Condición|
|---|---|---|
|`active`|Sin cambios|Documento operativo.|
|`deleted_pending_retention`|Espera purga|Borrado lógico realizado, retención aún vigente.|
|`purge_due`|Elegible para eliminación física|Retención vencida y sin legal hold.|
|`purged`|Eliminado|Binario borrado y metadato cerrado.|

## Reglas de purging

1. Si `legalHold = true`, el documento no puede purgarse.
    
2. Si existe retención activa, el binario se conserva hasta `purgeAt`.
    
3. Si el job de purga falla, el documento permanece en `deleted_pending_retention` y se reintenta con backoff.
    
4. Toda purga exitosa genera un evento `DOCUMENT_PURGED` y un webhook firmado.
    

## Pseudocódigo

ts

`async function purgeExpiredDocuments(now: Date) {   const candidates = await findDocuments({    status: 'deleted_pending_retention',    purgeAt: { $lte: now },    legalHold: false  });   for (const doc of candidates) {    try {      await beginTransaction();      await deleteCloudinaryAsset(doc.storageRefCurrent);      await markDocumentPurged(doc.assetId, now);      await writeEvent('DOCUMENT_PURGED', doc.assetId, undefined, { now });      await commitTransaction();      await emitWebhook('document.deleted.purged', doc);    } catch (err) {      await rollbackTransaction();      await scheduleRetry(doc.assetId);    }  } }`

## 2. Webhooks de estado

ABDFiles emitirá webhooks firmados para todo cambio relevante de estado documental. El diseño debe ser idempotente, tolerante a reintentos y seguro ante duplicados, usando un `eventId` estable y una tabla de deduplicación o `processed_webhook_events`.

|Evento|Cuándo se emite|
|---|---|
|`document.created`|Alta del asset maestro.|
|`document.version.created`|Nueva versión inmutable creada.|
|`document.deleted.logical`|Documento marcado para retención/purga.|
|`document.deleted.purged`|Binario físicamente eliminado.|
|`document.legal_hold.applied`|Se activa un hold.|
|`document.legal_hold.released`|Se libera el hold.|
|`document.storage.migrated`|Cambio de proveedor físico.|
|`document.upload.failed`|Fallo de subida o validación.|

## Reglas de entrega

- Firmar cada payload con HMAC o firma equivalente.
    
- Reintentar con backoff exponencial y jitter.
    
- Considerar 2xx como entrega aceptada.
    
- Guardar `eventId` procesado para evitar dobles efectos.
    

## Payload base

json

`{   "eventId": "uuid",  "tenantId": "tenant-123",  "assetId": "asset-456",  "assetRef": "files:tenant-123:asset-456:7",  "type": "document.version.created",  "correlationId": "corr-789",  "createdAt": "2026-06-04T17:24:00Z",  "data": {    "versionNumber": 7,    "hash": "sha256..."  } }`

## 3. RBAC granular

ABDFiles debe usar RBAC por archivo, pero con scope por tenant, espacio y acción. Lo recomendable es mantener roles **coarse-grained** y permisos como conjunto efectivo calculado por backend; así evitas permisos demasiado fragmentados y mantienes mantenibilidad.

## Roles propuestos

|Rol|Permisos|
|---|---|
|`FILE_VIEWER`|Ver metadatos, listar versiones autorizadas, descargar.|
|`FILE_EDITOR`|Subir nuevas versiones, editar metadatos no bloqueados.|
|`FILE_ADMIN`|Gestionar retención, legal hold, migraciones y borrado lógico.|
|`FILE_AUDITOR`|Leer eventos y trazabilidad, sin mutación.|

## Scope de autorización

- `tenantId`.
    
- `assetId`.
    
- `spaceId`.
    
- `action` (`read`, `write`, `delete`, `publish`, `manage_hold`, `manage_connector`).
    

## Regla de decisión

ts

`authorize(user, action, resource) {   return hasTenantAccess(user, resource.tenantId) &&         hasRolePermission(user.roles, action) &&         hasScopePermission(user.scopes, resource.assetId, resource.spaceId); }`

La eliminación debe ser siempre una capacidad privilegiada, no delegada de forma amplia.

## 4. Disaster Recovery

El protocolo de recuperación debe cubrir tanto MongoDB como Cloudinary, pero el metadato es la pieza crítica porque define qué existe, qué versión es vigente y qué debe purgarse. MongoDB recomienda estrategias de restauración basadas en RPO/RTO, backups regulares y pruebas de restore; en sistemas multi-tenant conviene además mantener partición lógica clara por tenant.

## Objetivos

|Objetivo|Definición|
|---|---|
|RPO|Pérdida máxima aceptable de datos de metadato.|
|RTO|Tiempo máximo para volver a operar.|
|DR Drill|Prueba periódica de restauración.|
|Restore Scope|Restauración parcial por tenant o global.|

## Recomendaciones

1. Backup diario de `documents`, `document_versions`, `document_events`, `legal_holds` y `asset_space_links`.
    
2. Backup incremental o PITR si la infraestructura lo soporta.
    
3. Restauraciones de prueba automáticas en entorno aislado.
    
4. Separación entre recuperación de metadatos y rehidratación de binarios.
    
5. Mantener catálogo de checksums para validar integridad tras restore.
    

## Flujo DR

ts

`async function restoreMetadata(snapshotId: string) {   const snapshot = await locateBackup(snapshotId);  await provisionIsolatedMongo();  await restoreMongoSnapshot(snapshot);  await validateCollections([    'documents',    'document_versions',    'document_events',    'legal_holds',    'asset_space_links'  ]);  await reconcileStorageRefsWithCloudinary();  await reindexTenantCollections(); }`

## 5. Índices recomendados

Para optimizar consultas por `tenantId`, el patrón debe empezar por ese campo y seguir con la cardinalidad que más filtra. MongoDB recomienda diseñar índices según patrones reales de acceso, evitando sobreindexación.

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|
|`documents`|`{ tenantId: 1, currentVersionId: 1 }`|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|
|`document_versions`|`{ tenantId: 1, hash: 1 }`|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|
|`legal_holds`|`{ tenantId: 1, assetId: 1, status: 1 }`|

## 6. Fallos en subida

Si falla la subida a Cloudinary, ABDFiles debe conservar el contexto de la operación y permitir reintento idempotente. No debe crear una versión vigente si el upload no se completó correctamente.

## Estados de fallo

|Estado|Significado|
|---|---|
|`upload_pending`|Petición iniciada.|
|`upload_failed`|Fallo antes de confirmar binario.|
|`upload_retriable`|Puede reintentarse con el mismo `eventId`.|
|`active`|Subida válida y confirmada.|

## Pseudocódigo de reintento

ts

`async function handleUploadFailure(commandId: string, err: unknown) {   await writeEvent('UPLOAD_FAILED', undefined, undefined, {    commandId,    error: serializeError(err)  });   await storeRetryableCommand(commandId, {    status: 'upload_retriable',    retryAfter: Date.now() + backoffMs()  }); }`

## 7. Migración de storage

La futura migración desde Cloudinary a un proveedor S3-compatible debe ser gradual, verificable y reversible. Cloudinary documenta procesos de migración de assets y preservación de metadatos, por lo que el satélite debe modelar cada versión con su `storageRef` propio para permitir coexistencia temporal entre orígenes.

## Estrategia

1. Copiar binario y metadatos al destino.
    
2. Verificar hash y tamaño.
    
3. Registrar `STORAGE_MIGRATED`.
    
4. Conmutar `storageProvider` y `storageRefCurrent`.
    
5. Mantener el origen hasta completar validación y rollback window.
    

## Webhook asociado

json

`{   "type": "document.storage.migrated",  "data": {    "fromProvider": "cloudinary",    "toProvider": "s3Compatible",    "oldStorageRef": "...",    "newStorageRef": "...",    "versionId": "..."  } }`

## 8. Trazabilidad

Toda acción sensible debe generar un evento en `document_events` y, en paralelo, un webhook de notificación hacia ABDSuite cuando el estado cambie. Así se desacopla la auditoría interna del sistema de integración externa.

## 9. Reglas de acceso

- Ninguna operación destructiva se permite sin rol explícito y scope de tenant.
    
- `FILE_AUDITOR` no puede mutar datos.
    
- `FILE_EDITOR` no puede aplicar `legal_hold`.
    
- `FILE_ADMIN` requiere validación reforzada en backend.
    
- La visibilidad de UI nunca sustituye la autorización del servicio.
    

## 10. Políticas de retención

La retención se evalúa por `retentionClass`, estado del documento y existencia de `legalHold`. Si un documento no tiene hold y su `purgeAt` ya venció, entra en el ciclo de purging automático.

## 11. Recuperación ante desastre

El plan de recuperación debe priorizar metadatos antes que binarios. Primero se restaura MongoDB, después se reconcilian referencias con Cloudinary o el storage secundario, y finalmente se reactivan jobs, webhooks e índices.

## 12. Cierre

Esta especificación deja ABDFiles preparado para operar como un DMS multi-tenant con borrado controlado, auditoría fuerte, webhooks idempotentes, DR real y una ruta clara de migración futura de Cloudinary a S3-compatible sin romper `assetRef` ni el histórico de versiones.[](https://www.mongodb.com/docs/manual/core/transactions/)[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYERZAHV4ML&Signature=P5c0ewufNZxErCwnZlyOuy5sDqg%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCP3OKVZ5RrPVhikv1tz67ztE67Z4eeo2IRrkryA7zRlgIhANyKjyYOdnbxcNCMsRvitJz1ajASYWJwEDVON%2FaJ2vDFKvMECFgQARoMNjk5NzUzMzA5NzA1Igy4Rjffbs3MpLyPpjEq0ATkDc6qWWpKrmSwTsgFF1dSTZqeRgGYr5scATy9uc9nryf5zlUH%2BWAWcOsRp07Y5i620il15S%2BsfMDRyITFVKYAsvVVNn8kdSp9wTr0ogOH32WGBnfCFWUyF9Amt1JIVOzvGJD8tuGMsxmnYzYMXzhLl4BG39kIGYTAtj3taRu3u%2BpQwrWFa0jCqpIm8tv6Ag8ssJR2EfvRG%2BorkA3UGZtU%2B%2BL2thBkgm79kt7Zu6Dyr9n234ON2XMGDRCMLJ9Tfb4%2FhRHaE%2FYlYVwMN9bVASWcNrRhl8u02Oh3BOHkswUrnXa8L9Q%2BBISZFtToupfp4AFPk1nBSQ%2BouYgoOyFtUYOvLD8PWSnaqVC3v9JPtQu4iPvW86tXomLrNA0mwe63SHyzrDyVfdn82cvuZORetdk2wntZYiU9zZNzP%2F%2Fg9hI5Si7voweAZAhAIJTUf6Zh9RaKiLM%2BBavzCB0ySfFL0IYDDkgAA7rTH7No%2B36bvSL71jZc%2BAfJOKIKxkkG9UgPUOsXnjkx1gAnysxIaL8fmSYhqP%2Be%2BHjrxr4vXBS3dK17qKSfewOo8P4GBV2b8KlQFtlcsmEHwPEq2QsWZVeScibdgMyyZGAfpPtOWEgdz34gk%2Fe2U0wcVuO6BjPiGV9y9navu4D6BIieZJpOAHuPpI5rcm6UMvNV8XgQaM0QDL%2FW5umb5oL94v9tsQI%2FAokjMxNtbXy9JG%2BxGWA8CfbmZ2xAbMkVMsg1hUhi7jOaqdOm6t4OkhVfQ7hj7eIfED27A2lWhRlZ2dpsDJbuRqJArXVuMOCohtEGOpcBvC7ZW38tYEehJ0zDEiTe%2FvV%2BaORUH86PYHe52Ei8RbCopTP4bKddyL1R02dk1Z5r5VEb4uND16oEaMT2SVuPTNImyHU2NdzzZ04wvl23bf0RO0XkSkN6WnuZgJtR73CTl%2FeHGKppuDSFzStbu2HMz7owyGElbrlycc3TtrUzEkutLFpD8pVNY7tGj3v1Jwu2lqr0SPFbkQ%3D%3D&Expires=1780589107)

-----------
e dejo el bloque en formato de **especificación formal lista para pegar** en ABDFiles. Está orientado a operación real: DR, idempotencia en webhooks, ABAC/RBAC, migración de storage y auditoría inmutable.

## 1. Objetivo

ABDFiles debe garantizar integridad del metadato en MongoDB, entrega segura de eventos, control granular de acceso por documento y capacidad de recuperación ante desastres sin pérdida significativa de historia. El sistema separa metadatos, versiones, eventos, holds y relaciones lógicas de la capa física de almacenamiento.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEVJYM5FVS&Signature=BX5Tl1gLDa1EPTDRDoCZjYvoJf0%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDTnI76OFbGgpOEMytYBJrO6%2FkTXECbJzLBQxHVdlO8swIhAOyel5aMw8vhP6KjuOX1OifJ7i%2B0momwds82BxbzKd%2BnKvMECFgQARoMNjk5NzUzMzA5NzA1IgzM5PfGrheAec4v86Yq0ARCl14S%2BYzso17baKezFcHd2c%2Bz%2Brunn%2FMuWNorbDxNjwz1O0IMGgYp1P5QE2zryDkMEo8x9gkFdJ90p3vQDkTvtWFnVkVh2DI3fOUuWMxMS7f03jlMNUTjZvW8Zi95PTNu3C%2Bo9NJcv4AAe57mE%2B05Z2bBQUCD39ejbgBYiWGOfAGq4VXejOBxrYm3jkqresF0OKU%2FCq9Dg0zAYoJsJ5MGz%2FCpxlKP6p1z1ZMnjcFbGQh9MX%2B1ZYvqjgrwp8BZr8ihy6mtFKIhHhMNP3l6MNkrlF%2FPOIt%2FdyXHaVw2NYdHEP6vPCVIB5zzBPe6efXyyI%2BWS7UOPiWenELstNmGgufXE3CyqKJ%2FIQYMeqan0Goa1qEjc%2F4D6BG0o3fQ4v7HTLSL4Wk3FfAF5QH1Dt55%2FtAw3r0%2FKfITkSmD386Fd7zCyh49lr8OeQtb%2B5ag9ZZyowSSFCuuJlRV4QkOKxGrGd44Wd38qRlycBQvAiif8xhRiCtEp3dG2qAR9M7aMf2OrNagMqxoXkSgrEwIbxpOJA4wCrrT27DrAB%2FI3HO9rnWw1RCHUX2g7HtcfGjiTBgowX4JO9A3v4uls2N1Vhvkn6An9%2FERRiarXCHHcnKynWG2PByiwiU0gI5b5MJE%2FqkXZtU21MZ4ZjYH9cBCussExNRK3etTKu%2B%2Ba0vpTGTx%2FONuuIxx8lriT%2BT%2FAXBAvWVsYjkNAHXuD4WT5so5Irpx0Ifua01mE%2BYO58CU297MDIBcxQTPZPyGf3Wbo6HbRcOOmy2178kwLkG3ihL7Q4q9IIO6MKGghtEGOpcBT6B7r69PSMwr%2FnHDc7NoC2uZOkc3fBknKFMfVpSknq8Of3LTmv0M8o27CSUKma7LkUf68xnHS5Hze92lRbCCYM63YvXvrx6%2BbN7leuLryBHXaNAOHY0JcpPQQaHVh%2FwGw18fnyAEWOdhGYRQS%2FQufVIH0pWLRdnHpOveT3h9mYcrVGjQ%2FBd6LFyv%2Bia6NVWiKJTwFNBemg%3D%3D&Expires=1780588020)

## 2. Disaster Recovery

La estrategia de DR para MongoDB debe partir de objetivos explícitos de RPO y RTO, con backups regulares, restauraciones probadas y capacidad de recuperar tanto colecciones completas como subconjuntos por tenant. MongoDB recomienda evaluar backups, programarlos, almacenarlos fuera del entorno productivo y probar restauraciones de forma continua.

|Elemento|Política|
|---|---|
|Frecuencia de backup|Diario para metadatos críticos, con incrementales o PITR si la infraestructura lo permite.|
|Alcance|`documents`, `document_versions`, `document_events`, `legal_holds`, `asset_space_links`, `storage_connectors`.|
|Ubicación|Almacenamiento externo y aislado de producción.|
|Verificación|Restore tests automáticos en entorno aislado.|
|Recuperación|Primero metadato, después binarios y reindexado.|

## Pseudocódigo de restore

ts

`async function restoreMetadata(snapshotId: string) {   const snapshot = await locateBackup(snapshotId);  await provisionIsolatedMongo();  await restoreMongoSnapshot(snapshot);  await validateCollections([    'documents',    'document_versions',    'document_events',    'legal_holds',    'asset_space_links',    'storage_connectors'  ]);  await reconcileStorageRefs();  await rebuildIndexes(); }`

## 3. Idempotencia en webhooks

Los webhooks deben asumir entrega al menos una vez y por tanto duplicados posibles. La recepción debe seguir el patrón **verificar → persistir → responder rápido**, usando un identificador estable de evento o una clave de idempotencia para evitar efectos dobles.

## Reglas

1. Cada evento incluye `eventId`, `tenantId`, `assetId`, `type`, `correlationId` y `createdAt`.
    
2. El receptor guarda primero el evento en una tabla/colección `processed_webhook_events`.
    
3. Si el `eventId` ya existe, el receptor responde 2xx sin repetir side effects.
    
4. Las reintentos usan backoff exponencial con jitter y un límite máximo de intentos.
    
5. Los fallos permanentes se envían a una DLQ o cola de incidencias.
    

## Estructura sugerida

ts

`interface ProcessedWebhookEvent {   eventId: string;  source: string;  tenantId: string;  type: string;  hash: string;  processedAt: Date;  status: 'processed' | 'ignored_duplicate' | 'failed'; }`

## 4. RBAC y ABAC

ABDFiles debe usar RBAC para asignar responsabilidades operativas, pero la autorización efectiva debe resolverse con **ABAC** sobre atributos de usuario, recurso y entorno. ABAC encaja bien cuando el acceso depende de contexto, pertenencia, sensibilidad, retención o espacio lógico.

## Roles base

|Rol|Alcance|
|---|---|
|`FILE_VIEWER`|Lectura autorizada.|
|`FILE_EDITOR`|Nueva versión y edición de metadatos no bloqueados.|
|`FILE_ADMIN`|Retención, holds, migraciones, purga lógica.|
|`FILE_AUDITOR`|Lectura de eventos y trazabilidad.|

## Atributos ABAC

|Tipo|Atributos|
|---|---|
|Usuario|`tenantId`, `roles`, `groups`, `departmentId`, `clearanceLevel`.|
|Recurso|`assetId`, `spaceId`, `sensitivityLevel`, `retentionClass`, `legalHold`, `ownerUserId`.|
|Entorno|`timeWindow`, `ipRange`, `mfaLevel`, `sessionAge`.|

## Regla de decisión

ts

`function canAccess(user, action, asset, env) {   if (user.tenantId !== asset.tenantId) return false;  if (asset.legalHold && action === 'delete') return false;  if (asset.sensitivityLevel === 'restricted' && user.clearanceLevel !== 'high') return false;  if (!hasRolePermission(user.roles, action)) return false;  if (!matchesEnvironmentalPolicy(env)) return false;  return true; }`

## 5. Migración Cloudinary → S3-compatible

La migración futura debe hacerse sin romper `assetRef` ni el histórico de versiones. Cloudinary tiene guías de migración y preservación de metadatos, así que el satélite debe tratar la migración como una operación por versión, no como un reemplazo global del documento.

|Fase|Acción|
|---|---|
|1|Copiar binario y metadatos al destino. [](https://cloudinary.com/documentation/migration)|
|2|Validar hash, tamaño y MIME.|
|3|Registrar evento `STORAGE_MIGRATED`.|
|4|Conmutar la versión activa a `storageRef` nuevo.|
|5|Mantener origen hasta completar ventana de rollback.|

## Pseudocódigo

ts

`async function migrateVersionStorage(versionId: string, targetProvider: 's3Compatible') {   const version = await getVersion(versionId);  const asset = await getAsset(version.assetId);   const copied = await copyBinary(version.storageRef, targetProvider);  assert(await sha256(copied.file) === version.hash);   await beginTransaction();  await updateVersionStorage(versionId, copied.storageRef, targetProvider);  await writeEvent('STORAGE_MIGRATED', asset.assetId, versionId, {    from: version.storageProvider,    to: targetProvider  });  await commitTransaction();   return copied.storageRef; }`

## 6. Auditoría inmutable

La auditoría debe ser append-only: cada evento relevante crea una entrada nueva, nunca una actualización sobre el historial. Esto permite reconstruir estado, demostrar integridad y sincronizar con ABDLogs sin perder la secuencia de hechos.

## Eventos mínimos

- `DOCUMENT_CREATED`.
    
- `DOCUMENT_VERSION_CREATED`.
    
- `DOCUMENT_LOGICAL_DELETED`.
    
- `DOCUMENT_PURGED`.
    
- `LEGAL_HOLD_APPLIED`.
    
- `LEGAL_HOLD_RELEASED`.
    
- `STORAGE_MIGRATED`.
    
- `UPLOAD_FAILED`.
    

## Integridad

Para garantizar inmutabilidad práctica:

- hash de cada evento;
    
- firma del payload al enviarlo fuera;
    
- secuencia por `correlationId`;
    
- prohibición de edición de eventos previos;
    
- validación periódica de cadena de hashes.
    

## 7. Borrado y retención

El borrado lógico debe preceder al borrado físico. Si `legalHold = true`, cualquier purga queda bloqueada hasta liberar el hold; si no existe hold y `purgeAt` vence, el job puede eliminar el binario y cerrar el asset.

## Flujo

1. `active` → `deleted_pending_retention`.
    
2. Se revocan URLs, accesos y links públicos.
    
3. Se programa `purgeAt`.
    
4. Se valida que no exista `legalHold`.
    
5. Se purga físicamente.
    
6. Se emite evento final y webhook.
    

## 8. Webhook payload

json

`{   "eventId": "uuid",  "tenantId": "tenant-123",  "assetId": "asset-456",  "assetRef": "files:tenant-123:asset-456:7",  "type": "document.version.created",  "correlationId": "corr-789",  "createdAt": "2026-06-04T17:30:00Z",  "data": {    "versionNumber": 7,    "hash": "sha256..."  } }`

## 9. Reglas de permisos por archivo

|Acción|Requisito|
|---|---|
|Ver|`FILE_VIEWER` o superior + mismo `tenantId`.|
|Subir versión|`FILE_EDITOR` o superior + permiso de escritura.|
|Aplicar hold|`FILE_ADMIN` + validación reforzada.|
|Borrar lógico|`FILE_ADMIN` + sin legal hold activo.|
|Auditar|`FILE_AUDITOR` o superior.|

La UI solo refleja permisos; el backend es quien autoriza de verdad.

## 10. Índices

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|
|`documents`|`{ tenantId: 1, currentVersionId: 1 }`|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|
|`document_versions`|`{ tenantId: 1, hash: 1 }`|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|
|`legal_holds`|`{ tenantId: 1, assetId: 1, status: 1 }`|
|`processed_webhook_events`|`{ eventId: 1 }` unique|

MongoDB recomienda diseñar índices a partir de los patrones reales de consulta, evitando índices innecesarios que penalicen escrituras.

## 11. Disaster Recovery operativo

|Caso|Respuesta|
|---|---|

|Caso|Respuesta|
|---|---|
|Corrupción lógica|Restore de snapshot/PITR al punto anterior.|
|Borrado accidental|Restauración del metadato, reconciliación con storage.|
|Caída total|Restituir backup aislado y rehidratar índices.|
|Falla parcial de webhook|Reintento idempotente y replay desde DLQ.|

## 12. Cierre

La combinación de DR en MongoDB, idempotencia en webhooks, RBAC+ABAC, migración por fases de Cloudinary a S3-compatible e historial append-only deja ABDFiles preparado para operar con seguridad, trazabilidad e integración futura sin romper el contrato lógico `assetRef`.

--------------

 te dejo una propuesta **lista para pegar en la spec** de ABDFiles, orientada a migración futura de storage, microservicios con Kafka, REST escalable, cifrado en reposo y observabilidad de MongoDB.

## 1. Objetivo

ABDFiles será el satélite documental de ABDSuite para la gestión de activos, versiones, retención y trazabilidad. El diseño debe permitir empezar con Cloudinary + MongoDB, pero dejar abierta la evolución hacia almacenamiento local o un proveedor S3-compatible sin romper `assetRef` ni el historial documental.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEUVWO5DZD&Signature=FLtMNKlrrvpBhmJH9kREGktBqvM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIALMA%2BP7lc6syigQT5el1ghgT1blfC%2FLIjdqWmrHHqinAiBoQNJZQk1ANzHS1osEKqomAm3NzXD4x3pd64F7GI%2Bx3yrzBAhYEAEaDDY5OTc1MzMwOTcwNSIM7r6Gn1XvLjxvGsROKtAEAXGE3fQZ8s82%2FCPIynPyVr0R0L%2Bs55y%2FLBTIb6Of0j%2FBXDcffBc%2BYd5jyHbcNcC7Ovass1U6s6NyWozE06Rt%2BA8kTLrzPbUD1obEuJ1K5SahTUkQWE%2BUQXo6mqPNA2yHE7S9ZRGllDdPgDvDKYdJELq7np4qJDM0UqSt4f1L%2FgCGJ82rrFSouGaokBLpVyJflQl522zt9vvK93G42RgKUj%2FaLucuajnB46dcAhF1N3h9JUaLEegHl%2BKvKaqk4uJ8rWJ6Vvz%2BF%2B0XaKYZBHqqiiY3BupiIc%2FILE63qIIev61w3OBSCum%2BfblXkMO9SYOsXKZNuQVk8%2FzO0ykuMX6DOD8vib3bnHq9p54hU9K09QYU%2FTwNyA7%2BvAaQkFd%2BXZmrrv5Vye6%2BxfcaGpWU1goWKpB0s6ey0mgh7nSitAxLjNemTbsGdHw05cFLSqcBRx6yYULahVZ7CCzY%2ByCF1kqMqG9b9a22WHRirx%2BgyPTBM0EmMaspqbFBS9qmplV7xni0Thac%2FrrjFBS13eUysS1qval1zV89hDFtXMWOnx8wCsCtfTrdTbeXzT5qjT94e%2B%2F2Kr0Xruzh8e8ns0EiBYB8uRZ6gDPcv89TmkA8pjRT%2BflaH3XD0shA1pCuyk1%2B0q%2BllyHoiDEzg57t0HJgyNQWSRJlvDLLvIFmkmTkGVCtwSF7PiOedWczrtaXCHT4vCnYd7qe4jKJ%2Fha7GAza%2FM4hfyX7PzZabhXU1xVillL88gJGghKmCPbSe7PsIiZpoIUeX473VIWRHCoshkp2VwdKADCHqobRBjqZAaad6DBUi%2FCIBa9iHSROxEamJ0OTjaO9IlO5SJcuad4Z2ZfFoNCQyriM30xF3OHHrl9W%2B0dtccNO3WKYrweifCiN7bK%2BlRIfschkOJP23xKGz8yH9DOqIy4hjfoGI7FL22ccnwwRpLm3nCP2D0RsyjFazCQPOxvFlNTC4XjMzfCeGOuXL5u9YXgDUL4MWz8uCV70uz7dQFpehw%3D%3D&Expires=1780589274)

## 2. Migración de storage

La migración desde Cloudinary hacia almacenamiento local o S3-compatible debe implementarse como una operación de **doble escritura controlada** y corte progresivo. Primero se copia el binario al destino, luego se valida hash, tamaño y MIME, y solo después se conmuta la referencia activa.

|Fase|Acción|Riesgo mitigado|
|---|---|---|
|1|Copia paralela al nuevo storage.|Caída durante el cambio.|
|2|Verificación criptográfica de contenido.|Corrupción o transferencia parcial.|
|3|Conmutación de `storageRefCurrent`.|Ruptura de consumidores.|
|4|Ventana de rollback.|Migración defectuosa.|
|5|Limpieza del origen.|Duplicación innecesaria.|

## Reglas

- `assetRef` no cambia durante la migración.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEUVWO5DZD&Signature=FLtMNKlrrvpBhmJH9kREGktBqvM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIALMA%2BP7lc6syigQT5el1ghgT1blfC%2FLIjdqWmrHHqinAiBoQNJZQk1ANzHS1osEKqomAm3NzXD4x3pd64F7GI%2Bx3yrzBAhYEAEaDDY5OTc1MzMwOTcwNSIM7r6Gn1XvLjxvGsROKtAEAXGE3fQZ8s82%2FCPIynPyVr0R0L%2Bs55y%2FLBTIb6Of0j%2FBXDcffBc%2BYd5jyHbcNcC7Ovass1U6s6NyWozE06Rt%2BA8kTLrzPbUD1obEuJ1K5SahTUkQWE%2BUQXo6mqPNA2yHE7S9ZRGllDdPgDvDKYdJELq7np4qJDM0UqSt4f1L%2FgCGJ82rrFSouGaokBLpVyJflQl522zt9vvK93G42RgKUj%2FaLucuajnB46dcAhF1N3h9JUaLEegHl%2BKvKaqk4uJ8rWJ6Vvz%2BF%2B0XaKYZBHqqiiY3BupiIc%2FILE63qIIev61w3OBSCum%2BfblXkMO9SYOsXKZNuQVk8%2FzO0ykuMX6DOD8vib3bnHq9p54hU9K09QYU%2FTwNyA7%2BvAaQkFd%2BXZmrrv5Vye6%2BxfcaGpWU1goWKpB0s6ey0mgh7nSitAxLjNemTbsGdHw05cFLSqcBRx6yYULahVZ7CCzY%2ByCF1kqMqG9b9a22WHRirx%2BgyPTBM0EmMaspqbFBS9qmplV7xni0Thac%2FrrjFBS13eUysS1qval1zV89hDFtXMWOnx8wCsCtfTrdTbeXzT5qjT94e%2B%2F2Kr0Xruzh8e8ns0EiBYB8uRZ6gDPcv89TmkA8pjRT%2BflaH3XD0shA1pCuyk1%2B0q%2BllyHoiDEzg57t0HJgyNQWSRJlvDLLvIFmkmTkGVCtwSF7PiOedWczrtaXCHT4vCnYd7qe4jKJ%2Fha7GAza%2FM4hfyX7PzZabhXU1xVillL88gJGghKmCPbSe7PsIiZpoIUeX473VIWRHCoshkp2VwdKADCHqobRBjqZAaad6DBUi%2FCIBa9iHSROxEamJ0OTjaO9IlO5SJcuad4Z2ZfFoNCQyriM30xF3OHHrl9W%2B0dtccNO3WKYrweifCiN7bK%2BlRIfschkOJP23xKGz8yH9DOqIy4hjfoGI7FL22ccnwwRpLm3nCP2D0RsyjFazCQPOxvFlNTC4XjMzfCeGOuXL5u9YXgDUL4MWz8uCV70uz7dQFpehw%3D%3D&Expires=1780589274)
    
- Cada versión conserva su propio `storageRef`.[](https://cloudinary.com/documentation/migration)
    
- El origen no se borra hasta completar la validación final.
    
- La operación genera evento `STORAGE_MIGRATED` y webhook asociado.
    

## 3. Arquitectura de microservicios con Kafka

Si ABDFiles evoluciona a microservicios, Kafka debe usarse como bus de eventos de dominio, no como sustituto del modelo de datos. Cada servicio conserva su propia base de datos, y los cambios relevantes se publican como eventos inmutables a topics bien definidos.

## Servicios sugeridos

|Servicio|Responsabilidad|
|---|---|
|`file-command-service`|Subidas, versiones, borrado lógico, holds.|
|`file-query-service`|Lectura optimizada, vistas y búsqueda.|
|`file-audit-service`|Persistencia de eventos y auditoría.|
|`file-webhook-dispatcher`|Notificaciones externas idempotentes.|
|`file-migration-service`|Migración entre storage providers.|

## Topics

|Topic|Contenido|
|---|---|
|`abdfiles.document.events`|Creación, versión, borrado, hold, migración.|
|`abdfiles.webhook.events`|Notificaciones a ABDSuite y consumidores externos.|
|`abdfiles.storage.events`|Uploads, fallos, migraciones y reintentos.|
|`abdfiles.audit.events`|Registro inmutable para trazabilidad.|

## Regla de oro

Cada comando produce como máximo un conjunto de eventos de dominio; los consumidores construyen sus propias proyecciones. Eso reduce acoplamiento y permite escalar lectura/escritura por separado.

## 4. API RESTful escalable

La API de ABDFiles debe ser REST, predecible y versionada. Para escalar, conviene usar recursos claros, filtros por `tenantId`, paginación, campos parciales y respuestas pequeñas.

## Recursos principales

- `POST /v1/documents`
    
- `GET /v1/documents`
    
- `GET /v1/documents/{assetId}`
    
- `POST /v1/documents/{assetId}/versions`
    
- `DELETE /v1/documents/{assetId}`
    
- `POST /v1/documents/{assetId}/holds`
    
- `DELETE /v1/documents/{assetId}/holds/{holdId}`
    
- `POST /v1/documents/{assetId}/migrations`
    
- `GET /v1/documents/{assetId}/events`
    

## Reglas de escalabilidad

- Paginación obligatoria.
    
- Filtros por `tenantId`, `status`, `spaceId` y `updatedAt`.
    
- Rate limiting por tenant y por token.
    
- Idempotency-Key en `POST` sensibles.
    
- Versionado de API con `/v1`, `/v2`.
    

## 5. Cifrado en reposo

MongoDB debe usar cifrado en reposo para proteger metadatos sensibles, y para campos críticos se puede reforzar con cifrado a nivel de campo o cifrado consultable según necesidad. MongoDB documenta cifrado en reposo con gestión de claves y soporte para protección adicional de datos sensibles.

## Política mínima

|Capa|Protección|
|---|---|
|Disco / storage|Encryption at Rest.|
|Red|TLS en tránsito. [](https://www.mongodb.com/docs/manual/core/security-data-encryption/)|
|Campo sensible|Cifrado de campo o Queryable Encryption si aplica.|
|Claves|Gestión centralizada con rotación.|

## Campos recomendados para cifrar

- `ownerUserId`.
    
- `sensitivityLevel`.
    
- `retentionClass`.
    
- `legalHold.reason`.
    
- `credentialsRef`.
    
- metadatos de clasificación interna.
    

## 6. Auditoría inmutable

La auditoría debe ser append-only: cada cambio relevante produce un evento nuevo y nunca sobrescribe el anterior. Esto da trazabilidad, reconstrucción histórica y soporte de cumplimiento.

## Eventos mínimos

|Evento|Descripción|
|---|---|
|`DOCUMENT_CREATED`|Alta del asset.|
|`DOCUMENT_VERSION_CREATED`|Nueva versión inmutable.|
|`DOCUMENT_LOGICAL_DELETED`|Borrado lógico.|
|`DOCUMENT_PURGED`|Eliminación física.|
|`LEGAL_HOLD_APPLIED`|Hold activo.|
|`LEGAL_HOLD_RELEASED`|Hold liberado.|
|`STORAGE_MIGRATED`|Cambio de proveedor.|
|`UPLOAD_FAILED`|Error de ingesta.|

## Integridad

- Hash por evento.
    
- Correlation ID por operación.
    
- Firma de payload en salida.
    
- Cola de auditoría separada.
    
- Validación periódica de la secuencia.
    

## 7. Idempotencia en webhooks

Los webhooks deben tolerar duplicados y reintentos. La regla es almacenar primero el evento recibido, usar `eventId` como clave única y devolver éxito si el evento ya fue procesado.

## Reglas

1. `eventId` único por evento.
    
2. Persistir antes de ejecutar side effects.
    
3. Reintentos con backoff exponencial y jitter.
    
4. DLQ para fallos permanentes.
    
5. Firma HMAC del payload.
    

## 8. RBAC y ABAC

ABDFiles debe combinar RBAC para funciones y ABAC para decisiones contextuales. RBAC define qué tipo de usuario puede hacer algo; ABAC decide si puede hacerlo sobre ese documento, en ese entorno y en ese momento.

## Roles base

- `FILE_VIEWER`.
    
- `FILE_EDITOR`.
    
- `FILE_ADMIN`.
    
- `FILE_AUDITOR`.
    

## Atributos de decisión

|Tipo|Atributos|
|---|---|
|Usuario|`tenantId`, `roles`, `groups`, `departmentId`, `clearanceLevel`.|
|Recurso|`assetId`, `spaceId`, `sensitivityLevel`, `legalHold`, `retentionClass`.|
|Entorno|`sessionAge`, `mfaLevel`, `timeWindow`, `ipRange`.|

## Regla

ts

`function authorize(user, action, asset, env) {   if (user.tenantId !== asset.tenantId) return false;  if (asset.legalHold && action === 'delete') return false;  if (!hasRolePermission(user.roles, action)) return false;  if (!attributePolicyPass(user, asset, env)) return false;  return true; }`

## 9. Consulta y rendimiento

La API y MongoDB deben optimizarse alrededor de `tenantId`, porque ese será el eje primario de aislamiento y de consulta. MongoDB recomienda diseñar índices según patrones reales de acceso y mantenerlos alineados con filtros y ordenaciones frecuentes.

## Índices sugeridos

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|
|`documents`|`{ tenantId: 1, currentVersionId: 1 }`|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|
|`legal_holds`|`{ tenantId: 1, assetId: 1, status: 1 }`|

## 10. Observabilidad

ABDFiles debe exponer métricas de rendimiento y salud de base de datos para detectar cuellos de botella antes de que impacten al usuario. La observabilidad debe incluir latencia de API, tasa de error, uso de índices, colas de webhooks, crecimiento de versiones y presión de shard.

## Métricas clave

- Latencia p50/p95/p99 por endpoint.
    
- Tasa de errores 4xx/5xx.
    
- Throughput de escrituras por tenant.
    
- Tiempo de lectura por colección.
    
- Tamaño de índices.
    
- Replicación / lag si aplica.
    
- Tasa de reintentos de webhook.
    
- Fallos de migración de storage.
    

## 11. Flujo operativo

text

`1. Cliente envía documento. 2. API valida tenant, roles y atributos. 3. Se calcula hash. 4. Se sube binario a Cloudinary o destino configurado. 5. Se crea versión inmutable. 6. Se actualiza puntero del documento. 7. Se emiten evento de auditoría y webhook. 8. Se actualizan proyecciones y métricas.`

## 12. Cierre

Esta arquitectura permite empezar con MongoDB + Cloudinary, pero deja listo ABDFiles para evolucionar a microservicios con Kafka, storage alternativo, cifrado robusto, webhooks idempotentes y una política de acceso segura basada en RBAC + ABAC. Lo importante es mantener `assetRef`, el event log y las reglas de autorización como contratos estables desde el día uno.

---------------
Aquí va el bloque formal listo para pegar en la spec de ABDFiles. Lo he redactado para que encaje con la arquitectura que ya venís construyendo: MongoDB como metadato y verdad operativa, Kafka para eventos, y ABDLogs/ABDAnalytics como capa de trazabilidad y explotación.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE6CMGPWJH&Signature=vBZ3JrGS8i4h1dci94ZHEMXsvWw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFNSM0Ljx9VFmoUsLtpIJV1ue032d7E%2BlaJK%2BrlfMIaDAiB7mcEtp5yymGp7feKVl%2F6YHFghjKwZoqL2uOok8S28lCrzBAhYEAEaDDY5OTc1MzMwOTcwNSIM5jiaPZ5QR1px0eBPKtAEQ%2B7efZfQHvQvMLQUQFvxTvy8ATJgzCu%2BLEZSG%2BOR6j6IoQTbCxSKtUwgaO48F05WwL2AcuN5qOAAjxz%2B99rotiVBBluAQjuu6JYKyCUrE%2B2OYvsCHUkxPTSeAeLCoUwr3dZQfHGX1R6yp1PUK%2BPkjQpWdusnhNgtwsztFYXM31eGYKHjegFOoUPPdThIwinQu42RaxhKFhxn4oDRPZuMDdjhxa8qhamohqr97Tdf4gQSx%2BEryMBPgLscK8SIAmNf%2FqJoJbb0BB3fzwM80M3Tn59qIHaqTnJhnulzApFxY5hSrI%2Fy6pghMJE%2B2RihGk%2B29weUHJrMpILwQzjO4pbSd%2BsisBZ0tH6447ZiNPRvi1UeUF0tGaiVVJ447JlkgNBUi1POtSGJ4kzTdDT9rEOaXTHEkig6DNikvayEm%2B651xqZszs9HqYuV7BpPVJMcuuK1nWTGQsUgTu%2Bp9L7LJvr%2Fu4ERv3ivYQVKVegO87%2FGqz8ckt%2FpOmzBC594rhZIZ0hhpkDaAraKsiRyB%2B%2FxuAUVmG0MVuAQ9oyjLn6FM%2FuN1y2RvDcg%2FbR%2FcOoErFxBgBSXrrKhRWJ%2BvrqI58QAbAiJj6MbrBgsRhbOjGEcocjqCLAyPuvnLX2QcQ%2Flni7jD3TSF0WJ2dXyPn%2FK1Ls13VQIFsLYrLCqGMjwhIj9cwF5NUnKQ53H10w9jkkBJ3XmQ8fbeaLNJgwNSMx1YHWyJaLl65QpWVfQkPuiUVG6sQNQnEeRhH%2BwvlRlg8635w%2Bq9vNWftKr3xdlFzbKS9W7hEygDDyrYbRBjqZAeRWSZONhia3NYh70gkcWLb6GAk94UzyOiVsKv94bWpNiLow1%2B2IU%2B38%2Br36yPpYyUzBaKJFs0qEKZad0r8NMs7ixRMPgxKtkcYU1EeAKcq4Txn%2BQ7e2AyPPd74azP7%2BVrdFMfEW0WlvicBz65Vl3L0wFSdH9nHYFCXCpsRHkP8928vVTsXuD6JW1Is%2FebzLCVMSIA3oeG6Tcw%3D%3D&Expires=1780589765)

## 1. Observabilidad y trazabilidad distribuida

ABDFiles utilizará Kafka como bus de eventos de dominio y, al mismo tiempo, mantendrá **ABDLogs** como sistema central de auditoría y **ABDAnalytics** como capa de explotación analítica. Kafka no sustituye la auditoría; la complementa como canal de propagación y desacoplo entre servicios.

## Reglas

|Capa|Función|
|---|---|
|Kafka|Transporte de eventos de dominio y telemetría operacional.|
|ABDLogs|Auditoría inmutable y trazabilidad de seguridad.|
|ABDAnalytics|Métricas, agregaciones y consumo de solo lectura.|
|OpenTelemetry|Propagación de contexto y trazas distribuidas entre servicios y consumidores Kafka.|

## Campos mínimos de trazabilidad

- `traceId`.
    
- `spanId`.
    
- `parentSpanId`.
    
- `tenantId`.
    
- `assetId`.
    
- `versionId`.
    
- `correlationId`.
    
- `eventId`.
    
- `sourceService`.
    
- `topic`.
    
- `partition`.
    
- `offset`.[](https://www.youtube.com/watch?v=jV7DR3jcBLo)
    

## Regla operativa

Todo comando que genere un evento en Kafka debe incluir contexto de traza y correlación en el payload o en headers. Los consumidores deben propagar ese contexto al siguiente hop, permitiendo reconstruir el recorrido completo de una operación documental.

## 2. Contratos de API para versiones y parches

La API de ABDFiles debe diferenciar claramente entre crear una nueva versión y aplicar un parche de metadatos. Las operaciones que alteren binarios o el contenido lógico principal crean una versión nueva; las operaciones administrativas ligeras, como cambiar título o etiquetas, pueden tratarse como parches de metadato.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE6CMGPWJH&Signature=vBZ3JrGS8i4h1dci94ZHEMXsvWw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFNSM0Ljx9VFmoUsLtpIJV1ue032d7E%2BlaJK%2BrlfMIaDAiB7mcEtp5yymGp7feKVl%2F6YHFghjKwZoqL2uOok8S28lCrzBAhYEAEaDDY5OTc1MzMwOTcwNSIM5jiaPZ5QR1px0eBPKtAEQ%2B7efZfQHvQvMLQUQFvxTvy8ATJgzCu%2BLEZSG%2BOR6j6IoQTbCxSKtUwgaO48F05WwL2AcuN5qOAAjxz%2B99rotiVBBluAQjuu6JYKyCUrE%2B2OYvsCHUkxPTSeAeLCoUwr3dZQfHGX1R6yp1PUK%2BPkjQpWdusnhNgtwsztFYXM31eGYKHjegFOoUPPdThIwinQu42RaxhKFhxn4oDRPZuMDdjhxa8qhamohqr97Tdf4gQSx%2BEryMBPgLscK8SIAmNf%2FqJoJbb0BB3fzwM80M3Tn59qIHaqTnJhnulzApFxY5hSrI%2Fy6pghMJE%2B2RihGk%2B29weUHJrMpILwQzjO4pbSd%2BsisBZ0tH6447ZiNPRvi1UeUF0tGaiVVJ447JlkgNBUi1POtSGJ4kzTdDT9rEOaXTHEkig6DNikvayEm%2B651xqZszs9HqYuV7BpPVJMcuuK1nWTGQsUgTu%2Bp9L7LJvr%2Fu4ERv3ivYQVKVegO87%2FGqz8ckt%2FpOmzBC594rhZIZ0hhpkDaAraKsiRyB%2B%2FxuAUVmG0MVuAQ9oyjLn6FM%2FuN1y2RvDcg%2FbR%2FcOoErFxBgBSXrrKhRWJ%2BvrqI58QAbAiJj6MbrBgsRhbOjGEcocjqCLAyPuvnLX2QcQ%2Flni7jD3TSF0WJ2dXyPn%2FK1Ls13VQIFsLYrLCqGMjwhIj9cwF5NUnKQ53H10w9jkkBJ3XmQ8fbeaLNJgwNSMx1YHWyJaLl65QpWVfQkPuiUVG6sQNQnEeRhH%2BwvlRlg8635w%2Bq9vNWftKr3xdlFzbKS9W7hEygDDyrYbRBjqZAeRWSZONhia3NYh70gkcWLb6GAk94UzyOiVsKv94bWpNiLow1%2B2IU%2B38%2Br36yPpYyUzBaKJFs0qEKZad0r8NMs7ixRMPgxKtkcYU1EeAKcq4Txn%2BQ7e2AyPPd74azP7%2BVrdFMfEW0WlvicBz65Vl3L0wFSdH9nHYFCXCpsRHkP8928vVTsXuD6JW1Is%2FebzLCVMSIA3oeG6Tcw%3D%3D&Expires=1780589765)

## Recursos

|Endpoint|Método|Función|
|---|---|---|
|`/v1/documents`|`POST`|Crear documento inicial.|
|`/v1/documents/{assetId}/versions`|`POST`|Crear nueva versión.|
|`/v1/documents/{assetId}/metadata`|`PATCH`|Parchar metadatos.|
|`/v1/documents/{assetId}`|`GET`|Obtener documento maestro.|
|`/v1/documents/{assetId}/versions/{versionId}`|`GET`|Obtener versión concreta.|
|`/v1/documents/{assetId}/events`|`GET`|Auditoría y trazabilidad.|

## Reglas de versionado

1. `POST /versions` siempre crea una versión inmutable nueva.
    
2. `PATCH /metadata` no cambia `versionNumber` salvo que la política diga lo contrario.
    
3. Toda respuesta relevante debe incluir `assetRef`, `currentVersionId` y `etag` o equivalente.
    
4. Cada operación debe soportar `Idempotency-Key`.
    

## Pseudocódigo de contrato

ts

`type CreateVersionRequest = {   tenantId: string;  assetId: string;  file: Buffer;  mimeType: string;  comment?: string;  idempotencyKey: string; }; type PatchMetadataRequest = {   tenantId: string;  assetId: string;  title?: string;  tags?: string[];  sensitivityLevel?: 'low' | 'medium' | 'high' | 'restricted';  idempotencyKey: string; };`

## 3. Gestión de metadatos en sistemas federados

En un entorno federado, los metadatos no deben vivir como una sola masa global; deben dividirse por dominio de responsabilidad y resolverse por contexto de tenant. El patrón más seguro es mantener un **modelo canónico central** en ABDFiles y exponer vistas derivadas o sincronizadas a otros satélites.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE6CMGPWJH&Signature=vBZ3JrGS8i4h1dci94ZHEMXsvWw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFNSM0Ljx9VFmoUsLtpIJV1ue032d7E%2BlaJK%2BrlfMIaDAiB7mcEtp5yymGp7feKVl%2F6YHFghjKwZoqL2uOok8S28lCrzBAhYEAEaDDY5OTc1MzMwOTcwNSIM5jiaPZ5QR1px0eBPKtAEQ%2B7efZfQHvQvMLQUQFvxTvy8ATJgzCu%2BLEZSG%2BOR6j6IoQTbCxSKtUwgaO48F05WwL2AcuN5qOAAjxz%2B99rotiVBBluAQjuu6JYKyCUrE%2B2OYvsCHUkxPTSeAeLCoUwr3dZQfHGX1R6yp1PUK%2BPkjQpWdusnhNgtwsztFYXM31eGYKHjegFOoUPPdThIwinQu42RaxhKFhxn4oDRPZuMDdjhxa8qhamohqr97Tdf4gQSx%2BEryMBPgLscK8SIAmNf%2FqJoJbb0BB3fzwM80M3Tn59qIHaqTnJhnulzApFxY5hSrI%2Fy6pghMJE%2B2RihGk%2B29weUHJrMpILwQzjO4pbSd%2BsisBZ0tH6447ZiNPRvi1UeUF0tGaiVVJ447JlkgNBUi1POtSGJ4kzTdDT9rEOaXTHEkig6DNikvayEm%2B651xqZszs9HqYuV7BpPVJMcuuK1nWTGQsUgTu%2Bp9L7LJvr%2Fu4ERv3ivYQVKVegO87%2FGqz8ckt%2FpOmzBC594rhZIZ0hhpkDaAraKsiRyB%2B%2FxuAUVmG0MVuAQ9oyjLn6FM%2FuN1y2RvDcg%2FbR%2FcOoErFxBgBSXrrKhRWJ%2BvrqI58QAbAiJj6MbrBgsRhbOjGEcocjqCLAyPuvnLX2QcQ%2Flni7jD3TSF0WJ2dXyPn%2FK1Ls13VQIFsLYrLCqGMjwhIj9cwF5NUnKQ53H10w9jkkBJ3XmQ8fbeaLNJgwNSMx1YHWyJaLl65QpWVfQkPuiUVG6sQNQnEeRhH%2BwvlRlg8635w%2Bq9vNWftKr3xdlFzbKS9W7hEygDDyrYbRBjqZAeRWSZONhia3NYh70gkcWLb6GAk94UzyOiVsKv94bWpNiLow1%2B2IU%2B38%2Br36yPpYyUzBaKJFs0qEKZad0r8NMs7ixRMPgxKtkcYU1EeAKcq4Txn%2BQ7e2AyPPd74azP7%2BVrdFMfEW0WlvicBz65Vl3L0wFSdH9nHYFCXCpsRHkP8928vVTsXuD6JW1Is%2FebzLCVMSIA3oeG6Tcw%3D%3D&Expires=1780589765)

## Capas

|Capa|Responsabilidad|
|---|---|
|Canonical Metadata Store|Estado maestro del documento.|
|Derived Views|Proyecciones para búsqueda, UI o analítica.|
|Federation Layer|Sincronización selectiva con otros satélites.|
|Policy Layer|Reglas de visibilidad, retención y acceso.|

## Reglas

- Un satélite puede consumir metadatos derivados, pero no reescribir el canon sin pasar por ABDFiles.
    
- Los campos sensibles deben cifrarse o proyectarse parcialmente.
    
- La sincronización federada debe ser eventual, no transaccional entre dominios.
    
- Toda reconciliación debe usar `assetRef` y `correlationId`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYE6CMGPWJH&Signature=vBZ3JrGS8i4h1dci94ZHEMXsvWw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFNSM0Ljx9VFmoUsLtpIJV1ue032d7E%2BlaJK%2BrlfMIaDAiB7mcEtp5yymGp7feKVl%2F6YHFghjKwZoqL2uOok8S28lCrzBAhYEAEaDDY5OTc1MzMwOTcwNSIM5jiaPZ5QR1px0eBPKtAEQ%2B7efZfQHvQvMLQUQFvxTvy8ATJgzCu%2BLEZSG%2BOR6j6IoQTbCxSKtUwgaO48F05WwL2AcuN5qOAAjxz%2B99rotiVBBluAQjuu6JYKyCUrE%2B2OYvsCHUkxPTSeAeLCoUwr3dZQfHGX1R6yp1PUK%2BPkjQpWdusnhNgtwsztFYXM31eGYKHjegFOoUPPdThIwinQu42RaxhKFhxn4oDRPZuMDdjhxa8qhamohqr97Tdf4gQSx%2BEryMBPgLscK8SIAmNf%2FqJoJbb0BB3fzwM80M3Tn59qIHaqTnJhnulzApFxY5hSrI%2Fy6pghMJE%2B2RihGk%2B29weUHJrMpILwQzjO4pbSd%2BsisBZ0tH6447ZiNPRvi1UeUF0tGaiVVJ447JlkgNBUi1POtSGJ4kzTdDT9rEOaXTHEkig6DNikvayEm%2B651xqZszs9HqYuV7BpPVJMcuuK1nWTGQsUgTu%2Bp9L7LJvr%2Fu4ERv3ivYQVKVegO87%2FGqz8ckt%2FpOmzBC594rhZIZ0hhpkDaAraKsiRyB%2B%2FxuAUVmG0MVuAQ9oyjLn6FM%2FuN1y2RvDcg%2FbR%2FcOoErFxBgBSXrrKhRWJ%2BvrqI58QAbAiJj6MbrBgsRhbOjGEcocjqCLAyPuvnLX2QcQ%2Flni7jD3TSF0WJ2dXyPn%2FK1Ls13VQIFsLYrLCqGMjwhIj9cwF5NUnKQ53H10w9jkkBJ3XmQ8fbeaLNJgwNSMx1YHWyJaLl65QpWVfQkPuiUVG6sQNQnEeRhH%2BwvlRlg8635w%2Bq9vNWftKr3xdlFzbKS9W7hEygDDyrYbRBjqZAeRWSZONhia3NYh70gkcWLb6GAk94UzyOiVsKv94bWpNiLow1%2B2IU%2B38%2Br36yPpYyUzBaKJFs0qEKZad0r8NMs7ixRMPgxKtkcYU1EeAKcq4Txn%2BQ7e2AyPPd74azP7%2BVrdFMfEW0WlvicBz65Vl3L0wFSdH9nHYFCXCpsRHkP8928vVTsXuD6JW1Is%2FebzLCVMSIA3oeG6Tcw%3D%3D&Expires=1780589765)
    

## 4. Criterios para S3-compatible

Si en el futuro migráis a un proveedor S3-compatible, la evaluación no debe limitarse al precio. Debe contemplar compatibilidad operativa, seguridad, auditoría, latencia, migración y posibilidad de integración con SSO o IAM corporativo.

## Matriz de evaluación

|Criterio|Qué revisar|
|---|---|
|Compatibilidad S3|APIs, buckets, object locking, versioning.|
|Seguridad|IAM/SSO, cifrado, firmas, rotación de claves.|
|Auditoría|Logs de acceso y cambios.|
|Rendimiento|Upload, download, listing y concurrencia. [](https://www.repoflow.io/blog/benchmarking-self-hosted-s3-compatible-storage-a-practical-performance-comparison)|
|Migración|Facilidad de importar metadata y conservar hashes.|
|Coste total|Storage, egress, soporte y operación.|
|Integración|SDKs, webhooks, presigned URLs, lifecycle policies. [](https://cloudian.com/guides/s3-storage/best-s3-compatible-storage-providers-top-5-options-in-2026/)|

## Regla de decisión

No se acepta un proveedor que no pueda:

- conservar `storageRef` por versión;
    
- generar URLs firmadas;
    
- soportar lifecycle o políticas equivalentes;
    
- ofrecer auditoría de acceso;
    
- permitir rollback de migración.
    

## 5. Búsqueda multi-tenant en MongoDB

La búsqueda debe diseñarse desde el principio con `tenantId` como filtro obligatorio, nunca opcional. En colecciones compartidas, esto evita fuga de resultados entre inquilinos y permite indexar de forma eficaz por patrones reales de búsqueda.

## Diseño base

|Colección|Campos de búsqueda|
|---|---|
|`documents`|`tenantId`, `title`, `tags`, `status`, `updatedAt`.|
|`document_versions`|`tenantId`, `assetId`, `hash`.|
|`document_events`|`tenantId`, `assetId`, `type`, `createdAt`.|

## Índices recomendados

- `{ tenantId: 1, title: 1 }`
    
- `{ tenantId: 1, tags: 1 }`
    
- `{ tenantId: 1, status: 1, updatedAt: -1 }`
    
- `{ tenantId: 1, assetId: 1, createdAt: -1 }`
    

## Reglas de búsqueda

1. Toda consulta de usuario debe llevar `tenantId`.
    
2. Los resultados nunca pueden mezclar tenants.
    
3. Las búsquedas semánticas o vectoriales deben aplicar pre-filtro por tenant.
    
4. Las proyecciones de búsqueda se reconstruyen desde el canon, no al revés.
    

## 6. Integración Kafka + API + Auditoría

ABDFiles debe emitir eventos de dominio a Kafka y, en paralelo, persistir auditoría inmutable en MongoDB/ABDLogs. Los consumidores de Kafka pueden construir vistas, notificar otros satélites o alimentar analítica, pero nunca deben sustituir el registro canónico de hechos.

## Topic sugerido

|Topic|Uso|
|---|---|
|`abdfiles.document.events`|Altas, versiones, holds, borrados.|
|`abdfiles.metadata.events`|Parches de metadatos.|
|`abdfiles.search.projections`|Actualización de vistas de búsqueda.|
|`abdfiles.audit.events`|Copia de seguridad lógica para trazabilidad.|

## Pseudocódigo de emisión

ts

`async function publishDocumentEvent(event) {   await saveAuditEvent(event);  await kafkaProducer.send({    topic: 'abdfiles.document.events',    key: event.assetId,    headers: {      traceId: event.traceId,      correlationId: event.correlationId,      tenantId: event.tenantId    },    value: JSON.stringify(event)  }); }`

## 7. Reglas de implementación

- `PATCH` solo para metadatos no estructurales.
    
- `POST /versions` para binarios y cambios que alteren la versión lógica.
    
- `tenantId` debe ser obligatorio en toda consulta de búsqueda.
    
- Kafka se usa para desacoplar, no para decidir la fuente de verdad.
    
- La auditoría canónica no se delega solo a la cola.
    
- Todo proveedor S3-compatible debe validar firma, auditoría y lifecycle.
    

## 8. Cierre

Esta propuesta deja ABDFiles preparado para operar con observabilidad real en Kafka, contratos de API limpios para versiones y parches, metadatos federados sin perder canon, búsqueda multi-tenant segura y una futura migración a S3-compatible con criterios de evaluación objetivos.

--------------

Aquí tienes el bloque formal listo para pegar en la spec de ABDFiles. Cubre parches JSON, evolución de esquemas en Kafka, concurrencia optimista y multi-tenancy a nivel bucket, con decisiones alineadas a MongoDB y S3.

## 1. Parcheo de documentos JSON

ABDFiles debe tratar los parches de metadatos como operaciones separadas de la creación de versiones binarias. Para recursos JSON, la operación recomendada es `PATCH` con semántica de **aplicación parcial** sobre campos permitidos, mientras que los cambios que afecten al binario o a la semántica principal deben crear nueva versión.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWHCH5FIS&Signature=YupLjouQdJybx5coD%2BTMEOA%2FbcU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQC2oyb8fGpsR9NSjlM3WoVrxOZ1T0%2FDNKKKtOgm5ox%2F0wIgR%2FQBaG1LpofiexLQwLrbaimrYedTrqhtEzeEYptDtAwq8wQIWRABGgw2OTk3NTMzMDk3MDUiDJkaz%2FMcMJVEWmCYyyrQBKlTccwpGh3ZW%2BwNjaCnhV0gyYcO4Xpf8rSBnr0aQjHC2lrvGy1Xpor3Ffo6lBzJqWaPSXZcrNtREJ44mSUhucofLSWvP2JP8dLTrjCdBe0oB321EmcGA5paXmxgQ6926QyR4b%2FnIIsX2DcvtoK1yF%2F6RQau9i51r1ktaQ060sHApk0BIlCQi3C3J4d6X%2BA09pvjqHqzIGlqCGjSHIsEXrTYAjyX1%2BRXt%2FI%2BCA6mEf4VOqWZ2lJcmoZlPt4r3mz88gjO8Awis%2FZJlsK%2BDiHC7AHEu%2FVrEEApQ7NIA0o1yApgyT37PWUARB7s8Y29vAtuc16v5yAuTj6P3TkL0NXaeYXeAbygxI7Yf%2F5JLK3DupOJcCo7l3zwXoH5muXIxcF1gotYOZ0WbN2u0uTFuaV2i0pk8U2nTNB1hFmM4FyN6pG%2F6h9UqC14itEQTsbkZTJzX7GWZJK64eKDgTawx9Z9TrlXidwCnTtl8y3VjOQdaXWZt1XrME3ftgnMg5izweilPaDjNWDHvRYWPZP7EMgGgtef6pEsRAriiq69ZcLxcgq5Z4XaGAaw07mEdijfLInCFIRIcfQVBFBPg8dkMOX0q8ZOmeeFD0iz1zA3Im7DiK%2F8vHqY1XRfjDfILJsCZJR7Jn0%2BMioK%2FDPIT9ayG7rX5l3y7IMkskGrCoA6fwVu%2BCP4pvl7GY7NWFjizVP2gK3wzLsE3fdrGeegZ4ltVs6UVsOb94Ras4P5Gg6W6r4wwIf9iwyxieyxrIZPcwE6Ilvnj%2F2OQ0hgWWLnltpRWdYwnhYw6LKG0QY6mAEVUXB0s4LezigOy5Sja6SMIBBgzB21cjRnfrla9jf8YCtmfmHqNJ0%2FX%2Brw%2FxowFYkBf6l6FaGP%2FcAq%2Frl4NXWGkfvA7wMSlNiJu4oLmsG%2BTA8KnESWAwnF2xRhuZRvi4bd5G8VIjf5FKWc4jvvr6bpYW6awqP0T2hS4x9sYxqN3ttH1awMcJk6p0QA02S%2B9rEwVS82BQntig%3D%3D&Expires=1780590395)

## Reglas

|Regla|Descripción|
|---|---|
|`PATCH`|Solo modifica campos autorizados y no binarios.|
|`PUT`|Reemplazo total del recurso, si se soporta.|
|`POST /versions`|Siempre crea una versión inmutable nueva.|
|`Idempotency-Key`|Obligatoria para operaciones mutables sensibles.|

## Pseudocódigo

ts

`async function patchDocumentMetadata(input) {   const asset = await getDocumentAsset(input.assetId);  assertTenantAccess(input.tenantId, input.actorId);  assertNoLegalHoldBlockingMetadata(asset, input.patch);   const diff = validatePatchAgainstPolicy(input.patch);  const nextVersion = asset.version + 1;   await beginTransaction();  await applyMetadataPatch(asset.assetId, diff, nextVersion);  await writeEvent('DOCUMENT_METADATA_UPDATED', asset.assetId, undefined, diff);  await commitTransaction(); }`

## 2. Kafka con Avro / Protobuf

Si ABDFiles usa Kafka para eventos, los mensajes deben tener contrato formal y evolución controlada. La práctica recomendada es usar Schema Registry con compatibilidad explícita, diseñar primero el esquema y después el productor/consumidor.

## Comparación práctica

|Formato|Ventaja|Cuándo usarlo|
|---|---|---|
|Avro|Muy flexible para evolución y compatible con schema registry.|Eventos de dominio con cambios frecuentes.|
|Protobuf|Muy eficiente y compacto, buen throughput.|Alta frecuencia y baja latencia.|
|JSON Schema|Más simple de inspeccionar. [](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)|Integraciones menos críticas.|

## Reglas de compatibilidad

- Sujetos por dominio, no un esquema gigante compartido.
    
- Compatibilidad `BACKWARD` o `FULL` según criticidad.
    
- Versionado semántico de eventos.
    
- Validación en CI antes de publicar cambios.
    

## Estructura de evento

text

`message DocumentEvent {   string event_id = 1;  string tenant_id = 2;  string asset_id = 3;  string correlation_id = 4;  string trace_id = 5;  string type = 6;  int64 created_at = 7;  bytes payload = 8; }`

## 3. Concurrencia optimista

MongoDB no resuelve por sí solo el control de concurrencia a nivel de documento como un ETag universal; conviene implementar un campo de versión monotónico o un token equivalente y validar que nadie haya modificado el documento entre lectura y escritura.

## Patrón recomendado

|Elemento|Uso|
|---|---|
|`version`|Contador monotónico por documento.|
|`etag`|Representación pública del estado actual.|
|`updatedAt`|Trazabilidad, no control de concurrencia por sí solo.|
|`If-Match`|Condición HTTP para parches concurrentes.|

## Regla

ts

`await collection.updateOne(   { assetId, tenantId, version: expectedVersion },  { $set: patch, $inc: { version: 1 } } );`

Si no se actualiza ningún documento, debe devolverse conflicto `409` y forzar relectura.

## 4. Bucket multi-tenancy

En almacenamiento tipo S3, el patrón multi-tenant más común es usar un bucket compartido con prefijos por tenant, o un bucket por tenant cuando las exigencias de aislamiento son altas. AWS documenta ambos enfoques y advierte que la elección afecta a cifrado, versionado, costes y gobernanza.

## Opciones

|Patrón|Ventaja|Desventaja|
|---|---|---|
|Bucket por tenant|Máximo aislamiento.|Más operación y más objetos de gestión.|
|Bucket compartido + prefix|Escala bien para muchos tenants. [](https://docs.aws.amazon.com/AmazonS3/latest/userguide/common-bucket-patterns.html)|Features a nivel bucket no se separan por prefix.|
|Access Points / capa intermedia|Mejor control de acceso. [](https://www.linkedin.com/posts/flahahmad_the-definitive-guide-to-choosing-the-right-activity-7344260649889267714-AAME)|Más complejidad operativa.|

## Recomendación para ABDFiles

- **Inicio**: bucket compartido con prefijos `tenantId/assetId/versionId`.
    
- **Tenants críticos**: bucket dedicado.
    
- **Migración futura**: permitir mover un tenant o un subset a bucket exclusivo sin cambiar `assetRef`.
    

## 5. Reglas de API para parches

Los parches JSON deben limitarse a un conjunto de campos permitido por policy, para evitar que un cliente modifique atributos estructurales o de seguridad. Si el parche toca `legalHold`, `retentionClass` o `storageRef`, la API debe exigir un rol superior o incluso un flujo separado.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWHCH5FIS&Signature=YupLjouQdJybx5coD%2BTMEOA%2FbcU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQC2oyb8fGpsR9NSjlM3WoVrxOZ1T0%2FDNKKKtOgm5ox%2F0wIgR%2FQBaG1LpofiexLQwLrbaimrYedTrqhtEzeEYptDtAwq8wQIWRABGgw2OTk3NTMzMDk3MDUiDJkaz%2FMcMJVEWmCYyyrQBKlTccwpGh3ZW%2BwNjaCnhV0gyYcO4Xpf8rSBnr0aQjHC2lrvGy1Xpor3Ffo6lBzJqWaPSXZcrNtREJ44mSUhucofLSWvP2JP8dLTrjCdBe0oB321EmcGA5paXmxgQ6926QyR4b%2FnIIsX2DcvtoK1yF%2F6RQau9i51r1ktaQ060sHApk0BIlCQi3C3J4d6X%2BA09pvjqHqzIGlqCGjSHIsEXrTYAjyX1%2BRXt%2FI%2BCA6mEf4VOqWZ2lJcmoZlPt4r3mz88gjO8Awis%2FZJlsK%2BDiHC7AHEu%2FVrEEApQ7NIA0o1yApgyT37PWUARB7s8Y29vAtuc16v5yAuTj6P3TkL0NXaeYXeAbygxI7Yf%2F5JLK3DupOJcCo7l3zwXoH5muXIxcF1gotYOZ0WbN2u0uTFuaV2i0pk8U2nTNB1hFmM4FyN6pG%2F6h9UqC14itEQTsbkZTJzX7GWZJK64eKDgTawx9Z9TrlXidwCnTtl8y3VjOQdaXWZt1XrME3ftgnMg5izweilPaDjNWDHvRYWPZP7EMgGgtef6pEsRAriiq69ZcLxcgq5Z4XaGAaw07mEdijfLInCFIRIcfQVBFBPg8dkMOX0q8ZOmeeFD0iz1zA3Im7DiK%2F8vHqY1XRfjDfILJsCZJR7Jn0%2BMioK%2FDPIT9ayG7rX5l3y7IMkskGrCoA6fwVu%2BCP4pvl7GY7NWFjizVP2gK3wzLsE3fdrGeegZ4ltVs6UVsOb94Ras4P5Gg6W6r4wwIf9iwyxieyxrIZPcwE6Ilvnj%2F2OQ0hgWWLnltpRWdYwnhYw6LKG0QY6mAEVUXB0s4LezigOy5Sja6SMIBBgzB21cjRnfrla9jf8YCtmfmHqNJ0%2FX%2Brw%2FxowFYkBf6l6FaGP%2FcAq%2Frl4NXWGkfvA7wMSlNiJu4oLmsG%2BTA8KnESWAwnF2xRhuZRvi4bd5G8VIjf5FKWc4jvvr6bpYW6awqP0T2hS4x9sYxqN3ttH1awMcJk6p0QA02S%2B9rEwVS82BQntig%3D%3D&Expires=1780590395)

## Campos permitidos por nivel

|Nivel|Campos|
|---|---|
|Básico|`title`, `tags`, `description`.|
|Controlado|`sensitivityLevel`, `spaceLinks`.|
|Restringido|`retentionClass`, `legalHold`, `storageProvider`.|

## 6. Eventos y contratos

Kafka y la API deben compartir una semántica coherente: si un `PATCH` cambia metadatos, el evento correspondiente debe reflejar exactamente el diff aplicado. Eso evita divergencias entre lectura HTTP, proyecciones y auditoría.

## Regla de emisión

1. Validar el parche.
    
2. Aplicar concurrencia optimista.
    
3. Guardar versión/estado.
    
4. Emitir evento de dominio.
    
5. Publicar a Kafka con schema versionado.
    

## 7. Índices para metadatos parchables

Los índices deben soportar lectura, validación de concurrencia y búsqueda multi-tenant. MongoDB recomienda alinear índices con los filtros dominantes, especialmente cuando `tenantId` es parte obligatoria de la consulta.

|Colección|Índice|
|---|---|

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, version: 1 }`|
|`documents`|`{ tenantId: 1, updatedAt: -1 }`|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|

## 8. Cierre

La combinación correcta para ABDFiles es: `PATCH` solo para metadatos acotados, versiones nuevas para cambios de contenido, Kafka con Avro/Protobuf y Schema Registry para eventos, concurrencia optimista por `version` o `etag`, y multi-tenancy en storage con prefijos o buckets dedicados según criticidad.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYEWHCH5FIS&Signature=YupLjouQdJybx5coD%2BTMEOA%2FbcU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQC2oyb8fGpsR9NSjlM3WoVrxOZ1T0%2FDNKKKtOgm5ox%2F0wIgR%2FQBaG1LpofiexLQwLrbaimrYedTrqhtEzeEYptDtAwq8wQIWRABGgw2OTk3NTMzMDk3MDUiDJkaz%2FMcMJVEWmCYyyrQBKlTccwpGh3ZW%2BwNjaCnhV0gyYcO4Xpf8rSBnr0aQjHC2lrvGy1Xpor3Ffo6lBzJqWaPSXZcrNtREJ44mSUhucofLSWvP2JP8dLTrjCdBe0oB321EmcGA5paXmxgQ6926QyR4b%2FnIIsX2DcvtoK1yF%2F6RQau9i51r1ktaQ060sHApk0BIlCQi3C3J4d6X%2BA09pvjqHqzIGlqCGjSHIsEXrTYAjyX1%2BRXt%2FI%2BCA6mEf4VOqWZ2lJcmoZlPt4r3mz88gjO8Awis%2FZJlsK%2BDiHC7AHEu%2FVrEEApQ7NIA0o1yApgyT37PWUARB7s8Y29vAtuc16v5yAuTj6P3TkL0NXaeYXeAbygxI7Yf%2F5JLK3DupOJcCo7l3zwXoH5muXIxcF1gotYOZ0WbN2u0uTFuaV2i0pk8U2nTNB1hFmM4FyN6pG%2F6h9UqC14itEQTsbkZTJzX7GWZJK64eKDgTawx9Z9TrlXidwCnTtl8y3VjOQdaXWZt1XrME3ftgnMg5izweilPaDjNWDHvRYWPZP7EMgGgtef6pEsRAriiq69ZcLxcgq5Z4XaGAaw07mEdijfLInCFIRIcfQVBFBPg8dkMOX0q8ZOmeeFD0iz1zA3Im7DiK%2F8vHqY1XRfjDfILJsCZJR7Jn0%2BMioK%2FDPIT9ayG7rX5l3y7IMkskGrCoA6fwVu%2BCP4pvl7GY7NWFjizVP2gK3wzLsE3fdrGeegZ4ltVs6UVsOb94Ras4P5Gg6W6r4wwIf9iwyxieyxrIZPcwE6Ilvnj%2F2OQ0hgWWLnltpRWdYwnhYw6LKG0QY6mAEVUXB0s4LezigOy5Sja6SMIBBgzB21cjRnfrla9jf8YCtmfmHqNJ0%2FX%2Brw%2FxowFYkBf6l6FaGP%2FcAq%2Frl4NXWGkfvA7wMSlNiJu4oLmsG%2BTA8KnESWAwnF2xRhuZRvi4bd5G8VIjf5FKWc4jvvr6bpYW6awqP0T2hS4x9sYxqN3ttH1awMcJk6p0QA02S%2B9rEwVS82BQntig%3D%3D&Expires=1780590395)[](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)


-----------------

quí tienes el bloque formal para la spec de ABDFiles. Lo he orientado a resolución de conflictos, evolución de esquemas, despliegue con Kafka, cifrado en tránsito y pruebas de regresión para parches JSON.

## 1. Resolución de conflictos

ABDFiles debe resolver escrituras concurrentes con **concurrencia optimista** por defecto, y solo pasar a bloqueo más fuerte cuando un dominio concreto lo justifique. La actualización debe validar una versión o token de estado y rechazar el cambio si el documento fue modificado por otro proceso desde la lectura inicial.

## Reglas

|Regla|Descripción|
|---|---|
|`version` monotónica|Cada documento y metadato tiene un contador de versión.|
|`If-Match` o `etag`|La API rechaza updates si el estado no coincide.|
|Reintento limitado|Solo en errores transitorios.|
|Backoff con jitter|Evita colisiones repetidas. [](https://oneuptime.com/blog/post/2026-03-31-mongodb-how-to-handle-write-conflict-retries-in-mongodb/view)|

## Pseudocódigo

ts

`async function updateWithOptimisticLock(collection, id, expectedVersion, patch, maxRetries = 5) {   for (let i = 0; i < maxRetries; i++) {    const result = await collection.updateOne(      { _id: id, version: expectedVersion },      { $set: patch, $inc: { version: 1 } }    );    if (result.matchedCount === 1) return true;    await sleep(backoffMs(i));  }  throw new Error('Optimistic lock failed'); }`

## 2. Ciclo de vida de esquemas

En Kafka, ABDFiles debe usar Schema Registry con evolución controlada y compatibilidad explícita. La regla operativa es: diseñar primero el esquema, registrar después, y solo permitir cambios compatibles según la política de compatibilidad del subject.[](https://www.youtube.com/watch?v=yX0gFN0MFA8)

## Política sugerida

|Tipo de cambio|Permitido|
|---|---|
|Añadir campo con default|Sí, si la compatibilidad lo permite.|
|Eliminar campo|Solo con revisión de consumidores.|
|Cambiar tipo|No, salvo migración planificada.|
|Renombrar campo|Solo con esquema puente o campos duplicados temporales.|

## Gestión de versiones

- `version` del schema avanza de uno en uno.
    
- `schemaId` se trata como identificador interno, no como contrato semántico.
    
- El despliegue debe usar consumidores primero, productores después.
    
- Los cambios incompatibles requieren nuevo subject o nueva línea de evento.[](https://www.youtube.com/watch?v=yX0gFN0MFA8)
    

## 3. Despliegue con Kafka

El patrón de despliegue recomendado para microservicios de ABDFiles es **consumer-first** con compatibilidad hacia atrás. Primero se despliegan los consumidores capaces de entender el nuevo evento, luego los productores empiezan a emitir la nueva versión del esquema.[](https://www.youtube.com/watch?v=yX0gFN0MFA8)

## Topología

|Componente|Función|
|---|---|
|Producer|Publica eventos de dominio.|
|Consumer|Construye proyecciones y side effects.|
|Schema Registry|Valida evolución de contratos.|
|DLQ|Aísla eventos que no pueden procesarse.|
|Outbox|Evita pérdida de eventos entre DB y Kafka.|

## Secuencia de despliegue

1. Desplegar consumidores compatibles.
    
2. Registrar nuevo esquema compatible.
    
3. Desplegar productores.
    
4. Monitorear lag, errores y replays.
    
5. Retirar soporte antiguo cuando la cola se estabilice.
    

## 4. Seguridad en tránsito

Kafka debe operar con TLS habilitado tanto entre clientes y brokers como entre brokers internos. La seguridad de ABDFiles no debe depender solo de red privada; el transporte cifrado es obligatorio para eventos documentales.

## Medidas mínimas

- TLS para producers y consumers.
    
- TLS entre brokers.
    
- ACLs por topic y por grupo de consumidores.
    
- Autenticación fuerte para clientes.
    
- Rotación de certificados y claves.
    

## Principio

Si el evento contiene metadatos sensibles, el canal debe ser cifrado y, cuando haga falta, el payload también puede ir cifrado a nivel de aplicación.

## 5. Pruebas de regresión

Los parches JSON deben tener una batería de pruebas de regresión para evitar romper contratos de metadatos. Toda modificación de campos parchables debe validar que:

- el parche se aplica solo a campos permitidos;
    
- la versión avanza correctamente;
    
- la concurrencia optimista detecta conflictos;
    
- el evento generado refleja exactamente el diff.
    

## Casos mínimos

|Caso|Esperado|
|---|---|
|Parche válido|Se aplica y se emite evento.|
|Campo no permitido|400 o 403 según política.|
|Versión desactualizada|409 conflicto.|
|Reintento duplicado|No duplica side effects.|
|Legal hold activo|Bloquea cambios sensibles.|

## Pseudocódigo de test

ts

`test('patch metadata preserves versioning and audit', async () => {   const before = await getDoc(assetId);  const res = await patchDocumentMetadata({    assetId,    tenantId,    patch: { title: 'Nuevo título' },    expectedVersion: before.version,    idempotencyKey: 'k1'  });  expect(res.version).toBe(before.version + 1);  expect(await getLastEvent(assetId)).toMatchObject({    type: 'DOCUMENT_METADATA_UPDATED'  }); });`

## 6. Integridad operativa

Cada operación concurrente debe distinguir entre error transitorio y error permanente. Los errores transitorios pueden reintentarse; los permanentes deben devolverse al cliente sin ocultar el conflicto. En MongoDB, los write conflicts y errores transaccionales transitorios suelen requerir reintento completo con backoff exponencial.

## 7. Recomendación final

La combinación más robusta para ABDFiles es:

- concurrencia optimista por `version` o `etag`;
    
- Kafka con Schema Registry y compatibilidad explícita;
    
- despliegue consumer-first;
    
- TLS obligatorio en tránsito;
    
- pruebas de regresión de parches antes de publicar cambios;
    
- reintentos solo para conflictos transitorios.
    

Si quieres, el siguiente paso útil es que te lo convierta en una **sección de spec completa** con subsecciones numeradas, tablas de errores HTTP y diagrama de flujo de desp

______________________

Aquí tienes la **sección de spec completa** para ABDFiles, ya estructurada con numeración, políticas HTTP, blue-green en Kafka, versionado semántico Avro y logs de auditoría para cambios concurrentes.

## 1. Propósito

ABDFiles debe soportar cambios concurrentes, despliegues seguros y evolución de esquemas sin perder trazabilidad ni romper contratos. Esta sección define la política de conflictos HTTP, el flujo de blue-green con Kafka, el versionado semántico de Avro y la estructura mínima de logs de auditoría para operaciones concurrentes.

## 2. Conflictos de concurrencia

ABDFiles resolverá las escrituras concurrentes con concurrencia optimista basada en `version` y `If-Match`, y devolverá errores HTTP según el punto exacto de detección del conflicto. Si el conflicto se detecta en la validación condicional del request, se usará `412 Precondition Failed`; si el conflicto emerge en la lógica de dominio o en la carrera entre operaciones válidas, se usará `409 Conflict`.

## 2.1 Política HTTP

|Situación|Código|Semántica|
|---|---|---|
|`If-Match` no coincide con el estado actual|`412 Precondition Failed`|La precondición HTTP falló.|
|Dos escrituras compiten y una pierde la carrera|`409 Conflict`|Conflicto con el estado actual del recurso.|
|Recurso eliminado o purgado|`410 Gone`|Ya no existe de forma recuperable.|
|Permisos insuficientes|`403 Forbidden`|No autorizado para la acción.|
|Falta de autenticación|`401 Unauthorized`|No hay credenciales válidas.|

## 2.2 Respuesta de error

json

`{   "error": {    "code": "CONCURRENT_UPDATE_CONFLICT",    "httpStatus": 409,    "message": "The document was modified by another request.",    "resource": {      "assetId": "asset-123",      "expectedVersion": 7,      "currentVersion": 8    },    "retryable": false,    "correlationId": "corr-789"  } }`

## 2.3 Reglas operativas

1. Toda operación mutable debe transportar `version` o `If-Match`.
    
2. Si no coincide, no se aplican side effects.
    
3. Los reintentos automáticos solo se permiten en errores transitorios, no en conflictos lógicos.
    
4. El cliente debe volver a leer el recurso antes de reintentar.
    

## 3. Blue-green en Kafka

ABDFiles usará un patrón **blue-green** para servicios consumidores y productores cuando se desplieguen cambios de esquema, lógica de eventos o procesamiento de auditoría. La idea es mantener dos entornos equivalentes, con un corte controlado y rollback rápido si aparecen errores.

## 3.1 Diagrama de flujo

text

             `+----------------------+             |   Blue en producción  |             +----------+-----------+                        |                        | 1. Deploy Green                        v             +----------------------+             |  Green en paralelo   |             +----------+-----------+                        |                        | 2. Consumer validation                        v             +----------------------+             |  Smoke tests + replay |             +----------+-----------+                        |                        | 3. Sync Kafka / topics                        v             +----------------------+             |  Mirror / replication |             +----------+-----------+                        |                        | 4. Switch traffic                        v             +----------------------+             |  Green becomes live   |             +----------+-----------+                        |                        | 5. Monitor & rollback                        v             +----------------------+             |  Keep Blue standby    |             +----------------------+`

## 3.2 Reglas del despliegue

- Los consumidores green deben arrancar antes de que los productores green emitan el nuevo formato.
    
- El sistema no debe mezclar grupos de consumidores blue y green sobre el mismo flujo activo salvo que exista una estrategia explícita de separación.
    
- Si falla el smoke test, el tráfico permanece en blue.
    
- Si falla el post-switch monitoring, el tráfico vuelve a blue sin perder offsets.
    

## 3.3 Política de corte

|Fase|Acción|
|---|---|
|Preflight|Validar compatibilidad de esquemas y consumidores.|
|Shadow|Procesar en green sin afectar la salida final.|
|Cutover|Redirigir producción a green.|
|Observe|Supervisar lag, errores y DLQ.|
|Rollback|Volver a blue si se degrada la operación.|

## 4. Versionado semántico de Avro

ABDFiles adoptará una estrategia de versionado semántico para schemas Avro alineada con compatibilidad hacia atrás, hacia adelante y cambios mayores explícitos. La regla general es que los cambios compatibles se publiquen como incrementos menores o de parche; los incompatibles requieren incremento mayor y despliegue coordinado.

## 4.1 Convención

text

`MAJOR.MINOR.PATCH`

|Tipo de cambio|Versión|
|---|---|
|Campo nuevo con default|MINOR|
|Campo opcional nuevo|MINOR|
|Cambio no rompedor de docu/metadata|PATCH|
|Cambio de tipo o eliminación de campo requerido|MAJOR|
|Renombrado de campo sin alias|MAJOR|

## 4.2 Reglas de compatibilidad

1. **Backward compatible** para la mayoría de cambios operativos.
    
2. **Full compatible** solo si el caso de uso lo soporta y el contrato no se degrada.
    
3. No eliminar campos obligatorios sin ventana de migración.
    
4. Si se renombra un campo, usar alias o mantener ambos campos temporalmente.
    

## 4.3 Política de publicación

- Los schemas se registran antes del despliegue del productor.
    
- El consumidor debe ser capaz de leer la versión anterior y la nueva durante la ventana de transición.
    
- Los subjects deben organizarse por dominio de evento, no por tipo técnico genérico.
    

## 5. Logs de auditoría

Los cambios concurrentes deben dejar una traza completa para auditoría y diagnóstico. ABDFiles registrará tanto el intento como el resultado final, incluyendo los datos de versión, conflicto y correlación.

## 5.1 Estructura mínima

ts

`interface AuditLogEntry {   eventId: string;  tenantId: string;  assetId: string;  versionBefore?: number;  versionAfter?: number;  action:    | 'DOCUMENT_PATCHED'    | 'DOCUMENT_VERSION_CREATED'    | 'DOCUMENT_CONFLICT_DETECTED'    | 'DOCUMENT_PURGED'    | 'DOCUMENT_RESTORED';  actorId: string;  correlationId: string;  traceId: string;  status: 'success' | 'conflict' | 'failed';  httpStatus?: number;  payload: Record<string, unknown>;  createdAt: Date; }`

## 5.2 Campos obligatorios

- `tenantId`.
    
- `assetId`.
    
- `actorId`.
    
- `correlationId`.
    
- `traceId`.
    
- `versionBefore`.
    
- `versionAfter`.
    
- `status`.
    
- `httpStatus`.
    

## 5.3 Reglas de registro

1. Todo conflicto concurrente genera un evento de auditoría.
    
2. La auditoría debe conservar tanto el request fallido como la versión actual encontrada.
    
3. Las entradas de auditoría son append-only.
    
4. Los cambios de esquema Kafka y los errores HTTP relevantes deben quedar enlazados por `correlationId`.
    

## 6. Flujo completo de actualización

text

`1. Cliente obtiene recurso con versión actual. 2. Cliente envía PATCH con If-Match o version. 3. API valida tenant, permisos y legal hold. 4. Si precondición falla → 412. 5. Si carrera de escritura → 409. 6. Si aplica el parche → crear nueva versión lógica si corresponde. 7. Emitir evento Kafka con schema registrado. 8. Escribir entrada de auditoría.`

## 7. Reglas de implementación

- `PATCH` para metadatos parciales.
    
- `POST /versions` para cambios que deban crear versión nueva.
    
- `409` cuando la operación es válida pero entra en conflicto con otra escritura.
    
- `412` cuando la condición de concurrencia falla antes de ejecutar la mutación.
    
- Blue-green con green en sombra antes del corte.
    
- Avro con compatibilidad semántica y Schemas registrados por dominio.
    

## 8. Cierre

Esta sección deja ABDFiles preparado para resolver concurrencia de forma predecible, desplegar consumidores Kafka sin interrupciones, evolucionar esquemas Avro con control, y mantener una auditoría completa de los conflictos y parches.

_______________________________
quí tienes la **sección de spec completa** para ABDFiles, integrada con pruebas de carga, event sourcing, DLQ, CI/CD de esquemas Avro y retención de logs en ABDLogs.

## 1. Propósito

ABDFiles debe validar su comportamiento bajo alta concurrencia, garantizar auditoría completa de parches JSON, aislar fallos de deserialización o compatibilidad en Kafka, automatizar la evolución segura de schemas y conservar logs de auditoría según política.

## 2. Pruebas de carga

ABDFiles ejecutará pruebas de carga periódicas para medir latencia, throughput, colisiones de concurrencia y degradación por tenant. La estrategia debe simular escrituras concurrentes, parches sobre el mismo documento, generación masiva de versiones y reintentos en condiciones de conflicto.

## 2.1 Escenarios mínimos

|Escenario|Objetivo|
|---|---|
|Escritura concurrente sobre el mismo `assetId`|Medir tasa de conflictos y latencia de resolución.|
|Parches masivos de metadatos|Verificar estabilidad de `PATCH` y control optimista.|
|Subida de versiones concurrentes|Validar `version` monotónica.|
|Reproducción de eventos Kafka|Medir lag y capacidad de replay.|
|Saturación de auditoría|Confirmar que ABDLogs no pierde eventos.|

## 2.2 Métricas

- p50, p95 y p99 de endpoints críticos.
    
- tasa de `409/412`.
    
- throughput por tenant.
    
- latencia de escritura en MongoDB.
    
- lag de Kafka.
    
- cola de DLQ.
    
- tasa de reintentos exitosos.
    

## 2.3 Reglas

1. Cada prueba debe correr con datos aislados por tenant.
    
2. Debe incluir al menos un tenant “hot” con carga desbalanceada.
    
3. Debe registrar trazas y eventos de auditoría equivalentes a producción.
    
4. El umbral de aprobación debe ser definido por SLA interno.
    

## 3. Event sourcing para auditoría

ABDFiles debe registrar los cambios de parches JSON como eventos append-only para reconstruir estado y probar integridad histórica. El modelo de lectura puede cambiar, pero el stream de eventos de auditoría no debe mutarse.

## 3.1 Eventos mínimos

|Evento|Significado|
|---|---|
|`DOCUMENT_PATCHED`|Parche de metadatos aplicado.|
|`DOCUMENT_PATCH_REJECTED`|Parche denegado por conflicto o policy.|
|`DOCUMENT_VERSION_CREATED`|Versión nueva creada.|
|`DOCUMENT_CONFLICT_DETECTED`|Concurrencia optimista fallida.|
|`DOCUMENT_PURGED`|Purga física ejecutada.|

## 3.2 Esquema de evento

ts

`interface AuditEvent {   eventId: string;  tenantId: string;  assetId: string;  versionBefore?: number;  versionAfter?: number;  action:    | 'DOCUMENT_PATCHED'    | 'DOCUMENT_PATCH_REJECTED'    | 'DOCUMENT_VERSION_CREATED'    | 'DOCUMENT_CONFLICT_DETECTED'    | 'DOCUMENT_PURGED';  actorId: string;  correlationId: string;  traceId: string;  status: 'success' | 'conflict' | 'failed';  httpStatus?: number;  patch?: Record<string, unknown>;  createdAt: Date; }`

## 3.3 Regla

Cada `PATCH` debe producir:

1. un evento de intento;
    
2. un evento de resultado;
    
3. un enlace por `correlationId` y `traceId`.
    

## 4. DLQ en Kafka

ABDFiles usará dead-letter queues para mensajes que fallen por deserialización, incompatibilidad de schema o lógica de negocio irrecuperable. La DLQ no sustituye el retry; solo absorbe mensajes irreparables o agotados tras reintentos.

## 4.1 Reglas de enrutamiento

|Tipo de fallo|Acción|
|---|---|
|Error de schema|Enviar a DLQ tras validación fallida.|
|Error de deserialización|Reintentar una vez y luego DLQ.|
|Error de negocio no retryable|DLQ directo.|
|Error transitorio|Reintentar con backoff.|

## 4.2 Topic

text

`abdfiles.document.dlq abdfiles.schema.dlq abdfiles.audit.dlq`

## 4.3 Payload DLQ

json

`{   "eventId": "uuid",  "sourceTopic": "abdfiles.document.events",  "tenantId": "tenant-123",  "assetId": "asset-456",  "errorType": "SCHEMA_VALIDATION_ERROR",  "errorMessage": "...",  "rawPayload": "{...}",  "attempts": 3,  "correlationId": "corr-789",  "createdAt": "2026-06-04T18:06:00Z" }`

## 4.4 Reglas operativas

- No bloquear el consumer group por un mensaje malo.
    
- Registrar cada salto a DLQ en ABDLogs.
    
- Exponer métricas de volumen y edad de mensajes en DLQ.
    
- Proveer proceso de replay manual o automatizado.
    

## 5. CI/CD para Avro

La compatibilidad de schemas Avro debe verificarse en CI antes de mergear cambios. El pipeline debe comparar el schema propuesto contra la versión publicada en Schema Registry, usando la API de compatibilidad y una política clara de `BACKWARD`, `FORWARD` o `FULL` según dominio.

## 5.1 Pipeline

1. Lint del schema.
    
2. Diff contra la versión anterior.
    
3. Validación de compatibilidad.
    
4. Generación de artefactos.
    
5. Publicación al registry.
    
6. Tests de contrato con fixtures.
    
7. Deploy solo si pasa todo.
    

## 5.2 Regla de bloqueo

Si `is_compatible=false`, el pipeline falla y no se publica el artefacto.

## 5.3 Test mínimo

bash

`curl -X POST \   -H "Content-Type: application/vnd.schemaregistry.v1+json" \  --data '{"schema":"..."}' \  "http://schema-registry:8081/compatibility/subjects/abdfiles-document-value/versions/latest?verbose=true"`

## 6. Retención de logs en ABDLogs

Los logs de auditoría de ABDLogs deben conservarse según sensibilidad y valor legal. Los logs de seguridad y auditoría requieren más retención que los operativos, y la política debe ser explícita por clase de evento.

## 6.1 Política propuesta

|Tipo de log|Retención|
|---|---|
|Auditoría de seguridad|1 a 3 años o lo que exija la regulación.|
|Auditoría documental|1 a 3 años mínimo.|
|Operacionales|30 a 90 días.|
|DLQ y fallos de schema|90 a 180 días.|

## 6.2 Reglas

- Los logs de auditoría no se borran mientras exista hold legal.
    
- El acceso a logs debe ser restringido por rol.
    
- Los logs deben ser inmutables o WORM cuando sea posible.
    
- Debe haber exportación periódica a almacenamiento de archivo.
    

## 7. Observabilidad de la carga

ABDFiles debe correlacionar pruebas de carga con trazas y eventos reales para identificar cuellos de botella entre API, MongoDB y Kafka. Los picos de `409` y `412` son una señal esperada bajo carga, pero no deben dispararse por encima de los umbrales definidos.

## Métricas críticas

- tasa de conflicto concurrente;
    
- tasa de DLQ;
    
- lag de Kafka;
    
- latencia de escritura por tenant;
    
- tamaño de índices;
    
- tasa de replay de eventos;
    
- errores de compatibilidad de schema.
    

## 8. Cierre

Esta sección deja ABDFiles listo para stress testing realista, auditoría basada en eventos, aislamiento de fallos Kafka con DLQ, validación automática de Avro en CI/CD y retención de logs consistente con una política de gobernanza seria.

-------------

Aquí tienes la **sección de spec completa** para ABDFiles/ABDLogs, lista para pegar. Cubre retención y purga de logs, monitoreo de DLQ en Kafka, tests de mutación para JSON patches, respaldo de Schema Registry e índices MongoDB para alta concurrencia.

## 1. Retención de ABDLogs

ABDLogs deberá conservar los eventos de auditoría según clase de dato, valor legal y necesidad operativa. Los logs de seguridad y auditoría se retendrán más tiempo que los operativos, y ningún log sujeto a hold legal podrá purgarse hasta liberación explícita.

## 1.1 Política de retención

|Tipo de log|Retención mínima|Regla de purga|
|---|---|---|
|Auditoría documental|1 a 3 años|Purga solo tras expiración y sin legal hold.|
|Seguridad|1 a 3 años o más si la regulación lo exige.||
|Operacional|30 a 90 días|Purga automática por TTL o job.|
|DLQ y errores de schema|90 a 180 días|Purga solo tras ventana de análisis.|

## 1.2 Reglas

1. Los eventos de auditoría deben ser append-only.
    
2. Los logs en hold legal no pueden borrarse ni compactarse.
    
3. Los logs operativos pueden ir a almacenamiento más barato tras la ventana caliente.
    
4. La purga debe quedar registrada como evento administrativo.
    

## 2. Monitoreo de Kafka DLQ

La latencia de DLQ debe medirse como tiempo desde el fallo original hasta la entrada en la cola de error, y también como tiempo de permanencia en la DLQ antes de revisión. Kafka monitoring debe seguir métricas de throughput, lag y utilización para detectar acumulación anómala.

## 2.1 Métricas clave

|Métrica|Qué indica|
|---|---|
|`dlq_enqueue_latency_ms`|Tiempo en llegar a DLQ tras el fallo.|
|`dlq_age_seconds`|Edad promedio del mensaje en DLQ.|
|`dlq_volume_total`|Volumen acumulado.|
|`consumer_lag`|Retraso respecto al topic principal.|
|`schema_error_rate`|Fallos por incompatibilidad de esquema.|

## 2.2 Alertas

- Alertar si `consumer_lag` crece de forma sostenida.
    
- Alertar si `dlq_volume_total` supera umbral por tenant.
    
- Alertar si la edad media de DLQ excede la ventana de triage.
    
- Alertar si hay picos de errores de schema o deserialización.
    

## 2.3 Triage

text

`1. Identificar topic y tenant. 2. Clasificar error: schema, deserialización, negocio, timeout. 3. Revisar si es retryable. 4. Reprocesar o mantener en DLQ. 5. Registrar resolución en ABDLogs.`

## 3. Tests de mutación para JSON patches

ABDFiles deberá incluir pruebas de mutación para validar que los parches JSON solo modifican los campos permitidos y que los errores de concurrencia o política son detectados. Los mutation tests ayudan a descubrir reglas demasiado laxas, validaciones incompletas o rutas no cubiertas por tests clásicos.

## 3.1 Objetivos

|Objetivo|Qué valida|
|---|---|
|Campos permitidos|Que el parche no altere metadatos restringidos.|
|Concurrencia|Que `409/412` se disparen donde corresponde.|
|Legal hold|Que no se modifiquen recursos bloqueados.|
|Integridad del evento|Que el diff auditable sea correcto.|

## 3.2 Mutaciones sugeridas

- Eliminar validación de `tenantId`.
    
- Permitir `PATCH` sobre `legalHold`.
    
- Ignorar `If-Match`.
    
- Permitir cambios de `storageRef`.
    
- No incrementar `version`.
    

## 3.3 Regla de aceptación

La suite debe fallar si una mutación permite que:

1. un campo restringido se actualice;
    
2. se ignore un conflicto de versión;
    
3. se emita un evento incorrecto;
    
4. se mutile un documento con legal hold.
    

## 4. Backup y recovery de Schema Registry

El respaldo del Schema Registry debe cubrir esquemas, compatibilidad y configuración de subjects. La restauración debe poder reconstruir el registro sin pérdida de versiones ni incompatibilidades ocultas.

## 4.1 Qué respaldar

|Elemento|Motivo|
|---|---|
|Esquemas por versión|Permite reconstrucción exacta.|
|Compatibilidad por subject|Preserva reglas de evolución.|
|Configuración global y de subject|Evita drift post-restore.|
|Metadatos de registro|Soporta auditoría y trazabilidad.|

## 4.2 Estrategia

1. Exportar todos los subjects y versiones.
    
2. Guardar configuración de compatibilidad.
    
3. Versionar el backup.
    
4. Probar restore en entorno aislado.
    
5. Validar consumidores críticos contra el registro restaurado.
    

## 4.3 Recuperación

ts

`async function restoreSchemaRegistry(snapshot) {   await stopSchemaRegistryWrites();  await loadSubjects(snapshot.subjects);  await restoreCompatibilityRules(snapshot.compatibility);  await verifySchemaIds(snapshot.schemas);  await runConsumerContractTests();  await reopenWrites(); }`

## 5. Índices para alta concurrencia

Los índices de MongoDB deben optimizar `PATCH`, validación de versión, auditoría y búsquedas frecuentes por tenant. MongoDB recomienda construir índices a partir de patrones reales de consulta y vigilar que los datos e índices frecuentes quepan razonablemente en memoria.

## 5.1 Índices base

|Colección|Índice|
|---|---|
|`documents`|`{ tenantId: 1, assetId: 1 }` unique|
|`documents`|`{ tenantId: 1, version: 1 }`|
|`documents`|`{ tenantId: 1, status: 1, updatedAt: -1 }`|
|`document_versions`|`{ tenantId: 1, assetId: 1, versionNumber: -1 }` unique|
|`document_events`|`{ tenantId: 1, assetId: 1, createdAt: -1 }`|
|`document_events`|`{ tenantId: 1, correlationId: 1 }`|
|`processed_webhook_events`|`{ eventId: 1 }` unique|

## 5.2 Índices para patches

- Índice compuesto por `tenantId + assetId + version`.
    
- Índice parcial para documentos `active`.
    
- Índice por `updatedAt` para listados recientes.
    
- Índice por `correlationId` para trazabilidad de auditoría.
    

## 5.3 Reglas

1. Toda operación de parche debe localizar el documento con `tenantId` y `version`.
    
2. No usar scans completos para validación de concurrencia.
    
3. Revisar plan de ejecución cuando crezcan los conflictos.
    
4. Limitar el número total de índices para no penalizar escrituras.
    

## 6. Flujo de operación

text

`1. Llega un PATCH. 2. Se valida tenant, versión y policy. 3. Si el parche falla, se emite evento de rechazo. 4. Si pasa, se incrementa versión y se escribe auditoría. 5. Se publica evento a Kafka. 6. Si el evento falla por schema, va a DLQ. 7. ABDLogs conserva el rastro y la resolución.`

## 7. Cierre

Con esta política, ABDFiles gana control operativo sobre parches concurrentes, y ABDLogs queda preparado para retener solo lo necesario, detectar acumulación de DLQ, respaldar Schema Registry y mantener índices optimizados para cargas altas.

-----------------

Aquí tienes la **sección de spec completa** para ABDFiles/ABDLogs, centrada en alertas DLQ, CI/CD con Schema Registry, anonimización RGPD, recuperación de índices MongoDB/S3 y observabilidad avanzada con OpenTelemetry.

## 1. Alertas DLQ

ABDFiles deberá monitorizar la cola DLQ con alertas basadas en volumen, antigüedad y crecimiento sostenido. El objetivo no es solo detectar fallos, sino anticipar degradación antes de que el DLQ se convierta en backlog operativo.

## Umbrales sugeridos

|Métrica|Umbral|Acción|
|---|---|---|
|`dlq_volume_total`|> N por tenant|Alertar a operación.|
|`dlq_age_seconds`|> ventana de triage|Escalar incidente.|
|`dlq_enqueue_latency_ms`|creciente durante X min|Abrir alerta amarilla.|
|`schema_error_rate`|> umbral de despliegue|Bloquear release.|

## Reglas

1. Las alertas deben segmentarse por `tenantId`.
    
2. Los mensajes DLQ deben clasificarse por causa: schema, deserialización, negocio, timeout.
    
3. Los dashboards deben mostrar volumen, edad media y tendencia de crecimiento.
    
4. Cada alerta debe quedar registrada en ABDLogs con `correlationId`.
    

## 2. CI/CD con Schema Registry

La integración con Schema Registry debe impedir que un cambio incompatible llegue a producción. El pipeline debe validar la compatibilidad del schema propuesto contra la versión publicada y bloquear el despliegue si falla la comprobación.

## Pipeline

text

`1. Lint del schema. 2. Validación sintáctica. 3. Comparación contra versión actual. 4. Check de compatibilidad. 5. Publicación al registry. 6. Tests de contrato. 7. Deploy.`

## Regla de bloqueo

- Si el esquema no es compatible bajo la política definida, el pipeline falla.
    
- Si hay dudas de compatibilidad, se exige revisión manual.
    
- Los cambios de breaking deben ir con versión mayor y ventana de despliegue coordinada.
    

## Ejemplo de verificación

bash

`curl -X POST \   -H "Content-Type: application/vnd.schemaregistry.v1+json" \  --data '{"schema":"..."}' \  "http://schema-registry:8081/compatibility/subjects/abdfiles-document-value/versions/latest?verbose=true"`

## 3. Cifrado y anonimización RGPD

ABDLogs debe cifrar los logs sensibles y anonimizar o seudonimizar los campos que no sean estrictamente necesarios para soporte o auditoría. Bajo RGPD, la minimización de datos es clave: los logs deben retener lo justo y ocultar lo que no aporte valor operativo.

## Política

|Tipo de dato|Tratamiento|
|---|---|
|Identificadores personales|Seudonimización o hash.|
|Tokens y secretos|No loggear nunca.|
|IPs completas|Truncado o máscara si no es necesario conservarlas.|
|Mensajes de error|Sanitización de payloads.|
|Metadatos de auditoría|Cifrado en reposo y acceso restringido.|

## Reglas

1. Los logs deben cifrarse en reposo.
    
2. Los campos sensibles deben anonimizarse antes de persistir.
    
3. El acceso a logs debe ser por rol y con trazabilidad.
    
4. La retención debe respetar legal hold y políticas de expiración.
    

## 4. Disaster Recovery de índices MongoDB y S3

La recuperación ante desastres debe cubrir tanto el metadato en MongoDB como los objetos en S3 o S3-compatible. MongoDB recomienda restauración desde backups y pruebas periódicas; en almacenamiento de objetos, la estrategia debe preservar versiones, hashes y referencias activas.

## Objetivos

|Elemento|Estrategia|
|---|---|
|MongoDB|Backup completo + restauración en entorno aislado.|
|Índices|Rebuild post-restore, no backup separado como fuente primaria.|
|S3|Versioning + copia cruzada o backup externo.|
|Referencias|Reconciliación por `storageRef` y `hash`.|

## Flujo

text

`1. Restaurar MongoDB desde snapshot/PITR. 2. Validar colecciones y consistencia. 3. Rebuild de índices. 4. Reconciliar storageRef con S3. 5. Verificar hashes. 6. Reactivar consumo y webhooks.`

## Reglas

- Los índices se reconstruyen tras el restore si es necesario.
    
- La referencia canónica sigue siendo MongoDB.
    
- El binario se valida por hash antes de reactivar documentos.
    
- Las pruebas DR deben ejecutarse regularmente.
    

## 5. Observabilidad con OpenTelemetry

ABDFiles debe instrumentar Kafka, API, MongoDB y jobs asíncronos con OpenTelemetry para obtener trazas distribuidas de extremo a extremo. Kafka requiere propagación de contexto entre productores y consumidores, además de exportación a un collector central.

## Componentes

|Componente|Función|
|---|---|
|SDK / agent OTel|Captura trazas y métricas.|
|Collector|Agrega, filtra y exporta telemetría.|
|Backend de trazas|Visualización y análisis.|
|Propagación|Mantiene `traceId` a través de Kafka.|

## Campos de span

- `traceId`
    
- `spanId`
    
- `parentSpanId`
    
- `service.name`
    
- `tenantId`
    
- `assetId`
    
- `versionId`
    
- `topic`
    
- `partition`
    
- `offset`
    

## Reglas

1. Cada productor Kafka debe iniciar o continuar un trace.
    
2. Cada consumidor debe enlazar el contexto recibido.
    
3. Los procesos largos deben emitir spans hijos.
    
4. El exporter debe ser OTLP con collector central.
    
5. El muestreo debe ajustarse para no impactar el rendimiento.
    

## 6. Respuesta operativa

## Caso: DLQ creciendo

1. Identificar tenant y topic.
    
2. Clasificar error.
    
3. Bloquear release si es schema.
    
4. Reprocesar si es transitorio.
    
5. Registrar decisión en ABDLogs.
    

## Caso: restore de desastre

1. Restaurar MongoDB.
    
2. Rehacer índices.
    
3. Validar S3.
    
4. Rehabilitar jobs.
    
5. Reanudar tráfico.
    

## 7. Cierre

Esta política deja ABDFiles y ABDLogs preparados para detectar problemas DLQ antes de que se agraven, impedir despliegues con esquemas incompatibles, proteger logs bajo RGPD, recuperarse de fallos de MongoDB/S3 y ofrecer trazabilidad distribuida real con OpenTelemetry.

--------------
Aquí tienes la **sección de spec completa** para ABDFiles/ABDLogs, enfocada en DR para Schema Registry, inmutabilidad en MongoDB, dashboard en Grafana, seguridad Kafka y blue-green con rollback automático en Kubernetes.

## 1. Mitigación en Schema Registry

El Schema Registry debe tener un plan de recuperación ante desastres que preserve esquemas, versiones y políticas de compatibilidad. El respaldo mínimo debe incluir los schemas, la configuración de compatibilidad y los metadatos necesarios para restaurar el estado sin romper consumidores.

## Controles mínimos

- Backup periódico exportando todos los subjects y versiones.
    
- Respaldo de reglas de compatibilidad por subject.
    
- Prueba de restauración en entorno aislado.
    
- Validación de consumidores críticos tras el restore.
    
- Procedimiento de failover documentado con RPO/RTO.
    

## 2. Inmutabilidad en MongoDB

Los eventos de auditoría en MongoDB deben tratarse como registros **append-only**, sin actualización ni borrado lógico salvo por procesos administrativos separados y auditados. MongoDB Atlas soporta auditoría de actividad, lo que refuerza la trazabilidad de cambios y accesos.

## Reglas

|Regla|Aplicación|
|---|---|
|Insert-only|Los eventos solo se insertan.|
|Sin update/delete directo|Ningún usuario de aplicación puede modificar eventos históricos.|
|Colección separada|Auditoría aislada del modelo operativo.|
|Firma/hash opcional|Verificación de integridad de eventos.|

## Controles

1. Bloquear `update` y `delete` en la capa de aplicación.
    
2. Usar roles de solo inserción para el writer de auditoría.
    
3. Registrar cada acceso administrativo.
    
4. Evitar compactación que elimine trazabilidad.
    

## 3. Dashboard en Grafana

El dashboard de observabilidad para ABDFiles debe mostrar salud de API, MongoDB, Kafka, DLQ y Schema Registry en una sola vista. Grafana debe priorizar latencia, errores, lag, volumen DLQ y saturación de índices para identificar degradación antes del incidente.

## Paneles recomendados

|Panel|Métrica|
|---|---|
|Latencia API|p50, p95, p99.|
|Kafka lag|Lag por consumer group.|
|DLQ|Volumen y antigüedad.|
|MongoDB|Tiempo de query y pool de conexiones.|
|Schema Registry|Errores de compatibilidad.|
|Traces|Tasa de spans con error.|

## Reglas del dashboard

- Filtros por `tenantId`, entorno y servicio.
    
- Alertas visuales por umbral y tendencia.
    
- Drill-down desde métrica a trace y log.
    
- Panel de cambios recientes para correlacionar despliegues.
    

## 4. Seguridad en Kafka

Kafka debe operar con autenticación fuerte, RBAC y cifrado en tránsito para todos los listeners. La configuración recomendada combina TLS/mTLS o SASL sobre TLS, ACLs o RBAC de mínimo privilegio, y rotación de credenciales.

## Política

|Control|Exigencia|
|---|---|
|Cifrado en tránsito|TLS 1.3 o TLS equivalente. [](https://www.conduktor.io/glossary/kafka-security-best-practices)|
|Autenticación|mTLS, SASL/SCRAM o mecanismo corporativo.|
|Autorización|RBAC/ACL por servicio y tenant.|
|Principio de mínimo privilegio|Sí. [](https://www.conduktor.io/glossary/kafka-security-best-practices)|

## Reglas

1. Todo cliente Kafka debe autenticarse.
    
2. Todo tráfico debe ir cifrado.
    
3. Los permisos deben auditarse regularmente.
    
4. Las credenciales deben rotarse y no embebirse en código.
    

## 5. Blue-green en Kubernetes

El despliegue de ABDFiles en Kubernetes debe ser blue-green con verificación previa y rollback automático si fallan salud, compatibilidad o métricas críticas. Esta estrategia reduce el riesgo de exponer tráfico a una versión defectuosa y facilita volver al entorno estable.

## Flujo

text

`1. Desplegar versión green. 2. Ejecutar smoke tests y checks de schema. 3. Validar métricas de salud. 4. Cambiar tráfico a green. 5. Vigilar ventana inicial. 6. Si falla, rollback automático a blue.`

## Criterios de rollback

- Aumento de errores 5xx.
    
- Latencia p95 fuera de umbral.
    
- Fallos de compatibilidad de schema.
    
- Crecimiento anómalo de DLQ.
    
- Problemas de conexión a MongoDB o Kafka.
    

## 6. Operación conjunta

El flujo ideal combina DR del Schema Registry, auditoría inmutable, trazas con Grafana y seguridad Kafka. Si el despliegue green introduce una incompatibilidad de schema, el pipeline debe bloquearse o el tráfico debe regresar a blue de forma automática.

## 7. Cierre

Con estas políticas, ABDFiles gana recuperación ante desastres en esquemas, trazabilidad fuerte de auditoría, una observabilidad visual clara, seguridad robusta en Kafka y despliegues reversibles con bajo riesgo operativo.

_______________________

Aquí tienes una **versión de spec lista para pegar** en la arquitectura de ABDFiles/ABDLogs/Analytics. Integra blue-green, mTLS Kafka, alta disponibilidad de Schema Registry, optimización de auditoría Mongo y alertas avanzadas en Grafana, alineada con la base documental y de analíticas de la suite.

## 1. Blue-green en Kubernetes

El despliegue de ABDFiles debe ser **blue-green automatizado** en Kubernetes, con promoción controlada del entorno green y rollback automático si cualquier verificación crítica falla. La suite ya prioriza despliegues reversibles y validación previa de compatibilidad, por lo que el cambio de tráfico debe depender de smoke tests, health checks, compatibilidad de schema y observabilidad inicial.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYETM6FWN7M&Signature=XYyzD1bN5xv9OI7Vfd1prDpH5DI%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIAv8QuZubEoIkOlCY9PCMvsfrpmZB191L8H7311guSLeAiEAv1FC31lBfkTanjPjYKXX2C47KYciNoSzdgsEZT4OoCAq8wQIWRABGgw2OTk3NTMzMDk3MDUiDF1ODbb8JeWRkwu14CrQBNXxoVuV0PHHLryHLQ3WH2MHCKAN6tHmZvRZuePxRYRhaC2LZFyDViSelxHS4yPigozdKRDWlDC8RoKXxtgq%2F8S0INNSkXDViF7S9fWhQPQ94PmvIAt%2F5Hq%2BPvm4HcLbgEHPe5R7fRUo8HiA%2BVoPpZRySjvmQYXnGSPKjiHlkM%2BEhjQ34PJ0CWqGrig0hbxNNiUDBwMLanss%2FuUiv78k0GjhmF6dyIy8QhbAG0N8nGXQFNaz%2FRxCBBz4jGvMlYSizuVfdELByb%2BGTbvdfb1%2B4xvtSeGe1SYBNffBDdq%2FpmaIxHUZb9tkjOvnp2gW81sxRrUtNhq6cDLg0AwNi6Rrn1AMmsUqH75cWEmrJx0ebty76ZIZr8NBP4QFaiUJj7tjyUhXBszlgnfcP%2Fy0hE%2Byg71MTmal%2BreGw4dwpb1UP9oNbXyaLTWN6sDEq2q17CkcHlBjm6ooLQ72QvSBJ%2B%2Beb42XI95O5mfeD5xnl2jlNG%2BywDtTL2Enzm%2FIA3FWDBt29iLC9B4O7rvYrdrEuKg%2BehC6QivXjX4VsqzpRWHtSpozie768036Wb9HJRgLyI1T%2BLf6eJ7p%2FETCcZO3FPz10FJLt%2F9Vinw5ziadVFG8bCTGyL5zXhcj51MtbUahpLqOr7eF%2FvVw24C3TwYZ0NzCMNCCu9s5RAD9S5qlKyFeUa5fzAn8BYQYgZ4bfMNJOgg2zVvJQYzHZvYJa7Um%2FDaKGZTKBoZxcGGKM8UAvAQFLtP06m%2FnrPRhwPqORHymV%2FrsX1bv%2B5xo9yeXhrtkY9C5sDAw87mG0QY6mAEX6JvIx3WXSQVJ3QNr%2F94aW6HIIjvq14oxGMXFzaQRcAgTpZvzWvAO1Epg0rxrNagIMX5%2BzI3zL3xII39Vnji5rfCuOaS%2BLL3Jpm04MP6vJBcxO37PFb5d4G2BWfCqXalzTTdXpgkwL115eOur0fvjHH0fZSYy3UVwscDQozQ8gchDqD44TiDdujmJxILHz5%2BSB9RGc9mcxg%3D%3D&Expires=1780591302)

## Flujo operativo

1. Desplegar `green` con la nueva imagen y configuración.
    
2. Ejecutar smoke tests y checks de readiness/liveness.
    
3. Validar compatibilidad de schemas y contratos.
    
4. Mover tráfico gradualmente o en corte total, según riesgo.
    
5. Vigilar una ventana de estabilización.
    
6. Si aparecen regresiones, ejecutar rollback automático a `blue`.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/53f50cff-0035-4acf-8ea6-6d26825d2db8/ESPECIFICACIONES_DOCUMENTOS.md?AWSAccessKeyId=ASIA2F3EMEYETM6FWN7M&Signature=XYyzD1bN5xv9OI7Vfd1prDpH5DI%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIAv8QuZubEoIkOlCY9PCMvsfrpmZB191L8H7311guSLeAiEAv1FC31lBfkTanjPjYKXX2C47KYciNoSzdgsEZT4OoCAq8wQIWRABGgw2OTk3NTMzMDk3MDUiDF1ODbb8JeWRkwu14CrQBNXxoVuV0PHHLryHLQ3WH2MHCKAN6tHmZvRZuePxRYRhaC2LZFyDViSelxHS4yPigozdKRDWlDC8RoKXxtgq%2F8S0INNSkXDViF7S9fWhQPQ94PmvIAt%2F5Hq%2BPvm4HcLbgEHPe5R7fRUo8HiA%2BVoPpZRySjvmQYXnGSPKjiHlkM%2BEhjQ34PJ0CWqGrig0hbxNNiUDBwMLanss%2FuUiv78k0GjhmF6dyIy8QhbAG0N8nGXQFNaz%2FRxCBBz4jGvMlYSizuVfdELByb%2BGTbvdfb1%2B4xvtSeGe1SYBNffBDdq%2FpmaIxHUZb9tkjOvnp2gW81sxRrUtNhq6cDLg0AwNi6Rrn1AMmsUqH75cWEmrJx0ebty76ZIZr8NBP4QFaiUJj7tjyUhXBszlgnfcP%2Fy0hE%2Byg71MTmal%2BreGw4dwpb1UP9oNbXyaLTWN6sDEq2q17CkcHlBjm6ooLQ72QvSBJ%2B%2Beb42XI95O5mfeD5xnl2jlNG%2BywDtTL2Enzm%2FIA3FWDBt29iLC9B4O7rvYrdrEuKg%2BehC6QivXjX4VsqzpRWHtSpozie768036Wb9HJRgLyI1T%2BLf6eJ7p%2FETCcZO3FPz10FJLt%2F9Vinw5ziadVFG8bCTGyL5zXhcj51MtbUahpLqOr7eF%2FvVw24C3TwYZ0NzCMNCCu9s5RAD9S5qlKyFeUa5fzAn8BYQYgZ4bfMNJOgg2zVvJQYzHZvYJa7Um%2FDaKGZTKBoZxcGGKM8UAvAQFLtP06m%2FnrPRhwPqORHymV%2FrsX1bv%2B5xo9yeXhrtkY9C5sDAw87mG0QY6mAEX6JvIx3WXSQVJ3QNr%2F94aW6HIIjvq14oxGMXFzaQRcAgTpZvzWvAO1Epg0rxrNagIMX5%2BzI3zL3xII39Vnji5rfCuOaS%2BLL3Jpm04MP6vJBcxO37PFb5d4G2BWfCqXalzTTdXpgkwL115eOur0fvjHH0fZSYy3UVwscDQozQ8gchDqD44TiDdujmJxILHz5%2BSB9RGc9mcxg%3D%3D&Expires=1780591302)
    

## Criterios de rollback

- Error rate por encima del umbral.
    
- Latencia p95/p99 fuera de SLO.
    
- Incremento anómalo de DLQ.
    
- Fallos de compatibilidad de schema.
    
- Errores de conexión a MongoDB, S3 o Kafka.
    

## 2. mTLS en Kafka

Kafka debe operar con **mTLS end-to-end** para productores, consumidores y clientes administrativos, complementado con autorización por roles o ACLs. La documentación de Confluent recomienda mTLS y RBAC como base de seguridad en brokers de Kafka en producción.

## Reglas mínimas

|Control|Requisito|
|---|---|
|Cifrado en tránsito|Obligatorio para todos los listeners.|
|Autenticación|Certificados cliente-servidor con mTLS. [](https://docs.confluent.io/platform/current/kafka/configure-mds/mutual-tls-auth-rbac.html)|
|Autorización|RBAC o ACL por servicio/tenant.|
|Rotación|Certificados y secretos con cadencia definida.|
|Zero trust|Sin acceso implícito entre topics. [](https://www.conduktor.io/glossary/kafka-security-best-practices)|

## Operación recomendada

- Listener interno solo para tráfico autenticado.
    
- Un certificado por servicio o dominio funcional.
    
- Separación de permisos entre producer, consumer y admin.
    
- Validación periódica de expiración de certificados.
    
- Auditoría de altas y revocaciones en ABDLogs.
    

## 3. Alta disponibilidad de Schema Registry

Schema Registry debe diseñarse con disponibilidad alta y recuperación rápida ante fallos, preservando esquemas, versiones y configuración de compatibilidad. Los backups deben incluir schemas, compatibilidad y metadatos; el failover debe estar probado en entorno aislado.

## Patrón propuesto

- Despliegue redundante del servicio.
    
- Persistencia y backup del estado de schemas y subjects.
    
- Réplica o linking entre regiones si aplica.
    
- Failover documentado con RPO/RTO explícitos.
    
- Validación post-restore con consumidores críticos.
    

## Reglas

1. No publicar cambios de schema sin backup previo.
    
2. No asumir que el registry “se reconstruye solo”.
    
3. Probar restauración completa con versiones antiguas.
    
4. Verificar compatibilidad tras failover antes de reabrir escrituras.
    

## 4. Queries de auditoría Mongo

Las colecciones de auditoría inmutables en MongoDB deben optimizarse con índices compuestos orientados a los patrones reales de consulta: `tenantId`, `entityId`, `action`, `createdAt` y `correlationId`. MongoDB recomienda diseñar índices según query patterns, ratio lectura/escritura y uso de memoria; además, la auditoría nativa ayuda a reforzar trazabilidad.

## Índices sugeridos

|Colección|Índice|
|---|---|
|`audit_events`|`{ tenantId: 1, entityId: 1, createdAt: -1 }`|
|`audit_events`|`{ tenantId: 1, correlationId: 1 }`|
|`audit_events`|`{ tenantId: 1, action: 1, createdAt: -1 }`|
|`dlq_events`|`{ tenantId: 1, sourceTopic: 1, createdAt: -1 }`|

## Reglas de consulta

- Filtrar siempre por `tenantId`.
    
- Proyectar solo campos necesarios.
    
- Evitar scans completos en búsquedas de auditoría.
    
- Usar paginación por cursor.
    
- Separar consultas operativas de reportes agregados.
    

## 5. Alertas avanzadas Grafana

El dashboard de Grafana para ABDFiles debe combinar métricas de Kafka, DLQ, MongoDB, API y Schema Registry en una vista de operación. La plataforma de analíticas de la suite ya usa vistas materializadas, caché y paneles orientados a latencia, lag y seguridad, así que el dashboard debe alertar por tendencia, no solo por valor absoluto.[](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/20816342/d01a1449-82ce-4e96-a5ab-e5f8ef06073c/ESPECIFICACIONES_ANALYTICS-3.md?AWSAccessKeyId=ASIA2F3EMEYETM6FWN7M&Signature=MjIFis0O3U6pMWN0gLTVtew%2FkdU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIAv8QuZubEoIkOlCY9PCMvsfrpmZB191L8H7311guSLeAiEAv1FC31lBfkTanjPjYKXX2C47KYciNoSzdgsEZT4OoCAq8wQIWRABGgw2OTk3NTMzMDk3MDUiDF1ODbb8JeWRkwu14CrQBNXxoVuV0PHHLryHLQ3WH2MHCKAN6tHmZvRZuePxRYRhaC2LZFyDViSelxHS4yPigozdKRDWlDC8RoKXxtgq%2F8S0INNSkXDViF7S9fWhQPQ94PmvIAt%2F5Hq%2BPvm4HcLbgEHPe5R7fRUo8HiA%2BVoPpZRySjvmQYXnGSPKjiHlkM%2BEhjQ34PJ0CWqGrig0hbxNNiUDBwMLanss%2FuUiv78k0GjhmF6dyIy8QhbAG0N8nGXQFNaz%2FRxCBBz4jGvMlYSizuVfdELByb%2BGTbvdfb1%2B4xvtSeGe1SYBNffBDdq%2FpmaIxHUZb9tkjOvnp2gW81sxRrUtNhq6cDLg0AwNi6Rrn1AMmsUqH75cWEmrJx0ebty76ZIZr8NBP4QFaiUJj7tjyUhXBszlgnfcP%2Fy0hE%2Byg71MTmal%2BreGw4dwpb1UP9oNbXyaLTWN6sDEq2q17CkcHlBjm6ooLQ72QvSBJ%2B%2Beb42XI95O5mfeD5xnl2jlNG%2BywDtTL2Enzm%2FIA3FWDBt29iLC9B4O7rvYrdrEuKg%2BehC6QivXjX4VsqzpRWHtSpozie768036Wb9HJRgLyI1T%2BLf6eJ7p%2FETCcZO3FPz10FJLt%2F9Vinw5ziadVFG8bCTGyL5zXhcj51MtbUahpLqOr7eF%2FvVw24C3TwYZ0NzCMNCCu9s5RAD9S5qlKyFeUa5fzAn8BYQYgZ4bfMNJOgg2zVvJQYzHZvYJa7Um%2FDaKGZTKBoZxcGGKM8UAvAQFLtP06m%2FnrPRhwPqORHymV%2FrsX1bv%2B5xo9yeXhrtkY9C5sDAw87mG0QY6mAEX6JvIx3WXSQVJ3QNr%2F94aW6HIIjvq14oxGMXFzaQRcAgTpZvzWvAO1Epg0rxrNagIMX5%2BzI3zL3xII39Vnji5rfCuOaS%2BLL3Jpm04MP6vJBcxO37PFb5d4G2BWfCqXalzTTdXpgkwL115eOur0fvjHH0fZSYy3UVwscDQozQ8gchDqD44TiDdujmJxILHz5%2BSB9RGc9mcxg%3D%3D&Expires=1780591302)

## Paneles recomendados

|Panel|Métrica|
|---|---|
|Kafka consumer lag|Lag por consumer group. [](https://oneuptime.com/blog/post/2026-01-25-monitor-consumer-lag-kafka/view)|
|DLQ|Volumen, edad media y crecimiento.|
|MongoDB|Latencia de query e índices más usados.|
|Schema Registry|Errores de compatibilidad y publish failures.|
|OpenTelemetry traces|Spans con error y saturación por servicio.|

## Alertas

- Lag sostenido durante N minutos.
    
- DLQ con crecimiento acelerado por tenant.
    
- Error rate de schema por encima de umbral.
    
- Latencia p95 de consultas de auditoría fuera de SLO.
    
- Caídas de trazas o pérdida de spans en un servicio crítico.
    

## 6. Secuencia de control

text

`1. CI valida schema y contratos. 2. Kubernetes despliega green. 3. Grafana observa health, lag y DLQ. 4. Kafka opera con mTLS y RBAC. 5. MongoDB responde a queries indexadas. 6. Si algo falla, rollback a blue. 7. ABDLogs registra toda la secuencia.`

## 7. Encaje arquitectónico

Esta propuesta encaja con la base existente de la suite: ABDFiles conserva el patrón de despliegue seguro y reversible, ABDAnalytics aporta el cuadro de mando de telemetría, y ABDLogs actúa como fuente inmutable de evidencia operativa. Además, las reglas de seguridad y aislamiento por tenant se mantienen coherentes con la gobernanza multi-aplicación ya definida.

___________________
Sí: lo correcto es separar **la política contractual y de auditoría** de la implementación técnica. La política debe vivir como documento formal, versionado, aprobable y firmable por tenant, mientras que los detalles técnicos quedan como anexos operativos internos.

## Enfoque documental

Te conviene crear un bloque de documentos con tres capas: **política marco**, **anexo por servicio** y **registro de evidencias**. La política marco define principios, responsabilidades, retención, seguridad, acceso, borrado y auditoría; el anexo traduce eso a cada producto o tenant sin convertirlo en código.

## Qué debe incluir

Las cláusulas útiles para contrato con tenant suelen cubrir:

- clasificación de datos y finalidad del tratamiento;
    
- retención y eliminación segura;
    
- acceso por roles y trazabilidad;
    
- cifrado en tránsito y en reposo;
    
- anonimización o seudonimización de datos sensibles;
    
- disponibilidad de evidencias y auditorías;
    
- responsabilidades del tenant y del proveedor;
    
- subencargados, backups y recuperación;
    
- notificación y gestión de incidentes.
    

## Formato recomendado

Te recomiendo estructurarlo como un **documento de política operativa para auditoría**, no como un spec técnico. Ese documento debe incluir lenguaje contractual, por ejemplo: “El proveedor conservará los logs de auditoría durante X tiempo”, “El acceso a los registros estará restringido a personal autorizado”, o “La información sensible se cifrará y se eliminará mediante procedimientos verificados al vencimiento”.

## Paquete mínimo

Para que quede bien cerrado con tenants, prepara estos 4 artefactos:

1. Política general de tratamiento y retención.
    
2. Anexo de seguridad y confidencialidad.
    
3. Anexo de continuidad, backup y recuperación.
    
4. Registro de evidencias y revisiones periódicas.
    

## Siguiente paso

Puedo redactarte ahora mismo una **versión contractual en español**, lista para pegar en un acuerdo con tenant, con secciones como “Retención”, “Acceso”, “Cifrado”, “Purgado”, “Auditoría” y “Recuperación”.

__________________
Te dejo una **plantilla contractual en español** pensada para pegar en el anexo o acuerdo de tenant, con redacción de auditoría y no técnica, y con secciones reutilizables para ABDFiles. Las cláusulas de notificación, RACI y portabilidad se apoyan en prácticas y referencias de notificación de incidentes, retención, RACI y derecho de portabilidad bajo RGPD.

## Texto contractual base

**Anexo de Seguridad, Auditoría y Tratamiento de la Información**

## 1. Objeto

El presente Anexo establece las condiciones de seguridad, confidencialidad, conservación, acceso, eliminación, auditoría y recuperación aplicables al tratamiento de la información del Tenant por parte del Proveedor.

## 2. Retención

El Proveedor conservará los datos, registros y evidencias de auditoría únicamente durante el plazo necesario para la finalidad contractual, el cumplimiento normativo y la atención de incidencias, o durante el plazo adicional que resulte exigible por ley o por obligación de conservación.

## 3. Acceso

El acceso a la información del Tenant quedará restringido al personal estrictamente autorizado, sujeto a deber de confidencialidad, principio de mínimo privilegio y trazabilidad de accesos. Toda solicitud excepcional de acceso deberá quedar registrada y justificada.

## 4. Cifrado

El Proveedor aplicará medidas de cifrado adecuadas para proteger la información en tránsito y, cuando corresponda, en reposo, especialmente respecto de datos sensibles, credenciales, evidencias y registros de auditoría.

## 5. Purgado

Una vez vencido el plazo de conservación aplicable, el Proveedor procederá a la eliminación o anonimización segura de la información, salvo que exista suspensión legal, requerimiento de autoridad competente o instrucción expresa del Tenant dentro del marco contractual.

## 6. Auditoría

El Proveedor mantendrá registros suficientes para acreditar el cumplimiento de este Anexo, incluyendo accesos, exportaciones, modificaciones administrativas, eventos de seguridad y operaciones de borrado o restauración. El Tenant podrá solicitar revisiones razonables de auditoría conforme a las condiciones pactadas.

## 7. Recuperación

El Proveedor mantendrá procedimientos de respaldo y recuperación orientados a preservar la continuidad del servicio y la integridad de la información, incluyendo pruebas periódicas de restauración y verificación de la recuperabilidad de los datos críticos.

## Cláusula de incidentes

**Notificación de incidentes de seguridad.**  
El Proveedor notificará al Tenant, sin dilación indebida y dentro del plazo máximo pactado en el contrato principal, cualquier incidente de seguridad que afecte o pueda afectar a la confidencialidad, integridad, disponibilidad o trazabilidad de la información tratada. La notificación incluirá, cuando sea razonablemente posible, la naturaleza del incidente, el alcance estimado, las medidas adoptadas, los riesgos potenciales y las acciones de contención o remediación.

## Matriz RACI

|Actividad|Proveedor|Tenant|
|---|---|---|
|Definir política marco de seguridad y auditoría|R|A|
|Aplicar controles operativos de seguridad|R|I|
|Clasificar información y niveles de sensibilidad|C|A|
|Aprobar retención contractual específica|C|A|
|Notificar incidentes relevantes|R|I|
|Confirmar impacto en negocio y priorización|I|R|
|Solicitar exportación o portabilidad|R|A|
|Validar borrado final al cierre contractual|R|A|

En esta matriz, **R** indica responsable de ejecución, **A** aprobación final, **C** consulta y **I** información. Este tipo de reparto de responsabilidades se usa habitualmente para dejar claro quién hace qué en incidentes y controles de seguridad.

## Procedimiento de auditoría de terceros

## 1. Solicitud

Toda auditoría de terceros deberá solicitarse por escrito, indicando alcance, motivo, período, información requerida y medidas de confidencialidad aplicables.

## 2. Evaluación

El Proveedor evaluará la solicitud para confirmar que no compromete secretos comerciales, datos de otros tenants, disponibilidad del servicio ni obligaciones legales de seguridad.

## 3. Ejecución

La auditoría se realizará en ventanas acordadas, con alcance limitado, acceso supervisado y evidencia documentada. El tercero auditor deberá estar sujeto a obligaciones de confidencialidad equivalentes.

## 4. Cierre

Finalizada la auditoría, el tercero emitirá un informe con hallazgos y el Proveedor conservará la evidencia mínima necesaria para trazabilidad y cumplimiento.

## Cláusula de portabilidad

**Derechos de acceso y portabilidad de datos.**  
El Tenant podrá solicitar, respecto de los datos que le correspondan y que sean legal y técnicamente portables, una copia en formato estructurado, de uso común y lectura mecánica, así como la transmisión directa a otro proveedor cuando ello sea técnicamente posible y jurídicamente procedente. Esta solicitud no afectará a obligaciones de conservación, seguridad, confidencialidad ni a datos de terceros.

## Guía de uso

Para que te sirva en contrato real, conviene añadir:

- plazo exacto de notificación de incidentes;
    
- plazos de retención por categoría;
    
- si la portabilidad incluye solo datos del tenant o también exportaciones operativas;
    
- procedimiento de borrado al término del contrato;
    
- obligación de confidencialidad reforzada para auditores externos.
    

Puedo convertir esto en un **Anexo legal completo, con estilo más formal y listo para firma**, o en una **versión corta tipo cláusulas numeradas** para integrar directamente en un MSA o DPA.

______________________

A continuación tienes una **versión contractual formal**, pensada para integrarse como **Anexo** en un MSA o DPA, con redacción más específica para cumplimiento **GDPR** y con cláusulas de SLA y brechas de seguridad. El texto está formulado en estilo jurídico-operativo y mantiene un enfoque compatible con contratos entre responsable y encargado del tratamiento.

## Anexo de Seguridad y Tratamiento

**ANEXO [X] — SEGURIDAD, CONFIDENCIALIDAD, RETENCIÓN, AUDITORÍA Y RECUPERACIÓN**

El presente Anexo forma parte integrante del Contrato Principal suscrito entre el Cliente o Tenant, en calidad de responsable del tratamiento cuando corresponda, y el Proveedor, en calidad de encargado del tratamiento o prestador de servicios, según resulte aplicable. Su finalidad es establecer las condiciones de tratamiento de datos, seguridad, conservación, acceso, eliminación, auditoría, recuperación y notificación de incidentes, de conformidad con la normativa de protección de datos aplicable, incluyendo el Reglamento (UE) 2016/679 (“GDPR”).

## 1. Objeto

1.1. El Proveedor tratará los datos personales y demás información del Tenant exclusivamente para la prestación de los servicios contratados, siguiendo las instrucciones documentadas del Tenant y las estipulaciones del Contrato Principal.  
1.2. El Proveedor no utilizará los datos para fines propios, salvo obligación legal o autorización expresa y documentada del Tenant.

## 2. Retención

2.1. El Proveedor conservará los datos únicamente durante el tiempo necesario para la prestación del servicio, el cumplimiento de obligaciones legales, la gestión de reclamaciones y la preservación de evidencias de auditoría.  
2.2. Finalizado el plazo aplicable, los datos serán eliminados, anonimizados o devueltos, según corresponda y salvo que exista obligación legal de conservación o suspensión de borrado por instrucción válida del Tenant.  
2.3. Cuando el Tenant establezca periodos de retención específicos, estos prevalecerán siempre que sean compatibles con la normativa aplicable y las obligaciones legales del Proveedor.

## 3. Acceso

3.1. El acceso a la información del Tenant quedará limitado al personal autorizado que necesite conocerla para la prestación del servicio.  
3.2. El Proveedor aplicará principios de mínimo privilegio, segregación de funciones, trazabilidad de accesos y revisión periódica de permisos.  
3.3. Toda excepción de acceso administrativo o extraordinario deberá quedar debidamente justificada, autorizada y registrada.

## 4. Cifrado

4.1. El Proveedor aplicará medidas de cifrado adecuadas para proteger los datos en tránsito y, cuando proceda, en reposo.  
4.2. Las credenciales, claves, tokens y demás secretos no deberán almacenarse en texto plano ni incorporarse indebidamente a registros o evidencia documental.  
4.3. El Proveedor mantendrá controles para la gestión segura de claves, su rotación y la revocación oportuna de certificados o credenciales comprometidas.

## 5. Purgado y destrucción

5.1. Vencido el plazo de retención aplicable, el Proveedor procederá a la eliminación segura de los datos y evidencias, salvo conservación obligatoria por ley, requerimiento de autoridad competente o instrucción expresa del Tenant.  
5.2. La destrucción o anonimización deberá realizarse por medios razonables y verificables, dejando constancia de la operación y su fecha.

## 6. Auditoría

6.1. El Proveedor mantendrá registros suficientes para acreditar el cumplimiento de este Anexo, incluyendo accesos, exportaciones, modificaciones administrativas, restauraciones, borrados y eventos de seguridad.  
6.2. El Tenant podrá solicitar auditorías razonables, directas o a través de terceros debidamente obligados a confidencialidad, siempre con preaviso suficiente y sin menoscabo de la seguridad, continuidad o secreto empresarial del Proveedor o de otros clientes.  
6.3. Las evidencias generadas durante la auditoría se conservarán durante el plazo estrictamente necesario para fines de trazabilidad, cumplimiento y resolución de incidencias.

## 7. Recuperación

7.1. El Proveedor mantendrá mecanismos de copia de seguridad, recuperación y restauración adecuados a la criticidad del servicio.  
7.2. Dichos mecanismos serán probados periódicamente y documentados, de modo que el Proveedor pueda restaurar los datos dentro de los objetivos de recuperación pactados.  
7.3. La información recuperada se validará antes de su puesta en producción para evitar alteraciones, corrupción o pérdida de integridad.

## SLA

## 8. Niveles de servicio

8.1. El Proveedor prestará el servicio conforme a los niveles de disponibilidad, tiempo de respuesta, resolución de incidencias y recuperación que se definan en el Anexo de SLA o en el Contrato Principal.[](https://www.youtube.com/watch?v=fO5l8RipohU)  
8.2. Los indicadores de servicio deberán ser medibles, trazables y revisables periódicamente, incluyendo, al menos, disponibilidad, tiempos de atención, tiempos de restauración y ventanas de mantenimiento.  
8.3. El incumplimiento reiterado de los niveles de servicio podrá dar lugar a medidas correctoras, créditos de servicio o las consecuencias contractuales previstas en el Contrato Principal.

## Brechas de seguridad

## 9. Notificación de incidentes

9.1. El Proveedor notificará al Tenant, sin dilación indebida y dentro del plazo contractual aplicable, cualquier brecha de seguridad que afecte o pueda afectar a la confidencialidad, integridad, disponibilidad o trazabilidad de los datos tratados.  
9.2. La notificación incluirá, en la medida en que sea razonablemente posible, la naturaleza del incidente, la categoría y volumen estimado de datos afectados, el posible impacto, las medidas de contención adoptadas y las acciones correctoras previstas.  
9.3. Cuando el incidente implique datos personales y resulte aplicable, el Proveedor cooperará con el Tenant para facilitar el cumplimiento de las obligaciones de notificación a la autoridad de control y, en su caso, a los interesados.

## GDPR

## 10. Cumplimiento bajo GDPR

10.1. El Proveedor tratará los datos personales conforme a las instrucciones documentadas del Tenant y aplicará medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo.  
10.2. El Proveedor no subcontratará tratamientos a terceros sin la autorización previa que corresponda conforme al contrato y al GDPR.  
10.3. El Proveedor apoyará al Tenant en el ejercicio de los derechos de los interesados, incluyendo acceso, rectificación, supresión, limitación, oposición y portabilidad, en la medida en que sean aplicables.  
10.4. La portabilidad se facilitará respecto de los datos personales del interesado en formato estructurado, de uso común y lectura mecánica, cuando proceda legalmente.

## Portabilidad

## 11. Acceso y portabilidad

11.1. El Tenant o, cuando proceda, el interesado, podrá solicitar la entrega de sus datos en un formato estructurado, de uso común y lectura mecánica, sin perjuicio de los derechos de terceros ni de las obligaciones legales de conservación.  
11.2. Cuando sea técnicamente posible y jurídicamente procedente, el Proveedor colaborará en la transmisión directa de los datos a otro proveedor indicado por el Tenant o el interesado.

## Cierre

Si prefieres una versión más ejecutiva, también puedo convertir esto en una **cláusula compacta de 1–2 páginas** para firma rápida, o en un **DPA completo con definiciones, subencargados, auditoría, transferencia internacional y jurisdicción**.

----------------------
Abajo tienes dos versiones: una **cláusula compacta** para firma rápida y un **DPA completo** para usar como anexo formal. Ambas están redactadas en tono contractual y alineadas con obligaciones típicas del GDPR sobre contrato de tratamiento, subencargados, notificación de brechas, portabilidad y asignación de responsabilidad.

## 1. Cláusula compacta

**ANEXO DE PROTECCIÓN DE DATOS, SEGURIDAD Y NIVEL DE SERVICIO**

Las Partes acuerdan que el Proveedor tratará los datos personales por cuenta del Tenant exclusivamente conforme a sus instrucciones documentadas y para la prestación de los servicios contratados, aplicando medidas técnicas y organizativas apropiadas al riesgo, incluyendo control de acceso, cifrado en tránsito y, cuando proceda, en reposo, registro de actividades, gestión segura de credenciales, copias de seguridad y procedimientos de recuperación.

El Proveedor conservará la información únicamente durante el plazo necesario para la prestación del servicio, el cumplimiento de obligaciones legales, la atención de reclamaciones y la conservación de evidencias de auditoría, y procederá a su supresión, anonimización o devolución al término de dicho plazo, salvo obligación legal de conservación o instrucción válida del Tenant.

El acceso a la información quedará limitado al personal autorizado bajo principio de mínimo privilegio, con trazabilidad de accesos y obligación reforzada de confidencialidad. El Proveedor no incorporará subencargados sin la autorización prevista en el Contrato Principal y asegurará que dichos subencargados asuman obligaciones equivalentes a las previstas en el presente Anexo.

El Proveedor notificará al Tenant, sin dilación indebida y dentro del plazo contractual aplicable, cualquier brecha de seguridad que afecte o pueda afectar a datos personales o información confidencial, indicando naturaleza del incidente, alcance estimado, medidas de contención y acciones correctoras.

A solicitud del Tenant o del interesado, el Proveedor facilitará la portabilidad de los datos personales en formato estructurado, de uso común y lectura mecánica, cuando legalmente proceda, y colaborará razonablemente en la restitución o transmisión de dichos datos al vencimiento del contrato o a su terminación anticipada.

El Proveedor prestará el servicio conforme a los niveles de disponibilidad, continuidad, tiempos de atención y recuperación definidos en el Anexo de SLA, y la falta reiterada de cumplimiento habilitará las medidas contractuales previstas en el Contrato Principal.

La responsabilidad de cada Parte por daños, incidentes o incumplimientos se regirá por el Contrato Principal, sin perjuicio de las obligaciones imperativas aplicables conforme al GDPR y demás normativa vigente.

## 2. DPA completo

## A. Definiciones

A efectos del presente DPA:

- **“Datos Personales”**: cualquier información sobre una persona física identificada o identificable.
    
- **“Tratamiento”**: cualquier operación realizada sobre datos personales.
    
- **“Responsable”**: la parte que determina los fines y medios del tratamiento.
    
- **“Encargado”**: la parte que trata datos por cuenta del Responsable.
    
- **“Subencargado”**: tercero autorizado por el Encargado para realizar parte del tratamiento.
    

## B. Objeto y duración

El Encargado tratará los Datos Personales exclusivamente por cuenta del Responsable, durante la vigencia del Contrato Principal y mientras sea necesario para prestar los servicios, ejecutar instrucciones documentadas o cumplir obligaciones legales.

## C. Instrucciones

El Encargado se obliga a tratar los datos únicamente conforme a instrucciones documentadas del Responsable. Si el Encargado considera que una instrucción infringe el GDPR u otra normativa aplicable, deberá informar de ello al Responsable sin dilación indebida.

## D. Medidas de seguridad

El Encargado aplicará medidas técnicas y organizativas apropiadas al riesgo, incluyendo:

- control de accesos y segregación de funciones;
    
- cifrado en tránsito y, cuando proceda, en reposo;
    
- registro y monitorización de actividad;
    
- gestión de copias de seguridad y restauración;
    
- gestión de vulnerabilidades y respuesta a incidentes;
    
- destrucción segura y anonimización cuando proceda.
    

## E. Confidencialidad

El personal autorizado del Encargado estará sujeto a obligaciones de confidencialidad y recibirá acceso mínimo necesario para la prestación del servicio. El Encargado documentará y revisará periódicamente los accesos concedidos.

## F. Subencargados

El Encargado no contratará ni sustituirá subencargados sin la autorización previa acordada en el Contrato Principal. Todo subencargado estará sujeto a un contrato escrito que imponga obligaciones de protección de datos, seguridad, confidencialidad, asistencia al Responsable y soporte en incidentes, al menos equivalentes a las del presente DPA.

## G. Notificación de brechas

En caso de brecha de seguridad que afecte a datos personales tratados por el Encargado, este notificará al Responsable sin dilación indebida y, en todo caso, dentro del plazo contractual máximo pactado. La notificación incluirá, en la medida razonablemente posible, naturaleza del incidente, categorías y volumen aproximado de datos afectados, consecuencias probables, medidas de mitigación adoptadas y acciones correctoras previstas.

## H. Asistencia al Responsable

El Encargado prestará asistencia razonable al Responsable para:

- atender solicitudes de derechos de los interesados;
    
- realizar evaluaciones de impacto, si proceden;
    
- gestionar investigaciones o requerimientos de autoridad;
    
- documentar incidentes y evidencias de cumplimiento.
    

## I. Portabilidad y devolución

A la terminación del contrato o a solicitud del Responsable, el Encargado devolverá o pondrá a disposición los datos del Responsable en formato estructurado, de uso común y lectura mecánica, cuando sea legal y técnicamente viable, y suprimirá las copias restantes salvo obligación legal de conservación.

## J. Retención y supresión

El Encargado conservará los datos solo durante el tiempo necesario para la prestación del servicio y el cumplimiento de la ley. Finalizado dicho plazo, procederá a su supresión segura, anonimización o bloqueo conforme a la instrucción documentada del Responsable y la normativa aplicable.

## K. Auditoría

El Responsable podrá solicitar auditorías razonables, propias o por tercero obligado a confidencialidad, para verificar el cumplimiento del presente DPA. El Encargado conservará evidencias suficientes de cumplimiento y facilitará información razonable, siempre que ello no comprometa la seguridad, la confidencialidad de otros clientes ni secretos empresariales.

## L. SLA

El Encargado prestará los servicios conforme a los niveles de servicio pactados en el SLA, que formará parte integrante del Contrato Principal. Dicho SLA deberá definir, como mínimo, disponibilidad, tiempo de respuesta, tiempo de recuperación, ventanas de mantenimiento y umbrales de escalado.[](https://www.purple.ai/en-gb/blogs/service-level-agreements-example)[](https://www.youtube.com/watch?v=fO5l8RipohU)[](https://www.cio.com/article/274740/outsourcing-sla-definitions-and-solutions.html)

## M. Limitación de responsabilidad

La responsabilidad de las Partes se regirá por el Contrato Principal, sin perjuicio de las responsabilidades imperativas que no puedan excluirse o limitarse conforme al GDPR. Cualquier cláusula de limitación se interpretará de forma compatible con la normativa aplicable y no afectará a las obligaciones legales frente a autoridades o interesados.

## N. Ley aplicable y jurisdicción

El presente DPA se interpretará conforme a la ley aplicable indicada en el Contrato Principal. En caso de controversia, las Partes se someten a los tribunales pactados en dicho contrato, sin perjuicio de las competencias inderogables de las autoridades de protección de datos.

## 3. Cláusulas adicionales solicitadas

## Limitación de responsabilidad por incidentes

El Proveedor no responderá por daños derivados de instrucciones del Tenant contrarias a la normativa aplicable, uso indebido del servicio por usuarios del Tenant o incumplimientos de seguridad imputables a terceros no controlados por el Proveedor, sin perjuicio de su responsabilidad por incumplimientos propios o por tratamiento no autorizado.

## Política de notificación de brechas

Toda brecha se notificará por un canal designado de contacto, con prioridad alta, manteniendo actualizaciones periódicas hasta su cierre y con un informe final de causa raíz y medidas correctoras cuando el incidente haya sido material.

## Obligaciones del subencargado

El subencargado deberá:

- tratar datos solo bajo instrucciones del Encargado;
    
- aplicar medidas de seguridad equivalentes;
    
- notificar brechas sin dilación indebida;
    
- colaborar en auditorías y derechos de los interesados;
    
- devolver o suprimir los datos al finalizar su intervención.
    

## Protocolo de portabilidad al final del contrato

El Encargado entregará un extracto exportable de los datos del Tenant en formato estructurado, de uso común y lectura mecánica, realizará la transición razonable a otro proveedor si se solicita y eliminará sus copias residuales una vez completada la entrega, salvo conservación legal obligatoria.

Si quieres, en el siguiente paso te lo convierto en un **documento final con encabezado, numeración jurídica y placeholders** como `[Tenant Name]`, `[Effective Date]` y `[Jurisdiction]` listo para pegar en Word o Google Docs.

------------------
A continuación te dejo un **documento final** listo para pegar en Word o Google Docs, con encabezado, numeración jurídica y placeholders. Está redactado para uso contractual y alineado con GDPR, incluyendo transferencias internacionales, registro de actividades, subencargados, auditoría, SLA, brechas y jurisdicción.

# ANEXO [X]

## PROTECCIÓN DE DATOS, SEGURIDAD, AUDITORÍA, TRANSFERENCIAS INTERNACIONALES Y NIVEL DE SERVICIO

**Entre:**  
**[Tenant Name]**, en adelante, el **“Responsable”** o **“Tenant”**, según corresponda, y  
**[Supplier Name]**, en adelante, el **“Encargado”** o **“Proveedor”**.

**Fecha de entrada en vigor:** [Effective Date]  
**Jurisdicción aplicable:** [Jurisdiction]

## 1. Objeto y alcance

1.1. El presente Anexo regula el tratamiento de datos personales que el Proveedor realice por cuenta del Tenant con ocasión de la prestación de los servicios contratados.  
1.2. El Proveedor actuará exclusivamente siguiendo instrucciones documentadas del Tenant, salvo obligación legal aplicable que exija lo contrario.  
1.3. Este Anexo complementa el Contrato Principal y, en caso de contradicción, prevalecerá en materia de protección de datos en la medida permitida por la ley aplicable.

## 2. Definiciones

2.1. **Datos Personales**: toda información sobre una persona física identificada o identificable.[](https://gdpr.eu/article-30-records-of-processing-activities/)  
2.2. **Tratamiento**: cualquier operación o conjunto de operaciones realizadas sobre datos personales.[](https://gdpr.eu/article-30-records-of-processing-activities/)  
2.3. **Subencargado**: cualquier tercero contratado por el Proveedor que acceda o trate datos personales por cuenta del Tenant.  
2.4. **Brecha de Seguridad**: cualquier destrucción, pérdida, alteración, divulgación no autorizada o acceso accidental o ilícito a datos personales.

## 3. Instrucciones del Tenant

3.1. El Tenant define los fines y medios esenciales del tratamiento. El Proveedor no tratará los datos para finalidades propias.  
3.2. El Proveedor informará sin dilación indebida si alguna instrucción pudiera infringir el GDPR o la normativa aplicable.

## 4. Medidas de seguridad

4.1. El Proveedor aplicará medidas técnicas y organizativas apropiadas al riesgo, incluyendo control de accesos, cifrado, gestión de credenciales, copias de seguridad, monitorización y restauración.  
4.2. El acceso a datos personales quedará limitado al personal autorizado y sujeto a confidencialidad.  
4.3. El Proveedor revisará periódicamente permisos, privilegios y evidencias de acceso.

## 5. Retención y supresión

5.1. El Proveedor conservará los datos solo durante el tiempo necesario para la prestación del servicio, el cumplimiento legal, la resolución de incidencias y la conservación de evidencias de auditoría.  
5.2. Finalizado dicho plazo, los datos serán eliminados, anonimizados o devueltos, salvo obligación legal de conservación o instrucción válida del Tenant.  
5.3. La eliminación deberá ejecutarse de forma segura y documentada.

## 6. Subencargados

6.1. El Proveedor no incorporará subencargados sin la autorización prevista en el Contrato Principal.  
6.2. Todo subencargado deberá aceptar por escrito obligaciones de protección de datos y seguridad equivalentes a las contenidas en este Anexo.  
6.3. El Proveedor responderá ante el Tenant por los actos y omisiones de sus subencargados en la medida permitida por la ley aplicable y el Contrato Principal.

## 7. Auditoría

7.1. El Proveedor conservará registros suficientes para acreditar el cumplimiento de este Anexo, incluyendo accesos, exportaciones, restauraciones, borrados, incidentes y cambios administrativos.  
7.2. El Tenant podrá solicitar auditorías razonables, directas o mediante tercero obligado a confidencialidad, con preaviso y alcance proporcionado.  
7.3. El Proveedor cooperará de buena fe, siempre que la auditoría no comprometa la seguridad, la continuidad del servicio ni la confidencialidad de otros clientes.

## 8. Transferencias internacionales

8.1. Cuando el tratamiento implique transferencias de datos fuera del EEE, el Proveedor solo las realizará cuando concurra una base válida conforme al GDPR, incluyendo decisión de adecuación, cláusulas contractuales tipo u otra garantía reconocida.  
8.2. El Proveedor asistirá al Tenant en la evaluación de dichas transferencias y, cuando proceda, en la implementación de medidas suplementarias tras Schrems II.  
8.3. El Proveedor informará al Tenant de cualquier cambio relevante en la ubicación de tratamiento o en el régimen de transferencia internacional.

## 9. Brechas de seguridad

9.1. El Proveedor notificará al Tenant toda Brecha de Seguridad sin dilación indebida y, en todo caso, dentro del plazo contractual máximo acordado.  
9.2. La notificación incluirá, en la medida razonablemente posible, la naturaleza del incidente, alcance estimado, datos afectados, impacto potencial, medidas de contención y medidas correctoras.  
9.3. Cuando la Brecha de Seguridad afecte a datos personales y exista obligación legal, el Proveedor colaborará con el Tenant en la notificación a la autoridad de control y, en su caso, a los interesados.

## 10. Derechos de los interesados

10.1. El Proveedor asistirá al Tenant en la atención de solicitudes de acceso, rectificación, supresión, limitación, oposición y portabilidad, en la medida en que sean aplicables.  
10.2. La portabilidad se facilitará respecto de los datos personales del interesado en formato estructurado, de uso común y lectura mecánica, cuando legalmente proceda.  
10.3. Cuando sea técnicamente viable y jurídicamente procedente, el Proveedor colaborará en la transmisión directa de datos a otro proveedor indicado por el Tenant o el interesado.

## 11. Nivel de servicio

11.1. El Proveedor prestará el servicio conforme a los niveles de disponibilidad, respuesta, recuperación y mantenimiento definidos en el SLA aplicable.[](https://www.youtube.com/watch?v=fO5l8RipohU)  
11.2. El SLA deberá especificar, al menos, disponibilidad mensual, tiempo de respuesta a incidencias, tiempo objetivo de recuperación, ventanas de mantenimiento y criterios de escalado.  
11.3. El incumplimiento reiterado de los niveles pactados dará lugar a las consecuencias contractuales previstas en el Contrato Principal.

## 12. Responsabilidad

12.1. La responsabilidad de cada Parte se regirá por el Contrato Principal y por la legislación aplicable.  
12.2. Ninguna cláusula del presente Anexo limitará las obligaciones imperativas derivadas del GDPR ni la responsabilidad que no pueda excluirse legalmente.  
12.3. Las limitaciones de responsabilidad no serán de aplicación en casos de dolo, fraude, infracción deliberada o incumplimiento grave de las obligaciones esenciales de protección de datos, en la medida en que la ley aplicable lo permita.

## 13. Registro de actividades de tratamiento

13.1. El Tenant y, cuando corresponda, el Proveedor mantendrán un registro de las actividades de tratamiento conforme al artículo 30 del GDPR.  
13.2. Dicho registro incluirá, según proceda, categorías de interesados, categorías de datos, finalidades, destinatarios, transferencias internacionales, plazos de supresión y medidas de seguridad.  
13.3. El registro se mantendrá por escrito, incluso en formato electrónico, y se pondrá a disposición de la autoridad de control cuando se requiera.[](https://gdpr.eu/article-30-records-of-processing-activities/)

## 14. Jurisdicción y ley aplicable

14.1. Este Anexo se interpretará conforme a la ley aplicable del Contrato Principal y la normativa de protección de datos que resulte aplicable.  
14.2. Las controversias se someterán a la jurisdicción pactada en el Contrato Principal, sin perjuicio de las competencias inderogables de las autoridades de protección de datos.

---

## 15. Firma

En prueba de conformidad, las Partes firman el presente Anexo en la fecha indicada.

**[Tenant Name]**  
Nombre:  
Cargo:  
Firma:

**[Supplier Name]**  
Nombre:  
Cargo:  
Firma:

Si quieres, en el siguiente paso te lo convierto en una **versión aún más formal de contrato jurídico español**, con estilo de notaría/abogacía y numeración de artículos más clásica.

------------

Claro. Te dejo una versión práctica en dos bloques: **checklist de cumplimiento** para operación interna y **resumen ejecutivo** para IT. También incluyo la cláusula de indemnización y qué cambiaría si el tratamiento se hiciera fuera de la UE.

## Checklist de cumplimiento

## Gobierno y contrato

- Confirmar rol de cada parte: responsable, encargado y, si aplica, subencargados.
    
- Incluir en contrato las finalidades, categorías de datos, categorías de interesados y duración del tratamiento.
    
- Definir plazos de retención, borrado, devolución y bloqueo legal.
    
- Establecer el SLA con disponibilidad, respuesta, recuperación y mantenimiento.
    

## Seguridad y operación

- Verificar cifrado en tránsito y, cuando proceda, en reposo.
    
- Confirmar control de accesos por mínimo privilegio y trazabilidad.
    
- Registrar copias de seguridad, restauración y pruebas de recuperación.
    
- Mantener evidencias de auditoría y accesos administrativos.
    

## Brechas e incidentes

- Tener canal único de notificación de incidentes.
    
- Notificar al tenant sin dilación indebida.
    
- Documentar causa, impacto, alcance, mitigación y cierre.
    
- Preparar soporte para notificación a la autoridad de control si hay datos personales afectados.
    

## Subencargados

- Aprobar subencargados antes de usarlos.
    
- Exigirles obligaciones equivalentes en seguridad, confidencialidad y asistencia.
    
- Mantener inventario actualizado de subencargados y ubicaciones de tratamiento.
    

## Derechos y portabilidad

- Tener proceso para acceso, rectificación, supresión, limitación, oposición y portabilidad.
    
- Entregar exportación estructurada y legible por máquina cuando proceda.
    

## Transferencias internacionales

- Si hay tratamiento fuera del EEE, validar base legal de transferencia y salvaguardas apropiadas.
    
- Si no existe decisión de adecuación, usar SCC u otro mecanismo válido y documentar evaluación de riesgos.
    

## Resumen ejecutivo para IT

Este anexo obliga a que ABDFiles opere con tratamiento documentado, acceso mínimo, cifrado, retención controlada, auditoría y respuesta a incidentes. Para IT, lo importante es que cualquier cambio de infraestructura, proveedor, región o subencargado debe pasar por validación de cumplimiento antes de producción.

Operativamente, la prioridad es sostener cuatro controles: seguridad técnica, trazabilidad, recuperación y notificación. Si falla uno de ellos, el riesgo ya no es solo técnico: también contractual y regulatorio.

## Cláusula de indemnización

**Indemnización por violaciones de seguridad.**  
El Proveedor indemnizará y mantendrá indemne al Tenant frente a daños directos, costes razonables de notificación, respuesta, remediación, investigación forense, comunicaciones obligatorias y demás gastos acreditables derivados de una brecha de seguridad causada por incumplimiento del Proveedor, sus empleados o sus subencargados, en la medida permitida por la ley aplicable. La indemnización no cubrirá daños derivados de instrucciones ilícitas del Tenant, uso indebido del servicio por el Tenant o hechos imputables exclusivamente a terceros ajenos al control razonable del Proveedor.

## Si el tratamiento fuera fuera de la UE

Cambiaría bastante. Habría que añadir expresamente:

- mecanismo de transferencia internacional válido;
    
- SCC o equivalente;
    
- evaluación de garantías del país destino;
    
- medidas suplementarias técnicas, contractuales y organizativas;
    
- inventario de ubicaciones de tratamiento;
    
- cláusula de notificación de cambios de región o proveedor.
    

Además, si el destino no ofrece protección equivalente, el contrato debería dejar claro que el Proveedor no moverá datos sin autorización previa y sin salvaguardas documentadas. Eso reduce el riesgo de incumplimiento post-Schrems II.

## Cláusula corta de fuera UE

**Transferencias internacionales.**  
El Proveedor no transferirá Datos Personales fuera del Espacio Económico Europeo salvo que exista una base jurídica válida conforme al GDPR y se hayan implementado las garantías adecuadas, incluyendo, en su caso, cláusulas contractuales tipo, evaluación de impacto de transferencia y medidas suplementarias apropiadas.

Puedo convertir todo esto en un **anexo final listo para pegar**, con secciones numeradas y redacción homogénea de contrato, o en una **versión interna de compliance** para IT y legal.

-----------

Aquí tienes un paquete listo para usar con **ROPA**, **TOMs**, **ARSOLP**, **EIPD** y **SLA matrix**, redactado para DPA y alineado con Art. 30 y Art. 35 GDPR. Las plantillas de ROPA y DPIA deben documentar finalidades, categorías, destinatarios, transferencias, plazos de borrado, riesgos y medidas de mitigación.

## 1. Plantilla ROPA

**Registro de Actividades de Tratamiento — ABDFiles**

|Campo|Contenido|
|---|---|
|Responsable|[Tenant Name] / [Supplier Name]|
|Encargado|[Supplier Name]|
|Finalidad|Gestión documental, auditoría, retención, recuperación y soporte.|
|Categorías de interesados|Empleados, administradores, usuarios del tenant, auditores.|
|Categorías de datos|Identificativos, metadatos documentales, logs, evidencias, trazas.|
|Base jurídica|Ejecución contractual, interés legítimo, obligación legal, consentimiento si aplica.|
|Destinatarios|Personal autorizado, subencargados, autoridades competentes.|
|Transferencias|[EEA/Non-EEA], mecanismo legal aplicable, salvaguardas.|
|Plazos de conservación|Según política contractual y normativa aplicable.|
|Medidas de seguridad|Control de acceso, cifrado, backup, auditoría, segregación.|
|Fecha de revisión|[Review Date]|
|Responsable interno|[DPO / Security Owner]|

## 2. Anexo TOMs

**Medidas técnicas y organizativas mínimas**

- Control de acceso por rol y mínimo privilegio.
    
- Autenticación reforzada y gestión segura de credenciales.
    
- Cifrado en tránsito y, cuando corresponda, en reposo.
    
- Registro de actividad y trazabilidad de cambios.
    
- Copias de seguridad y pruebas de restauración.
    
- Gestión de incidentes y notificación.
    
- Segregación lógica o física por tenant.
    
- Supresión segura y anonimización.
    

## 3. Protocolo ARSOLP

**Protocolo de actuación ante solicitudes de derechos**

1. Recepción y verificación de identidad.
    
2. Clasificación del derecho ejercido.
    
3. Localización de datos y alcance aplicable.
    
4. Evaluación de excepciones legales.
    
5. Ejecución de la respuesta.
    
6. Registro de la actuación.
    
7. Cierre y archivo de evidencia.
    

## Texto contractual breve

El Proveedor asistirá al Tenant en la atención de solicitudes de acceso, rectificación, supresión, limitación, oposición y portabilidad, y ejecutará las acciones que se le instruyan legalmente aplicables dentro de un plazo razonable.

## 4. EIPD

**Guía de evaluación de impacto**

## Cuándo aplicar

- Tratamiento a gran escala.
    
- Monitorización sistemática.
    
- Datos sensibles o alto riesgo.
    
- Transferencias internacionales complejas.
    
- Nuevas tecnologías o automatización intensiva.
    

## Estructura

1. Descripción del tratamiento.
    
2. Necesidad y proporcionalidad.
    
3. Identificación de riesgos.
    
4. Medidas de mitigación.
    
5. Riesgo residual.
    
6. Decisión final.
    
7. Plan de revisión.
    

## 5. Matriz SLA

|Actividad|Proveedor|Tenant|IT|DPO|
|---|---|---|---|---|
|Definir SLA|R|A|C|C|
|Medir disponibilidad|R|I|R|I|
|Gestionar incidencias|R|I|R|C|
|Aprobar ventanas de mantenimiento|R|A|C|I|
|Revisar incumplimientos|R|A|C|C|
|Escalar brechas|R|I|R|C|

## 6. Cláusula lista para DPA

El Proveedor mantendrá y pondrá a disposición del Tenant, cuando proceda, el Registro de Actividades de Tratamiento, las Medidas Técnicas y Organizativas, la documentación de atención a derechos, la evaluación de impacto cuando resulte exigible y la matriz de responsabilidades de nivel de servicio, todo ello en forma escrita o electrónica y actualizado razonablemente.

Si quieres, el siguiente paso puede ser cualquiera de estos tres:

1. convertir esto en un **anexo contractual ya redactado**,
    
2. expandirlo a una **política interna de compliance**, o
    
3. transformarlo en una **tabla operativa para legal + IT + DPO**.
--------------

Aquí tienes una respuesta ya lista para incorporar al DPA o al playbook interno. Cubro notificación de brechas, diferencias entre DPA local y cloud, gestión de subencargados, respuesta ante auditorías de la autoridad y la matriz RACI para registros de tratamiento.

## Cláusula de brechas

Una cláusula sólida debe obligar al encargado a notificar al responsable **sin dilación indebida** tras tener conocimiento de una brecha, y debe pedir naturaleza del incidente, alcance estimado, datos afectados, consecuencias probables y medidas de contención. El GDPR exige notificación a la autoridad competente en un máximo de 72 horas desde que el responsable tenga conocimiento, salvo que sea improbable que la brecha suponga un riesgo para los derechos y libertades de las personas.

**Texto sugerido:**  
“El Encargado notificará al Responsable, sin dilación indebida y en cuanto tenga conocimiento, cualquier Brecha de Seguridad que afecte a Datos Personales tratados por cuenta del Responsable, facilitando toda la información razonablemente disponible para permitir al Responsable cumplir, en su caso, con sus obligaciones de notificación ante la autoridad de control y, cuando proceda, ante los interesados.”

## DPA local vs cloud

En un tratamiento local, el DPA suele centrarse en acceso físico, soportes, copias de seguridad, segregación interna y personal autorizado. En cloud, además, el contrato necesita cubrir ubicación de datos, subencargados, multi-región, transferencias internacionales, reciclaje de recursos, APIs de administración y mayor detalle sobre responsabilidades del proveedor.

Dicho de forma práctica, el DPA cloud es más exigente porque debe describir mejor la cadena de subtratamiento, el ciclo de vida del dato y las garantías de transferencia y continuidad.

## Subencargados

La debida diligencia de subencargados debe ser **risk-based**: revisar antes del alta, volver a revisar tras incidentes o cambios materiales y mantener seguimiento periódico. El proveedor debe informar del subencargado, la ubicación, la finalidad del tratamiento y el mecanismo de transferencia, y el responsable debe poder verificar que las garantías contractuales siguen vigentes.

## Obligaciones mínimas del subencargado

- Tratar datos solo bajo instrucciones documentadas.
    
- Aplicar medidas de seguridad equivalentes.
    
- Notificar incidentes sin dilación indebida.
    
- Cooperar con auditorías y derechos de los interesados.
    
- Eliminar o devolver datos al finalizar el servicio.
    

## Auditoría de la autoridad

Ante una auditoría o requerimiento de la autoridad de control, la respuesta debe ser ordenada y documentada. Conviene designar un único interlocutor, congelar borrados relevantes, recopilar ROPA, TOMs, contratos, bitácoras de incidentes, evidencias de formación y registros de transferencias.

## Protocolo breve

1. Registrar la notificación recibida.
    
2. Identificar alcance, plazo y base legal del requerimiento.
    
3. Consolidar evidencias y responsables.
    
4. Revisar coherencia entre contrato, práctica y documentación.
    
5. Responder en plazo con control de versiones y trazabilidad.
    

## Matriz RACI

|Actividad|Proveedor|Tenant|DPO|IT|
|---|---|---|---|---|
|Mantener ROPA|R|A|C|C|
|Mantener TOMs|R|I|C|A|
|Gestionar subencargados|R|A|C|I|
|Notificar brechas|R|I|C|A|
|Responder auditoría de autoridad|R|A|C|C|
|Revisar transferencias internacionales|R|A|C|C|

## Frase de cierre contractual

**“El Encargado mantendrá documentación suficiente y actualizada sobre actividades de tratamiento, medidas de seguridad, subencargados, transferencias internacionales y respuesta a incidentes, de modo que el Responsable pueda acreditar el cumplimiento normativo ante la autoridad de control en cualquier momento razonablemente requerido.”**

Si quieres, puedo convertir esto en un **anexo formal ya redactado con numeración de artículos**, o en un **playbook operativo interno** para IT, DPO y legal.

--------------------

Aquí tienes un paquete listo para incorporar al DPA o al playbook interno. Incluye anexo formal con artículos, playbook operativo para IT/DPO/legal, flujo de notificación de brechas, modelo de subencargados y cláusula de auditoría e inspección.

# Anexo formal

## Artículo 1. Objeto

El presente anexo regula las obligaciones de las Partes en materia de tratamiento de datos personales, seguridad de la información, subencargados, auditoría, notificación de brechas y conservación de evidencias, en cumplimiento del GDPR y demás normativa aplicable.

## Artículo 2. Notificación de brechas

El Encargado notificará al Responsable cualquier Brecha de Seguridad sin dilación indebida tras tener conocimiento de ella y facilitará la información necesaria para la evaluación del incidente, su contención y, en su caso, su notificación a la autoridad de control dentro del plazo legal de 72 horas.

## Artículo 3. Subencargados

El Encargado solo podrá designar subencargados conforme a la autorización contractual aplicable y deberá imponerles por escrito obligaciones equivalentes en materia de protección de datos, seguridad, confidencialidad, auditoría y supresión de datos.

## Artículo 4. Auditoría e inspección

El Responsable tendrá derecho a verificar el cumplimiento del presente anexo mediante revisiones documentales o inspecciones razonables, directamente o por tercero obligado a confidencialidad, siempre con preaviso, alcance proporcionado y sin menoscabo de la seguridad ni de la continuidad del servicio.

## Artículo 5. Registros de tratamiento

Las Partes mantendrán registros actualizados de actividades de tratamiento, categorías de datos, finalidades, destinatarios, transferencias, plazos de conservación y medidas de seguridad, de forma que la autoridad de control pueda verificar el cumplimiento.

## Artículo 6. Responsabilidad

Cada Parte responderá por sus propios incumplimientos en la medida prevista en el Contrato Principal y la legislación aplicable, sin perjuicio de la obligación de cooperación en la mitigación de daños y en la investigación de incidentes.

# Playbook operativo

## IT

1. Detectar y clasificar el incidente.
    
2. Preservar evidencia y congelar cambios relevantes.
    
3. Reunir logs, accesos, backups y trazas.
    
4. Ejecutar contención y recuperación.
    
5. Preparar el informe técnico inicial.
    

## DPO

1. Valorar si existe brecha de datos personales.
    
2. Determinar riesgo para los derechos y libertades.
    
3. Decidir si procede notificación a la autoridad.
    
4. Coordinar comunicaciones a interesados si aplica.
    
5. Documentar la decisión y el cierre.
    

## Legal

1. Verificar obligaciones contractuales y de notificación.
    
2. Revisar subencargados implicados.
    
3. Validar jurisdicción, transferencias y responsabilidad.
    
4. Aprobar comunicaciones externas.
    
5. Archivar la evidencia contractual y regulatoria.
    

# Flujo de brechas

text

`Detección -> Clasificación -> Contención -> Evaluación de riesgo ->  Decisión de notificación -> Comunicación a autoridad/interesados ->  Remediación -> Cierre -> Archivo de evidencias`

La autoridad competente debe recibir la notificación sin dilación indebida y, cuando sea posible, dentro de 72 horas desde que el responsable tenga conocimiento.

# Modelo de subencargados

## Cláusula base

El Encargado no subcontratará tratamiento sin la autorización prevista y, en caso de subencargo autorizado, celebrará un contrato escrito que obligue al subencargado a tratar los datos solo bajo instrucciones, aplicar medidas de seguridad equivalentes, notificar incidentes, asistir en auditorías y devolver o suprimir los datos al finalizar la relación.

## Checklist

- Identificar necesidad del subencargado.
    
- Evaluar riesgo y ubicación.
    
- Firmar contrato equivalente.
    
- Registrar finalidades y países.
    
- Revisar periódicamente su cumplimiento.
    

# Cláusula de auditoría

**Derecho de inspección.**  
El Responsable, o un auditor independiente designado por este y sujeto a deber de confidencialidad, podrá auditar razonablemente las medidas de seguridad, los procedimientos de tratamiento, los subencargados y la documentación de cumplimiento del Encargado, con preaviso suficiente, en horario laboral y sin interferir injustificadamente en la prestación del servicio. El Encargado podrá oponerse a solicitudes desproporcionadas o que comprometan la seguridad o la confidencialidad de terceros, proponiendo una alternativa equivalente de verificación.

## Matriz RACI

|Actividad|IT|DPO|Legal|Proveedor|
|---|---|---|---|---|

|Actividad|IT|DPO|Legal|Proveedor|
|---|---|---|---|---|
|Detectar brecha|R|I|I|R|
|Evaluar riesgo|C|R|C|C|
|Notificar autoridad|I|A|C|I|
|Revisar subencargado|C|C|A|R|
|Responder auditoría|R|C|A|R|
|Mantener ROPA|R|A|C|I|

Si quieres, lo siguiente que puedo darte es una **versión ya maquetada como documento contractual final**, con numeración completa, encabezado, cláusulas de firma y placeholders tipo `[Tenant Name]`, `[Effective Date]` y `[Jurisdiction]`.

______________

A continuación te dejo un **documento base maquetado como anexo contractual final** con encabezado, numeración clásica y placeholders, seguido de un **playbook operativo** y las piezas de cumplimiento que pediste. Las estrategias de transferencias internacionales, derechos ARSOLP, auditorías de subencargados, terminación/devolución y minimización se apoyan en requisitos y guías habituales del GDPR, especialmente sobre transferencias fuera del EEE, gestión de derechos y evaluaciones de impacto.

# ANEXO [X]

## PROTECCIÓN DE DATOS, TRANSFERENCIAS INTERNACIONALES, DERECHOS DE LOS INTERESADOS, SUBENCARGADOS, AUDITORÍA Y NIVEL DE SERVICIO

**Entre:**  
**[Tenant Name]**, en adelante el **“Responsable”**, y **[Supplier Name]**, en adelante el **“Encargado”**.

**Fecha de entrada en vigor:** [Effective Date]  
**Jurisdicción aplicable:** [Jurisdiction]

## Artículo 1. Objeto

1.1. El presente Anexo regula el tratamiento de datos personales realizado por el Encargado por cuenta del Responsable con ocasión de la prestación de los servicios contratados.  
1.2. El Encargado actuará únicamente conforme a instrucciones documentadas del Responsable, salvo obligación legal aplicable.  
1.3. Este Anexo complementa el Contrato Principal y prevalecerá en materia de protección de datos dentro de los límites permitidos por la ley aplicable.

## Artículo 2. Definiciones

2.1. “Datos Personales” significa cualquier información sobre una persona física identificada o identificable.[](https://gdpr.eu/article-30-records-of-processing-activities/)  
2.2. “Brecha de Seguridad” significa cualquier incidente que ocasione destrucción, pérdida, alteración, divulgación no autorizada o acceso no autorizado a Datos Personales.  
2.3. “Subencargado” significa cualquier tercero contratado por el Encargado que trate Datos Personales por cuenta del Responsable.

## Artículo 3. Medidas de seguridad

3.1. El Encargado aplicará medidas técnicas y organizativas apropiadas al riesgo, incluyendo control de acceso, cifrado, copias de seguridad, monitorización, trazabilidad y restauración.  
3.2. El acceso a Datos Personales quedará restringido al personal autorizado bajo principio de mínimo privilegio y confidencialidad reforzada.

## Artículo 4. Retención y supresión

4.1. El Encargado conservará los datos solo durante el tiempo necesario para la prestación del servicio, el cumplimiento legal, la resolución de incidencias y la conservación de evidencias de auditoría.  
4.2. Finalizado dicho plazo, el Encargado suprimirá, anonimizará o devolverá los datos, salvo obligación legal de conservación o instrucción válida del Responsable.

## Artículo 5. Derechos ARSOLP

5.1. El Encargado asistirá al Responsable en la atención de solicitudes de acceso, rectificación, supresión, oposición, limitación y portabilidad, así como cualquier otra solicitud de derechos aplicable.  
5.2. La portabilidad se realizará, cuando proceda, en formato estructurado, de uso común y lectura mecánica.  
5.3. El Encargado documentará la recepción, tramitación y cierre de cada solicitud, con trazabilidad suficiente.[](https://www.youtube.com/watch?v=rwdAsldaNLg)[](https://www.neumetric.com/journal/gdpr-subject-rights-workflow-3907/)

## Artículo 6. Brechas de seguridad

6.1. El Encargado notificará al Responsable cualquier Brecha de Seguridad sin dilación indebida y facilitará la información razonablemente disponible para que el Responsable cumpla, en su caso, con la notificación a la autoridad de control dentro del plazo legal.  
6.2. La notificación incluirá, en la medida razonablemente posible, naturaleza del incidente, datos afectados, alcance estimado, impacto probable, medidas de contención y acciones correctoras.  
6.3. El Encargado conservará evidencia suficiente del incidente y de las acciones adoptadas.

## Artículo 7. Subencargados

7.1. El Encargado no designará subencargados sin la autorización prevista en el Contrato Principal.  
7.2. Todo Subencargado deberá estar sujeto a contrato escrito con obligaciones equivalentes en materia de protección de datos, seguridad, confidencialidad, asistencia, auditoría, notificación de brechas y supresión de datos.  
7.3. El Encargado mantendrá un inventario actualizado de subencargados, ubicaciones de tratamiento y finalidades asociadas.

## Artículo 8. Transferencias internacionales

8.1. Cuando existan transferencias fuera del EEE, el Encargado solo podrá realizarlas si concurre una base válida conforme al GDPR y se han implementado las garantías adecuadas.  
8.2. En ausencia de decisión de adecuación, el Encargado aplicará el mecanismo contractual apropiado, realizará una evaluación de impacto de transferencia y, cuando sea necesario, adoptará medidas suplementarias técnicas, contractuales y organizativas.  
8.3. El Encargado informará al Responsable de cualquier cambio relevante en la región de tratamiento, subencargados o salvaguardas aplicables.

## Artículo 9. Auditoría y derecho de inspección

9.1. El Responsable tendrá derecho a verificar el cumplimiento de este Anexo mediante auditorías documentales o inspecciones razonables, directamente o por tercero obligado a confidencialidad.  
9.2. La auditoría se realizará con preaviso suficiente, alcance proporcionado y en horario laboral, sin interferir injustificadamente en la prestación del servicio ni comprometer la seguridad o confidencialidad de otros clientes.  
9.3. El Encargado cooperará de buena fe con la autoridad de control y con cualquier requerimiento legal de información conforme a la normativa aplicable.

## Artículo 10. SLA

10.1. El Encargado prestará el servicio conforme a los niveles de disponibilidad, respuesta, recuperación y mantenimiento definidos en el SLA aplicable.  
10.2. El SLA deberá incluir, al menos, disponibilidad mensual, tiempos de respuesta, tiempos de recuperación, ventanas de mantenimiento y criterios de escalado.  
10.3. El incumplimiento reiterado de los niveles pactados dará lugar a las consecuencias contractuales previstas en el Contrato Principal.

## Artículo 11. Terminación y devolución

11.1. A la terminación del Contrato Principal o a solicitud válida del Responsable, el Encargado devolverá los datos en formato razonablemente utilizable y suprimirá las copias residuales, salvo conservación obligatoria por ley.  
11.2. El Encargado certificará, cuando sea razonable, la supresión o devolución efectuada.

## Artículo 12. Responsabilidad

12.1. Cada Parte responderá por sus propios incumplimientos en los términos del Contrato Principal y de la ley aplicable.  
12.2. Ninguna limitación contractual podrá excluir obligaciones imperativas de protección de datos ni responsabilidad derivada de dolo o incumplimiento grave, en la medida en que la ley aplicable lo impida.

## Artículo 13. Jurisdicción y ley aplicable

13.1. Este Anexo se regirá por la ley aplicable indicada en el Contrato Principal.  
13.2. Las controversias se someterán a la jurisdicción pactada en dicho contrato, sin perjuicio de las competencias inderogables de las autoridades de protección de datos.

## Artículo 14. Firmas

En prueba de conformidad, las Partes firman el presente Anexo en la fecha indicada.

**[Tenant Name]**  
Nombre:  
Cargo:  
Firma:

**[Supplier Name]**  
Nombre:  
Cargo:  
Firma:

# Playbook operativo

## 1. IT

1. Detectar y clasificar el incidente o solicitud.
    
2. Preservar evidencia y congelar cambios relevantes.
    
3. Reunir logs, accesos, backups y trazas.
    
4. Ejecutar contención, recuperación o exportación.
    
5. Entregar informe técnico y cerrar con evidencia.
    

## 2. DPO

1. Confirmar si el incidente implica datos personales.
    
2. Evaluar riesgo para derechos y libertades.
    
3. Decidir si procede notificar a la autoridad.
    
4. Coordinar notificación a interesados si aplica.
    
5. Documentar decisiones y cierre.
    

## 3. Legal

1. Verificar obligaciones contractuales y regulatorias.
    
2. Validar subencargados, transferencias y jurisdicción.
    
3. Aprobar comunicaciones externas.
    
4. Revisar indemnización y limitación de responsabilidad.
    
5. Archivar la evidencia contractual y regulatoria.
    

# Flujo de brechas

text

`Detección -> Clasificación -> Contención -> Evaluación de riesgo -> Decisión de notificación -> Comunicación a autoridad/interesados -> Remediación -> Cierre -> Archivo de evidencias`

La notificación a la autoridad debe prepararse con antelación para cumplir, cuando proceda, el límite de 72 horas desde el conocimiento de la brecha.

# Gestión de subencargados

## Modelo de contrato

El contrato con subencargados debe imponer instrucciones documentadas, medidas de seguridad equivalentes, confidencialidad, notificación de incidentes, asistencia en derechos ARSOLP, soporte en auditoría y supresión o devolución al final del servicio.

## Checklist anual

- Revisar alta, baja y cambios de subencargados.
    
- Confirmar ubicación de tratamiento y transferencias.
    
- Revalidar medidas de seguridad.
    
- Verificar incidentes y hallazgos del año.
    
- Registrar aprobación del DPO y Legal.
    

# Minimización de datos

La minimización exige que cada microservicio solo recoja los datos estrictamente necesarios para su función, con separación de identificadores, pseudonimización cuando sea posible, borrado por expiración y contratos de intercambio de datos entre servicios. En arquitecturas distribuidas, esto reduce superficie de riesgo, simplifica transferencias y mejora el cumplimiento en auditoría.

Si quieres, el siguiente paso puede ser la **versión maquetada para Word con portada, índice y estilos de artículo**, o una **tabla de control interna para IT/DPO/Legal**.

_-------------------------_
