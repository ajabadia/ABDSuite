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
    renderToPdf: async (docxBlob: Blob, filename: string): Promise<Blob> => {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px'; // APROX A4
      container.style.background = 'white';
      document.body.appendChild(container);

      try {
        // Renderizado DOCX -> HTML (Fidelidad de Word)
        await (window as any).docx.renderAsync(docxBlob, container, null, {
          className: "docx-high-fidelity",
          inWrapper: false,
          ignoreHeight: false,
          ignoreWidth: false,
          debug: false
        });

        // Esperar un momento para renderizado de fuentes/imágenes
        await new Promise(r => setTimeout(r, 400));

        // Captura HTML -> PDF
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'pt',
          format: 'a4',
          compress: true
        });

        await pdf.html(container, {
          callback: (doc) => {
            // No hacemos nada aquí, usamos la promesa externa si es posible
          },
          x: 0,
          y: 0,
          width: 595.28, // A4 PT width
          windowWidth: 800,
          autoPaging: 'text'
        });

        const pdfBlob = pdf.output('blob');
        return pdfBlob;
      } finally {
        document.body.removeChild(container);
      }
    }
  });

  return null; // Componente de servicio invisible
};
