'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
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
} from '@/lib/constants/letter.constants';
import { HelpIcon, SaveIcon, XIcon, AlertTriangleIcon } from '@/components/common/Icons';

interface PresetEditorModalProps {
  preset: EtlPreset | null;
  onSave: (p: EtlPreset) => void;
  onClose: () => void;
}

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

const PresetEditorModal: React.FC<PresetEditorModalProps> = ({ preset, onSave, onClose }) => {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<EtlPreset>(preset || {
    name: '',
    version: '1.0',
    description: '',
    chunkSize: 1000,
    encoding: 'utf-8',
    recordTypeStart: 0,
    recordTypeLen: 2,
    defaultRecordType: 'DATA',
    headerTypeId: 'H',
    recordTypes: [],
    isActive: true,
    gawebConfig: DEFAULT_CONFIG,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [helpTopic, setHelpTopic] = useState<{title: string, content: string} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateGaweb = (field: keyof GawebConfig, value: any) => {
    setFormData({
      ...formData,
      gawebConfig: {
        ...(formData.gawebConfig || DEFAULT_CONFIG),
        [field]: value
      }
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const config = formData.gawebConfig || DEFAULT_CONFIG;
    
    if (!formData.name) newErrors.name = 'Nombre requerido';
    if (config.codigoDocumento.length !== 6) newErrors.codDoc = 'Exacto 6 caracteres';
    if (config.oficina.length !== 5) newErrors.oficina = 'Exacto 5 caracteres';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const currentSoporte = formData.gawebConfig?.tipoSoporte || 'PDF';
  const filteredFormatos = FORMATOS_GAWEB.filter(f => f.extra === currentSoporte);

  const renderField = (label: string, helpKey: string | null, children: React.ReactNode, errorKey?: string) => (
    <div className="station-form-field">
      <div className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
        <label className="station-label">{label}</label>
        {helpKey && (
          <button 
            type="button"
            className="station-help-btn"
            onClick={() => setHelpTopic({ title: label, content: t(`letter.help.${helpKey}`) })}
          >
            ?
          </button>
        )}
      </div>
      {children}
      {errorKey && errors[errorKey] && (
        <span className="txt-err" style={{ fontSize: '0.7rem', fontWeight: 900 }}>{errors[errorKey].toUpperCase()}</span>
      )}
    </div>
  );

  return (
    <div className="station-modal-overlay" onClick={onClose}>
      <div 
        className="station-modal" 
        style={{ maxWidth: '900px' }}
        onClick={e => e.stopPropagation()}
      >
        <header className="station-modal-header">
          <h2 className="station-registry-item-name" style={{ fontSize: '1rem' }}>{t('letter.config_title')}</h2>
          <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <div className="station-modal-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div className="flex-col" style={{ gap: '20px' }}>
            <span className="station-form-section-title">IDENTIFICACIÓN</span>
            <section className="station-card flex-col" style={{ gap: '16px' }}>
              {renderField('Nombre del Preset', null, 
                <input 
                  className="station-input" 
                  value={formData.name} 
                  placeholder="Ej: CARTAS_ORDINARIAS"
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />, 'name')}
              {renderField('Descripción', null,
                <input 
                  className="station-input" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />)}
              <div className="station-checkbox-group" style={{ marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  id="chk-active"
                  className="station-checkbox"
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                />
                <label htmlFor="chk-active" className="station-label" style={{ margin: 0, cursor: 'pointer' }}>Visible para los operadores</label>
              </div>
            </section>

            <span className="station-form-section-title" style={{ marginTop: '12px' }}>CONFIGURACIÓN TÉCNICA</span>
            <section className="station-card flex-col" style={{ gap: '16px' }}>
              {renderField('Tipo Soporte', null,
                <select className="station-select" value={formData.gawebConfig?.tipoSoporte} onChange={e => updateGaweb('tipoSoporte', e.target.value)}>
                  {SOPORTES_GAWEB.map(s => <option key={s.globalId} value={s.globalId}>{s.label}</option>)}
                </select>)}
              
              {renderField('Formato GAWEB', 'formato',
                <select className="station-select" value={formData.gawebConfig?.formatoCarta} onChange={e => updateGaweb('formatoCarta', e.target.value)}>
                  {filteredFormatos.map(f => <option key={f.globalId} value={f.globalId}>{f.label}</option>)}
                </select>)}

              {renderField('Método de Envío', null,
                <select className="station-select" value={formData.gawebConfig?.forzarMetodo} onChange={e => updateGaweb('forzarMetodo', e.target.value)}>
                  {METODOS_ENVIO.map(m => <option key={m.globalId} value={m.globalId}>{m.label}</option>)}
                </select>)}
            </section>
          </div>

          <div className="flex-col" style={{ gap: '20px' }}>
            <span className="station-form-section-title">SEGMENTACIÓN Y HOST</span>
            <section className="station-card flex-col" style={{ gap: '16px' }}>
              <div className="station-form-grid">
                {renderField('Tipo Destinatario', null,
                  <select className="station-select" value={formData.gawebConfig?.tipoDestino} onChange={e => updateGaweb('tipoDestino', e.target.value)}>
                    {DESTINOS_GAWEB.map(d => <option key={d.globalId} value={d.globalId}>{d.label}</option>)}
                  </select>)}
                {renderField('Indicador Destino', null,
                  <select className="station-select" value={formData.gawebConfig?.indicadorDestino} onChange={e => updateGaweb('indicadorDestino', e.target.value)}>
                    {INDICADORES_DESTINO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>)}
              </div>
              
              {renderField('Entorno Host', 'entorno',
                <input className="station-input" value={formData.gawebConfig?.codigoEntorno} onChange={e => updateGaweb('codigoEntorno', e.target.value)} />)}
              
              <div className="station-form-grid">
                {renderField('F. Generación (Default)', 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaGeneracion} onChange={e => updateGaweb('fechaGeneracion', e.target.value.replace(/\D/g, ''))} />)}
                {renderField('F. Carta (Default)', 'fechas',
                  <input className="station-input" value={formData.gawebConfig?.fechaCarta} onChange={e => updateGaweb('fechaCarta', e.target.value.replace(/\D/g, ''))} />)}
              </div>
            </section>

            <span className="station-form-section-title" style={{ marginTop: '12px' }}>OPCIONALES GAWEB</span>
            <section className="station-card flex-col" style={{ gap: '16px' }}>
              <div className="station-form-grid">
                {renderField('Idioma (ISO)', 'idioma',
                  <select className="station-select" value={formData.gawebConfig?.idioma} onChange={e => updateGaweb('idioma', e.target.value)}>
                    {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                  </select>)}
                {renderField('Vía Reparto', 'viaReparto',
                  <select className="station-select" value={formData.gawebConfig?.viaReparto} onChange={e => updateGaweb('viaReparto', e.target.value)}>
                    {VIAS_REPARTO.map(v => <option key={v.globalId} value={v.globalId}>{v.label}</option>)}
                  </select>)}
              </div>
              
              <div className="station-form-grid">
                 {renderField('Cód. Doc', 'codDoc',
                   <input className="station-input" maxLength={6} value={formData.gawebConfig?.codigoDocumento} onChange={e => updateGaweb('codigoDocumento', e.target.value.toUpperCase())} />, 'codDoc')}
                 {renderField('Oficina', 'oficina',
                   <input className="station-input" maxLength={5} value={formData.gawebConfig?.oficina} onChange={e => updateGaweb('oficina', e.target.value.replace(/\D/g, ''))} />, 'oficina')}
                 {renderField('Páginas', 'paginas',
                   <input className="station-input" type="number" value={formData.gawebConfig?.paginasDefecto} onChange={e => updateGaweb('paginasDefecto', Number(e.target.value))} />)}
              </div>
            </section>
          </div>

        </div>

        <footer className="station-modal-footer">
          <button className="station-btn" onClick={onClose}>Cancelar</button>
          <button className="station-btn station-btn-primary" onClick={() => validate() && onSave(formData)}>
            <SaveIcon size={16} /> GUARDAR CONFIGURACIÓN
          </button>
        </footer>

        {helpTopic && (
          <div className="station-modal-overlay" style={{ zIndex: 6000 }} onClick={() => setHelpTopic(null)}>
             <div className="station-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                <header style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>AYUDA / {helpTopic.title}</span>
                   <button className="station-btn" style={{ border: 'none', padding: '4px' }} onClick={() => setHelpTopic(null)}>X</button>
                </header>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.5' }}>
                   {helpTopic.content}
                </div>
                <button 
                  className="station-btn station-btn-primary" 
                  style={{ marginTop: '24px', width: '100%' }} 
                  onClick={() => setHelpTopic(null)}
                >
                  Entendido
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetEditorModal;
