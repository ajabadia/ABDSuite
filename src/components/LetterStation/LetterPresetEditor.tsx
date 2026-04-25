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
  UndoIcon,
  FileTextIcon
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
  contractClass: '  ',
  savingsOpCode: '',
  savingsOpAccount: '',
  savingsOpSign: '+',
  savingsOpAmount: '0',
  savingsOpCurrency: '  ',
  savingsOpISO: '   ',
  savingsOpConcept: '  '
};

import { auditService } from '@/lib/services/AuditService';
import { useWorkspace } from '@/lib/context/WorkspaceContext';

const LetterPresetEditor: React.FC = () => {
  const { t } = useLanguage();
  const { currentOperator } = useWorkspace();
  
  // Data
  const presets = useLiveQuery(() => db.presets_v6.toArray()) || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      id: crypto.randomUUID(),
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
    const id = await db.presets_v6.add(newPreset);
    setSelectedId(id as string);
    setIsRegistryExpanded(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm_delete').toUpperCase())) {
      await db.presets_v6.delete(id);
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
    if (!formData.name) newErrors.name = 'ERR: Name required';
    
    const codDoc = formData.gawebConfig?.codigoDocumento || "";
    const oficina = formData.gawebConfig?.oficina || "";
    
    if (codDoc.length !== 6) newErrors.codDoc = 'Exacto 6 caracteres';
    if (oficina.length !== 5) newErrors.oficina = 'Exacto 5 caracteres';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      recordSnapshot();
      
      // 1. Guardado Interno (DB)
      await db.presets_v6.put({
        ...formData,
        updatedAt: Date.now()
      });

      // Audit Config Change
      await auditService.log({
        module: 'LETTER',
        messageKey: 'letter.config.update',
        status: 'WARNING',
        operatorId: currentOperator?.id,
        details: {
          eventType: 'LETTER_CONFIG_UPDATE',
          entityType: 'LETTER_CONFIG',
          entityId: formData.id || 'NEW',
          actorId: currentOperator?.id,
          actorUser: currentOperator?.username,
          severity: 'WARN',
          context: {
            modelName: formData.name,
            version: formData.version
          }
        }
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
      } catch (fileErr: any) {
        if (fileErr.name !== 'AbortError') throw fileErr;
      }
    } catch (err: any) {
      console.error('SAVE_ERROR', err);
    }
  };

  const handleExportAll = async () => {
    const data = await db.presets_v6.toArray();
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
              const { id: _, ...cleanPreset } = p;
              await db.presets_v6.add({
                ...cleanPreset,
                id: crypto.randomUUID()
              });
            }
            alert('IMPORT_COMPLETE');
          }
        } catch (err) {}
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
             {t('letter.ui.models_registry').toUpperCase()} ({presets.length})
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
                    [+] {t('letter.ui.new_model').toUpperCase()}
                 </button>
              </div>
              
              <div className="flex-col" style={{ gap: '8px' }}>
                <div className="station-registry-list">
                  {presets.length === 0 && (
                    <div className="station-empty-state" style={{ minHeight: '120px' }}>
                      <span className="station-shimmer-text">{t('processor.empty').toUpperCase()}</span>
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
                      {formData.isActive ? t('audit.status_ready').toUpperCase() : 'DRAFT'}
                   </span>
                </div>
              </div>

              <div className="flex-row" style={{ gap: '12px' }}>
                <button className="station-btn" onClick={undo} disabled={undoStack.length === 0}><UndoIcon size={16} /></button>
                <button className="station-btn" onClick={() => setShowConfigModal(true)}>
                  <CogIcon size={16} /> {t('settings.title').toUpperCase()}
                </button>
                <button className="station-btn station-btn-primary" onClick={handleSave}>
                  <SaveIcon size={16} /> {t('common.save').toUpperCase()}
                </button>
              </div>
            </div>

            <div className="station-tech-summary" style={{ marginTop: '16px' }}>
              <div className="station-tech-item"><span className="station-tech-label">{t('audit.fields.Format').toUpperCase()}:</span> {formData.gawebConfig?.tipoSoporte}</div>
              <div className="station-tech-item"><span className="station-tech-label">FORMATO:</span> {formData.gawebConfig?.formatoCarta}</div>
              <div className="station-tech-item"><span className="station-tech-label">ENTORNO:</span> {formData.gawebConfig?.codigoEntorno}</div>
              <div className="station-tech-item"><span className="station-tech-label">{t('audit.fields.DocCode').toUpperCase()}:</span> {formData.gawebConfig?.codigoDocumento}</div>
            </div>
          </header>

          <div className="flex-col" style={{ gap: '32px' }}>

            {/* Bloque: Técnica */}
            <span className="station-form-section-title">{t('etl.tech_summary').toUpperCase()}</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField(t('audit.fields.Format'), 'soporte',
                  <select className="station-select" value={formData.gawebConfig?.tipoSoporte} onChange={e => updateGaweb('tipoSoporte', e.target.value)}>
                    {SOPORTES_GAWEB.map(s => <option key={s.globalId} value={s.globalId}>{s.label}</option>)}
                  </select>, undefined, 'small')}
                
                {renderField('GAWEB_FORMAT', 'formato',
                  <select className="station-select" value={formData.gawebConfig?.formatoCarta} onChange={e => updateGaweb('formatoCarta', e.target.value)}>
                    {filteredFormatos.map(f => <option key={f.globalId} value={f.globalId}>{f.label}</option>)}
                  </select>, undefined, 'medium')}

                {renderField(t('audit.fields.ForceSend'), null,
                  <select className="station-select" value={formData.gawebConfig?.forzarMetodo} onChange={e => updateGaweb('forzarMetodo', e.target.value)}>
                    {METODOS_ENVIO.map(m => <option key={m.globalId} value={m.globalId}>{m.label}</option>)}
                  </select>, undefined, 'medium')}
              </div>
            </section>

            {/* Bloque: Segmentación */}
            <span className="station-form-section-title">SEGMENT_HOST_CONTROL</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField(t('audit.fields.INDOM'), null,
                  <select className="station-select" value={formData.gawebConfig?.tipoDestino} onChange={e => updateGaweb('tipoDestino', e.target.value)}>
                    {DESTINOS_GAWEB.map(d => <option key={d.globalId} value={d.globalId}>{d.label}</option>)}
                  </select>, undefined, 'small')}
                
                {formData.gawebConfig?.tipoDestino !== 'CL' && renderField('CLASE DE CONTRATO', null,
                  <input className="station-input" maxLength={2} value={formData.gawebConfig?.contractClass} onChange={e => updateGaweb('contractClass', e.target.value.toUpperCase())} placeholder="EJ: 99" />, undefined, 'small')}
                
                {renderField(t('audit.fields.DestinationIndicator'), null,
                  <select className="station-select" value={formData.gawebConfig?.indicadorDestino} onChange={e => updateGaweb('indicadorDestino', e.target.value)}>
                    {INDICADORES_DESTINO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField('HOST_ENV', 'entorno',
                  <input className="station-input" value={formData.gawebConfig?.codigoEntorno} onChange={e => updateGaweb('codigoEntorno', e.target.value.toUpperCase())} />, undefined, 'medium')}
                
                {renderField(`${t('letter.ui.gen_date')} (DEF)`, 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaGeneracion} onChange={e => updateGaweb('fechaGeneracion', e.target.value)} />, undefined, 'small')}
                {renderField(`${t('letter.ui.letter_date')} (DEF)`, 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaCarta} onChange={e => updateGaweb('fechaCarta', e.target.value)} />, undefined, 'small')}
              </div>
            </section>
            
            {/* Bloque: Opcionales GAWEB */}
            <span className="station-form-section-title">GAWEB_OPTIONAL_PARAM</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField(`${t('audit.fields.Language')} (ISO)`, 'idioma',
                  <select className="station-select" value={formData.gawebConfig?.idioma} onChange={e => updateGaweb('idioma', e.target.value)}>
                    {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField(t('audit.fields.DeliveryWay'), 'viaReparto',
                  <select className="station-select" value={formData.gawebConfig?.viaReparto} onChange={e => updateGaweb('viaReparto', e.target.value)}>
                    {VIAS_REPARTO.map(v => <option key={v.globalId} value={v.globalId}>{v.label}</option>)}
                  </select>, undefined, 'small')}
                {renderField(t('audit.fields.DocCode'), 'codDoc',
                  <input className="station-input" maxLength={6} value={formData.gawebConfig?.codigoDocumento} onChange={e => updateGaweb('codigoDocumento', e.target.value.toUpperCase())} />, 'codDoc', 'small')}
                {renderField(t('audit.fields.OfficeCode'), 'oficina',
                  <input className="station-input" maxLength={5} value={formData.gawebConfig?.oficina} onChange={e => updateGaweb('oficina', e.target.value)} />, 'oficina', 'small')}
                {renderField(t('audit.fields.Page'), 'paginas',
                  <input className="station-input" value={formData.gawebConfig?.paginasDefecto} onChange={e => updateGaweb('paginasDefecto', Number(e.target.value))} />, undefined, 'small')}
              </div>
            </section>

            {/* Bloque: Ahorro (AH) */}
            <span className="station-form-section-title">SAVINGS_OPERATIONS_AH</span>
            <section className="station-card">
              <div className="station-form-grid">
                {renderField(t('audit.fields.SavingOpCode'), 'ahcode',
                  <input className="station-input" value={formData.gawebConfig?.savingsOpCode} onChange={e => updateGaweb('savingsOpCode', e.target.value.toUpperCase())} placeholder="EJ: AH" />, undefined, 'small')}
                {renderField(t('audit.fields.SavingOpAccount'), 'account',
                  <input className="station-input" value={formData.gawebConfig?.savingsOpAccount} onChange={e => updateGaweb('savingsOpAccount', e.target.value)} />, undefined, 'medium')}
                {renderField(`${t('audit.fields.SavingOpSign')} / IMPORT`, null,
                  <div className="flex-row" style={{ gap: '4px' }}>
                    <select className="station-select" style={{ width: '40px' }} value={formData.gawebConfig?.savingsOpSign} onChange={e => updateGaweb('savingsOpSign', e.target.value)}>
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>
                    <input className="station-input" style={{ flex: 1 }} value={formData.gawebConfig?.savingsOpAmount} onChange={e => updateGaweb('savingsOpAmount', e.target.value)} />
                  </div>, undefined, 'medium')}
                {renderField(`ISO / ${t('audit.fields.SavingOpConcept')}`, null,
                  <div className="flex-row" style={{ gap: '4px' }}>
                    <input className="station-input" style={{ width: '50px' }} value={formData.gawebConfig?.savingsOpISO} onChange={e => updateGaweb('savingsOpISO', e.target.value.toUpperCase())} />
                    <input className="station-input" style={{ flex: 1 }} value={formData.gawebConfig?.savingsOpConcept} onChange={e => updateGaweb('savingsOpConcept', e.target.value)} />
                  </div>, undefined, 'small')}
              </div>
            </section>
          </div>

          <footer className="station-modal-footer" style={{ border: 'none', background: 'transparent', padding: 0, marginTop: '24px' }}>
            <button className="station-btn" onClick={() => setSelectedId(null)}>{t('common.cancel').toUpperCase()}</button>
            <button className="station-btn station-btn-primary" style={{ padding: '0 32px', height: '48px' }} onClick={handleSave}>
              <SaveIcon size={18} /> {t('common.save').toUpperCase()}
            </button>
          </footer>
        </div>
      ) : (
        <div className="station-empty-state">
           <CogIcon size={64} style={{ marginBottom: '16px' }} />
           <span className="station-shimmer-text">{t('letter.ui.models_registry').toUpperCase()}</span>
        </div>
      )}

      {/* Modal de Configuración de Modelo */}
      {showConfigModal && (
        <div className="station-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="station-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <header className="station-modal-header">
              <h3 className="station-registry-item-name" style={{ fontSize: '1.1rem' }}>{t('settings.title').toUpperCase()}</h3>
              <button className="station-btn icon-only" style={{ border: 'none', padding: '4px' }} onClick={() => setShowConfigModal(false)}><XIcon size={20} /></button>
            </header>
            <div className="station-modal-content">
              <div className="station-form-grid">
                <div className="station-form-field full">
                  <label className="station-label">{t('etl.field_name').toUpperCase()}</label>
                  <input className="station-input" value={formData?.name} onChange={e => setFormData({...formData!, name: e.target.value.toUpperCase()})} />
                </div>
              </div>
            </div>
            <footer className="station-modal-footer">
               <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setShowConfigModal(false)}>{t('common.save').toUpperCase()}</button>
            </footer>
          </div>
        </div>
      )}

      {helpTopic && (
        <div className="station-modal-overlay" onClick={() => setHelpTopic(null)}>
           <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
              <header className="station-modal-header">
                 <h3 className="station-registry-item-name" style={{ fontSize: '1rem' }}>{t('common.help').toUpperCase()} / {helpTopic.title}</h3>
                 <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setHelpTopic(null)}><XIcon size={18} /></button>
              </header>
              <div className="station-modal-content" style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                 {helpTopic.content}
              </div>
              <footer className="station-modal-footer">
                <button className="station-btn station-btn-primary" style={{ width: '100%' }} onClick={() => setHelpTopic(null)}>{t('common.ok').toUpperCase()}</button>
              </footer>
           </div>
        </div>
      )}
      {/* Sello de Integridad (Era 6) */}
      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <FileTextIcon size={14} />
         <span>ESTÁNDAR GAWEB v.1 (ERA 6)</span>
      </div>
    </div>
  );
};

export default LetterPresetEditor;
