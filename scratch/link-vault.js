import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'd:/desarrollos/ABDSuite/ABD-Suite-DOCS';

const links = {
  // 02_architecture
  '02_architecture/ANALISIS_ARQUITECTURA.md': {
    specs: ['01_active_specs/ROADMAP.md', '01_active_specs/STYLE_GUIDE.md'],
    arch: ['02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md', '02_architecture/DISENO_SSO_TENANTS.md'],
    grafos: ['grafos/Mapa_Global_Suite.md', 'grafos/ABDtenantGobernance.md', 'grafos/ABDAuth.md']
  },
  '02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md': {
    specs: ['01_active_specs/ROADMAP.md', '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md', '02_architecture/DISENO_SSO_TENANTS.md'],
    grafos: ['grafos/ABDtenantGobernance.md', 'grafos/ABDAuth.md']
  },
  '02_architecture/DISENO_SSO_TENANTS.md': {
    specs: ['01_active_specs/ROADMAP.md', '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md'],
    arch: ['02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md', '02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/ABDAuth.md', 'grafos/ABDSatelliteSDK.md']
  },

  // 01_active_specs
  '01_active_specs/ESPECIFICACIONES_ABDFILES.md': {
    specs: ['01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md', '01_active_specs/ROADMAP.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/ABDFiles.md']
  },
  '01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md': {
    specs: ['01_active_specs/ESPECIFICACIONES_ABDFILES.md', '01_active_specs/ROADMAP.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/ABDFiles.md']
  },
  '01_active_specs/ESPECIFICACIONES_ANALYTICS.md': {
    specs: ['01_active_specs/ROADMAP.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/ABDAnalytics.md']
  },
  '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO.md': {
    specs: ['01_active_specs/RECOVERY_FLOW_COMPARISON.md', '01_active_specs/ROADMAP.md', '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md'],
    arch: ['02_architecture/DISENO_SSO_TENANTS.md', '02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md'],
    grafos: ['grafos/ABDAuth.md']
  },
  '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md': {
    specs: ['01_active_specs/RECOVERY_FLOW_COMPARISON.md', '01_active_specs/ROADMAP.md', '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO.md'],
    arch: ['02_architecture/DISENO_SSO_TENANTS.md', '02_architecture/ARQUITECTURA_IAM_GOBERNANZA.md'],
    grafos: ['grafos/ABDAuth.md']
  },
  '01_active_specs/ESPECIFICACIONES_ECOSISTEMA_APRENDIZAJE.md': {
    specs: ['01_active_specs/ROADMAP.md', '01_active_specs/ESPECIFICACIONES_ANALYTICS.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/ABDQuiz.md']
  },
  '01_active_specs/RECOVERY_FLOW_COMPARISON.md': {
    specs: ['01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md'],
    arch: ['02_architecture/DISENO_SSO_TENANTS.md'],
    grafos: ['grafos/ABDAuth.md']
  },
  '01_active_specs/ROADMAP.md': {
    specs: [
      '01_active_specs/STYLE_GUIDE.md',
      '01_active_specs/ESPECIFICACIONES_ABDFILES.md',
      '01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md',
      '01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md',
      '01_active_specs/ESPECIFICACIONES_ECOSISTEMA_APRENDIZAJE.md',
      '01_active_specs/ESPECIFICACIONES_ANALYTICS.md'
    ],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/Mapa_Global_Suite.md']
  },
  '01_active_specs/STYLE_GUIDE.md': {
    specs: ['01_active_specs/ROADMAP.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/ABDEcosystemWidgets.md']
  },
  '01_active_specs/PROMPT_UNIFICADO_DESARROLLO.md': {
    specs: ['01_active_specs/ROADMAP.md'],
    arch: ['02_architecture/ANALISIS_ARQUITECTURA.md'],
    grafos: ['grafos/Mapa_Global_Suite.md']
  }
};

for (const [relPath, targets] of Object.entries(links)) {
  const filePath = path.join(DOCS_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove existing Section if any
  const separatorIndex = content.indexOf('## 📚 Referencias y Grafos Relacionados');
  if (separatorIndex !== -1) {
    content = content.substring(0, separatorIndex).trim();
  } else {
    content = content.trim();
  }

  let section = '\n\n## 📚 Referencias y Grafos Relacionados\n';

  if (targets.specs && targets.specs.length > 0) {
    section += '\n* **Especificaciones y Hitos**:\n';
    targets.specs.forEach(s => {
      section += `\t* [[${s}]]\n`;
    });
  }

  if (targets.arch && targets.arch.length > 0) {
    section += '\n* **Diseño y Arquitectura**:\n';
    targets.arch.forEach(a => {
      section += `\t* [[${a}]]\n`;
    });
  }

  if (targets.grafos && targets.grafos.length > 0) {
    section += '\n* **Grafos de Interrelaciones**:\n';
    targets.grafos.forEach(g => {
      section += `\t* [[${g}]]\n`;
    });
  }

  fs.writeFileSync(filePath, content + section, 'utf8');
  console.log(`Updated ${relPath} with WikiLinks successfully.`);
}
