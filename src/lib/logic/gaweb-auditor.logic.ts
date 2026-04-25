/**
 * GAWEB Auditor Logic - Unified Industrial Edition
 * Refactored to achieve 100% parity with legacy C# AbdTools.Core and official documentation.
 * 
 * Standards:
 * - English logic identifiers (02-code-quality-architecture)
 * - Industrial beige/purple aesthetic connectivity
 * - i18n key-based error reporting (06-i18n-ux-feedback)
 */

import { GawebGoldenProfile } from '../types/gaweb-golden.types';
import { regulatoryOrchestrator } from './RegulatoryOrchestrator';
import '@/lib/regulatory'; // Initialize plugins

export interface GawebField {
  name: string;
  length: number;
  startIndex: number; // 0-based
  isNumeric?: boolean;
}

export const GAWEB_FIELDS: GawebField[] = [
  { name: 'LetterType', length: 1, startIndex: 0 },         // 1-1 (Fijo Blanco)
  { name: 'Format', length: 2, startIndex: 1 },             // 2-3 (01-05)
  { name: 'GenerationDate', length: 8, startIndex: 3, isNumeric: true }, // 4-11 (AAAAMMDD)
  { name: 'Batch', length: 4, startIndex: 11, isNumeric: true },          // 12-15 (Lote)
  { name: 'Sequential', length: 7, startIndex: 15, isNumeric: true },     // 16-22 (Secuencial)
  { name: 'Page', length: 4, startIndex: 22, isNumeric: true },           // 23-26 (Página)
  { name: 'DocCode', length: 6, startIndex: 26 },            // 27-32 (Cód Documento)
  { name: 'Version', length: 4, startIndex: 32, isNumeric: true },        // 33-36 (Versión Ceros)
  { name: 'ContractClass', length: 2, startIndex: 36 },      // 37-38 (Clase)
  { name: 'ContractCode', length: 25, startIndex: 38 },      // 39-63 (Código Contrato)
  { name: 'TIREL', length: 1, startIndex: 63 },              // 64-64 (Tipo Relación)
  { name: 'NUREL', length: 3, startIndex: 64, isNumeric: true },          // 65-67 (Núm Relación)
  { name: 'CLALF', length: 15, startIndex: 67 },             // 68-82 (ID Cliente)
  { name: 'INDOM', length: 2, startIndex: 82, isNumeric: true },          // 83-84 (Cod Domicilio)
  { name: 'ForceSend', length: 1, startIndex: 84 },          // 85-85 (Forzar Envío - Vacío)
  { name: 'Language', length: 2, startIndex: 85 },           // 86-87 (Idioma - Vacío)
  { name: 'SavingOpCode', length: 2, startIndex: 87 },       // 88-89 (Ahorro - AH)
  { name: 'SavingOpAccount', length: 25, startIndex: 89 },   // 90-114 (CCC)
  { name: 'SavingOpSign', length: 1, startIndex: 114 },       // 115-115 (Signo +/-)
  { name: 'SavingOpAmount', length: 13, startIndex: 115, isNumeric: true }, // 116-128 (Importe)
  { name: 'SavingOpCurrency', length: 2, startIndex: 128 },   // 129-130 (Moneda)
  { name: 'SavingOpISO', length: 3, startIndex: 130 },        // 131-133 (Cod ISO)
  { name: 'SavingOpConcept', length: 2, startIndex: 133 },    // 134-135 (Concepto)
  { name: 'LetterDate', length: 8, startIndex: 135, isNumeric: true },     // 136-143 (Fecha AAAAMMDD)
  { name: 'DestinationIndicator', length: 1, startIndex: 143 }, // 144-144 (0, O, 7)
  { name: 'LoadDetail', length: 4, startIndex: 144, isNumeric: true },      // 145-148 (Fijo Cero)
  { name: 'DeliveryWay', length: 2, startIndex: 148 },        // 149-150 (Vacío)
  { name: 'PaperCopy', length: 1, startIndex: 150 },          // 151-151 (Vacío)
  { name: 'OfficeCode', length: 5, startIndex: 151 },         // 152-156 (Cód Oficina)
  { name: 'EmailFax', length: 50, startIndex: 156 },          // 157-206 (Vacío)
  { name: 'ContentLength', length: 5, startIndex: 206, isNumeric: true },   // 207-211 (Longitud Cero)
  { name: 'PdfName', length: 40, startIndex: 211 }            // 212-251 (Nombre PDF)
];

