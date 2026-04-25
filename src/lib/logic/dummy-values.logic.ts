/**
 * ABDFN Suite - Dummy Data Logic (Phase 19)
 * Guesses logical types from templateVar names and generates synthetic data.
 */

export type DummyLogicalType =
  | 'name'
  | 'address'
  | 'date'
  | 'datetime'
  | 'amount'
  | 'percent'
  | 'id'
  | 'iban'
  | 'phone'
  | 'generic';

/**
 * Guesses the logical data type from a placeholder name.
 */
export const guessLogicalType = (rawVar: string): DummyLogicalType => {
  const v = rawVar.toUpperCase();
  const has = (s: string) => v.includes(s);

  if (has('IMPORTE') || has('AMOUNT') || has('CUOTA') || has('TOTAL')) {
    return 'amount';
  }
  if (has('PORC') || has('PCT') || has('PORCENTAJE') || has('PERCENT')) {
    return 'percent';
  }
  if (has('FECHA') || has('FEC_') || has('_DATE') || v === 'DATE') {
    if (has('HORA') || has('TIME')) return 'datetime';
    return 'date';
  }
  if (has('NOMBRE') || has('NAME') || has('APELLIDO') || has('SURNAME')) {
    return 'name';
  }
  if (has('DIRECCION') || has('ADDRESS') || has('DOMICILIO')) {
    return 'address';
  }
  if (has('IBAN') || has('CCC') || has('CUENTABANCARIA')) {
    return 'iban';
  }
  if (has('TELEF') || has('TEL') || has('PHONE') || has('MOVIL')) {
    return 'phone';
  }
  if (has('DOC') || has('DNI') || has('NIF') || has('ID')) {
    return 'id';
  }

  return 'generic';
};

/**
 * Generates a realistic but synthetic value for a given logical type.
 */
export const generateDummyValue = (
  logicalType: DummyLogicalType,
  placeholder: string,
): string => {
  switch (logicalType) {
    case 'name':
      return 'JUAN PÉREZ GARCÍA';
    case 'address':
      return 'C/ AVENIDA FALSA 123, 28001 MADRID';
    case 'date':
      return '21/04/2026';
    case 'datetime':
      return '21/04/2026 09:30';
    case 'amount':
      return '1.234,56 €';
    case 'percent':
      return '7,50 %';
    case 'iban':
      return 'ES76 2100 0418 4502 0005 1332';
    case 'phone':
      return '+34 600 123 456';
    case 'id':
      return '12345678Z';
    case 'generic':
    default:
      return `DUMMY_${placeholder.toUpperCase()}`;
  }
};
