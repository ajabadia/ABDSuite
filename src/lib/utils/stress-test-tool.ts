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
    <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 60px; color: #1a1a1a; background: white; border: 20px solid #f0f0f0;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">INDUSTRIAL_NOTIFICATION</h1>
        <div style="text-align: right;">
           <div style="background: #333; color: white; padding: 4px 12px; font-weight: 900; font-size: 12px;">ERA_5_COMPLIANT</div>
           <div style="font-size: 10px; margin-top: 4px;">SECURE_DOCUMENT_STREAM</div>
        </div>
      </div>
      
      <p style="font-size: 14px; color: #666;">REF_ID: <strong>{{ID_CLIENTE}}</strong></p>
      
      <p>Estimado/a <strong>{{NOMBRE_COMPLETO}}</strong>,</p>
      
      <div style="background: #fafafa; border: 1px solid #eee; padding: 20px; margin: 30px 0;">
        <p style="margin-top: 0;">Se ha detectado una anomalía técnica en su registro de auditoría. Por favor, verifique los siguientes detalles:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 700;">DESTINO_IBAN:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace;">{{IBAN}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 700;">CUANTÍA_PTE:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 900; color: #d32f2f;">{{IMPORTE_CENT}} CÉNTIMOS</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12px; line-height: 1.6; opacity: 0.8;">
        Este documento ha sido generado por el motor de alta fidelidad ABDFN Suite. 
        La paridad visual respecto al modelo industrial está garantizada bajo el protocolo Aseptic V4.
      </p>
      
      <div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; display: flex; justify-content: space-between;">
        <span>FIRMADO DIGITALMENTE POR: ABD_SUITE_ENGINE</span>
        <span>ID_SESIÓN: 0x88F2A1</span>
      </div>
    </div>
  `,

  isActive: true,
  updatedAt: Date.now()
};

export async function seedStressEnvironment() {
  // 1. Seed Preset (Force field names consistency)
  let presetId: string;
  const existingPreset = await db.presets_v6.where('name').equals(STRESS_PRESET_DATA.name).first();
  if (!existingPreset) {
    presetId = await db.presets_v6.add(STRESS_PRESET_DATA as any) as string;
  } else {
    presetId = existingPreset.id!;
    // UPDATE fields to ensure they match our logic
    await db.presets_v6.update(presetId, { recordTypes: STRESS_PRESET_DATA.recordTypes as any });
  }

  // 2. Seed Template
  let templateId: string;
  const existingTemplate = await db.lettertemplates_v6.where('name').equals(STRESS_TEMPLATE_DATA.name).first();
  if (!existingTemplate) {
    templateId = await db.lettertemplates_v6.add(STRESS_TEMPLATE_DATA as any) as string;
  } else {
    templateId = existingTemplate.id!;
  }

  // 3. Seed Mapping (Industrial Auto-Link)
  let mapping: any;
  const existingMapping = await db.lettermappings_v6
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
    mapping.id = await db.lettermappings_v6.add(mapping as any) as string;
  } else {
    mapping = existingMapping;
    // Forzar actualización de mappings para QA
    await db.lettermappings_v6.update(mapping.id!, { mappings: mappingDefinition });
    mapping.mappings = mappingDefinition;
  }

  const template = await db.lettertemplates_v6.get(templateId);
  const preset = await db.presets_v6.get(presetId);

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
