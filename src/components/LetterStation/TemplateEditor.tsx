'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { LetterTemplate, TemplateComposition } from '@/lib/types/letter.types';
import { TrashIcon, CogIcon, FileTextIcon, SaveIcon } from '@/components/common/Icons';
import styles from './TemplateEditor.module.css';

const DEFAULT_COMPOSITION: TemplateComposition = {
  fontFamily: 'Space Mono',
  fontSize: 11,
  windowX: 20,
  windowY: 45,
  windowWidth: 90,
  windowHeight: 40,
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
  headerHtml: '<div style="font-weight: 800; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ABDFN UNIFIED SUITE - DEPARTAMENTO TÉCNICO</div>',
  footerHtml: '<div style="font-size: 10px; border-top: 1px solid #ccc; padding-top: 5px;">Calle Falsa 123, 28001 Madrid | www.abdfn-suite.com</div>'
};

const TemplateEditor: React.FC = () => {
  const { t } = useLanguage();
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'composition'>('content');
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editConfig, setEditConfig] = useState<TemplateComposition>(DEFAULT_COMPOSITION);

  useEffect(() => {
    if (selectedId) {
      const tmpl = templates.find(t => t.id === selectedId);
      if (tmpl) {
        setEditName(tmpl.name);
        setEditContent(tmpl.content || '');
        setEditConfig(tmpl.config || DEFAULT_COMPOSITION);
      }
    }
  }, [selectedId, templates]);

  const handleCreate = async () => {
    const id = await db.letter_templates.add({
      name: 'NUEVA_PLANTILLA',
      type: 'HTML',
      content: '<h1>CARTA_TITULO</h1>\n<p>Estimado/a {{NOMBRE}}:</p>\n<p>Contenido del mensaje aquí...</p>\n<p>Un saludo,</p>',
      config: DEFAULT_COMPOSITION,
      updatedAt: Date.now()
    });
    setSelectedId(id as number);
    setActiveTab('content');
  };

  const handleSave = async () => {
    if (!selectedId) return;
    await db.letter_templates.update(selectedId, {
      name: editName,
      content: editContent,
      config: editConfig,
      updatedAt: Date.now()
    });
    alert('PLANTILLA ACTUALIZADA CORRECTAMENTE');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar esta plantilla?')) return;
    await db.letter_templates.delete(id);
    if (selectedId === id) setSelectedId(null);
  };

  const updateConfig = (key: keyof TemplateComposition, val: any) => {
    setEditConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={handleCreate}>
            + NUEVA PLANTILLA
          </button>
        </div>
        <div className={styles.list}>
          {templates.filter(t => t.type === 'HTML').map(tmpl => (
            <div 
              key={tmpl.id} 
              className={`${styles.item} ${selectedId === tmpl.id ? styles.active : ''}`}
              onClick={() => setSelectedId(tmpl.id!)}
            >
              <span className={styles.itemName}>{tmpl.name}</span>
              <button 
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); handleDelete(tmpl.id!); }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
          {templates.length === 0 && <div className={styles.empty}>SIN PLANTILLAS</div>}
        </div>
      </aside>

      <main className={styles.main}>
        {selectedId ? (
          <>
            <div className={styles.editorArea}>
              {/* Panel de Edición/Configuración */}
              <div className={styles.leftPanel}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ flex: 1 }}>
                     <label className="station-label">NOMBRE DE PLANTILLA:</label>
                     <input className="station-input" value={editName} onChange={e => setEditName(e.target.value)} />
                   </div>
                   <button className="station-btn station-btn-primary" style={{ marginLeft: '16px', height: '42px' }} onClick={handleSave}>
                     <SaveIcon size={16} /> GUARDAR
                   </button>
                </header>

                <div className={styles.tabs}>
                  <button className={`${styles.tabBtn} ${activeTab === 'content' ? styles.active : ''}`} onClick={() => setActiveTab('content')}>
                    <FileTextIcon size={14} /> EDITOR HTML
                  </button>
                  <button className={`${styles.tabBtn} ${activeTab === 'composition' ? styles.active : ''}`} onClick={() => setActiveTab('composition')}>
                    <CogIcon size={14} /> CONFIG. PLIEGO
                  </button>
                </div>

                {activeTab === 'content' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                    <label className="station-label">CUERPO DEL DOCUMENTO (Handlebars):</label>
                    <textarea 
                      className={styles.monoEditor}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      placeholder="Escriba aquí el contenido HTML de la carta..."
                    />
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                      Sugerencia: Use {'{{VARIABLE}}'} para inyectar datos del Preset ETL activo.
                    </div>
                  </div>
                ) : (
                  <div className="flex-col" style={{ gap: '20px' }}>
                     <div className={styles.propertyGroup}>
                        <span className={styles.propertyTitle}>Ventanilla de Sobre (mm)</span>
                        <div className={styles.configGrid}>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">X (Derecha)</label>
                              <input className="station-input" type="number" value={editConfig.windowX} onChange={e => updateConfig('windowX', parseInt(e.target.value))} />
                           </div>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Y (Abajo)</label>
                              <input className="station-input" type="number" value={editConfig.windowY} onChange={e => updateConfig('windowY', parseInt(e.target.value))} />
                           </div>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Ancho</label>
                              <input className="station-input" type="number" value={editConfig.windowWidth} onChange={e => updateConfig('windowWidth', parseInt(e.target.value))} />
                           </div>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Alto</label>
                              <input className="station-input" type="number" value={editConfig.windowHeight} onChange={e => updateConfig('windowHeight', parseInt(e.target.value))} />
                           </div>
                        </div>
                     </div>

                     <div className={styles.propertyGroup}>
                        <span className={styles.propertyTitle}>Tipografía y Cuerpo</span>
                        <div className={styles.configGrid}>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Familia</label>
                              <select className="station-select" value={editConfig.fontFamily} onChange={e => updateConfig('fontFamily', e.target.value)}>
                                 <option value="Space Mono">Space Mono (Technical)</option>
                                 <option value="Helvetica">Helvetica (Clean)</option>
                                 <option value="Arial">Arial (Standard)</option>
                                 <option value="Times New Roman">Times New Roman (Formal)</option>
                                 <option value="Courier New">Courier New (Legacy)</option>
                              </select>
                           </div>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Tamaño (pt)</label>
                              <input className="station-input" type="number" value={editConfig.fontSize} onChange={e => updateConfig('fontSize', parseInt(e.target.value))} />
                           </div>
                        </div>
                     </div>

                     <div className={styles.propertyGroup}>
                        <span className={styles.propertyTitle}>Elementos de Página</span>
                        <div className="flex-col" style={{ gap: '12px' }}>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Cabecera (HTML)</label>
                              <textarea className="station-input" style={{ height: '60px', fontSize: '0.8rem' }} value={editConfig.headerHtml} onChange={e => updateConfig('headerHtml', e.target.value)} />
                           </div>
                           <div className="flex-col" style={{ gap: '4px' }}>
                              <label className="station-label">Pie de Página (HTML)</label>
                              <textarea className="station-input" style={{ height: '60px', fontSize: '0.8rem' }} value={editConfig.footerHtml} onChange={e => updateConfig('footerHtml', e.target.value)} />
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>

              {/* Panel de Previsualización A4 Real */}
              <div className={styles.rightPanel}>
                <span className="station-card-title" style={{ color: 'var(--text-secondary)' }}>Previsualización Pliego A4</span>
                <div className={styles.a4Sheet}>
                  {/* Ventanilla de Sobre */}
                  <div 
                    className={styles.windowOverlay}
                    style={{
                      left: `${editConfig.windowX}mm`,
                      top: `${editConfig.windowY}mm`,
                      width: `${editConfig.windowWidth}mm`,
                      height: `${editConfig.windowHeight}mm`
                    }}
                  >
                    Ventanilla
                  </div>

                  {/* Hoja Física */}
                  <div 
                    className={styles.sheetContent}
                    style={{
                      fontFamily: editConfig.fontFamily,
                      fontSize: `${editConfig.fontSize}pt`,
                      padding: `${editConfig.marginTop}mm ${editConfig.marginRight}mm ${editConfig.marginBottom}mm ${editConfig.marginLeft}mm`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                     <div dangerouslySetInnerHTML={{ __html: editConfig.headerHtml || '' }} />
                     <div style={{ flex: 1, marginTop: '20px' }} dangerouslySetInnerHTML={{ __html: editContent || 'Contenido de la carta...' }} />
                     <div dangerouslySetInnerHTML={{ __html: editConfig.footerHtml || '' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>Escala de previsualización 1:2 (Aprox)</div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <FileTextIcon size={64} style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>SELECCIONE UNA PLANTILLA</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Cree o elija una plantilla HTML para empezar a maquetar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TemplateEditor;
