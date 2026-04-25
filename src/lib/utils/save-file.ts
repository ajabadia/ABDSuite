/**
 * ABDFN Suite - Save File Helper (Industrial Standard)
 * Patrón: Dual Flow (FileSystem Access API + <a download> Fallback)
 */

export async function saveFile(blob: Blob, suggestedName: string) {
  // Verificación de soporte nativo (Chrome/Edge modernos y entorno seguro)
  const supportsFileSystemAccess =
    'showSaveFilePicker' in window &&
    (() => {
      try {
        // Evitar el uso en iframes sin permisos si aplica
        return window.self === window.top;
      } catch {
        return false;
      }
    })();

  if (supportsFileSystemAccess) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Archivo GAWEB (.txt)',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: any) {
      // Si el usuario cancela, salimos silenciosamente
      if (err.name === 'AbortError') return;
      console.warn('FileSystem Access API falló, usando fallback industrial...', err);
    }
  }

  // --- Fallback Industrial (<a download>) ---
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.style.display = 'none';
  document.body.appendChild(a);
  
  a.click();
  
  // Limpieza diferida
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}
