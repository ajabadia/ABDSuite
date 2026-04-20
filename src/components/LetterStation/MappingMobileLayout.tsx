'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  EditIcon,
  ChevronRightIcon,
  SearchIcon,
  TrashIcon
} from '@/components/common/Icons';
import { clsx } from '@/lib/utils/clsx';

interface MappingMobileLayoutProps {
  mapping: any;
  dataFileFields: string[];
  onUpdateMapping: (templateVar: string, sourceField: string) => void;
  onClearMapping: (templateVar: string) => void;
}

/**
 * Mobile-First Master/Detail Mapping UI (Phase 15)
 */
export const MappingMobileLayout: React.FC<MappingMobileLayoutProps> = ({
  mapping,
  dataFileFields,
  onUpdateMapping,
  onClearMapping
}) => {
  const { t } = useLanguage();
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const filteredVars = useMemo(() => {
    return mapping.mappings.filter((m: any) => {
      const matchesSearch = m.templateVar.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPending = onlyPending ? !m.sourceField : true;
      return matchesSearch && matchesPending;
    });
  }, [mapping.mappings, searchTerm, onlyPending]);

  const selectedMappingItem = mapping.mappings.find((m: any) => m.templateVar === selectedVar);

  return (
    <div className="mobile-mapping-container flex-col" style={{ height: '100%', gap: '16px' }}>
      
      {/* TOOLBAR */}
      <div className="flex-col" style={{ gap: '12px' }}>
         <div className="flex-row" style={{ gap: '8px' }}>
            <div className="search-box flex-row" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0 12px', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
               <SearchIcon size={14} style={{ opacity: 0.5 }} />
               <input 
                 className="station-input" 
                 style={{ border: 'none', background: 'transparent', width: '100%' }}
                 placeholder="BUSCAR VARIABLE..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <button 
              className={clsx('station-btn', { active: onlyPending })}
              style={{ fontSize: '10px', height: '40px' }}
              onClick={() => setOnlyPending(!onlyPending)}
            >
              {onlyPending ? 'MOSTRAR TODO' : 'SOLO PENDIENTES'}
            </button>
         </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '16px', minHeight: 0 }}>
        
        {/* MASTER LIST */}
        <div className="master-list flex-col" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflowY: 'auto' }}>
           {filteredVars.map((m: any) => (
             <div 
               key={m.templateVar} 
               className={clsx('mapping-mobile-item flex-row', { active: selectedVar === m.templateVar })}
               onClick={() => setSelectedVar(m.templateVar)}
               style={{
                 padding: '16px',
                 borderBottom: '1px solid rgba(255,255,255,0.05)',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 cursor: 'pointer',
                 background: selectedVar === m.templateVar ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent'
               }}
             >
               <div className="flex-col" style={{ gap: '4px' }}>
                  <div className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
                    {m.sourceField ? <CheckCircleIcon size={14} color="var(--status-ok)" /> : <AlertTriangleIcon size={14} color="var(--status-err)" />}
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{m.templateVar}</span>
                  </div>
                  <span style={{ fontSize: '11px', opacity: 0.4 }}>
                    {m.sourceField || 'SIN_VINCULACIÓN'}
                  </span>
               </div>
               <ChevronRightIcon size={16} style={{ opacity: 0.3 }} />
             </div>
           ))}
        </div>

        {/* DETAIL PANEL (Only visible if something selected or narrow layout allows) */}
        {selectedVar && (
           <div className="detail-panel flex-col animate-slide-in-right" style={{ width: '350px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '24px', gap: '20px' }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                 <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary-color)' }}>VARIABLE DESTINO</span>
                 <h3 style={{ margin: 0 }}>{selectedVar}</h3>
              </div>

              <div className="flex-col" style={{ gap: '8px' }}>
                 <label className="station-label">ORIGEN DE DATOS (CSV/GAWEB)</label>
                 <select 
                   className="station-select" 
                   value={selectedMappingItem?.sourceField || ''} 
                   onChange={e => onUpdateMapping(selectedVar, e.target.value)}
                   style={{ width: '100%', height: '48px' }}
                 >
                    <option value="">-- SELECCIONE CAMPO --</option>
                    <optgroup label="CAMPOS GAWEB CANÓNICOS">
                       <option value="DOC_CODE">DOC_CODE (CÓDIGO)</option>
                       <option value="LOTE">LOTE (ID)</option>
                       <option value="FECHA_CARTA">FECHA_CARTA (ISO)</option>
                    </optgroup>
                    <optgroup label="CAMPOS DETECTADOS EN CSV">
                       {dataFileFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </optgroup>
                 </select>
              </div>

              <div className="flex-row" style={{ marginTop: 'auto', gap: '12px' }}>
                 <button className="station-btn err flex-row" style={{ flex: 1, gap: '8px' }} onClick={() => onClearMapping(selectedVar)}>
                    <TrashIcon size={14} /> LIMPIAR
                 </button>
                 <button className="station-btn icon-only" onClick={() => setSelectedVar(null)}>X</button>
              </div>
           </div>
        )}
      </div>

      <style jsx>{`
        .animate-slide-in-right {
           animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .mapping-mobile-item:hover {
          background: rgba(255,255,255,0.02) !important;
        }
        .mapping-mobile-item.active {
          border-left: 4px solid var(--primary-color);
        }
      `}</style>
    </div>
  );
};
