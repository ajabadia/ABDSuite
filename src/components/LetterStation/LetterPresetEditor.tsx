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
  HelpCircleIcon,
  XIcon,
  CogIcon
} from '@/components/common/Icons';

import styles from './LetterPresetEditor.module.css';

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
  copiaPapel: ' '
};

const LetterPresetEditor: React.FC = () => {
  const { t } = useLanguage();
  
  // Data
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isRegistryExpanded, setIsRegistryExpanded] = useState(true);
  
  const [formData, setFormData] = useState<EtlPreset | null>(null);
  const [helpTopic, setHelpTopic] = useState<{title: string, content: string} | null>(null);
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

  const handleSave = async () => {
    if (!formData) return;
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nombre requerido';
    if (formData.gawebConfig?.codigoDocumento.length !== 6) newErrors.codDoc = 'Exacto 6 caracteres';
    if (formData.gawebConfig?.oficina.length !== 5) newErrors.oficina = 'Exacto 5 caracteres';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    await db.presets.put({
      ...formData,
      updatedAt: Date.now()
    });
    alert('MODELO GUARDADO CON ÉXITO.');
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

  const renderField = (label: string, helpKey: string | null, children: React.ReactNode, errorKey?: string, className?: string) => (
    <div className={`flex-col ${className || ''}`} style={{ gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
        <label className="station-label" style={{ marginBottom: 0 }}>{label}</label>
        {helpKey && (
          <button 
            type="button"
            className={styles.helpBtn}
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
    <div className={styles.container}>
      {/* 1. Registro Técnico (Unified Style) */}
      <section className="station-registry">
        <div className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
          <div className="station-registry-title">
            <ListIcon size={18} />
             LETTER_MODELS_REGISTRY ({presets.length})
          </div>
          {isRegistryExpanded ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
        </div>

        {isRegistryExpanded && (
          <div className="station-registry-content">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="station-btn station-btn-primary" style={{ flex: 1, height: '48px', fontWeight: 900 }} onClick={handleCreate}>
                [+] NUEVO MODELO CARTA
              </button>
              <button className="station-btn" style={{ width: '64px' }} title="Importar Backup"><UploadIcon size={18} /></button>
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
                             v{p.version} <span className="station-registry-item-status">ACTIVE</span>
                          </span>
                       </div>
                    </div>
                    <div className="station-registry-item-actions">
                       <button className="station-registry-action-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p.id!); }}><TrashIcon size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Zona de Edición Industrial */}
      {formData ? (
        <div className={styles.mainEditor}>
          <div className={styles.configGrid}>
            
            {/* Bloque: Identificación */}
            <span className={styles.sectionTitle}>IDENTIFICACIÓN</span>
            <section className="station-card">
              <div className={styles.cardContent}>
                {renderField('Nombre del Preset', null, 
                  <input className="station-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />, 'name', styles.fieldMedium)}
                {renderField('Descripción', null,
                  <input className="station-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />, undefined, styles.fieldLarge)}
                <div className={`${styles.fieldSmall} flex-row`} style={{ alignItems: 'center', marginTop: '24px' }}>
                  <input type="checkbox" id="chk-active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label htmlFor="chk-active" className="station-label" style={{ marginBottom: 0 }}>Modelo visible</label>
                </div>
              </div>
            </section>

            {/* Bloque: Técnica */}
            <span className={styles.sectionTitle}>CONFIGURACIÓN TÉCNICA</span>
            <section className="station-card">
              <div className={styles.cardContent}>
                {renderField('Tipo Soporte', 'soporte',
                  <select className="station-select" value={formData.gawebConfig?.tipoSoporte} onChange={e => updateGaweb('tipoSoporte', e.target.value)}>
                    {SOPORTES_GAWEB.map(s => <option key={s.globalId} value={s.globalId}>{s.label}</option>)}
                  </select>, undefined, styles.fieldSmall)}
                
                {renderField('Formato GAWEB', 'formato',
                  <select className="station-select" value={formData.gawebConfig?.formatoCarta} onChange={e => updateGaweb('formatoCarta', e.target.value)}>
                    {filteredFormatos.map(f => <option key={f.globalId} value={f.globalId}>{f.label}</option>)}
                  </select>, undefined, styles.fieldMedium)}

                {renderField('Método de Envío', null,
                  <select className="station-select" value={formData.gawebConfig?.forzarMetodo} onChange={e => updateGaweb('forzarMetodo', e.target.value)}>
                    {METODOS_ENVIO.map(m => <option key={m.globalId} value={m.globalId}>{m.label}</option>)}
                  </select>, undefined, styles.fieldMedium)}
              </div>
            </section>

            {/* Bloque: Segmentación */}
            <span className={styles.sectionTitle}>SEGMENTACIÓN Y HOST</span>
            <section className="station-card">
              <div className={styles.cardContent}>
                {renderField('Tipo Destinatario', null,
                  <select className="station-select" value={formData.gawebConfig?.tipoDestino} onChange={e => updateGaweb('tipoDestino', e.target.value)}>
                    {DESTINOS_GAWEB.map(d => <option key={d.globalId} value={d.globalId}>{d.label}</option>)}
                  </select>, undefined, styles.fieldSmall)}
                {renderField('Indicador Destino', null,
                  <select className="station-select" value={formData.gawebConfig?.indicadorDestino} onChange={e => updateGaweb('indicadorDestino', e.target.value)}>
                    {INDICADORES_DESTINO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>, undefined, styles.fieldSmall)}
                {renderField('Entorno Host', 'entorno',
                  <input className="station-input" value={formData.gawebConfig?.codigoEntorno} onChange={e => updateGaweb('codigoEntorno', e.target.value.toUpperCase())} />, undefined, styles.fieldMedium)}
                
                {renderField('F. Generación (Default)', 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaGeneracion} onChange={e => updateGaweb('fechaGeneracion', e.target.value)} />, undefined, styles.fieldSmall)}
                {renderField('F. Carta (Default)', 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaCarta} onChange={e => updateGaweb('fechaCarta', e.target.value)} />, undefined, styles.fieldSmall)}
              </div>
            </section>

            {/* Bloque: Opcionales */}
            <span className={styles.sectionTitle}>OPCIONALES GAWEB</span>
            <section className="station-card">
              <div className={styles.cardContent}>
                {renderField('Idioma (ISO)', 'idioma',
                  <select className="station-select" value={formData.gawebConfig?.idioma} onChange={e => updateGaweb('idioma', e.target.value)}>
                    {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>, undefined, styles.fieldSmall)}
                {renderField('Vía Reparto', 'viaReparto',
                  <select className="station-select" value={formData.gawebConfig?.viaReparto} onChange={e => updateGaweb('viaReparto', e.target.value)}>
                    {VIAS_REPARTO.map(v => <option key={v.globalId} value={v.globalId}>{v.label}</option>)}
                  </select>, undefined, styles.fieldSmall)}
                {renderField('Cód. Doc', 'codDoc',
                  <input className="station-input" maxLength={6} value={formData.gawebConfig?.codigoDocumento} onChange={e => updateGaweb('codigoDocumento', e.target.value.toUpperCase())} />, 'codDoc', styles.fieldSmall)}
                {renderField('Oficina', 'oficina',
                  <input className="station-input" maxLength={5} value={formData.gawebConfig?.oficina} onChange={e => updateGaweb('oficina', e.target.value)} />, 'oficina', styles.fieldSmall)}
                {renderField('Páginas', 'paginas',
                  <input className="station-input" value={formData.gawebConfig?.paginasDefecto} onChange={e => updateGaweb('paginasDefecto', Number(e.target.value))} />, undefined, styles.fieldSmall)}
              </div>
            </section>

          </div>

          <footer className={styles.footer}>
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

      {/* Ayuda Técnica Contextual */}
      {helpTopic && (
        <div className="station-modal-overlay" style={{ zIndex: 6000 }} onClick={() => setHelpTopic(null)}>
           <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
              <header style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>AYUDA / {helpTopic.title}</span>
                 <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setHelpTopic(null)}><XIcon size={18} /></button>
              </header>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                 {helpTopic.content}
              </div>
              <button className="station-btn station-btn-primary" style={{ marginTop: '24px', width: '100%' }} onClick={() => setHelpTopic(null)}>ENTENDIDO</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default LetterPresetEditor;
