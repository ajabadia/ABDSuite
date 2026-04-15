import { GawebRecord, GawebRecordSchema } from '../types/letter.types';

export class GawebExporter {
  
  /**
   * Serializes a GawebRecord following the legacy fixed-width format (251 chars).
   * Achieves 100% parity with legacy C# Serialization and HOST documentation.
   */
  static serializeRecord(record: GawebRecord): string {
    // Validate schema first
    const clean = GawebRecordSchema.parse(record);

    // Padding & Construction logic (Industrial Fixed Width)
    // Following positions from documentation:
    return [
      clean.LetterType.padEnd(1),             // 1
      clean.Format.padEnd(2),                 // 2-3
      clean.GenerationDate.padEnd(8),         // 4-11
      clean.Batch.padStart(4, '0'),           // 12-15
      clean.Sequential.padStart(7, '0'),      // 16-22
      clean.Page.padStart(4, '0'),            // 23-26
      clean.DocCode.padEnd(6),                // 27-32
      clean.Version.padStart(4, '0'),         // 33-36
      clean.ContractClass.padEnd(2),          // 37-38
      clean.ContractCode.padEnd(25),          // 39-63
      clean.TIREL.padEnd(1),                  // 64
      clean.NUREL.padStart(3, '0'),           // 65-67
      clean.CLALF.padEnd(15),                 // 68-82
      clean.INDOM.padStart(2, '0'),           // 83-84
      clean.ForceSend.padEnd(1),              // 85
      clean.Language.padEnd(2),               // 86-87
      clean.SavingOpCode.padEnd(2),           // 88-89
      clean.SavingOpAccount.padEnd(25),       // 90-114
      clean.SavingOpSign.padEnd(1),           // 115
      clean.SavingOpAmount.padStart(13, '0'), // 116-128
      clean.SavingOpCurrency.padEnd(2),       // 129-130
      clean.SavingOpISO.padEnd(3),            // 131-133
      clean.SavingOpConcept.padEnd(2),        // 134-135
      clean.LetterDate.padEnd(8),             // 136-143
      clean.DestinationIndicator.padEnd(1),   // 144
      clean.LoadDetail.padStart(4, '0'),      // 145-148
      clean.DeliveryWay.padEnd(2),            // 149-150
      clean.PaperCopy.padEnd(1),              // 151
      clean.OfficeCode.padStart(5, '0'),      // 152-156
      clean.EmailFax.padEnd(50),              // 157-206
      clean.ContentLength.padStart(5, '0'),   // 207-211
      clean.NombrePDF.padEnd(40)              // 212-251
    ].join('');
  }

  /**
   * Generates the MD5-based standardized filename for GAWEB PDFs (PseudoCodRef).
   * Format: {BaseMD5(32)}{Sequence(8)} = 40 chars total.
   * Matches legacy calculateGawebPdfName logic exactly.
   */
  static generateDocName(baseHash: string, index: number): string {
    // Legacy spec: MD5(32) + Sequence(8)
    const suffix = index.toString().padStart(8, '0');
    // Ensure baseHash is 32 chars (trimmed or padded if needed, but usually it's an MD5)
    const cleanHash = baseHash.substring(0, 32).padEnd(32, '0');
    return `${cleanHash}${suffix}`;
  }

  /**
   * Generates the overall package name for the ZIP and .GAWEB files.
   */
  static generatePackageName(entorno: string, timestamp: string, lote: string): string {
    // Standard industrial naming
    return `COMUNICADOS.PDF.${entorno}.${timestamp}.L${lote.padStart(4, '0')}`;
  }
}
