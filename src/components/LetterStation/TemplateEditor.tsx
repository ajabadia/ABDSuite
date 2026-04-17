'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { LetterTemplate, TemplateComposition } from '@/lib/types/letter.types';
import JSZip from 'jszip';
import { TrashIcon, CogIcon, FileTextIcon, SaveIcon, ArrowUpIcon, ArrowDownIcon, ListIcon, EyeIcon, DownloadIcon, UploadIcon, RefreshCwIcon, XIcon, UndoIcon } from '@/components/common/Icons';

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
  const [editVersion, setEditVersion] = useState('1.0');
  const [editActive, setEditActive] = useState(true);
  const [docxPreview, setDocxPreview] = useState<string>('');
  const [docxTags, setDocxTags] = useState<string[]>([]);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);
  const [editConfig, setEditConfig] = useState<TemplateComposition>(DEFAULT_COMPOSITION);

  // UI State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);

  const currentTemplate = templates.find(t => t.id === selectedId);

  useEffect(() => {
    if (selectedId) {
      const tmpl = templates.find(t => t.id === selectedId);
      if (tmpl) {
        setEditName(tmpl.name);
        setEditContent(tmpl.content || '');
        setEditVersion(tmpl.version || '1.0');
        setEditActive(tmpl.isActive !== false);
        setEditConfig(tmpl.config || DEFAULT_COMPOSITION);
      }
    }
  }, [selectedId, templates]);

  const recordSnapshot = () => {
    const tmpl = templates.find(t => t.id === selectedId);
    if (tmpl) setUndoStack(prev => [...prev.slice(-19), JSON.stringify(tmpl)]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const data = JSON.parse(last);
    setUndoStack(prev => prev.slice(0, -1));
    setEditName(data.name);
    setEditContent(data.content);
    setEditVersion(data.version);
    setEditActive(data.isActive);
    setEditConfig(data.config);
  };

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

  useEffect(() => {
    const extractDocx = async () => {
      if (currentTemplate?.type === 'DOCX' && currentTemplate.binaryContent) {
        setIsLoadingDocx(true);
        try {
          const zip = await JSZip.loadAsync(currentTemplate.binaryContent);
          
          // 1. Scan ALL XML files for Tags (Main, Headers, Footers)
          const tags: string[] = [];
          const tagRegex = /\{\{(.*?)\}\}/g;
          
          const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
          
          for (const name of xmlFiles) {
             const content = await zip.file(name)?.async('text');
             if (content) {
                let match;
                while ((match = tagRegex.exec(content)) !== null) {
                  // Clean tags from XML markers (Docxtemplater standard)
                  const tag = match[1].trim().replace(/<[^>]*>?/gm, '');
                  if (tag) tags.push(tag);
                }
             }
          }
          setDocxTags(Array.from(new Set(tags)));

          // 2. Extract Main Content Text Preview
          const docXml = await zip.file('word/document.xml')?.async('text');
          if (docXml) {
             const text = docXml
               .replace(/<w:p(?:\s+[^>]*)?>/g, '\n')
               .replace(/<[^>]*>/g, '')
               .replace(/\n\s*\n/g, '\n\n')
               .trim();
             setDocxPreview(text);
          }
        } catch (err) {
          setDocxPreview('ERROR_DE_EXTRACCIÓN: No se pudo leer la estructura del Word.');
        } finally {
          setIsLoadingDocx(false);
        }
      } else {
        setDocxPreview('');
        setDocxTags([]);
      }
    };
    extractDocx();
  }, [selectedId, currentTemplate?.binaryContent]);

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
    recordSnapshot();
    await db.letter_templates.update(selectedId, {
      name: editName,
      content: editContent,
      config: editConfig,
      version: editVersion,
      isActive: editActive,
      updatedAt: Date.now()
    });
    // Visual feedback 
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar esta plantilla?')) return;
    await db.letter_templates.delete(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleDownload = (tmpl: LetterTemplate) => {
    const exportData = {
      type: 'abdfn_template',
      payload: tmpl,
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tmpl.name.toUpperCase()}_TEMPLATE.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const data = await db.letter_templates.toArray();
    const exportPath = {
      type: 'abdfn_templates_backup',
      payload: data,
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(exportPath, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABDFN_TEMPLATES_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateConfig = (key: keyof TemplateComposition, val: any) => {
    setEditConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="flex-col" style={{ gap: '24px' }}>
      <section className="station-registry">
        <div className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
          <div className="station-registry-title">
            <ListIcon size={18} />
             TEMPLATES_REGISTRY ({templates.length})
          </div>
          {isRegistryExpanded ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
        </div>

        <div className={`station-registry-anim-container ${isRegistryExpanded ? 'expanded' : ''}`}>
          <div className="station-registry-anim-content">
            <div className="station-registry-content">
                <div className="station-registry-actions" style={{ justifyContent: 'space-between' }}>
                   <div className="flex-row" style={{ gap: '8px' }}>
                     <button 
                        className="station-btn station-registry-btn-side" 
                        onClick={handleExportAll}
                        title="Exportar Plantillas (JSON↓)"
                     >
                        <DownloadIcon size={14} /> <span style={{fontSize: '0.65rem', fontWeight: 800}}>JSON↓</span>
                     </button>
                     <button 
                        className="station-btn station-registry-btn-side" 
                        onClick={handleImport}
                        title="Importar Plantillas (ALL↑)"
                     >
                        <UploadIcon size={14} /> <span style={{fontSize: '0.65rem', fontWeight: 800}}>ALL↑</span>
                     </button>
                   </div>

                   <button 
                      className="station-btn station-btn-primary station-registry-btn-main" 
                      onClick={handleCreate}
                      style={{ flex: 1, maxWidth: '300px' }}
                   >
                      [+] NUEVA PLANTILLA
                   </button>
                </div>
                
                <div className="flex-col" style={{ gap: '8px' }}>
                <div className="station-registry-list">
                {templates.length === 0 && (
                  <div className="station-empty-state" style={{ minHeight: '120px' }}>
                    <span className="station-shimmer-text">SIN PLANTILLAS REGISTRADAS</span>
                  </div>
                )}
                  {templates.map(tmpl => (
                    <div 
                      key={tmpl.id} 
                      className={`station-registry-item ${selectedId === tmpl.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedId(tmpl.id!);
                        setIsRegistryExpanded(false);
                      }}
                    >
                      <div className="station-registry-item-left">
                         <div className="station-registry-item-icon"><FileTextIcon size={16} /></div>
                         <div className="station-registry-item-info">
                             <span className="station-registry-item-name">{tmpl.name}</span>
                             <span className="station-registry-item-meta">
                                V1.0 • {tmpl.type} • {new Date(tmpl.updatedAt).toLocaleDateString()}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="station-main">
        {selectedId && currentTemplate?.type === 'DOCX' && (
        <div className="flex-col" style={{ gap: '24px' }}>
           <div className="station-card" style={{ background: 'rgba(56, 189, 248, 0.05)', borderLeft: '4px solid var(--primary-color)' }}>
              <div className="flex-row" style={{ alignItems: 'center', gap: '16px' }}>
                 <FileTextIcon size={32} style={{ color: 'var(--primary-color)' }} />
                 <div className="flex-col">
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>ESTRUCTURA DOCX (OPENXML / ZIP)</span>
                    <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>MODO PREVISUALIZACIÓN TÉCNICA - EDICIÓN NO DISPONIBLE EN WEB</span>
                 </div>
              </div>
           </div>

           <div className="station-card shadow-lg" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              <div className="station-panel-header">
                 <span className="station-title-main">CONTENIDO EXTRAÍDO (BORRADOR)</span>
                 <span className="station-badge station-badge-blue">READ-ONLY</span>
              </div>
              <div className="station-shell-content" style={{ flex: 1, padding: '24px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', opacity: 0.8 }}>
                 {isLoadingDocx ? (
                   <div className="station-shimmer-text">EXTRAYENDO ESTRUCTURA TÉCNICA...</div>
                 ) : (
                   <>
                     <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                        <span className="station-label">ETIQUETAS DETECTADAS:</span>
                        <div className="flex-row" style={{ flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                           {docxTags.length > 0 ? docxTags.map(t => (
                             <span key={t} className="station-badge station-badge-blue" style={{ fontSize: '0.65rem' }}>{`{{${t}}}`}</span>
                           )) : <span style={{ opacity: 0.5 }}>Ninguna detectada.</span>}
                        </div>
                     </div>
                     {docxPreview || 'Sin contenido de texto detectable.'}
                   </>
                 )}
                 {"\n\n[SISTEMA]: El motor industrial utilizará el archivo binario original para la generación final."}
              </div>
           </div>
        </div>
     )}

     {selectedId && currentTemplate?.type === 'HTML' && (
          <>
            <header className="station-card">
              <div className="station-panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <h2 className="station-title-main" style={{ margin: 0 }}>{editName}</h2>
                  <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
                     <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>V{editVersion}</span>
                     <span className={`station-badge ${editActive ? 'station-badge-green' : 'station-badge-orange'}`}>
                        {editActive ? 'ACTIVA' : 'DRAFT'}
                     </span>
                  </div>
                </div>

                <div className="flex-row" style={{ gap: '12px' }}>
                  <button className="station-btn" onClick={undo} disabled={undoStack.length === 0} title="Deshacer"><UndoIcon size={16} /></button>
                  <button className="station-btn" onClick={() => setShowSettingsModal(true)} title="Configuración de Plantilla">
                    <CogIcon size={16} /> CONFIGURACIÓN
                  </button>
                  <button className={`station-btn ${showPreview ? 'active' : ''}`} onClick={() => setShowPreview(!showPreview)} title="Alternar Previsualización">
                    <EyeIcon size={16} /> PREVISUALIZAR
                  </button>
                  <button className="station-btn station-btn-primary" onClick={handleSave}>
                    <SaveIcon size={16} /> GUARDAR PLANTILLA
                  </button>
                </div>
              </div>

              <div className="station-tech-summary" style={{ marginTop: '16px' }}>
                <div className="station-tech-item"><span className="station-tech-label">Tipo:</span> {templates.find(t=>t.id===selectedId)?.type}</div>
                <div className="station-tech-item"><span className="station-tech-label">Actualización:</span> {new Date(templates.find(t=>t.id===selectedId)?.updatedAt || 0).toLocaleString()}</div>
                <div className="station-tech-item"><span className="station-tech-label">Engine:</span> HANDLEBARS v4</div>
              </div>
            </header>

            <div className="station-editor-area" style={{ gridTemplateColumns: '1fr' }}>
              <div className="station-left-panel">
                 <div className="flex-col" style={{ gap: '16px' }}>

                  <div className="station-tabs">
                    <button className={`station-tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
                      <FileTextIcon size={16} /> EDITOR ESTRUCTURAL
                    </button>
                    <button className={`station-tab-btn ${activeTab === 'composition' ? 'active' : ''}`} onClick={() => setActiveTab('composition')}>
                      <CogIcon size={16} /> COMPOSICIÓN A4
                    </button>
                  </div>

                  {activeTab === 'content' ? (
                    <div className="flex-col" style={{ flex: 1, gap: '12px', minHeight: '400px' }}>
                      <label className="station-label">CUERPO HTML (MOTOR HANDLEBARS):</label>
                      <textarea 
                        className="station-mono-editor"
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
                       <div className="station-property-group">
                          <span className="station-property-title">Ventanilla de Sobre (Medidas en mm)</span>
                          <div className="station-config-grid">
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

                       <div className="station-property-group">
                          <span className="station-property-title">Tipografía Técnica</span>
                          <div className="station-config-grid">
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

                       <div className="station-property-group">
                          <span className="station-property-title">Inyectores de Página</span>
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

            {/* Panel de Previsualización Colapsable Inferior */}
            <div className={`station-registry-anim-container ${showPreview ? 'expanded' : ''}`} style={{ marginTop: '24px' }}>
              <div className="station-registry-anim-content">
                <div className="station-right-panel" style={{ padding: 0 }}>
                  <div className="station-card" style={{ padding: '32px', background: 'var(--bg-color)', overflow: 'auto', maxHeight: '700px' }}>
                    <div className="station-a4-sheet">
                      <div 
                        className="station-window-overlay"
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
                        className="station-sheet-content"
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
              </div>
            </div>
          </>
      )}
      {!selectedId && (
          <div className="station-empty-state">
            <FileTextIcon size={64} style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>SISTEMA DE DISEÑO DE PLANTILLAS</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Seleccione o cree una plantilla desde el registro superior para comenzar.</p>
          </div>
      )}
      </main>
      {/* Modales de Configuración de Plantilla */}
      {showSettingsModal && (
        <div className="station-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="station-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>CONFIGURACIÓN DE PLANTILLA</h3>
              <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setShowSettingsModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">Etiqueta de Plantilla (Nombre)</label>
                  <input className="station-input" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">Versión</label>
                  <input className="station-input" value={editVersion} onChange={e => setEditVersion(e.target.value)} />
                </div>
                <div className="station-form-field full">
                   <div className="flex-row" style={{ gap: '12px', marginTop: '8px' }}>
                    <input type="checkbox" id="tmpl-active" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                    <label htmlFor="tmpl-active" className="station-label" style={{ marginBottom: 0 }}>Plantilla activa para producción</label>
                   </div>
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
               <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setShowSettingsModal(false)}>ACEPTAR Y CERRAR</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
