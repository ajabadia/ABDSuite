/**
 * GAWEB Auditor Logic - Unified Industrial Edition
 * Refactored to achieve 100% parity with legacy C# AbdTools.Core and official documentation.
 * 
 * Standards:
 * - English logic identifiers (02-code-quality-architecture)
 * - Industrial beige/purple aesthetic connectivity
 * - i18n key-based error reporting (06-i18n-ux-feedback)
 */

export interface GawebField {
  name: string;
  length: number;
  isNumeric?: boolean;
}

export const GAWEB_FIELDS: GawebField[] = [
  { name: 'LetterType', length: 1 },         // 1-1 (Fijo Blanco)
  { name: 'Format', length: 2 },             // 2-3 (01-05)
  { name: 'GenerationDate', length: 8, isNumeric: true }, // 4-11 (AAAAMMDD)
  { name: 'Batch', length: 4, isNumeric: true },          // 12-15 (Lote)
  { name: 'Sequential', length: 7, isNumeric: true },     // 16-22 (Secuencial)
  { name: 'Page', length: 4, isNumeric: true },           // 23-26 (Página)
  { name: 'DocCode', length: 6 },            // 27-32 (Cód Documento)
  { name: 'Version', length: 4, isNumeric: true },        // 33-36 (Versión Ceros)
  { name: 'ContractClass', length: 2 },      // 37-38 (Clase)
  { name: 'ContractCode', length: 25 },      // 39-63 (Código Contrato)
  { name: 'TIREL', length: 1 },              // 64-64 (Tipo Relación)
  { name: 'NUREL', length: 3, isNumeric: true },          // 65-67 (Núm Relación)
  { name: 'CLALF', length: 15 },             // 68-82 (ID Cliente)
  { name: 'INDOM', length: 2, isNumeric: true },          // 83-84 (Cod Domicilio)
  { name: 'ForceSend', length: 1 },          // 85-85 (Forzar Envío - Vacío)
  { name: 'Language', length: 2 },           // 86-87 (Idioma - Vacío)
  { name: 'SavingOpCode', length: 2 },       // 88-89 (Ahorro - AH)
  { name: 'SavingOpAccount', length: 25 },   // 90-114 (CCC)
  { name: 'SavingOpSign', length: 1 },       // 115-115 (Signo +/-)
  { name: 'SavingOpAmount', length: 13, isNumeric: true }, // 116-128 (Importe)
  { name: 'SavingOpCurrency', length: 2 },   // 129-130 (Moneda)
  { name: 'SavingOpISO', length: 3 },        // 131-133 (Cod ISO)
  { name: 'SavingOpConcept', length: 2 },    // 134-135 (Concepto)
  { name: 'LetterDate', length: 8, isNumeric: true },     // 136-143 (Fecha AAAAMMDD)
  { name: 'DestinationIndicator', length: 1 }, // 144-144 (0, O, 7)
  { name: 'LoadDetail', length: 4, isNumeric: true },      // 145-148 (Fijo Cero)
  { name: 'DeliveryWay', length: 2 },        // 149-150 (Vacío)
  { name: 'PaperCopy', length: 1 },          // 151-151 (Vacío)
  { name: 'OfficeCode', length: 5 },         // 152-156 (Cód Oficina)
  { name: 'EmailFax', length: 50 },          // 157-206 (Vacío)
  { name: 'ContentLength', length: 5, isNumeric: true },   // 207-211 (Longitud Cero)
  { name: 'PdfName', length: 40 }            // 212-251 (Nombre PDF)
];

export interface GawebError {
  line: number;
  field: string;
  position: string;
  severity: 'ERROR' | 'WARNING';
  messageKey: string;
  value: string;
}

export interface GawebAuditResult {
  lines: number;
  errors: GawebError[];
  warnings: GawebError[];
  parsedData: Record<string, string>[];
}

/**
 * Validates a GAWEB file (fixed-width .txt)
 */
