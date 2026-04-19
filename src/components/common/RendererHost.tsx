'use client';

import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

interface RendererHostProps {
  onReady: (engine: any) => void;
}

/**
 * RendererHost
 * Componente asíncrono que carga los motores de renderizado de alta fidelidad.
 * Cumplimiento: Era 5 (Industrial Design)
 */
export const RendererHost: React.FC<RendererHostProps> = ({ onReady }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadScripts = async () => {
      if ((window as any).docx) {
        setIsLoaded(true);
        return;
      }

      // 1. Carga de docx-preview
      const docxScript = document.createElement('script');
      docxScript.src = 'https://unpkg.com/docx-preview@0.3.2/dist/docx-preview.js';
      docxScript.async = true;

      // 2. Carga de html2canvas (para fidelidad de captura en jsPDF)
      const canvasScript = document.createElement('script');
      canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      canvasScript.async = true;

      document.body.appendChild(docxScript);
      document.body.appendChild(canvasScript);

      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if ((window as any).docx && (window as any).html2canvas) {
          clearInterval(check);
          setIsLoaded(true);
          onReady(createEngine());
        }
        if (attempts > 50) {
          clearInterval(check);
          console.error('FAILED_TO_LOAD_HIGH_FIDELITY_ENGINES');
        }
      }, 200);
    };

    loadScripts();
  }, [onReady]);

  const createEngine = () => ({
    renderToPdf: async (blob: Blob, filename: string): Promise<Blob> => {
      const isDocx = filename.toLowerCase().endsWith('.docx');
      
      // MODO 'FORCE-PAINT' (Asegura que el navegador dibuje el elemento)
      const container = document.createElement(isDocx ? 'div' : 'iframe') as any;
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '1px'; // Tamaño mínimo pero visible para el motor cromático
      container.style.height = '1px';
      container.style.overflow = 'visible'; 
      container.style.background = 'white';
      container.style.zIndex = '-9999';
      container.style.pointerEvents = 'none';
      container.id = `renderer_target_${Date.now()}`;
      
      document.body.appendChild(container);

      try {
        if (isDocx) {
          await (window as any).docx.renderAsync(blob, container, null, {
            className: "docx-high-fidelity",
            inWrapper: false,
            ignoreHeight: false,
            ignoreWidth: false,
            debug: false
          });
        } else {
          const htmlContent = await blob.text();
          const doc = container.contentWindow.document;
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { background: white; margin: 0; padding: 40px; font-family: sans-serif; width: 800px; }
                  * { color: black !important; -webkit-print-color-adjust: exact; }
                </style>
              </head>
              <body>
                <!-- TEST MARKER -->
                <div style="background: red; color: white; padding: 5px; font-size: 10px; position: fixed; top: 0; right: 0;">ENGINE_ACTIVE</div>
                ${htmlContent}
              </body>
            </html>
          `);
          doc.close();
        }

        // Sincronización de Frames (Asegura Paint)
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 1000));

        const target = isDocx ? container : container.contentWindow.document.body;

        const canvas = await (window as any).html2canvas(target, {
          scale: 2,
          useCORS: true,
          logging: true,
          backgroundColor: '#ffffff',
          width: 800,
          windowWidth: 800
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'pt',
          format: 'a4',
          compress: true
        });

        const imgWidth = 595.28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
        
        // Firma técnica invisible (Confirmación de motor)
        pdf.setFontSize(8);
        pdf.setTextColor(200, 200, 200);
        pdf.text(`ENGINE_STAMP: ${new Date().toISOString()}`, 10, 830);

        return pdf.output('blob');
      } finally {
        if (container.parentNode) document.body.removeChild(container);
      }
    }
  });







  return null; // Componente de servicio invisible
};
