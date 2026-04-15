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
    
    if (!formData.name) newErrors.name = 'NOMBRE_REQUERIDO';
    
    // Strict Legacy Validations (from C# source)
    if (config.codigoDocumento.length !== 6) newErrors.codDoc = 'Exacto 6 chars';
    if (config.oficina.length !== 5) newErrors.oficina = 'Exacto 5 chars';
    if (!/^\d+$/.test(config.oficina)) newErrors.oficina = 'Debe ser numérico';
    
    if (config.codigoEntorno.length === 0) newErrors.entorno = 'Requerido';
    if (config.codigoEntorno.length > 8) newErrors.entorno = 'Máx 8 chars';
    
    if (config.fechaGeneracion.length !== 8) newErrors.fechas = 'Fto AAAAMMDD';
    if (config.fechaCarta.length !== 8) newErrors.fechas = 'Fto AAAAMMDD';
    
    if (String(config.paginasDefecto).length > 4) newErrors.paginas = 'Máx 4 chars';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const currentSoporte = formData.gawebConfig?.tipoSoporte || 'PDF';
  const filteredFormatos = FORMATOS_GAWEB.filter(f => f.extra === currentSoporte);

  const renderField = (label: string, helpKey: string | null, children: React.ReactNode, errorKey?: string) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <label className="station-label" style={{ marginBottom: 0 }}>{label}</label>
        {helpKey && (
          <button 
            type="button"
            className="station-btn" 
            style={{ padding: '2px 6px', fontSize: '0.65rem', background: '#e1e100', color: '#000', fontWeight: 900, minWidth: 'auto', boxShadow: 'none' }}
            onClick={() => setHelpTopic({ title: label, content: t(`letter.help.${helpKey}`) })}
          >
            ?
          </button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {children}
        {errorKey && errors[errorKey] && (
          <div className="txt-err" style={{ fontSize: '0.65rem', marginTop: '4px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
             <AlertTriangleIcon size={10} /> {errors[errorKey].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ maxWidth: '900px', height: '90vh', background: '#f0f0f0', border: '2px solid #000' }}>
        <header className="station-console-header" style={{ padding: '10px 20px', background: '#d4d0c8', color: '#000', borderBottom: '2px solid #000' }}>
          <div style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
            {t('letter.config_title')} - {formData.name || 'Sin Título'}
          </div>
          <button className="station-btn" style={{ padding: '2px', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>
            <XIcon size={20} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#fff' }}>
          
          <section className="station-card" style={{ background: '#f5f5f5', border: '1px solid #ccc' }}>
            <span className="station-card-title" style={{ background: '#444' }}>Identificación</span>
            {renderField('Nombre:', null, 
              <input 
                className="station-input" 
                value={formData.name} 
                placeholder="Nueva Configuración"
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />, 'name')}
            {renderField('Descripción:', null,
              <input 
                className="station-input" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />)}
            <div className="flex-row" style={{ alignItems: 'center', marginTop: '5px' }}>
              <input 
                type="checkbox" 
                id="chk-active"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={formData.isActive} 
                onChange={e => setFormData({...formData, isActive: e.target.checked})} 
              />
              <label htmlFor="chk-active" className="station-label" style={{ marginBottom: 0, marginLeft: '8px', cursor: 'pointer' }}>Activo (Visible)</label>
            </div>
          </section>

          <section className="station-card" style={{ background: '#f5f5f5', border: '1px solid #ccc' }}>
            <span className="station-card-title" style={{ background: '#444' }}>Configuración Técnica</span>
            {renderField('Tipo Soporte:', null,
              <select className="station-select" value={formData.gawebConfig?.tipoSoporte} onChange={e => updateGaweb('tipoSoporte', e.target.value)}>
                {SOPORTES_GAWEB.map(s => <option key={s.globalId} value={s.globalId}>{s.label}</option>)}
              </select>)}
            
            {renderField('Tamaño/Formato:', 'formato',
              <select className="station-select" value={formData.gawebConfig?.formatoCarta} onChange={e => updateGaweb('formatoCarta', e.target.value)}>
                {filteredFormatos.map(f => <option key={f.globalId} value={f.globalId}>{f.label}</option>)}
              </select>)}

            {renderField('Método Envío:', null,
              <select className="station-select" value={formData.gawebConfig?.forzarMetodo} onChange={e => updateGaweb('forzarMetodo', e.target.value)}>
                {METODOS_ENVIO.map(m => <option key={m.globalId} value={m.globalId}>{m.label}</option>)}
              </select>)}
          </section>

          <section className="station-card" style={{ background: '#f5f5f5', border: '1px solid #ccc' }}>
            <span className="station-card-title" style={{ background: '#444' }}>Segmentación y Fechas</span>
            {renderField('Tipo Destinatario:', null,
              <select className="station-select" value={formData.gawebConfig?.tipoDestino} onChange={e => updateGaweb('tipoDestino', e.target.value)}>
                {DESTINOS_GAWEB.map(d => <option key={d.globalId} value={d.globalId}>{d.label}</option>)}
              </select>)}
            {renderField('Indicador Destino:', null,
              <select className="station-select" value={formData.gawebConfig?.indicadorDestino} onChange={e => updateGaweb('indicadorDestino', e.target.value)}>
                {INDICADORES_DESTINO.map(i => <option key={i.globalId} value={i.globalId}>{i.label}</option>)}
              </select>)}
            
            <div className="grid-2" style={{ gap: '10px' }}>
              {renderField('Fecha Generación:', 'fechas',
                <input className="station-input" value={formData.gawebConfig?.fechaGeneracion} onChange={e => updateGaweb('fechaGeneracion', e.target.value.replace(/\D/g, ''))} />, 'fechas')}
              {renderField('Fecha Carta:', 'fechas',
                <input className="station-input" value={formData.gawebConfig?.fechaCarta} onChange={e => updateGaweb('fechaCarta', e.target.value.replace(/\D/g, ''))} />)}
            </div>
          </section>

          <section className="station-card" style={{ background: '#f5f5f5', border: '1px solid #ccc' }}>
            <span className="station-card-title" style={{ background: '#444' }}>Configuración HOST</span>
            {renderField('Código Entorno:', 'entorno',
              <input className="station-input" value={formData.gawebConfig?.codigoEntorno} onChange={e => updateGaweb('codigoEntorno', e.target.value)} />, 'entorno')}
          </section>

          <section className="station-card" style={{ gridColumn: 'span 2', background: '#f5f5f5', border: '1px solid #ccc' }}>
            <span className="station-card-title" style={{ background: '#444' }}>Campos Opcionales GAWEB</span>
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              {renderField('Idioma (ISO):', 'idioma',
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

          <section className="station-card" style={{ gridColumn: 'span 2', background: '#e9e9e9', border: '1px solid #999 shadow-inset' }}>
            <span className="station-card-title" style={{ background: '#666' }}>Valores por Defecto</span>
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
               {renderField('Cod Documento:', 'codDoc',
                 <input className="station-input" maxLength={6} value={formData.gawebConfig?.codigoDocumento} onChange={e => updateGaweb('codigoDocumento', e.target.value.toUpperCase())} />, 'codDoc')}
               {renderField('Cod Oficina:', 'oficina',
                 <input className="station-input" maxLength={5} value={formData.gawebConfig?.oficina} onChange={e => updateGaweb('oficina', e.target.value.replace(/\D/g, ''))} />, 'oficina')}
               {renderField('Nº Páginas:', 'paginas',
                 <input className="station-input" maxLength={4} value={formData.gawebConfig?.paginasDefecto} onChange={e => updateGaweb('paginasDefecto', Number(e.target.value.replace(/\D/g, '')))} />, 'paginas')}
            </div>
          </section>

        </div>

        <footer style={{ padding: '15px 25px', borderTop: '2px solid #000', background: '#d4d0c8', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button className="station-btn" style={{ background: '#d4d0c8', border: '1px solid #444' }} onClick={onClose}>Cancelar</button>
          <button className="station-btn station-btn-primary" style={{ padding: '8px 25px' }} onClick={() => validate() && onSave(formData)}>
            <SaveIcon size={16} /> GUARDAR CONFIGURACIÓN
          </button>
        </footer>

        {helpTopic && (
          <div className="station-modal-overlay" style={{ zIndex: 300 }} onClick={() => setHelpTopic(null)}>
             <div className="station-modal" style={{ maxWidth: '400px', background: '#ffffee', border: '2px solid #880', boxShadow: '5px 5px 0px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                <header style={{ padding: '8px 15px', background: '#e1e100', color: '#000', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span>AYUDA / {helpTopic.title.toUpperCase()}</span>
                   <button onClick={() => setHelpTopic(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900 }}>X</button>
                </header>
                <div style={{ padding: '20px', whiteSpace: 'pre-line', fontSize: '0.8rem', color: '#330', lineHeight: '1.4' }}>
                   {helpTopic.content}
                </div>
                <div style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
                   <button className="station-btn" onClick={() => setHelpTopic(null)} style={{ background: '#e1e100', border: '1px solid #000', color: '#000' }}>CERRAR</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetEditorModal;
