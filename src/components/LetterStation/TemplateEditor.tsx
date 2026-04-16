'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { LetterTemplate, TemplateComposition } from '@/lib/types/letter.types';
import { TrashIcon, CogIcon, FileTextIcon, SaveIcon, ArrowUpIcon, ArrowDownIcon, ListIcon, EyeIcon, DownloadIcon, UploadIcon } from '@/components/common/Icons';
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
  const [isRegistryExpanded, setIsRegistryExpanded] = useState(true);
  
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
    setIsRegistryExpanded(false); // Auto-collapse to focus on editing
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.type === 'abdfn_template' && data.payload) {
            const id = await db.letter_templates.add({
              ...data.payload,
              name: data.name + '_IMPORTED',
              type: 'HTML',
              updatedAt: Date.now()
            });
            setSelectedId(id as number);
            setIsRegistryExpanded(false);
          } else {
            alert('FORMATO DE PLANTILLA NO VÁLIDO');
          }
        } catch (err) {
          console.error('FAILED_TO_IMPORT', err);
          alert('ERROR AL LEER EL ARCHIVO');
        }
      }
    };
    input.click();
  };

  const handleSave = async () => {
    if (!selectedId) return;
    await db.letter_templates.update(selectedId, {
      name: editName,
      content: editContent,
      config: editConfig,
      updatedAt: Date.now()
    });
    // Visual feedback instead of alert would be better but keeping it for now
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar esta plantilla?')) return;
    await db.letter_templates.delete(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleDownload = (tmpl: LetterTemplate) => {
    const exportData = {
      type: 'abdfn_template',
      version: '1.0',
      name: tmpl.name,
      payload: {
        content: tmpl.content,
        config: tmpl.config
      },
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tmpl.name.toUpperCase()}_TEMPLATE.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateConfig = (key: keyof TemplateComposition, val: any) => {
    setEditConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className={styles.container}>
      <section className="station-registry">
        <div className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
          <div className="station-registry-title">
            <ListIcon size={18} />
             TEMPLATES_REGISTRY ({templates.length})
          </div>
          {isRegistryExpanded ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
        </div>

        {isRegistryExpanded && (
          <div className="station-registry-content">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="station-btn station-btn-primary" 
                style={{ flex: 1, height: '48px', fontWeight: 900 }} 
                onClick={handleCreate}
              >
                [+] NUEVA PLANTILLA
              </button>
              <button 
                className="station-btn" 
                style={{ width: '64px', height: '48px', padding: 0 }} 
                onClick={handleImport}
                title="Importar Backup (.json)"
              >
                <UploadIcon size={18} />
              </button>
            </div>
            
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="station-registry-sync-header">
                <span className="station-registry-sync-title">SYNCHRONIZATION</span>
                <div className="station-registry-sync-actions">
                  <button className="station-registry-sync-btn">JSON↓</button>
                  <button className="station-registry-sync-btn">ALL↑</button>
                </div>
              </div>

              <div className="station-registry-list">
                {templates.filter(t => t.type === 'HTML').map(tmpl => (
                  <div 
                    key={tmpl.id} 
                    className={`station-registry-item ${selectedId === tmpl.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedId(tmpl.id!);
                      setIsRegistryExpanded(false);
                    }}
                  >
                    <div className="station-registry-item-left">
                       <div className="station-registry-item-icon"><ListIcon size={16} /></div>
                       <div className="station-registry-item-info">
                          <span className="station-registry-item-name">{tmpl.name}</span>
                          <span className="station-registry-item-meta">
                             v1.0 <span className="station-registry-item-status">ACTIVE</span>
                          </span>
                       </div>
                    </div>

                    <div className="station-registry-item-actions">
                       <button 
                         className="station-registry-action-btn"
                         onClick={(e) => { e.stopPropagation(); handleDownload(tmpl); }}
                         title="Descargar Plantilla"
                       >
                         <DownloadIcon size={16} />
                       </button>
                       <button 
                         className="station-registry-action-btn err"
                         onClick={(e) => { e.stopPropagation(); handleDelete(tmpl.id!); }}
                         title="Eliminar"
                       >
                         <TrashIcon size={16} />
                       </button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', opacity: 0.3 }}>
                    SIN PLANTILLAS REGISTRADAS
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Area de Edición Principal */}
      <main className={styles.main}>
        {selectedId ? (
          <div className={styles.editorArea}>
            {/* Panel de Configuración */}
            <div className={styles.leftPanel}>
               <div className="flex-col" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                      <label className="station-label">ETIQUETA DE PLANTILLA:</label>
                      <input className="station-input" style={{ fontSize: '1rem', fontWeight: 800 }} value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} />
                    </div>
                    <button className="station-btn station-btn-primary" style={{ marginLeft: '16px', height: '48px', padding: '0 24px' }} onClick={handleSave}>
                      <SaveIcon size={18} /> GUARDAR
                    </button>
                  </div>

                  <div className={styles.tabs}>
                    <button className={`${styles.tabBtn} ${activeTab === 'content' ? styles.active : ''}`} onClick={() => setActiveTab('content')}>
                      <FileTextIcon size={16} /> EDITOR ESTRUCTURAL
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'composition' ? styles.active : ''}`} onClick={() => setActiveTab('composition')}>
                      <CogIcon size={16} /> COMPOSICIÓN A4
                    </button>
                  </div>

                  {activeTab === 'content' ? (
                    <div className="flex-col" style={{ flex: 1, gap: '12px', minHeight: '400px' }}>
                      <label className="station-label">CUERPO HTML (MOTOR HANDLEBARS):</label>
                      <textarea 
                        className={styles.monoEditor}
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        placeholder="Escriba aquí el contenido de la carta..."
                      />
                      <div style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '0.05rem' }}>
                        TIP: use {'{{CAMPO}}'} para inyectar datos del payload ETL.
                      </div>
                    </div>
                  ) : (
                    <div className="flex-col" style={{ gap: '20px' }}>
                       <div className={styles.propertyGroup}>
                          <span className={styles.propertyTitle}>Ventanilla de Sobre (Medidas en mm)</span>
                          <div className={styles.configGrid}>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">POS. X</label>
                                <input className="station-input" type="number" value={editConfig.windowX} onChange={e => updateConfig('windowX', parseInt(e.target.value))} />
                             </div>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">POS. Y</label>
                                <input className="station-input" type="number" value={editConfig.windowY} onChange={e => updateConfig('windowY', parseInt(e.target.value))} />
                             </div>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">ANCHO</label>
                                <input className="station-input" type="number" value={editConfig.windowWidth} onChange={e => updateConfig('windowWidth', parseInt(e.target.value))} />
                             </div>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">ALTO</label>
                                <input className="station-input" type="number" value={editConfig.windowHeight} onChange={e => updateConfig('windowHeight', parseInt(e.target.value))} />
                             </div>
                          </div>
                       </div>

                       <div className={styles.propertyGroup}>
                          <span className={styles.propertyTitle}>Tipografía Técnica</span>
                          <div className={styles.configGrid}>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">FUENTE</label>
                                <select className="station-select" value={editConfig.fontFamily} onChange={e => updateConfig('fontFamily', e.target.value)}>
                                   <option value="Space Mono">SPACE MONO (DEFAULT)</option>
                                   <option value="Helvetica">HELVETICA (SYS)</option>
                                   <option value="Courier New">COURIER (RETRO)</option>
                                </select>
                             </div>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">CUERPO (PT)</label>
                                <input className="station-input" type="number" value={editConfig.fontSize} onChange={e => updateConfig('fontSize', parseInt(e.target.value))} />
                             </div>
                          </div>
                       </div>

                       <div className={styles.propertyGroup}>
                          <span className={styles.propertyTitle}>Inyectores de Página</span>
                          <div className="flex-col" style={{ gap: '12px' }}>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">HEADER (HTML)</label>
                                <textarea className="station-input" style={{ height: '60px', fontSize: '0.8rem' }} value={editConfig.headerHtml} onChange={e => updateConfig('headerHtml', e.target.value)} />
                             </div>
                             <div className="flex-col" style={{ gap: '4px' }}>
                                <label className="station-label">FOOTER (HTML)</label>
                                <textarea className="station-input" style={{ height: '60px', fontSize: '0.8rem' }} value={editConfig.footerHtml} onChange={e => updateConfig('footerHtml', e.target.value)} />
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Panel de Previsualización A4 Real */}
            <div className={styles.rightPanel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                 <EyeIcon size={14} style={{ opacity: 0.5 }} />
                 <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.5 }}>VISTA PREVIA DE SALIDA (A4 SCALE 1:1)</span>
              </div>
              
              <div className="station-card" style={{ padding: '32px', background: 'var(--bg-color)', overflow: 'auto' }}>
                <div className={styles.a4Sheet}>
                  <div 
                    className={styles.windowOverlay}
                    style={{
                      left: `${editConfig.windowX}mm`,
                      top: `${editConfig.windowY}mm`,
                      width: `${editConfig.windowWidth}mm`,
                      height: `${editConfig.windowHeight}mm`
                    }}
                  >
                    ADDR_WINDOW
                  </div>

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
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FileTextIcon size={64} style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>SISTEMA DE DISEÑO DE PLANTILLAS</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Seleccione o cree una plantilla desde el registro superior para comenzar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TemplateEditor;
