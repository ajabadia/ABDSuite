/**
 * GAWEB Golden Profile Types - Industrial Edition v1.3
 * Standards: 
 * - GAWEB v1.3 Design
 * - PDF Protocol v4
 */

export type GawebFieldFormat =
  | 'ALFANUMERICO'
  | 'NUMERICO'
  | 'FECHA_YYYYMMDD'
  | 'MONEDA'
  | 'ISO'
  | 'EMAIL_FAX'
  | 'FILL_BLANK'
  | 'FILL_ZERO';

export type GawebFieldRole =
  | 'IDENTIFICADOR'
  | 'DESTINO'
  | 'BUSQUEDA'
  | 'OPERACION_AH'
  | 'ROUTING'
  | 'METADATA'
  | 'RESERVADO';

export interface GawebFieldSpec {
  name: string;            // p.ej. "TIPO_CARTA", "FORMATO_CARTA", "FECHA_GENERACION"
  description?: string;    // texto libre con extracto del doc oficial
  start: number;           // 1-based (según diseño oficial)
  end: number;             // inclusive
  length: number;          // longitud total
  format: GawebFieldFormat;
  required: boolean;       
  allowedValues?: string[]; 
  role?: GawebFieldRole;   
}

export type GawebRuleType =
  | 'REQUIRED_FIELD'
  | 'MUTUALLY_EXCLUSIVE_GROUP'
  | 'AT_LEAST_ONE_IN_GROUP'
  | 'VALUE_IN_SET'
  | 'RANGE'
  | 'DEPENDENCY'; 

export interface GawebValidationRule {
  id: string;
  type: GawebRuleType;
  description: string;
  fields: string[];             // nombres de campos implicados

  params?: {
    required?: boolean;         // REQUIRED_FIELD
    minSelected?: number;       // MUTUALLY_EXCLUSIVE_GROUP / AT_LEAST_ONE_IN_GROUP
    maxSelected?: number;
    allowedValues?: string[];    // VALUE_IN_SET
    min?: number;               // RANGE
    max?: number;
    whenField?: string;         // DEPENDENCY
    whenValue?: string;
    thenField?: string;
    thenAllowedValues?: string[];
  };
}

export interface GawebGoldenProfile {
  id: string;                     // uuid
  name: string;                   // "GAWEB v1 - PDF A4 izquierda"
  version: string;                // "1.0.0"
  active: boolean;

  // Claves de enlace industrial
  codigoDocumento: string;        // Xnnnnn
  formatoCarta: string;           // '01' | '02' | '03' | '04' | '05'
  entorno?: string;               // GA.GAWEB.<entorno>

  sourceType: 'GAWEB_TXT' | 'GAWEB_GAWEB' | 'METADATOS_PDF';

  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;

  notes?: string;

  recordLayout: GawebFieldSpec[];
  validationRules: GawebValidationRule[];
  breakingRuleIds?: string[];     // Reglas cuya violación marca el fichero como BREAK (Duro)

  contentMode: 'OVERLAY_TEXT' | 'PDF_NAME';
  contentSpec?: {
    maxLines?: number;
    lineLength?: number;
    pdfNameField?: string;
  };
}