export interface GawebError {
  line: number;
  field: string;
  position: string;
  colStart: number;
  colEnd: number;
  severity: 'ERROR' | 'WARNING' | 'INFO';
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
 * Validates a single line of a GAWEB file.
 * Used by streaming workers to process GBs of data without memory overhead.
 */
export function auditGawebLine(
  line: string, 
  lineNum: number, 
  profile?: GawebGoldenProfile
): { record: Record<string, string>, errors: GawebError[], warnings: GawebError[] } {
  const result: { errors: GawebError[], warnings: GawebError[] } = {
    errors: [],
    warnings: []
  };

  // Spec compliance: Trimmed lines are valid if they were naturally short.
  // We pad them virtualization to 251 for field extraction.
  const paddedLine = line.padEnd(251, ' ');

  if (line.length < 212) {
    result.errors.push({
      line: lineNum,
      field: 'LINE_LENGTH',
      position: `1-${line.length}`,
      colStart: 0,
      colEnd: line.length,
      severity: 'ERROR',
      messageKey: 'audit.errors.insufficient_length',
      value: `${line.length} bytes`
    });
    return { record: {}, errors: result.errors, warnings: result.warnings };
  }

  const record: Record<string, string> = {};

  // 1. Extraction Pass
  GAWEB_FIELDS.forEach(field => {
    const start = field.startIndex;
    const end = field.startIndex + field.length;
    record[field.name] = paddedLine.substring(start, end);
  });

  // 2. Validation Pass (with full record context)
  GAWEB_FIELDS.forEach(field => {
    const value = record[field.name];
    const start = field.startIndex;
    const end = field.startIndex + field.length;
    const posLabel = `${start + 1}-${end}`;
    validateField(field, value, lineNum, posLabel, result, record);
  });


  // Cross-field validations
  validateCrossFields(record, lineNum, result);

  // Golden Validation (Phase 17)
  if (profile) {
    validateGoldenLayout(record, lineNum, profile, result);
    executeValidationRules(record, lineNum, profile, result);
  }

  return { record, errors: result.errors, warnings: result.warnings };
}

/**
 * Validates a record against the Golden Profile layout specs.
 */
function validateGoldenLayout(
  record: Record<string, string>, 
  line: number, 
  profile: GawebGoldenProfile, 
  audit: { errors: GawebError[], warnings: GawebError[] }
) {
  const paddedLine = serializeGawebRecord(GAWEB_FIELDS, record);

  profile.recordLayout.forEach(spec => {
    const value = paddedLine.substring(spec.start - 1, spec.end).trim();
    const pos = `${spec.start}-${spec.end}`;
    const startIdx = spec.start - 1;
    const endIdx = spec.end;
    const isBreaking = profile.breakingRuleIds?.includes(spec.name) || false;

    const addIssue = (key: string) => {
      const issue: GawebError = { 
        line, 
        field: spec.name, 
        position: pos, 
        colStart: startIdx,
        colEnd: endIdx,
        severity: isBreaking ? 'ERROR' : 'WARNING' as any, 
        messageKey: key, value 
      };
      if (isBreaking) audit.errors.push(issue);
      else audit.warnings.push(issue);
    };

    // 1. Mandatory check
    if (spec.required && value === '') {
       addIssue('audit.errors.golden.required');
    }

    // 2. Format check
    if (value !== '') {
      switch (spec.format) {
        case 'NUMERICO':
          if (!/^\d+$/.test(value)) addIssue('audit.errors.must_be_numeric');
          break;
        case 'FECHA_YYYYMMDD':
          if (!isValidGawebDate(value)) addIssue('audit.errors.invalid_date_format');
          break;
        case 'MONEDA':
          if (!/^[A-Z]{3}$/.test(value)) addIssue('audit.errors.golden.invalid_currency');
          break;
        // email_fax, iso, alfanumerico are generally loose or checked via regex if needed
      }
    }

    // 3. Allowed Values
    if (spec.allowedValues && spec.allowedValues.length > 0 && !spec.allowedValues.includes(value)) {
       addIssue('audit.errors.golden.value_not_allowed');
    }
  });
}

/**
 * Executes high-level business rules from Golden Profile.
 */
function executeValidationRules(
  record: Record<string, string>, 
  line: number, 
  profile: GawebGoldenProfile, 
  audit: { errors: GawebError[], warnings: GawebError[] }
) {
  const paddedLine = serializeGawebRecord(GAWEB_FIELDS, record);

  profile.validationRules.forEach(rule => {
    const isBreaking = profile.breakingRuleIds?.includes(rule.id) || false;
    
    // Resolve colStart/colEnd from the first field in the rule if possible
    const primaryFieldName = rule.fields[0];
    const spec = profile.recordLayout.find(s => s.name === primaryFieldName);
    const startIdx = spec ? spec.start - 1 : 0;
    const endIdx = spec ? spec.end : 0;

    const addIssue = () => {
      const issue: GawebError = { 
        line, 
        field: rule.id, 
        position: 'GOLDEN_RULE', 
        colStart: startIdx,
        colEnd: endIdx,
        severity: isBreaking ? 'ERROR' : 'WARNING' as any, 
        messageKey: `audit.rule.${rule.id}`, 
        value: rule.description 
      };
      if (isBreaking) audit.errors.push(issue);
      else audit.warnings.push(issue);
    };

    const getVal = (fName: string) => {
      const spec = profile.recordLayout.find(s => s.name === fName);
      if (!spec) return record[fName]?.trim() || '';
      return paddedLine.substring(spec.start - 1, spec.end).trim();
    };

    switch (rule.type) {
      case 'REQUIRED_FIELD':
        if (rule.fields.some(f => getVal(f) === '')) addIssue();
        break;
      case 'AT_LEAST_ONE_IN_GROUP':
        const selected = rule.fields.filter(f => getVal(f) !== '');
        if (selected.length < (rule.params?.minSelected ?? 1)) addIssue();
        break;
      case 'MUTUALLY_EXCLUSIVE_GROUP':
        const filled = rule.fields.filter(f => getVal(f) !== '');
        if (filled.length > (rule.params?.maxSelected ?? 1)) addIssue();
        break;
      case 'VALUE_IN_SET':
        if (rule.fields.some(f => !rule.params?.allowedValues?.includes(getVal(f)))) addIssue();
        break;
      case 'DEPENDENCY':
        if (getVal(rule.params?.whenField || '') === rule.params?.whenValue) {
           if (rule.params?.thenField && !rule.params?.thenAllowedValues?.includes(getVal(rule.params.thenField))) {
              addIssue();
           }
        }
        break;
    }
  });
}

/**
 * Validates a GAWEB file (fixed-width .txt) - Legacy Synchronous version.
 * Deprecated for large files. Use streaming instead.
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
    const { record, errors, warnings } = auditGawebLine(line, index + 1);
    result.lines++;
    result.errors.push(...errors);
    result.warnings.push(...warnings);
    if (record && Object.keys(record).length > 0) {
      result.parsedData.push(record);
    }
  });

  return result;
}

function validateField(field: GawebField, value: string, line: number, pos: string, audit: { errors: GawebError[], warnings: GawebError[] }, record: Record<string, string>) {
  const addError = (msgKey: string) => audit.errors.push({ 
    line, 
    field: field.name, 
    position: pos, 
    colStart: field.startIndex,
    colEnd: field.startIndex + field.length,
    severity: 'ERROR', 
    messageKey: msgKey, 
    value 
  });

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
    case 'CLALF':
      if (value.trim() === '') {
        addError('audit.errors.not_empty');
      } else {
        // Regulatory Plugin Integration (Sync-Plug)
        const countryIso = record['SavingOpISO']?.trim() || 'ES'; // Default fallback
        const regResult = regulatoryOrchestrator.validateTin(countryIso, value);
        if (!regResult.isValid) {
          audit.errors.push({ 
            line, 
            field: field.name, 
            position: pos, 
            colStart: field.startIndex,
            colEnd: field.startIndex + field.length,
            severity: regResult.severity || 'ERROR', 
            messageKey: regResult.message || `audit.errors.invalid_tin_${countryIso.toLowerCase()}`, 
            value 
          });
        }
      }
      break;
    case 'PdfName':
    case 'DocCode':
      if (value.trim() === '') addError('audit.errors.not_empty');
      break;
  }
}

function validateCrossFields(record: Record<string, string>, line: number, audit: { errors: GawebError[], warnings: GawebError[] }) {
  // Destino Validation: CLALF or CodContrato must be filled
  const clalf = record['CLALF'].trim();
  const contract = record['ContractCode'].trim();
  
  if (clalf === '' && contract === '') {
    audit.errors.push({
      line,
      field: 'DESTINO',
      position: '39-82',
      colStart: 38,
      colEnd: 82,
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
         colStart: 89,
         colEnd: 114,
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
