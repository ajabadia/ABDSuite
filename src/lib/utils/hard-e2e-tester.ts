import { getActiveDb, GoldenTest, AuditHistoryRecord } from '@/lib/db/db';
import type { EtlPreset } from '@/lib/types/etl.types';
import type { LetterTemplate, LetterMapping } from '@/lib/types/letter.types';
import type { CatDocumRecord } from '@/lib/types/catdocum.types';
import { GawebExporter } from './gaweb-exporter';
import { STRESS_PRESET_DATA, STRESS_TEMPLATE_DATA } from './stress-test-tool';

const HARD_E2E_TAG = 'HARD_E2E';
const CODDOC_1 = 'X00054'; // Golden + CATDOC completo
const CODDOC_2 = 'X00055'; // CATDOC incompleto / inactivo
const CODDOC_3 = 'X00056'; // sin CATDOC

/**
 * PUESTA EN ESCENA (SEEDING):
 * Configura registros en Dexie para los 3 escenarios de prueba.
 */
export async function seedHardE2E() {
  const realDb = getActiveDb();
  if (!realDb) {
     throw new Error('NO ACTIVE DB INSTANCE FOUND. Selecciona un Workspace primero.');
  }

  console.log('HARD_E2E DIAGNOSTIC:');
  console.log(' - Unit DB Name:', realDb.name);
  console.log(' - Tables inventory:', realDb.tables.map(t => t.name).join(', '));
  
  let golden: GoldenTest | undefined;
  let preset: EtlPreset | undefined;
  let template: LetterTemplate | undefined;
  let mapping: LetterMapping | undefined;

  // 1. Verificar si ya existe el escenario (X00054 es nuestro Golden de referencia)
  const goldenExisting = await realDb.table('golden_tests_v6').where('codDocumento').equals(CODDOC_1).first();
  
  if (!goldenExisting) {
    console.log('HARD_E2E: Escenario incompleto. Iniciando sembrado industrial...');
    
    // Verificación de tablas
    const required = ['presets_v6', 'lettertemplates_v6', 'lettermappings_v6', 'golden_tests_v6'];
    const missing = required.filter(name => !realDb.tables.find(t => t.name === name));
    if (missing.length > 0) {
      throw new Error(`ESTRUCTURA DE BD INCOMPLETA. Faltan tablas: ${missing.join(', ')}`);
    }

    const pId = crypto.randomUUID();
    const tId = crypto.randomUUID();
    const mId = crypto.randomUUID();

    try {
      console.log('HARD_E2E: Obteniendo tablas desde realDb...');
      const presetsTable = realDb.table('presets_v6');
      const templatesTable = realDb.table('lettertemplates_v6');
      const mappingsTable = realDb.table('lettermappings_v6');
      const goldensTable = realDb.table('golden_tests_v6');

      console.log('HARD_E2E: Insertando Preset...');
      await presetsTable.add({ ...STRESS_PRESET_DATA, id: pId } as any);
      
      console.log('HARD_E2E: Insertando Template...');
      await templatesTable.add({ ...STRESS_TEMPLATE_DATA, id: tId } as any);
      
      const mappingDef = [
        { templateVar: "NOMBRE_COMPLETO", sourceType: "TEMPLATE", sourceField: "NOMBRE_COMPLETO" },
        { templateVar: "ID_CLIENTE", sourceType: "TEMPLATE", sourceField: "ID_CLIENTE" },
        { templateVar: "IBAN", sourceType: "TEMPLATE", sourceField: "IBAN" },
        { templateVar: "IMPORTE_CENT", sourceType: "TEMPLATE", sourceField: "IMPORTE_CENT" }
      ];

      console.log('HARD_E2E: Insertando Mapping...');
      await mappingsTable.add({
        id: mId,
        name: "AUTO_HARD_E2E_MAPPING",
        templateId: tId,
        etlPresetId: pId,
        mappings: mappingDef,
        isActive: true,
        updatedAt: Date.now()
      } as any);

      const newGolden: GoldenTest = {
        id: crypto.randomUUID(),
        templateId: tId,
        mappingId: mId,
        etlPresetId: pId,
        codDocumento: CODDOC_1,
        version: '1.000',
        layoutHash: 'HARD_E2E_AUTO_HASH',
        hashAlgorithm: 'SHA-256',
        renderSpec: 'v1:page1@144dpi:gray:512x724',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      console.log('HARD_E2E: Insertando Golden...');
      const gId = await goldensTable.add(newGolden);
      
      console.log('HARD_E2E: Recuperando recursos...');
      golden = await goldensTable.get(gId as string);
      preset = await presetsTable.get(pId);
      template = await templatesTable.get(tId);
      mapping = await mappingsTable.get(mId);
    } catch (innerErr: any) {
      console.error('HARD_E2E: Error durante la creación de recursos base:', innerErr);
      throw new Error(`Fallo en sembrado base: ${innerErr.message}`);
    }
  } else {
    golden = goldenExisting;
    [preset, template, mapping] = await Promise.all([
      realDb.table('presets_v6').get(goldenExisting.etlPresetId),
      realDb.table('lettertemplates_v6').get(goldenExisting.templateId),
      realDb.table('lettermappings_v6').get(goldenExisting.mappingId),
    ]);
  }

  // Validación final por seguridad
  if (!preset || !template || !mapping || !golden) {
    throw new Error('HARD_E2E: Error crítico al crear o recuperar recursos base para X00054.');
  }

  // 2) CATDOC activo para X00054 (escenario perfecto)
  const catdocActive: CatDocumRecord = {
    id: crypto.randomUUID(),
    codDocumento: CODDOC_1,
    businessName: 'HARD_E2E X00054 OK',
    version: '1.0.0',
    presetId: golden.etlPresetId,
    templateId: golden.templateId,
    mappingId: golden.mappingId,
    channel: 'GAWEB',
    support: 'PDF',
    isActive: true,
    isDefaultForCode: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    goldenTestId: golden.id,
    notes: HARD_E2E_TAG,
    category: 'TEST',
    pagesDefault: 1,
    languageIso: 'ES'
  };

  // 3) CATDOC incompleto/inactivo para X00055 (escenario stop)
  const catdocBroken: CatDocumRecord = {
    id: crypto.randomUUID(),
    codDocumento: CODDOC_2,
    businessName: 'HARD_E2E X00055 BROKEN',
    version: '1.0.0',
    presetId: null, // incompleto a propósito
    templateId: null,
    mappingId: null,
    channel: 'GAWEB',
    support: 'PDF',
    isActive: false, // inactivo
    isDefaultForCode: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    notes: HARD_E2E_TAG,
    goldenTestId: null,
    category: 'TEST',
    pagesDefault: null,
    languageIso: null
  };

  // 4) Persistir CATDOCs (X00056 se deja ausente por diseño)
  await realDb.table('catdocumv6').put(catdocActive);
  await realDb.table('catdocumv6').put(catdocBroken);

  // 5) Registro de auditoría para trazabilidad
  await realDb.table('audit_history_v6').add({
    timestamp: Date.now(),
    module: 'LETTER',
    category: 'SYSTEM',
    action: 'LETTERHARDSEEDREADY',
    status: 'SUCCESS',
    details: JSON.stringify({
      tag: HARD_E2E_TAG,
      codigos: [CODDOC_1, CODDOC_2, CODDOC_3],
    }),
  });
}

/**
 * GENERADOR DE DATOS MIXTOS:
 * Crea un archivo GAWEB TXT intercalando los tres códigos.
 */
export async function generateMixedGawebFile(): Promise<{
  blob: Blob;
  name: string;
}> {
  const lines: string[] = [];
  const today = new Date();
  const fechaStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const buildRecord = (codDoc: string, seq: number) => {
    return GawebExporter.serializeRecord({
      LetterType: ' ',
      Format: '04',
      GenerationDate: fechaStr,
      Batch: 'E2E1',
      Sequential: seq.toString().padStart(7, '0'),
      Page: '0001',
      DocCode: codDoc,
      Version: '0000',
      ContractClass: '  ',
      ContractCode: `CONTR-${seq.toString().padStart(6, '0')}`.padEnd(25),
      TIREL: ' ',
      NUREL: '000',
      CLALF: ' '.repeat(15),
      INDOM: '00',
      ForceSend: ' ',
      Language: 'ES',
      SavingOpCode: '  ',
      SavingOpAccount: ' '.repeat(25),
      SavingOpSign: ' ',
      SavingOpAmount: '0'.repeat(13),
      SavingOpCurrency: '  ',
      SavingOpISO: '   ',
      SavingOpConcept: '  ',
      LetterDate: fechaStr,
      DestinationIndicator: '0',
      LoadDetail: '0000',
      DeliveryWay: '  ',
      PaperCopy: ' ',
      OfficeCode: '00001',
      EmailFax: ' '.repeat(50),
      ContentLength: '00000',
      PdfName: ' '.repeat(40)
    });
  };

  // Patrón mixto: 15 registros alternados (5 por código)
  for (let i = 0; i < 5; i++) {
    lines.push(buildRecord(CODDOC_1, i + 1));
    lines.push(buildRecord(CODDOC_2, 100 + i));
    lines.push(buildRecord(CODDOC_3, 200 + i));
  }

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const name = `GAWEB_HARD_E2E_${fechaStr}.txt`;
  
  return { blob, name };
}
