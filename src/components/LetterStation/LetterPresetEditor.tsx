'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { EtlPreset, GawebConfig } from '@/lib/types/etl.types';
import { 
  IDIOMAS_ISO, 
  FORMATOS_GAWEB, 
  SOPORTES_GAWEB, 
  DESTINOS_GAWEB, 
  INDICADORES_DESTINO, 
  METODOS_ENVIO,
  VIAS_REPARTO,
  COPIAS_PAPEL,
  GAWEB_HELP
} from '@/lib/constants/letter.constants';
import { 
  ListIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  SaveIcon, 
  TrashIcon, 
  DownloadIcon, 
  UploadIcon,
  HelpIcon,
  XIcon,
  CogIcon,
  UndoIcon
} from '@/components/common/Icons';

const DEFAULT_CONFIG: GawebConfig = {
  active: true,
  tipoSoporte: 'PDF',
  formatoCarta: '04',
  forzarMetodo: ' ',
  indicadorDestino: '0',
  tipoDestino: 'CL',
  codigoEntorno: 'ABDFN01',
  codigoDocumento: 'X00000',
  fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  fechaCarta: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  oficina: '00000',
  paginasDefecto: 4,
  idioma: '  ',
  viaReparto: '  ',
  copiaPapel: ' ',
  savingsOpCode: '',
  savingsOpAccount: '',
  savingsOpSign: '+',
  savingsOpAmount: '0',
  savingsOpCurrency: '  ',
  savingsOpISO: '   ',
  savingsOpConcept: '  '
};

