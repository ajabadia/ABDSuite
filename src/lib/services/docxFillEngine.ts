/**
 * ABDFN Suite - DOCX Fill Engine (Phase 19)
 * Performs offline-first document filling using Docxtemplater & PizZip.
 */

export interface DocxFillEngine {
  fillTemplate(
    templateBuffer: ArrayBuffer,
    data: Record<string, any>,
  ): Promise<Blob>;
}

export const docxFillEngine: DocxFillEngine = {
  /**
   * Fills a DOCX template with the provided data.
   * Everything happens in-memory (No exfiltration).
   */
  async fillTemplate(templateBuffer: ArrayBuffer, data: Record<string, any>): Promise<Blob> {
    const PizZip = (window as any).PizZip;
    const Docxtemplater = (window as any).docxtemplater;

    if (!PizZip || !Docxtemplater) {
      // Lazy load if not in window (safety net, although RendererHost should handle it)
      await loadFillScripts();
    }

    try {
      const zip = new (window as any).PizZip(templateBuffer);
      const doc = new (window as any).docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.setData(data);
      doc.render();

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      return out;
    } catch (error) {
      console.error('[DOCX_FILL_ENGINE] Failed to fill template:', error);
      throw error;
    }
  },
};

/**
 * Loads the necessary vendor scripts for DOCX filling.
 */
async function loadFillScripts(): Promise<void> {
  const scripts = [
    '/vendor/pizzip.min.js',
    '/vendor/docxtemplater.js'
  ];

  for (const src of scripts) {
    if (document.querySelector(`script[src="${src}"]`)) continue;
    
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // Poll for availability
  let attempts = 0;
  while (!(window as any).PizZip || !(window as any).docxtemplater) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
    if (attempts > 50) throw new Error('TIMEOUT_LOADING_FILL_ENGINES');
  }
}
