/**
 * Document Engine Worker - Phase D: Zero-Turbopack Vanilla Version
 * Unified Industrial Edition - Agnostic Engine v18.7
 */

/// <reference lib="webworker" />

declare const JSZip: any;
declare const Handlebars: any;

/* global importScripts, JSZip, Handlebars, Docxtemplater, self */

try {
  importScripts(
    'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js',
    'https://unpkg.com/handlebars@4.7.7/dist/handlebars.min.js',
    'https://unpkg.com/docxtemplater@3.37.2/build/docxtemplater.js',
    'https://unpkg.com/pizzip@3.1.4/dist/pizzip.min.js' 
  );
} catch (e) {
  console.error('Worker Script Loading Error:', e);
}

// --- UTILIDADES INTEGRADAS (Agnósticas) ---

function md5_mini(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const GawebUtility = {
  generateDocName: (baseHash: string, index: number) => {
    const idxStr = (index + 1).toString().padStart(7, '0');
    return `${baseHash.substring(0, 11)}${idxStr}`;
  },
  
  /**
   * SERIALIZADOR AGNOSTICO
   * Construye el registro basado en las reglas inyectadas desde el hilo principal.
   */
  serializeDynamic: (fields: any[], data: any) => {
    let body = "";
    fields.forEach((field: any) => {
      let val = data[field.name] || "";
      if (field.isNumeric) {
        body += val.toString().replace(/\D/g, '').substring(0, field.length).padStart(field.length, '0');
      } else {
        body += val.toString().substring(0, field.length).padEnd(field.length, ' ');
      }
    });
    return body.padEnd(300, ' ');
  }
};

async function calculateSha256(data: any) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- MANEJADOR PRINCIPAL ---

self.onmessage = async (e: MessageEvent) => {
  const { dataFile, template, mapping, etlPreset, options, isStreaming = false, gawebFields = [] } = e.data;

  self.postMessage({ type: 'HEARTBEAT' });

  try {
    if (typeof JSZip === 'undefined' || typeof Handlebars === 'undefined') {
        throw new Error('Librerías externas no cargadas.');
    }

    const zipOutput = new JSZip();
    const gawebLines = [];
    const auditLines = ['INDICE;DOC_NAME;SHA256;TIMESTAMP'];
    
    let docxTemplate = null;
    if (template.type === 'DOCX' && template.binaryContent) {
      docxTemplate = template.binaryContent;
    }

    const dataStream = dataFile.stream().getReader();
    const decoder = new TextDecoder('windows-1252'); 
    
    let lineCount = 0;
    let processedCount = 0;
    let partialLine = '';
    const industrialBaseHash = md5_mini(`${dataFile.name}_${options.lote || 'STRS'}`);
    
    self.postMessage({ type: 'LOG', payload: { type: 'info', message: `MOTOR AGNOSTICO (v18.7-Centralized) iniciado.` } });

    while (true) {
      const { done, value } = await dataStream.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = (partialLine + text).split(/\r?\n/);
      partialLine = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        lineCount++;
        if (lineCount === 1) continue; 

        let rt = null;
        let mergeData: Record<string, any> = {
          _INDEX: (lineCount - 1).toString(),
          _LOTE: options.lote,
          _OFICINA: options.oficina,
          _FECHA_CARTA: options.fechaCarta
        };

        // 1. Identificación de Registro
        for (const type of etlPreset.recordTypes) {
           const trigger = type.trigger;
           const start = type.triggerStart || 0;
           if (line.substring(start, start + trigger.length).trim() === trigger.trim()) {
             rt = type;
             break;
           }
        }

        if (rt) {
          // 2. Mapeo
          mapping.mappings.forEach((m: any) => {
            const field = rt.fields.find((f: any) => 
              (f.Name || f.name) === m.sourceField || f.id === m.sourceField
            );
            
            if (field) {
               const startPos = typeof field.Start === 'number' ? field.Start : field.start;
               const len = typeof field.Length === 'number' ? field.Length : field.length;

               const val = (typeof startPos === 'number' && typeof len === 'number')
                  ? line.substring(startPos, startPos + len)
                  : line.split(';')[field.Index || field.index] || '';
               
               mergeData[m.templateVar] = val.trim();
            }
          });

          // 3. Generación (Solo DATA)
          if (rt.name === 'DATA') {
             processedCount++;
             
             const docName = GawebUtility.generateDocName(industrialBaseHash, lineCount - 1);
             const fileName = `${docName}.${template.type === 'DOCX' ? 'docx' : 'html'}`;
             let content;

             try {
               if (template.type === 'DOCX' && docxTemplate) {
                 const zip = new (self as any).PizZip(docxTemplate);
                 const doc = new (self as any).docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
                 doc.render(mergeData);
                 content = doc.getZip().generate({ type: 'arraybuffer' });
               } else {
                 let merged = template.content || '';
                 Object.entries(mergeData).forEach(([k, v]) => {
                   merged = merged.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi'), v || '');
                 });
                 content = new TextEncoder().encode(merged).buffer;
               }

               const sha256 = await calculateSha256(content);
               auditLines.push(`${lineCount - 1};${fileName};${sha256};${new Date().toISOString()}`);

               if (isStreaming) {
                 self.postMessage({ type: 'DOCUMENT_READY', payload: { name: fileName, content } });
               } else {
                 zipOutput.file(fileName, content);
               }

               // SERIALIZACIÓN UNIVERSAL (Inyectada - Protocolo v4 / Diseño v.1)
               const cfg = etlPreset.gawebConfig || {};
               const indexData = {
                  LetterType: ' ',
                  Format: options.codDocto || cfg.formatoCarta || '04',
                  GenerationDate: options.fechaGeneracion || cfg.fechaGeneracion || options.fechaCarta,
                  Batch: options.lote || '0000',
                  Sequential: (lineCount - 1).toString(),
                  Page: cfg.paginasDefecto ? cfg.paginasDefecto.toString() : '0001',
                  DocCode: (options.codDocto || cfg.codigoDocumento || 'x00054').substring(0, 6),
                  Version: '0000',
                  ContractClass: '00',
                  ContractCode: mergeData.CodContrato || mergeData._INDEX,
                  CLALF: mergeData.CLALF || '',
                  ForceSend: cfg.forzarMetodo || ' ',
                  Language: cfg.idioma || '  ',
                  SavingOpCode: cfg.savingsOpCode || '',
                  SavingOpAccount: cfg.savingsOpAccount || '',
                  SavingOpSign: cfg.savingsOpSign || '+',
                  SavingOpAmount: cfg.savingsOpAmount || '0',
                  SavingOpCurrency: cfg.savingsOpCurrency || '  ',
                  SavingOpISO: cfg.savingsOpISO || '   ',
                  SavingOpConcept: cfg.savingsOpConcept || '  ',
                  LetterDate: options.fechaCarta || cfg.fechaCarta || '',
                  DestinationIndicator: cfg.indicadorDestino || '0',
                  LoadDetail: '0000',
                  DeliveryWay: cfg.viaReparto || '',
                  PaperCopy: cfg.copiaPapel || '',
                  OfficeCode: options.oficina || cfg.oficina || '00000',
                  PdfName: docName
               };
               
               const gawebLine = GawebUtility.serializeDynamic(gawebFields, indexData);
               gawebLines.push(gawebLine);

               if (processedCount % 100 === 0) {
                  self.postMessage({ type: 'LOG', payload: { type: 'info', message: `PROGRESO: [${processedCount}] generados...` } });
               }
             } catch (renderErr) {
               self.postMessage({ type: 'LOG', payload: { type: 'error', message: `RENDER ERROR (L ${lineCount}): ${(renderErr as any).message}` } });
             }
          }
        }
      }
    }

    // PERSISTENCIA DE ÍNDICES FINALES
    if (isStreaming && processedCount > 0) {
       const gawebContent = new TextEncoder().encode(gawebLines.join('\r\n')).buffer;
       self.postMessage({ type: 'DOCUMENT_READY', payload: { name: 'GAWEB.txt', content: gawebContent } });
       
       const auditContent = new TextEncoder().encode(auditLines.join('\r\n')).buffer;
       self.postMessage({ type: 'DOCUMENT_READY', payload: { name: 'AUDIT_REPORT.CSV', content: auditContent } });
    }

    self.postMessage({ type: 'LOG', payload: { type: 'info', message: `CICLE COMPLETE: ${processedCount} documentos procesados.` } });

    if (isStreaming) {
       self.postMessage({ type: 'COMPLETE', payload: { count: processedCount } });
    } else {
       zipOutput.file('GAWEB.txt', gawebLines.join('\r\n'));
       zipOutput.file('AUDIT_REPORT.CSV', auditLines.join('\r\n'));
       const blob = await zipOutput.generateAsync({ type: 'blob' });
       self.postMessage({ type: 'COMPLETE', payload: { blob, name: `LOTE_${options.lote || '0000'}.zip`, count: processedCount } });
    }

  } catch (err) {
    self.postMessage({ type: 'LOG', payload: { type: 'error', message: `ERROR CRÍTICO: ${(err as any).message}` } });
  }
};
