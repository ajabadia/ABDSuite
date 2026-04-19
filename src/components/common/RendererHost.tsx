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

      // 1. Carga de docx-preview (Vendorizado)
      const docxScript = document.createElement('script');
      docxScript.src = '/vendor/docx-preview.js';
      docxScript.async = true;

      // 2. Carga de html2canvas (Vendorizado)
      const canvasScript = document.createElement('script');
      canvasScript.src = '/vendor/html2canvas.min.js';
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

  const renderQueue = React.useRef<Promise<any>>(Promise.resolve());

  const createEngine = () => ({
    renderToPdf: async (blob: Blob, filename: string): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        renderQueue.current = renderQueue.current.then(async () => {
          try {
            const { pdf } = await renderAndProcess(blob, filename);
            resolve(pdf.output('blob'));
          } catch (err) {
            reject(err);
          }
        });
      });
    },
    captureFingerprint: async (blob: Blob, filename: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        renderQueue.current = renderQueue.current.then(async () => {
          try {
            const { canvas } = await renderAndProcess(blob, filename);
            const { generateCanvasFingerprint } = await import('@/lib/logic/golden-tests.logic');
            resolve(await generateCanvasFingerprint(canvas));
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  });

  const renderAndProcess = async (blob: Blob, filename: string) => {
      const isDocx = filename.toLowerCase().endsWith('.docx');
      const container = document.createElement(isDocx ? 'div' : 'iframe') as any;
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '800px'; 
      container.style.height = 'auto';
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
          doc.write(`<!DOCTYPE html><html><head><style>body { background: white; margin: 0; padding: 40px; font-family: sans-serif; width: 800px; } * { color: black !important; }</style></head><body>${htmlContent}</body></html>`);
          doc.close();
        }

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 1000));

        const target = isDocx ? container : container.contentWindow.document.body;
        const canvas = await (window as any).html2canvas(target, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 800
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }

        return { pdf, canvas };
      } finally {
        if (container.parentNode) document.body.removeChild(container);
      }
  };







  return null; // Componente de servicio invisible
};
