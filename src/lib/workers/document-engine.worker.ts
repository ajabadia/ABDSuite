/**
 * Document Engine Worker - Phase D: Word & Mapping Parity
 * Handles batch generation of DOCX and HTML letters.
 * 
 * Compliance: 04-compliance-security (Local processing only)
 * Compliance: Legacy Parity (Industrial GAWEB Standards)
 */

import JSZip from 'jszip';
import Handlebars from 'handlebars';
import Docxtemplater from 'docxtemplater';
import { LetterTemplate, LetterMapping, LetterGenerationOptions } from '../types/letter.types';
import { EtlPreset } from '../types/etl.types';
import { GawebExporter } from '../utils/gaweb-exporter';
import { md5 } from '../utils/crypto.utils';

// Helper for SHA256 (Audit Trail)
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
    const zipOutput = new JSZip();
    const gawebLines: string[] = [];
    const auditLines: string[] = ['INDICE;DOC_NAME;SHA256;TIMESTAMP'];
    
    // Prepare engines
    let hbsTemplate: any = null;
    let docxTemplate: ArrayBuffer | null = null;
    
    if (template.type === 'HTML' && template.content) {
      hbsTemplate = Handlebars.compile(template.content);
    } else if (template.type === 'DOCX' && template.binaryContent) {
      docxTemplate = template.binaryContent;
    }

    const dataStream = dataFile.stream().getReader();
    const decoder = new TextDecoder('windows-1252'); 
    
    let lineCount = 0;
    let processed = 0;
    let partialLine = '';
    
    const batchSeed = `${dataFile.name}_${options.lote}_${Date.now()}`;
    const industrialBaseHash = md5(batchSeed);
    
    self.postMessage({ type: 'LOG', payload: { type: 'info', message: `INICIANDO PROCESO BATCH: ${dataFile.name}` } });

    while (true) {
      const { done, value } = await dataStream.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = (partialLine + text).split(/\r?\n/);
      partialLine = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        lineCount++;
        
        // Skip header if lineCount 1
        if (lineCount === 1) continue; 

        if (options.rangeFrom > 0 && (lineCount - 1) < options.rangeFrom) continue;
        if (options.rangeTo > 0 && (lineCount - 1) > options.rangeTo) break;

        const parts = line.split(';');
        
        // Construct merge data based on mapping
        const mergeData: Record<string, any> = {
          _INDEX: (lineCount - 1).toString(),
          _LOTE: options.lote,
          _OFICINA: options.oficina,
          _FECHA_CARTA: options.fechaCarta
        };

        mapping.mappings.forEach(m => {
          if (m.sourceType === 'TEMPLATE' || m.sourceType === 'GAWEB') {
              // Extract from CSV parts based on preset field index
              const presetField = etlPreset.recordTypes[0].fields.find(f => f.Name === m.sourceField || (f as any).name === m.sourceField);
              if (presetField) {
                  const val = parts[presetField.Index] || '';
                  mergeData[m.templateVar] = val.trim();
              }
          }
        });

        // Generate Document Content
        let documentContent: ArrayBuffer;
        const outExt = template.type === 'DOCX' ? 'docx' : 'html';

        if (template.type === 'DOCX' && docxTemplate) {
          const zip = new JSZip();
          await zip.loadAsync(docxTemplate);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });
          doc.render(mergeData);
          documentContent = doc.getZip().generate({ type: 'arraybuffer' });
        } else {
          const merged = hbsTemplate(mergeData);
          documentContent = new TextEncoder().encode(merged).buffer;
        }

        const docName = GawebExporter.generateDocName(industrialBaseHash, lineCount - 1);
        const fileName = `${docName}.${outExt}`;
        
        // Audit & ZIP
        const sha256 = await calculateSha256(documentContent);
        auditLines.push(`${lineCount - 1};${fileName};${sha256};${new Date().toISOString()}`);
        zipOutput.file(fileName, documentContent);

        // GAWEB Serialization
        if (options.outputType === 'PDF_GAWEB') {
           const gaLine = GawebExporter.serializeRecord({
             LetterType: ' ',
             Format: etlPreset.gawebConfig?.formatoCarta || '04',
             GenerationDate: options.fechaGeneracion,
             Batch: options.lote,
             Sequential: (lineCount - 1).toString().padStart(7, '0'),
             Page: '0001',
             DocCode: options.codDocumento,
             Version: '0000',
             ContractClass: '  ',
             ContractCode: (mergeData['CodContrato'] || '').padEnd(25),
             TIREL: ' ',
             NUREL: '000',
             CLALF: (mergeData['CLALF'] || '').padEnd(15),
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
             PdfName: docName
           });
           gawebLines.push(gaLine);
        }

        processed++;
        if (processed % 10 === 0) {
          self.postMessage({ type: 'PROGRESS', payload: { processed } });
        }
      }
    }

    // Finalize Metadata
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '') + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '');

    if (options.outputType === 'PDF_GAWEB') {
       const packageName = GawebExporter.generatePackageName('ARATORES', timestamp, options.lote);
       zipOutput.file(`${packageName}.GAWEB`, gawebLines.join('\n'));
       zipOutput.file(`AUDIT_REPORT_${timestamp}.CSV`, auditLines.join('\n'));
    }

    const finalBundle = await zipOutput.generateAsync({ type: 'blob' });
    self.postMessage({ type: 'COMPLETE', payload: finalBundle });

  } catch (err: any) {
    console.error(err);
    self.postMessage({ type: 'LOG', payload: { type: 'error', message: `ERROR CRÍTICO EN MOTOR: ${err.message}` } });
  }
};
