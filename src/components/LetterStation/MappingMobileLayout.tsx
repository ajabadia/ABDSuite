'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  EditIcon,
  ChevronRightIcon,
  SearchIcon,
  TrashIcon,
  RefreshCwIcon,
  UndoIcon,
  SaveIcon,
  XIcon
} from '@/components/common/Icons';
import { clsx } from '@/lib/utils/clsx';

interface MappingMobileLayoutProps {
  mapping: any;
  templateVars: string[];
  dataFields: string[];
  gawebFields: readonly string[];
  coverageStats: {
    totalVars: number;
    mappedCount: number;
    pendingCount: number;
    coverage: number;
  };
  onUpdateMapping: (templateVar: string, sourceType: 'TEMPLATE' | 'GAWEB' | 'UI_OVERRIDE', sourceField: string) => void;
  onClearMapping: (templateVar: string) => void;
  onAutoMap?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
}

/**
 * Mobile-First Industrial Mapping UI (Version 2.0 - Rich Edition)
 */
export const MappingMobileLayout: React.FC<MappingMobileLayoutProps> = ({
  mapping,
  templateVars,
  dataFields,
  gawebFields,
  coverageStats,
  onUpdateMapping,
  onClearMapping,
  onAutoMap,
  onSave,
  onUndo
}) => {
  const { t } = useLanguage();
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'CSV' | 'GAWEB' | 'OVERRIDE'>('CSV');

  const filteredVars = useMemo(() => {
    return templateVars.filter((v: string) => {
      const map = mapping.mappings.find((m: any) => m.templateVar === v);
      const matchesSearch = v.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPending = onlyPending ? !map?.sourceField : true;
      return matchesSearch && matchesPending;
    });
  }, [templateVars, mapping.mappings, searchTerm, onlyPending]);

  const selectedMappingItem = mapping.mappings.find((m: any) => m.templateVar === selectedVar);

  const coveragePercent = Math.round(coverageStats.coverage * 100);

  return (
    <div className="mobile-mapping-container flex-col" style={{ height: '100%', gap: '16px' }}>
      
      {/* HEADER & COVERAGE */}
      <header className="flex-col" style={{ gap: '12px', background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
         <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex-col">
              <h2 className="station-title-main" style={{ margin: 0, fontSize: '1rem' }}>MAPPING_BRAIN_V2</h2>
              <span style={{ fontSize: '10px', opacity: 0.4 }}>INDUSTRIAL_MOBILE_LINKER</span>
            </div>
            <div className="flex-row" style={{ gap: '8px' }}>
               {onUndo && <button className="station-btn tiny" onClick={onUndo}><UndoIcon size={12} /></button>}
               {onSave && <button className="station-btn station-btn-primary tiny" onClick={onSave}><SaveIcon size={12} /> {t('common.save').toUpperCase()}</button>}
            </div>
         </div>
         
         <div className="flex-row" style={{ gap: '12px', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
               <div style={{ width: `${coveragePercent}%`, height: '100%', background: coveragePercent === 100 ? 'var(--status-ok)' : 'var(--primary-color)', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
              {coverageStats.mappedCount}/{coverageStats.totalVars} ({coveragePercent}%)
            </span>
         </div>
      </header>

      {/* TOOLBAR */}
      <div className="flex-row" style={{ gap: '8px' }}>
          <div className="search-box flex-row" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0 12px', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
              <SearchIcon size={14} style={{ opacity: 0.5 }} />
              <input 
                className="station-input" 
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem' }}
                placeholder="BUSCAR VARIABLE..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <button 
            className={clsx('station-btn', { active: onlyPending })}
            style={{ fontSize: '10px', height: '40px', padding: '0 12px' }}
            onClick={() => setOnlyPending(!onlyPending)}
          >
            {onlyPending ? 'MOSTRAR TODO' : 'PENDIENTES'}
          </button>
          {onAutoMap && (
            <button className="station-btn icon-only" style={{ height: '40px', width: '40px' }} onClick={onAutoMap} title="Auto-Map">
              <RefreshCwIcon size={16} />
            </button>
          )}
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '16px', minHeight: 0 }}>
        
        {/* MASTER LIST */}
        <div className="master-list flex-col" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflowY: 'auto' }}>
           {filteredVars.map((v: string) => {
             const m = mapping.mappings.find((mi: any) => mi.templateVar === v);
             return (
              <div 
                key={v} 
                className={clsx('mapping-mobile-item flex-row', { active: selectedVar === v })}
                onClick={() => setSelectedVar(v)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: selectedVar === v ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent'
                }}
              >
                <div className="flex-col" style={{ gap: '4px' }}>
                   <div className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
                     {m?.sourceField ? <CheckCircleIcon size={14} color="var(--status-ok)" /> : <AlertTriangleIcon size={14} color="var(--status-err)" />}
                     <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{v}</span>
                   </div>
                   <span style={{ fontSize: '10px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                     {m?.sourceField ? `[${m.sourceType}] ${m.sourceField}` : 'IDLE_WAITING'}
                   </span>
                </div>
                <ChevronRightIcon size={14} style={{ opacity: 0.2 }} />
              </div>
             );
           })}
        </div>

        {/* DETAIL PANEL (2-Column simulation) */}
        {selectedVar && (
           <div className="detail-panel flex-col animate-slide-in-right" style={{ width: '400px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '24px', gap: '24px' }}>
              <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="flex-col" style={{ gap: '4px' }}>
                   <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '1px' }}>TEMPLATE_VARIABLE</span>
                   <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>{selectedVar}</h3>
                </div>
                <button className="station-btn secondary tiny" onClick={() => setSelectedVar(null)}><XIcon size={14} /></button>
              </div>

              {/* TABS PARA ORIGEN */}
              <div className="flex-row" style={{ gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px' }}>
                {(['CSV', 'GAWEB', 'OVERRIDE'] as const).map(tab => (
                  <button 
                    key={tab}
                    className={clsx('station-btn tiny', { primary: activeTab === tab })}
                    style={{ flex: 1, fontSize: '10px', height: '32px' }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-col" style={{ flex: 1, gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
                 {activeTab === 'CSV' && (
                    <div className="flex-col" style={{ gap: '8px' }}>
                       <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 800 }}>SELECT FROM DATA SOURCE:</span>
                       {dataFields.map(f => (
                         <button 
                           key={f} 
                           className={clsx('station-btn secondary small', { active: selectedMappingItem?.sourceField === f && selectedMappingItem?.sourceType === 'TEMPLATE' })}
                           style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: '44px' }}
                           onClick={() => onUpdateMapping(selectedVar, 'TEMPLATE', f)}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                 )}

                 {activeTab === 'GAWEB' && (
                    <div className="flex-col" style={{ gap: '8px' }}>
                       <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 800 }}>SELECT FROM GAWEB CANONICALS:</span>
                       {gawebFields.map(f => (
                         <button 
                           key={f} 
                           className={clsx('station-btn secondary small', { active: selectedMappingItem?.sourceField === f && selectedMappingItem?.sourceType === 'GAWEB' })}
                           style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: '44px' }}
                           onClick={() => onUpdateMapping(selectedVar, 'GAWEB', f)}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                 )}

                 {activeTab === 'OVERRIDE' && (
                   <div className="flex-col" style={{ gap: '12px' }}>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 800 }}>MANUAL OVERRIDE (UI_ONLY):</span>
                      <input 
                        className="station-input" 
                        placeholder="VALOR ESTÁTICO..."
                        value={selectedMappingItem?.sourceType === 'UI_OVERRIDE' ? selectedMappingItem.sourceField : ''}
                        onChange={e => onUpdateMapping(selectedVar, 'UI_OVERRIDE', e.target.value)}
                      />
                   </div>
                 )}
              </div>

              <div className="flex-row" style={{ gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                 <button className="station-btn err flex-row" style={{ flex: 1, gap: '8px', height: '48px' }} onClick={() => onClearMapping(selectedVar)}>
                    <TrashIcon size={14} /> {t('common.clear').toUpperCase()}
                 </button>
              </div>
           </div>
        )}
      </div>

      <style jsx>{`
        .animate-slide-in-right {
           animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .mapping-mobile-item:hover {
          background: rgba(255,255,255,0.02) !important;
        }
        .mapping-mobile-item.active {
          border-left: 3px solid var(--primary-color);
        }
        .station-btn.active {
          background: var(--primary-color);
          color: #000;
        }
      `}</style>
    </div>
  );
};
