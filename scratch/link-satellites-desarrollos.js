import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'd:/desarrollos/ABDSuite/ABD-Suite-DOCS';

// 1. Link Configurar una Nueva Aplicación Satélite.md
const satFile = path.join(DOCS_DIR, '02_architecture/Configurar una Nueva Aplicación Satélite.md');
if (fs.existsSync(satFile)) {
  let content = fs.readFileSync(satFile, 'utf8');
  // Remove existing
  const separatorIndex = content.indexOf('## 📚 Referencias y Grafos Relacionados');
  if (separatorIndex !== -1) {
    content = content.substring(0, separatorIndex).trim();
  } else {
    content = content.trim();
  }

  const section = `\n\n## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]
* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]
	* [[02_architecture/DISENO_SSO_TENANTS.md]]
* **Grafos de Interrelaciones**:
	* [[grafos/Mapa_Global_Suite.md]]
	* [[grafos/ABDSatelliteSDK.md]]
	* [[grafos/ABDEcosystemWidgets.md]]
	* [[grafos/ABDLanding.md]]
`;
  fs.writeFileSync(satFile, content + section, 'utf8');
  console.log('Linked Configurar una Nueva Aplicación Satélite.md');
}

// 2. Link files in Desarrollos Suite
const desarrollosDir = path.join(DOCS_DIR, 'Desarrollos Suite');
const filesToLink = [
  'ABDDocs & ABDTemplates.md',
  'plan_arquitectura_pdf_suite_abd_v2.md',
  'anexo_tecnico_pdf_accesible_pipeline.md'
];

filesToLink.forEach(f => {
  const filePath = path.join(desarrollosDir, f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const separatorIndex = content.indexOf('## 📚 Referencias y Grafos Relacionados');
    if (separatorIndex !== -1) {
      content = content.substring(0, separatorIndex).trim();
    } else {
      content = content.trim();
    }

    const section = `\n\n## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]]
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]]
* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]
* **Grafos de Interrelaciones**:
	* [[grafos/ABDFiles.md]]
	* [[grafos/Mapa_Global_Suite.md]]
`;
    fs.writeFileSync(filePath, content + section, 'utf8');
    console.log(`Linked Desarrollos Suite/${f}`);
  }
});

// 3. Update ABDFiles.md graph to point to Desarrollos Suite files
const filesGraph = path.join(DOCS_DIR, 'grafos/ABDFiles.md');
if (fs.existsSync(filesGraph)) {
  let content = fs.readFileSync(filesGraph, 'utf8');
  // Find where ## 📚 Documentación de Especificaciones y Diseño is
  const sectionIndex = content.indexOf('## 📚 Documentación de Especificaciones y Diseño');
  if (sectionIndex !== -1) {
    let mainContent = content.substring(0, sectionIndex).trim();
    const newSection = `## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]] (Requerimientos, almacenamiento, conectores y retenciones).
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]] (Definición del ciclo de vida y metadatos de documentos).
	* [[01_active_specs/ROADMAP.md]] (Hitos de desarrollo e integraciones).
* **Desarrollo y PDFs (Desarrollos Suite)**:
	* [[Desarrollos Suite/ABDDocs & ABDTemplates.md]] (Plantillas y generación de PDFs).
	* [[Desarrollos Suite/plan_arquitectura_pdf_suite_abd_v2.md]] (Arquitectura de generación PDF).
	* [[Desarrollos Suite/anexo_tecnico_pdf_accessible_pipeline.md]] (Accesibilidad de PDFs).
* **Historial y Archivo**:
	* [[03_archive/PROMPT_2_APLICACIONES.md]] (Instrucciones originales para los satélites de almacenamiento).
`;
    fs.writeFileSync(filesGraph, mainContent + '\n\n' + newSection, 'utf8');
    console.log('Updated ABDFiles.md with Desarrollos Suite links');
  }
}

// 4. Update Mapa_Global_Suite.md to include Desarrollos Suite section
const mapGraph = path.join(DOCS_DIR, 'grafos/Mapa_Global_Suite.md');
if (fs.existsSync(mapGraph)) {
  let content = fs.readFileSync(mapGraph, 'utf8');
  const sectionIndex = content.indexOf('### 03. Archivo Histórico');
  if (sectionIndex !== -1) {
    let mainContent = content.substring(0, sectionIndex).trim();
    let oldRest = content.substring(sectionIndex);
    const newSection = `### 04. Desarrollos Suite (\`Desarrollos Suite\`)
Planificación de PDF e impresiones del gestor documental:
* [[Desarrollos Suite/ABDDocs & ABDTemplates.md|📄 Plantillas y Gestión de Documentos (ABDTemplates)]]
* [[Desarrollos Suite/plan_arquitectura_pdf_suite_abd_v2.md|📄 Plan de Arquitectura PDF (v2)]]
* [[Desarrollos Suite/anexo_tecnico_pdf_accesible_pipeline.md|📄 Pipeline de Accesibilidad de PDFs]]

`;
    fs.writeFileSync(mapGraph, mainContent + newSection + oldRest, 'utf8');
    console.log('Updated Mapa_Global_Suite.md with Desarrollos Suite section');
  }
}
