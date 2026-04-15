/**
 * Letter Station Constants & Reference Data
 * 1:1 Parity with legacy C# ReferenceData.cs
 */

export interface ReferenceItem {
  globalId: string;
  label: string;
  extra?: string;
  help?: string;
}

// Idiomas (ISO 639-1) - Position 86-87
export const IDIOMAS_ISO: ReferenceItem[] = [
  { globalId: "  ", label: "Vacío (Por defecto)" },
  { globalId: "ES", label: "ES - Español" },
  { globalId: "EN", label: "EN - Inglés" },
  { globalId: "FR", label: "FR - Francés" },
  { globalId: "DE", label: "DE - Alemán" },
  { globalId: "IT", label: "IT - Italiano" },
  { globalId: "PT", label: "PT - Portugués" },
  { globalId: "CA", label: "CA - Catalán" },
  { globalId: "EU", label: "EU - Euskera" },
  { globalId: "GL", label: "GL - Gallego" },
  { globalId: "RU", label: "RU - Ruso" },
  { globalId: "ZH", label: "ZH - Chino" }
];

// Vías de Reparto (Pos 88-89)
export const VIAS_REPARTO: ReferenceItem[] = [
  { globalId: "  ", label: "Vacío (Estándar)" },
  { globalId: "01", label: "01 - Reparto Especial 1" },
  { globalId: "02", label: "02 - Reparto Especial 2" }
];

// Copia Papel (Pos 90)
export const COPIAS_PAPEL: ReferenceItem[] = [
  { globalId: " ", label: "Vacío (No indicado)" },
  { globalId: "S", label: "S - Sí" },
  { globalId: "N", label: "N - No" },
  { globalId: "X", label: "X - No Imprimir" }
];

// Tipos de Soporte
export const SOPORTES_GAWEB: ReferenceItem[] = [
  { globalId: "OV", label: "OV - Overlay", extra: "OV" },
  { globalId: "PDF", label: "PDF - Digital", extra: "PDF" }
];

// Formatos Carta (Pos 0-1)
export const FORMATOS_GAWEB: ReferenceItem[] = [
  { globalId: "01", label: "01 - Overlay, tercio (Din A6)", extra: "OV" },
  { globalId: "02", label: "02 - Overlay, Din A4 sobre americano ventana pequeña", extra: "OV" },
  { globalId: "03", label: "03 - Overlay, Din A4 Duplex sobre americano ventana grande", extra: "OV" },
  { globalId: "04", label: "04 - PDF A4 ventana Izquierda sobre americano ventana grande", extra: "PDF" },
  { globalId: "05", label: "05 - PDF A4 ventana derecha sobre C5", extra: "PDF" }
];

// Tipos de Destinatario
export const DESTINOS_GAWEB: ReferenceItem[] = [
  { globalId: "CL", label: "Cliente" },
  { globalId: "CT", label: "Contrato" },
  { globalId: "CC", label: "Cuenta Corriente" }
];

// Indicadores de Destino (Pos 2)
export const INDICADORES_DESTINO: ReferenceItem[] = [
  { globalId: "0", label: "Clientes" },
  { globalId: "7", label: "Central" },
  { globalId: "O", label: "Oficinas" }
];

// Métodos de Envío (Pos 3)
export const METODOS_ENVIO: ReferenceItem[] = [
  { globalId: " ", label: "Canal elegido por el cliente" },
  { globalId: "1", label: "Papel al cliente" },
  { globalId: "3", label: "Por FAX" },
  { globalId: "4", label: "Por Correo Electrónico" },
  { globalId: "5", label: "Al Buzón Electrónico (solo cargar en la WEB)" },
  { globalId: "8", label: "No enviar, solo cargar en WEB" }
];

// Metadata / Help mapping
export const GAWEB_HELP: Record<string, string> = {
  formato: "Código de 2 dígitos (Posiciones 0-1).\n01-03: Overlay (requiere plantilla).\n04-05: PDF Digital.\nOBLIGATORIO.",
  soporte: "Indica si el origen es una macro Overlay (OV) o un PDF Digital.",
  entorno: "Identificador técnico del proceso (Ej: ABDFN01).\nSe usa para nombrar el paquete ZIP final.\nNO se serializa dentro del GAWEB.",
  codDoc: "Identificador de plantilla (Posiciones 5-10).\nDebe tener 6 caracteres exactos.\nEjemplo: X00054.",
  oficina: "Código de la oficina responsable (Posiciones 11-15).\nDebe tener 5 dígitos.",
  paginas: "Número total de páginas del documento (Posiciones 16-19).\nDebe tener 4 dígitos.",
  fechas: "Formato AAAAMMDD (8 dígitos).\nEjemplo: 20261231.",
  idioma: "Código ISO 639-1 (Posiciones 86-87).\nVacío = Español (Estándar).",
  viaReparto: "Posiciones 88-89 del registro.\nUso para segmentaciones de impresión especiales.",
  copiaPapel: "Posición 90.\nS: Generar copia física.\nX: Bloqueo de impresión (Solo digital)."
};