export function auditGaweb(content: string): GawebAuditResult {
  const lines = content.split(/\r?\n/);
  const result: GawebAuditResult = {
    lines: 0,
    errors: [],
    warnings: [],
    parsedData: []
  };

  lines.forEach((line, index) => {
    if (line.trim() === '') return;
    result.lines++;
    const lineNum = index + 1;

    // Spec compliance: Trimmed lines are valid if they were naturally short.
    // We pad them virtualization to 251 for field extraction.
    const paddedLine = line.padEnd(251, ' ');

    if (line.length < 212) {
      result.errors.push({
        line: lineNum,
        field: 'LINE_LENGTH',
        position: `1-${line.length}`,
        severity: 'ERROR',
        messageKey: 'audit.errors.insufficient_length',
        value: `${line.length} bytes`
      });
      return;
    }

    const record: Record<string, string> = {};
    let currentPos = 0;

    GAWEB_FIELDS.forEach(field => {
      const start = currentPos;
      const end = currentPos + field.length;
      const value = paddedLine.substring(start, end);
      const posLabel = `${start + 1}-${end}`;
      
      record[field.name] = value;
      validateField(field, value, lineNum, posLabel, result);
      
      currentPos = end;
    });

    // Cross-field validations
    validateCrossFields(record, lineNum, result);

    result.parsedData.push(record);
  });

  return result;
}

function validateField(field: GawebField, value: string, line: number, pos: string, audit: GawebAuditResult) {
  const addError = (msgKey: string) => audit.errors.push({ line, field: field.name, position: pos, severity: 'ERROR', messageKey: msgKey, value });

  switch (field.name) {
    case 'LetterType':
      if (value !== ' ') addError('audit.errors.fixed_blank');
      break;
    case 'Format':
      if (!['01', '02', '03', '04', '05'].includes(value)) addError('audit.errors.invalid_format');
      break;
    case 'GenerationDate':
    case 'LetterDate':
      if (!isValidGawebDate(value)) addError('audit.errors.invalid_date_format');
      break;
    case 'Version':
    case 'LoadDetail':
      if (value !== '0000') addError('audit.errors.fixed_zeros');
      break;
    case 'NUREL':
    case 'INDOM':
    case 'SavingOpAmount':
    case 'ContentLength':
    case 'Batch':
    case 'Sequential':
    case 'Page':
      if (value.trim() !== '' && !/^\d+$/.test(value.trim())) addError('audit.errors.must_be_numeric');
      break;
    case 'ForceSend':
      if (![' ', '1', '3', '4', '5', '8'].includes(value)) addError('audit.errors.invalid_force_send');
      break;
    case 'Language':
    case 'DeliveryWay':
    case 'PaperCopy':
      if (value.trim() !== '') addError('audit.errors.must_be_empty');
      break;
    case 'SavingOpCode':
      if (value.trim() !== '' && value !== 'AH') addError('audit.errors.invalid_ah_code');
      break;
    case 'DestinationIndicator':
      if (!['0', 'O', '7'].includes(value)) addError('audit.errors.invalid_destination');
      break;
    case 'PdfName':
    case 'DocCode':
      if (value.trim() === '') addError('audit.errors.not_empty');
      break;
  }
}

function validateCrossFields(record: Record<string, string>, line: number, audit: GawebAuditResult) {
  // Destino Validation: CLALF or CodContrato must be filled
  const clalf = record['CLALF'].trim();
  const contract = record['ContractCode'].trim();
  
  if (clalf === '' && contract === '') {
    audit.errors.push({
      line,
      field: 'DESTINO',
      position: '39-82',
      severity: 'ERROR',
      messageKey: 'audit.errors.destino_required',
      value: 'CLALF & CONTRACT MISSING'
    });
  }

  // OpAhorro validation: If AHCode is AH, other fields should not be empty ideally
  if (record['SavingOpCode'] === 'AH') {
    if (record['SavingOpAccount'].trim() === '') {
       audit.warnings.push({
         line,
         field: 'SavingOpAccount',
         position: '90-114',
         severity: 'WARNING',
         messageKey: 'audit.errors.not_empty',
         value: 'AH_ACCOUNT_MISSING'
       });
    }
  }
}

/**
 * Universal GAWEB Serializer
 * Used by both Generator and Validator to ensure 100% parity.
 */
export function serializeGawebRecord(fields: GawebField[], data: Record<string, string>): string {
  let body = "";
  
  fields.forEach(field => {
    let val = data[field.name] || "";
    
    if (field.isNumeric) {
      // Numeric: Pad with zeros to the left
      body += val.replace(/\D/g, '').substring(0, field.length).padStart(field.length, '0');
    } else {
      // Alphanumeric: Pad with spaces to the right
      body += val.substring(0, field.length).padEnd(field.length, ' ');
    }
  });

  return body.padEnd(300, ' ');
}

function isValidGawebDate(dateStr: string): boolean {
  if (dateStr.length !== 8) return false;
  if (!/^\d{8}$/.test(dateStr)) return false;
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
