/**
 * Document Engine Worker - Era 6 (Industrial Edition)
 * Unified High-Fidelity Engine for DOCX and HTML multi-format generation.
 * PHASE 20: Added Dynamic Resource Resolution via CATDOCUM map.
 */

/// <reference lib="webworker" />

declare const JSZip: any;
declare const Handlebars: any;

/* global importScripts, JSZip, Handlebars, Docxtemplater, self */

try {
  // Las rutas son relativas a la raíz del servidor público
  const base = self.location.origin;
  importScripts(
    base + '/vendor/jszip.min.js',
    base + '/vendor/handlebars.min.js',
    base + '/vendor/docxtemplater.js',
    base + '/vendor/pizzip.min.js' 
  );
} catch (e) {
  console.error('Worker Script Loading Error:', e);
}

const GawebUtility = {
  generateDocName: (baseHash: string, index: number) => {
    const idxStr = (index + 1).toString().padStart(7, '0');
    return `${baseHash.substring(0, 11)}${idxStr}`;
  },
  
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
  const { 
    dataFile, 
    template, 
    mapping, 
    etlPreset, 
    options, 
    isStreaming = false, 
    gawebFields = [],
    catalogResources = null
  } = e.data;
  
  // Naming Canonizado (Base default)
  const defaultCodDocumento = options.codDocumento || (options as any).codDocto || 'X00000';

  self.postMessage({ type: 'HEARTBEAT' });

  try {
    if (typeof JSZip === 'undefined' || typeof Handlebars === 'undefined') {
        throw new Error('Librerías externas no cargadas. Ejecute SCRIPT/vendorize_libs.ps1');
    }

    const zipOutput = new JSZip();
    const gawebLines: string[] = [];
    const auditLines = ['INDICE;DOC_NAME;SHA256;TIMESTAMP'];
    
    const dataStream = dataFile.stream().getReader();
    const decoder = new TextDecoder('windows-1252'); 
    
    let lineCount = 0;
    let processedCount = 0;
    let partialLine = '';
    
    const industrialBaseHash = (Math.random().toString(36).substring(2, 10) + Date.now().toString(36)).substring(0, 11);
    
    self.postMessage({ type: 'LOG', payload: { type: 'info', message: `INDUSTRIAL MOTOR (Era 6) iniciado.` } });

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
          _FECHA_CARTA: options.fechaCarta,
          _COD_DOCUMENTO: defaultCodDocumento
        };

        for (const type of etlPreset.recordTypes) {
           const trigger = type.trigger;
           const start = type.triggerStart || 0;
           if (line.substring(start, start + trigger.length).trim() === trigger.trim()) {
             rt = type;
             break;
           }
        }

        if (rt) {
          // Initial mapping (fallback/standard)
          mapping.mappings.forEach((m: any) => {
            const field = rt.fields.find((f: any) => 
               (f.name || f.Name) === m.sourceField || f.id === m.sourceField
            );
            if (field) {
               const s = field.start ?? field.Start;
               const l = field.length ?? field.Length;
               const idx = field.index ?? field.Index;
               const val = (typeof s === 'number' && typeof l === 'number') ? line.substring(s, s + l) : line.split(';')[idx] || '';
               mergeData[m.templateVar] = val.trim();
            }
          });

          if (rt.name === 'DATA') {
             processedCount++;

             // CATDOCUM Dynamic Resolution (Phase 20)
             let activeTemplate = template;
             let activeMapping = mapping;
             let activeCodDocumento = defaultCodDocumento;
             
             if (catalogResources) {
                // GAWEB standard: DocCode is at position 26-32 (length 6)
                const lineCod = line.substring(26, 32).trim();
                // Find in map (case insensitive to avoid mismatches)
                if (lineCod && catalogResources[lineCod]) {
                   const res = catalogResources[lineCod];
                   activeTemplate = res.template || template;
                   activeMapping = res.mapping || mapping;
                   activeCodDocumento = lineCod;
                }
             }

             const docName = GawebUtility.generateDocName(industrialBaseHash, processedCount - 1);
             const fileName = `${docName}.${activeTemplate.type === 'DOCX' ? 'docx' : 'html'}`;
             let content;

             try {
                if (activeTemplate.type === 'DOCX' && activeTemplate.binaryContent) {
                   const zip = new (self as any).PizZip(activeTemplate.binaryContent);
                   const doc = new (self as any).docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
                   
                   // Overhaul mergeData with activeCodDocumento before render
                   const finalMergeData: Record<string, any> = { ...mergeData, _COD_DOCUMENTO: activeCodDocumento };
                   
                   // Re-apply mapping logic if the mapping changed for this record
                   if (activeMapping !== mapping) {
                      activeMapping.mappings.forEach((m: any) => {
                         const field = rt.fields.find((f: any) => (f.name || f.Name) === m.sourceField || f.id === m.sourceField);
                         if (field) {
                            const s = field.start ?? field.Start;
                            const l = field.length ?? field.Length;
                            const idx = field.index ?? field.Index;
                            const val = (typeof s === 'number' && typeof l === 'number') ? line.substring(s, s + l) : line.split(';')[idx] || '';
                            finalMergeData[m.templateVar] = val.trim();
                         }
                      });
                   }

                   doc.render(finalMergeData);
                   content = doc.getZip().generate({ type: 'arraybuffer' });
                } else {
                   const hbsTemplate = Handlebars.compile(activeTemplate.content || '');
                   const finalMergeData: Record<string, any> = { ...mergeData, _COD_DOCUMENTO: activeCodDocumento };
                   content = new TextEncoder().encode(hbsTemplate(finalMergeData)).buffer;
                }

                const sha256 = await calculateSha256(content);
                auditLines.push(`${lineCount - 1};${fileName};${sha256};${new Date().toISOString()}`);

                if (isStreaming) {
                  self.postMessage({ 
                    type: 'DOCUMENT_READY', 
                    payload: { 
                      name: fileName, 
                      content, 
                      index: processedCount,
                      isFirst: processedCount === 1 
                    } 
                  });
                } else {
                  zipOutput.file(fileName, content);
                }

                // SERIALIZACIÓN GAWEB (Protocolo Unificado v4)
                const cfg = etlPreset.gawebConfig || {};
                const indexData = {
                   LetterType: ' ',
                   Format: activeCodDocumento.toLowerCase() === 'x00054' ? '04' : (cfg.formatoCarta || '04'),
                   GenerationDate: options.fechaGeneracion || cfg.fechaGeneracion || options.fechaCarta,
                   Batch: options.lote || '0000',
                   Sequential: (lineCount - 1).toString(),
                   Page: cfg.paginasDefecto ? cfg.paginasDefecto.toString() : '0001',
                   DocCode: activeCodDocumento.substring(0, 6).toUpperCase(),
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

    if (isStreaming && processedCount > 0) {
       const gawebContent = new TextEncoder().encode(gawebLines.join('\r\n')).buffer;
       self.postMessage({ type: 'DOCUMENT_READY', payload: { name: 'GAWEB.txt', content: gawebContent } });
       
       const auditContent = new TextEncoder().encode(auditLines.join('\r\n')).buffer;
       self.postMessage({ type: 'DOCUMENT_READY', payload: { name: 'AUDIT_REPORT.CSV', content: auditContent } });
    }

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
