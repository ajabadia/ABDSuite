/**
 * Document Engine Worker - Phase C: Letter Station
 * Handles batch PDF generation and GAWEB packaging in a secondary thread.
 * 
 * Compliance: 04-compliance-security (SHA256 Audit Trail)
 * Compliance: Legacy Parity (Industrial GAWEB Standards)
 */

import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import Handlebars from 'handlebars';
import { LetterTemplate, LetterMapping, LetterGenerationOptions } from '../types/letter.types';
import { EtlPreset } from '../types/etl.types';
import { GawebExporter } from '../utils/gaweb-exporter';
import { md5 } from '../utils/crypto.utils';

/**
 * Calculates SHA256 Hex string for a Blob/Buffer.
 */
async function calculateSha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

self.onmessage = async (e) => {
  const { 
    dataFile, 
    template, 
    mapping, 
    etlPreset, 
    options 
  }: { 
    dataFile: File, 
    template: LetterTemplate, 
    mapping: LetterMapping, 
    etlPreset: EtlPreset,
    options: LetterGenerationOptions 
  } = e.data;

  try {
    const zip = new JSZip();
    const gawebLines: string[] = [];
    const auditLines: string[] = ['INDICE;PDF_NAME;SHA256;TIMESTAMP']; // Audit Trail CSV
    
    const hbsTemplate = Handlebars.compile(template.content);
    
    // 1. Process Data Loader
    const dataStream = dataFile.stream().getReader();
    // Use windows-1252 for legacy parity if needed, otherwise UTF-8
    const decoder = new TextDecoder('windows-1252'); 
    
    let lineCount = 0;
    let processed = 0;
    let partialLine = '';
    
    // Industrial Batch Hash (Unique for this specific run and source)
    const batchSeed = `${dataFile.name}_${options.lote}_${Date.now()}`;
    const industrialBaseHash = md5(batchSeed); // 32 chars hex
    
    self.postMessage({ type: 'LOG', payload: { type: 'info', message: `INITIALIZING_BATCH: ${dataFile.name}` } });

    while (true) {
      const { done, value } = await dataStream.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = (partialLine + text).split(/\r?\n/);
      partialLine = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        lineCount++;
        
        // CSV Header Skip
        if (lineCount === 1) continue; 

        if (options.rangeFrom > 0 && lineCount < options.rangeFrom) continue;
        if (options.rangeTo > 0 && lineCount > options.rangeTo) break;

        // Data extraction mapping
        const parts = line.split(';');
        const mockData: Record<string, string> = {
          INDEX: (lineCount - 1).toString(),
          LOTE: options.lote,
          ...mapping.mappings.reduce((acc, m) => {
             acc[m.templateVar] = parts[0] || ''; 
             return acc;
          }, {} as any)
        };

        // 2. Generate PDF
        const doc = new jsPDF({
           orientation: 'p',
           unit: 'mm',
           format: 'a4'
        });

        // Merge template
        const mergedHtml = hbsTemplate(mockData);
        const cleanText = mergedHtml.replace(/<[^>]*>?/gm, '');

        const offsetX = etlPreset.gawebConfig?.windowOffsetX || 0;
        const offsetY = etlPreset.gawebConfig?.windowOffsetY || 0;

        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        doc.text(cleanText, 20 + offsetX, 30 + offsetY);
        
        // Finalize PDF binary with Legacy industrial name (40 chars)
        const pdfName = GawebExporter.generateDocName(industrialBaseHash, lineCount - 1);
        const pdfArrayBuffer = doc.output('arraybuffer');
        
        // Audit SHA256 Calculation
        const sha256 = await calculateSha256(pdfArrayBuffer);
        auditLines.push(`${lineCount - 1};${pdfName}.pdf;${sha256};${new Date().toISOString()}`);

        // 3. Add PDF to ZIP
        zip.file(`${pdfName}.pdf`, pdfArrayBuffer);

        // 4. GAWEB Metadata (Full 27-field Serialization)
        if (options.outputType === 'PDF_GAWEB') {
           const gaLine = GawebExporter.serializeRecord({
             LetterType: ' ',
             Format: '04',
             GenerationDate: options.fechaGeneracion,
             Batch: options.lote,
             Sequential: (lineCount - 1).toString(),
             Page: '0001',
             DocCode: options.codDocumento,
             Version: '0000',
             ContractClass: '  ',
             ContractCode: ' '.repeat(25),
             TIREL: ' ',
             NUREL: '000',
             CLALF: (mockData['CLALF'] || '').padEnd(15),
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
             LetterDate: options.fechaCarta,
             DestinationIndicator: '0',
             LoadDetail: '0000',
             DeliveryWay: '  ',
             PaperCopy: ' ',
             OfficeCode: options.oficina,
             EmailFax: ' '.repeat(50),
             ContentLength: '00000',
             PdfName: pdfName
           });
           gawebLines.push(gaLine);
        }

        processed++;
        if (processed % 10 === 0) {
          self.postMessage({ type: 'PROGRESS', payload: { processed } });
        }
      }
    }

    // Finalize Metadata File
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '') + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '');

    if (options.outputType === 'PDF_GAWEB') {
       const packageName = GawebExporter.generatePackageName('ARATORES', timestamp, options.lote);
       zip.file(`${packageName}.GAWEB`, gawebLines.join('\n'));
       
       // Add the SHA256 Audit Report (Legacy Requirement)
       zip.file(`AUDIT_REPORT_${timestamp}.CSV`, auditLines.join('\n'));
    }

    // Finalize ZIP
    const finalZip = await zip.generateAsync({ type: 'blob' });
    self.postMessage({ type: 'COMPLETE', payload: finalZip });

  } catch (err: any) {
    console.error(err);
    self.postMessage({ type: 'LOG', payload: { type: 'error', message: `FATAL_ENGINE_ERROR: ${err.message}` } });
  }
};
