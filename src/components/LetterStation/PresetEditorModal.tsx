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
  GAWEB_HELP
} from '@/lib/constants/letter.constants';
import { HelpIcon, SaveIcon, XIcon } from '@/components/common/Icons';

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
  codigoEntorno: '11111111',
  codigoDocumento: 'X00000',
  fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  fechaCarta: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  oficina: '00000',
  paginasDefecto: 1,
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
    if (!formData.name) newErrors.name = 'Requerido';
    if (config.codigoDocumento.length !== 6) newErrors.codDoc = 'Exacto 6 chars';
    if (config.oficina.length !== 5) newErrors.oficina = 'Exacto 5 chars';
    if (config.codigoEntorno.length > 8) newErrors.entorno = 'Max 8 chars';
    if (config.fechaGeneracion.length !== 8) newErrors.fechas = 'Formato AAAAMMDD';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const currentSoporte = formData.gawebConfig?.tipoSoporte || 'PDF';
  const filteredFormatos = FORMATOS_GAWEB.filter(f => f.extra === currentSoporte);

  const renderField = (label: string, helpKey: string, children: React.ReactNode, errorKey?: string) => (
    <div style={{ marginBottom: '15px' }}>
      <label className="station-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {label}
        {GAWEB_HELP[helpKey] && (
          <span title={GAWEB_HELP[helpKey]} style={{ cursor: 'help', opacity: 0.6 }}>
            <HelpIcon size={12} />
          </span>
        )}
      </label>
      <div style={{ position: 'relative' }}>
        {children}
        {errorKey && errors[errorKey] && <div className="txt-err" style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: 900 }}>{errors[errorKey]}</div>}
      </div>
    </div>
  );

  return (
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ maxWidth: '900px', height: '90vh' }}>
        <header className="station-console-header" style={{ padding: '15px 30px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '1px' }}>
            PRESET_EDITOR / {formData.name || 'NEW_CONFIG'}.json
          </div>
          <button className="station-btn" style={{ padding: '5px', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>
            <XIcon size={24} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          <section className="station-card">
            <span className="station-card-title">Identificación</span>
            {renderField('Nombre del Preset:', 'nombre', 
              <input 
                className="station-input" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />, 'name')}
            {renderField('Descripción:', 'descripcion',
              <input 
                className="station-input" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />)}
            <div className="flex-row" style={{ alignItems: 'center' }}>
              <input 
                type="checkbox" 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                checked={formData.isActive} 
                onChange={e => setFormData({...formData, isActive: e.target.checked})} 
              />
              <label className="station-label" style={{ marginBottom: 0 }}>Preset Activo</label>
            </div>
          </section>

          <section className="station-card">
            <span className="station-card-title">Configuración Técnica</span>
            {renderField('Tipo Soporte GAWEB:', 'soporte',
              <select 
                className="station-select"
                value={formData.gawebConfig?.tipoSoporte}
                onChange={e => updateGaweb('tipoSoporte', e.target.value)}
              >
                {SOPORTES_GAWEB.map(s => <option key={s.globalId} value={s.globalId}>{s.label}</option>)}
              </select>)}
            
            {renderField('Formato Documento:', 'formato',
              <select 
                className="station-select"
                value={formData.gawebConfig?.formatoCarta}
                onChange={e => updateGaweb('formatoCarta', e.target.value)}
              >
                {filteredFormatos.map(f => <option key={f.globalId} value={f.globalId}>{f.label}</option>)}
              </select>)}

            {renderField('Método de Envío (HOST):', 'metodo',
              <select 
                className="station-select"
                value={formData.gawebConfig?.forzarMetodo}
                onChange={e => updateGaweb('forzarMetodo', e.target.value)}
              >
                {METODOS_ENVIO.map(m => <option key={m.globalId} value={m.globalId}>{m.label}</option>)}
              </select>)}
          </section>

          <section className="station-card">
            <span className="station-card-title">Segmentación y Destinos</span>
            {renderField('Tipo de Destinatario:', 'destinatario',
              <select 
                className="station-select"
                value={formData.gawebConfig?.tipoDestino}
                onChange={e => updateGaweb('tipoDestino', e.target.value)}
              >
                {DESTINOS_GAWEB.map(d => <option key={d.globalId} value={d.globalId}>{d.label}</option>)}
              </select>)}
            {renderField('Indicador de Destino:', 'indDestino',
              <select 
                className="station-select"
                value={formData.gawebConfig?.indicadorDestino}
                onChange={e => updateGaweb('indicadorDestino', e.target.value)}
              >
                {INDICADORES_DESTINO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
              </select>)}
            
            <div className="grid-2">
              {renderField('G-Fecha:', 'fechas',
                <input 
                  className="station-input" 
                  value={formData.gawebConfig?.fechaGeneracion}
                  onChange={e => updateGaweb('fechaGeneracion', e.target.value)}
                />, 'fechas')}
              {renderField('C-Fecha:', 'fechas',
                <input 
                  className="station-input" 
                  value={formData.gawebConfig?.fechaCarta}
                  onChange={e => updateGaweb('fechaCarta', e.target.value)}
                />)}
            </div>
          </section>

          <section className="station-card">
            <span className="station-card-title">Valores por Defecto</span>
            {renderField('Código de Entorno (HOST):', 'entorno',
              <input 
                className="station-input" 
                value={formData.gawebConfig?.codigoEntorno}
                onChange={e => updateGaweb('codigoEntorno', e.target.value)}
              />, 'entorno')}
            <div className="grid-2">
               {renderField('Cod. Doc:', 'codDoc',
                 <input 
                   className="station-input" 
                   value={formData.gawebConfig?.codigoDocumento}
                   onChange={e => updateGaweb('codigoDocumento', e.target.value.toUpperCase())}
                 />, 'codDoc')}
               {renderField('Oficina:', 'oficina',
                 <input 
                   className="station-input" 
                   value={formData.gawebConfig?.oficina}
                   onChange={e => updateGaweb('oficina', e.target.value)}
                 />, 'oficina')}
            </div>
          </section>

          <section className="station-card" style={{ gridColumn: 'span 2' }}>
            <span className="station-card-title">Opciones Adicionales GAWEB</span>
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {renderField('Idioma ISO:', 'idioma',
                <select className="station-select" value={formData.gawebConfig?.idioma} onChange={e => updateGaweb('idioma', e.target.value)}>
                  {IDIOMAS_ISO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
                </select>)}
              {renderField('Vía Reparto:', 'viaReparto',
                <select className="station-select" value={formData.gawebConfig?.viaReparto} onChange={e => updateGaweb('viaReparto', e.target.value)}>
                  {VIAS_REPARTO.map(v => <option key={v.globalId} value={v.globalId}>{v.label}</option>)}
                </select>)}
              {renderField('Copia Papel:', 'copiaPapel',
                <select className="station-select" value={formData.gawebConfig?.copiaPapel} onChange={e => updateGaweb('copiaPapel', e.target.value)}>
                  {COPIAS_PAPEL.map(c => <option key={c.globalId} value={c.globalId}>{c.label}</option>)}
                </select>)}
            </div>
          </section>

        </div>

        <footer style={{ padding: '20px 30px', borderTop: 'var(--border-thick) solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
          <button className="station-btn" style={{ opacity: 0.8 }} onClick={onClose}>CANCELAR</button>
          <button className="station-btn station-btn-primary" onClick={() => validate() && onSave(formData)}>
            <SaveIcon size={16} /> GUARDAR PRESET
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PresetEditorModal;