const LetterPresetEditor: React.FC = () => {
  const { t } = useLanguage();
  
  // Data
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isRegistryExpanded, setIsRegistryExpanded] = useState(true);
  
  const [formData, setFormData] = useState<EtlPreset | null>(null);
  const [helpTopic, setHelpTopic] = useState<{title: string, content: string} | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync selection to form
  useEffect(() => {
    if (selectedId) {
      const preset = presets.find(p => p.id === selectedId);
      if (preset) {
        setFormData({
          ...preset,
          description: preset.description || '',
          isActive: preset.isActive ?? true,
          gawebConfig: {
            ...DEFAULT_CONFIG,
            ...(preset.gawebConfig || {})
          }
        });
      }
    } else {
      setFormData(null);
    }
  }, [selectedId, presets]); 

  const handleCreate = async () => {
    const newPreset: EtlPreset = {
      name: 'NUEVO_MODELO_CARTA',
      version: '1.0',
      description: 'Generación industrial',
      chunkSize: 1000,
      encoding: 'utf-8',
      recordTypeStart: 0,
      recordTypeLen: 2,
      defaultRecordType: 'DATA',
      headerTypeId: 'H',
      recordTypes: [],
      isActive: true,
      gawebConfig: { ...DEFAULT_CONFIG },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const id = await db.presets.add(newPreset);
    setSelectedId(id as number);
    setIsRegistryExpanded(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('common.confirm_delete'))) {
      await db.presets.delete(id);
      if (selectedId === id) setSelectedId(null);
    }
  };

  const recordSnapshot = () => {
    if (formData) setUndoStack(prev => [...prev.slice(-19), JSON.stringify(formData)]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setFormData(JSON.parse(last));
  };

  const handleSave = async () => {
    if (!formData) return;
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nombre requerido';
    
    const codDoc = formData.gawebConfig?.codigoDocumento || "";
    const oficina = formData.gawebConfig?.oficina || "";
    
    if (codDoc.length !== 6) newErrors.codDoc = 'Exacto 6 caracteres';
    if (oficina.length !== 5) newErrors.oficina = 'Exacto 5 caracteres';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      alert('ATENCIÓN: Corrija los campos marcados en rojo antes de guardar.');
      return;
    }

    try {
      recordSnapshot();
      
      // 1. Guardado Interno (DB)
      await db.presets.put({
        ...formData,
        updatedAt: Date.now()
      });

      // 2. Guardado Físico (Diálogo de Sistema / Requisito Chrome)
      const fileName = `PRESET_${formData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
      
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'ABDFN Preset Configuration (JSON)',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('MODELO PERSISTIDO EN BASE DE DATOS Y DISCO CON ÉXITO.');
      } catch (fileErr: any) {
        if (fileErr.name === 'AbortError') {
          alert('ATENCIÓN: Se guardó en base de datos pero se canceló el guardado físico.');
        } else {
          throw fileErr;
        }
      }
    } catch (err: any) {
      console.error('SAVE_ERROR', err);
      alert(`ERROR AL GUARDAR: ${err.message}`);
    }
  };

  const handleExportAll = async () => {
    const data = await db.presets.toArray();
    const exportPath = {
      type: 'abdfn_presets_backup',
      payload: data,
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(exportPath, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABDFN_PRESETS_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          if (data.type === 'abdfn_presets_backup' && Array.isArray(data.payload)) {
            for (const p of data.payload) {
              const { id, ...cleanPreset } = p;
              await db.presets.add(cleanPreset);
            }
            alert('MODELOS IMPORTADOS CON ÉXITO.');
          } else {
            alert('FORMATO DE ARCHIVO NO VÁLIDO.');
          }
        } catch (err) {
          console.error('IMPORT_ERROR', err);
          alert('ERROR AL IMPORTAR ARCHIVO.');
        }
      }
    };
    input.click();
  };

  const updateGaweb = (field: keyof GawebConfig, value: any) => {
    if (!formData) return;
    setFormData({
      ...formData,
      gawebConfig: {
        ...DEFAULT_CONFIG,
        ...(formData.gawebConfig || {}),
        [field]: value
      }
    });
  };

  const renderField = (label: string, helpKey: string | null, children: React.ReactNode, errorKey?: string, className: string = "") => (
    <div className={`station-form-field ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label className="station-label">{label}</label>
        {helpKey && (
          <button 
            type="button"
            className="station-help-btn"
            onClick={() => setHelpTopic({ title: label, content: GAWEB_HELP[helpKey] || t(`letter.help.${helpKey}`) })}
          >
            ?
          </button>
        )}
      </div>
      {children}
      {errorKey && errors[errorKey] && (
        <span className="txt-err" style={{ fontSize: '0.7rem' }}>{errors[errorKey].toUpperCase()}</span>
      )}
    </div>
  );

  const currentSoporte = formData?.gawebConfig?.tipoSoporte || 'PDF';
  const filteredFormatos = FORMATOS_GAWEB.filter(f => f.extra === currentSoporte);

  return (
    <div className="flex-col" style={{ gap: '24px' }}>
      {/* 1. Registro Técnico (Unified Style) */}
      <section className="station-registry">
        <div className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
          <div className="station-registry-title">
            <ListIcon size={18} />
             LETTER_MODELS_REGISTRY ({presets.length})
          </div>
          {isRegistryExpanded ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
        </div>

        <div className={`station-registry-anim-container ${isRegistryExpanded ? 'expanded' : ''}`}>
          <div className="station-registry-anim-content">
            <div className="station-registry-content" style={{ gap: '16px' }}>
              <div className="station-registry-actions" style={{ justifyContent: 'space-between' }}>
                 <div className="flex-row" style={{ gap: '8px' }}>
                   <button 
                      className="station-btn station-registry-btn-side" 
                      onClick={handleExportAll}
                      title="Exportar Modelos (JSON↓)"
                   >
                      <DownloadIcon size={14} /> <span style={{fontSize: '0.65rem', fontWeight: 800}}>JSON↓</span>
                   </button>
                   <button 
                      className="station-btn station-registry-btn-side" 
                      onClick={handleImport}
                      title="Importar Modelos (ALL↑)"
                   >
                      <UploadIcon size={14} /> <span style={{fontSize: '0.65rem', fontWeight: 800}}>ALL↑</span>
                   </button>
                 </div>

                 <button 
                    className="station-btn station-btn-primary station-registry-btn-main" 
                    onClick={handleCreate}
                    style={{ flex: 1, maxWidth: '300px' }}
                 >
                    [+] NUEVO MODELO
                 </button>
              </div>
              
              <div className="flex-col" style={{ gap: '8px' }}>
                <div className="station-registry-list">
                  {presets.length === 0 && (
                    <div className="station-empty-state" style={{ minHeight: '120px' }}>
                      <span className="station-shimmer-text">SIN MODELOS REGISTRADOS</span>
                    </div>
                  )}
                  {presets.map(p => (
                    <div 
                      key={p.id} 
                      className={`station-registry-item ${selectedId === p.id ? 'active' : ''}`}
                      onClick={() => { setSelectedId(p.id!); setIsRegistryExpanded(false); }}
                    >
                      <div className="station-registry-item-left">
                         <div className="station-registry-item-icon"><ListIcon size={16} /></div>
                         <div className="station-registry-item-info">
                            <span className="station-registry-item-name">{p.name}</span>
                            <span className="station-registry-item-meta">
                               v{p.version} • {p.isActive ? 'ACTIVE' : 'DRAFT'}
                            </span>
                         </div>
                      </div>
                      <div className="station-registry-item-actions">
                         <button className="station-registry-action-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p.id!); }}>
                            <TrashIcon size={16} style={{ color: 'var(--status-err)' }} />
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

      {/* 2. Zona de Edición Industrial */}
      {formData ? (
        <div className="flex-col fade-in" style={{ gap: '24px' }}>
          
          {/* 1. Cabecera Industrial Aseptic v4 */}
          <header className="station-card">
            <div className="station-panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                <h2 className="station-title-main" style={{ margin: 0 }}>{formData.name}</h2>
                <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
                   <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>V{formData.version}</span>
                   <span className={`station-badge ${formData.isActive ? 'station-badge-green' : 'station-badge-orange'}`}>
                      {formData.isActive ? 'ACTIVO' : 'DRAFT'}
                   </span>
                </div>
              </div>

              <div className="flex-row" style={{ gap: '12px' }}>
                <button className="station-btn" onClick={undo} disabled={undoStack.length === 0} title="Deshacer"><UndoIcon size={16} /></button>
                <button className="station-btn" onClick={() => setShowConfigModal(true)} title="Configuración de Modelo">
                  <CogIcon size={16} /> CONFIGURACIÓN
                </button>
                <button className="station-btn station-btn-primary" onClick={handleSave}>
                  <SaveIcon size={16} /> GUARDAR MODELO
                </button>
              </div>
            </div>

            <div className="station-tech-summary" style={{ marginTop: '16px' }}>
              <div className="station-tech-item"><span className="station-tech-label">Soporte:</span> {formData.gawebConfig?.tipoSoporte}</div>
              <div className="station-tech-item"><span className="station-tech-label">Formato:</span> {formData.gawebConfig?.formatoCarta}</div>
              <div className="station-tech-item"><span className="station-tech-label">Entorno:</span> {formData.gawebConfig?.codigoEntorno}</div>
              <div className="station-tech-item"><span className="station-tech-label">Cód. Doc:</span> {formData.gawebConfig?.codigoDocumento}</div>
            </div>
          </header>

          <div className="flex-col" style={{ gap: '32px' }}>

            {/* Bloque: Técnica */}
            <span className="station-form-section-title">CONFIGURACIÓN TÉCNICA</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField('Tipo Soporte', 'soporte',
                  <select className="station-select" value={formData.gawebConfig?.tipoSoporte} onChange={e => updateGaweb('tipoSoporte', e.target.value)}>
                    {SOPORTES_GAWEB.map(s => <option key={s.globalId} value={s.globalId}>{s.label}</option>)}
                  </select>, undefined, 'small')}
                
                {renderField('Formato GAWEB', 'formato',
                  <select className="station-select" value={formData.gawebConfig?.formatoCarta} onChange={e => updateGaweb('formatoCarta', e.target.value)}>
                    {filteredFormatos.map(f => <option key={f.globalId} value={f.globalId}>{f.label}</option>)}
                  </select>, undefined, 'medium')}

                {renderField('Método de Envío', null,
                  <select className="station-select" value={formData.gawebConfig?.forzarMetodo} onChange={e => updateGaweb('forzarMetodo', e.target.value)}>
                    {METODOS_ENVIO.map(m => <option key={m.globalId} value={m.globalId}>{m.label}</option>)}
                  </select>, undefined, 'medium')}
              </div>
            </section>

            {/* Bloque: Segmentación */}
            <span className="station-form-section-title">SEGMENTACIÓN Y HOST</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField('Tipo Destinatario', null,
                  <select className="station-select" value={formData.gawebConfig?.tipoDestino} onChange={e => updateGaweb('tipoDestino', e.target.value)}>
                    {DESTINOS_GAWEB.map(d => <option key={d.globalId} value={d.globalId}>{d.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField('Indicador Destino', null,
                  <select className="station-select" value={formData.gawebConfig?.indicadorDestino} onChange={e => updateGaweb('indicadorDestino', e.target.value)}>
                    {INDICADORES_DESTINO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField('Entorno Host', 'entorno',
                  <input className="station-input" value={formData.gawebConfig?.codigoEntorno} onChange={e => updateGaweb('codigoEntorno', e.target.value.toUpperCase())} />, undefined, 'medium')}
                
                {renderField('F. Generación (Default)', 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaGeneracion} onChange={e => updateGaweb('fechaGeneracion', e.target.value)} />, undefined, 'small')}
                {renderField('F. Carta (Default)', 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaCarta} onChange={e => updateGaweb('fechaCarta', e.target.value)} />, undefined, 'small')}
              </div>
            </section>
            
            {/* Bloque: Opcionales GAWEB */}
            <span className="station-form-section-title">OPCIONALES GAWEB</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField('Idioma (ISO)', 'idioma',
                  <select className="station-select" value={formData.gawebConfig?.idioma} onChange={e => updateGaweb('idioma', e.target.value)}>
                    {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField('Vía Reparto', 'viaReparto',
                  <select className="station-select" value={formData.gawebConfig?.viaReparto} onChange={e => updateGaweb('viaReparto', e.target.value)}>
                    {VIAS_REPARTO.map(v => <option key={v.globalId} value={v.globalId}>{v.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField('Cód. Doc', 'codDoc',
                  <input className="station-input" maxLength={6} value={formData.gawebConfig?.codigoDocumento} onChange={e => updateGaweb('codigoDocumento', e.target.value.toUpperCase())} />, 'codDoc', 'small')}
                {renderField('Oficina', 'oficina',
                  <input className="station-input" maxLength={5} value={formData.gawebConfig?.oficina} onChange={e => updateGaweb('oficina', e.target.value)} />, 'oficina', 'small')}
                {renderField('Páginas', 'paginas',
                  <input className="station-input" value={formData.gawebConfig?.paginasDefecto} onChange={e => updateGaweb('paginasDefecto', Number(e.target.value))} />, undefined, 'small')}
              </div>
            </section>

            {/* Bloque: Ahorro (AH) */}
            <span className="station-form-section-title">OPERACIONES EN AHORRO (AH)</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField('Cód. Ahorro', 'ahcode',
                  <input className="station-input" value={formData.gawebConfig?.savingsOpCode} onChange={e => updateGaweb('savingsOpCode', e.target.value.toUpperCase())} placeholder="EJ: AH" />, undefined, 'small')}
                {renderField('Cuenta (CCC)', 'account',
                  <input className="station-input" value={formData.gawebConfig?.savingsOpAccount} onChange={e => updateGaweb('savingsOpAccount', e.target.value)} />, undefined, 'medium')}
                {renderField('Signo / Importe', null,
                  <div className="flex-row" style={{ gap: '4px' }}>
                    <select className="station-select" style={{ width: '40px' }} value={formData.gawebConfig?.savingsOpSign} onChange={e => updateGaweb('savingsOpSign', e.target.value)}>
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>
                    <input className="station-input" style={{ flex: 1 }} value={formData.gawebConfig?.savingsOpAmount} onChange={e => updateGaweb('savingsOpAmount', e.target.value)} />
                  </div>, undefined, 'medium')}
                {renderField('ISO / Concepto', null,
                  <div className="flex-row" style={{ gap: '4px' }}>
                    <input className="station-input" style={{ width: '50px' }} value={formData.gawebConfig?.savingsOpISO} onChange={e => updateGaweb('savingsOpISO', e.target.value.toUpperCase())} />
                    <input className="station-input" style={{ flex: 1 }} value={formData.gawebConfig?.savingsOpConcept} onChange={e => updateGaweb('savingsOpConcept', e.target.value)} />
                  </div>, undefined, 'small')}
              </div>
            </section>
          </div>

          <footer className="station-modal-footer" style={{ border: 'none', background: 'transparent', padding: 0, marginTop: '24px' }}>
            <button className="station-btn" onClick={() => setSelectedId(null)}>CANCELAR CAMBIOS</button>
            <button className="station-btn station-btn-primary" style={{ padding: '0 32px', height: '48px' }} onClick={handleSave}>
              <SaveIcon size={18} /> GUARDAR CONFIGURACION DEL MODELO
            </button>
          </footer>
        </div>
      ) : (
        <div className="flex-col" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
           <CogIcon size={64} />
           <span style={{ fontWeight: 800, marginTop: '16px' }}>SELECCIONE O CREE UN MODELO DE CARTA</span>
        </div>
      )}

      {/* Modal de Configuración de Modelo */}
      {showConfigModal && (
        <div className="station-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="station-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>CONFIGURACIÓN DEL MODELO</h3>
              <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setShowConfigModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">Nombre del Modelo</label>
                  <input className="station-input" value={formData?.name} onChange={e => setFormData({...formData!, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="station-form-field">
                  <label className="station-label">Versión</label>
                  <input className="station-input" value={formData?.version} onChange={e => setFormData({...formData!, version: e.target.value})} />
                </div>
                <div className="station-form-field full">
                  <label className="station-label">Descripción</label>
                  <input className="station-input" value={formData?.description} onChange={e => setFormData({...formData!, description: e.target.value})} />
                </div>
                <div className="station-form-field full">
                   <div className="flex-row" style={{ gap: '12px', marginTop: '8px' }}>
                    <input type="checkbox" id="model-active" checked={formData?.isActive} onChange={e => setFormData({...formData!, isActive: e.target.checked})} />
                    <label htmlFor="model-active" className="station-label" style={{ marginBottom: 0 }}>Modelo activo para producción</label>
                   </div>
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
               <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setShowConfigModal(false)}>ACEPTAR Y CERRAR</button>
            </footer>
          </div>
        </div>
      )}

      {helpTopic && (
        <div className="station-modal-overlay" onClick={() => setHelpTopic(null)}>
           <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
              <header className="station-modal-header">
                 <h3 className="station-registry-item-name" style={{ fontSize: '1rem' }}>AYUDA / {helpTopic.title}</h3>
                 <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setHelpTopic(null)}><XIcon size={18} /></button>
              </header>
              <div className="station-modal-content" style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                 {helpTopic.content}
              </div>
              <footer className="station-modal-footer">
                <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setHelpTopic(null)}>ENTENDIDO</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default LetterPresetEditor;
