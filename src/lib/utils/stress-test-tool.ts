import { db } from '../db/db';

export const STRESS_PRESET_DATA = {
  name: "ABDFN_STRESS_AUDIT_PRESET",
  version: "1.0.0",
  description: "Preset industrial para validación de volumen y segregación de registros.",
  chunkSize: 5000,
  encoding: "windows-1252",
  recordTypeStart: 0,
  recordTypeLen: 4,
  defaultRecordType: "DATA",
  recordTypes: [
    {
      name: "HEADER",
      behavior: "HEADER",
      trigger: "HEAD",
      triggerStart: 0,
      range: "1",
      fields: [
        { id: "h1", name: "ETIQUETA", start: 0, length: 4 },
        { id: "h2", name: "FECHA", start: 5, length: 10 },
        { id: "h3", name: "LOTE_ID", start: 16, length: 16 }
      ]
    },
    {
      name: "DATA",
      behavior: "DATA",
      trigger: "DATA",
      triggerStart: 0,
      fields: [
        { id: "d1", name: "ETIQUETA", start: 0, length: 4 },
        { id: "d2", name: "ID_CLIENTE", start: 5, length: 6 },
        { id: "d3", name: "NOMBRE_COMPLETO", start: 12, length: 25 },
        { id: "d4", name: "IBAN", start: 38, length: 22 },
        { id: "d5", name: "IMPORTE_CENT", start: 61, length: 10 }
      ]
    },
    {
      name: "FOOTER",
      behavior: "FOOTER",
      trigger: "FOOT",
      triggerStart: 0,
      fields: [
        { id: "f1", name: "ETIQUETA", start: 0, length: 4 },
        { id: "f2", name: "TOTAL_REGS", start: 5, length: 6 },
        { id: "f3", name: "SUMA_IMPORTE", start: 12, length: 12 }
      ]
    }
  ],
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const STRESS_TEMPLATE_DATA = {
  name: "NOMBRE.docx (STRESS_EMULATED)",
  type: "HTML",
  content: `
    <div style="font-family: Arial, sans-serif; padding: 40px;">
      <h1>NOTIFICACIÓN DE PRUEBA DE CARGA</h1>
      <p>Estimado/a <strong>{{NOMBRE_COMPLETO}}</strong>,</p>
      <p>Esta es una carta generada automáticamente para el registro <strong>{{ID_CLIENTE}}</strong>.</p>
      <p>Su IBAN detectado es: {{IBAN}}</p>
      <p>Importe total pendiente: {{IMPORTE_CENT}} céntimos.</p>
      <br/>
      <p>Atentamente,<br/>Departamento de Stress QA</p>
    </div>
  `,
  isActive: true,
  updatedAt: Date.now()
};

export async function seedStressEnvironment() {
  // 1. Seed Preset (Force field names consistency)
  let presetId: number;
  const existingPreset = await db.presets.where('name').equals(STRESS_PRESET_DATA.name).first();
  if (!existingPreset) {
    presetId = await db.presets.add(STRESS_PRESET_DATA as any) as number;
  } else {
    presetId = existingPreset.id!;
    // UPDATE fields to ensure they match our logic
    await db.presets.update(presetId, { recordTypes: STRESS_PRESET_DATA.recordTypes as any });
  }

  // 2. Seed Template
  let templateId: number;
  const existingTemplate = await db.letter_templates.where('name').equals(STRESS_TEMPLATE_DATA.name).first();
  if (!existingTemplate) {
    templateId = await db.letter_templates.add(STRESS_TEMPLATE_DATA as any) as number;
  } else {
    templateId = existingTemplate.id!;
  }

  // 3. Seed Mapping (Industrial Auto-Link)
  let mapping: any;
  const existingMapping = await db.letter_mappings
    .where('templateId').equals(templateId)
    .filter(m => m.etlPresetId === presetId)
    .first();

  const mappingDefinition: any[] = [
    { templateVar: "NOMBRE_COMPLETO", sourceType: "TEMPLATE", sourceField: "NOMBRE_COMPLETO" },
    { templateVar: "ID_CLIENTE", sourceType: "TEMPLATE", sourceField: "ID_CLIENTE" },
    { templateVar: "IBAN", sourceType: "TEMPLATE", sourceField: "IBAN" },
    { templateVar: "IMPORTE_CENT", sourceType: "TEMPLATE", sourceField: "IMPORTE_CENT" }
  ];

  if (!existingMapping) {
    mapping = {
      name: "AUTO_STRESS_MAPPING",
      templateId,
      etlPresetId: presetId,
      mappings: mappingDefinition,
      isActive: true,
      updatedAt: Date.now()
    };
    mapping.id = await db.letter_mappings.add(mapping as any) as number;
  } else {
    mapping = existingMapping;
    // Forzar actualización de mappings para QA
    await db.letter_mappings.update(mapping.id!, { mappings: mappingDefinition });
    mapping.mappings = mappingDefinition;
  }

  const template = await db.letter_templates.get(templateId);
  const preset = await db.presets.get(presetId);

  return { presetId, templateId, mapping, template, preset };
}

export function generateIndustrialStressData(count: number = 10000): File {
  const names = ['JUAN MARTINEZ', 'MARIA PEREZ', 'ALBERTO RODRIGUEZ', 'ANA SANCHEZ', 'PEDRO LOPEZ', 'LUISA GARCIA', 'JULIA HERNANDEZ', 'CARLOS JIMENEZ', 'BELEN GOMEZ', 'ROBERTO DIAZ'];
  const surnames = ['GARCIA', 'LOPEZ', 'MARTINEZ', 'PEREZ', 'RODRIGUEZ', 'SANCHEZ', 'HERNANDEZ', 'JIMENEZ', 'GOMEZ', 'DIAZ'];

  const lines: string[] = [];
  lines.push('HEAD 2026-04-16 BATCH_STRESS_10K');

  for (let i = 1; i <= count; i++) {
    const id = i.toString().padStart(6, '0');
    const name = names[i % 10] + ' ' + surnames[(i + 5) % 10];
    const paddedName = name.padEnd(25).substring(0, 25);
    const iban = 'ES' + Math.random().toString().substring(2, 22).padStart(20, '0');
    const amount = (Math.floor(Math.random() * 1000000)).toString().padStart(10, '0');
    
    lines.push(`DATA ${id} ${paddedName} ${iban} ${amount}`);
  }

  lines.push(`FOOT ${count.toString().padStart(6, '0')} ${'0'.repeat(12)}`);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  return new File([blob], `STRESS_TEST_${count}_REGS.txt`, { type: 'text/plain' });
}
