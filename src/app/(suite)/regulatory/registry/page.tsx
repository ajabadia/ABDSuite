'use client';

import React, { useState, useMemo } from 'react';
import { COUNTRIES_MASTER, CountryMetadata } from '@/data/countries_master';
import { FlagResolver } from '@/components/ui/FlagResolver';
import { 
  SearchIcon, 
  ShieldCheckIcon, 
  GlobeIcon, 
  ExternalLinkIcon, 
  LinkIcon, 
  XIcon, 
  InfoIcon,
  ClockIcon,
  FileTextIcon,
  ZapIcon
} from '@/components/common/Icons';
import { useLanguage } from '@/lib/context/LanguageContext';
import { TIN_INFO_MAP, REQUIREMENTS_MAP } from '@/lib/regulatory/plugins';
import { TIN_NAMES } from '@/lib/regulatory/plugins/i18n';

/**
 * Global Jurisdictional Registry - Era 6 Industrial
 */
export default function RegulatoryRegistryPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryMetadata | null>(null);

  const filteredCountries = useMemo(() => {
    const term = search.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!term) return COUNTRIES_MASTER;
    return COUNTRIES_MASTER.filter(c => {
      const nameNorm = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const idNorm = c.id.toLowerCase();
      return nameNorm.includes(term) || idNorm.includes(term);
    });
  }, [search]);

  const stats = useMemo(() => {
    const total = COUNTRIES_MASTER.length;
    const covered = COUNTRIES_MASTER.filter(c => c.hasPlugin).length;
    const official = COUNTRIES_MASTER.filter(c => c.hasPlugin && c.isOfficial !== false).length;
    return { total, covered, official, percent: Math.round((covered / total) * 100) };
  }, []);

  // Modal Data Resolvers
  const pluginInfo = selectedCountry ? TIN_INFO_MAP[selectedCountry.id] || TIN_INFO_MAP[selectedCountry.sharedFrom || ''] : null;
  const tinName = selectedCountry ? TIN_NAMES[selectedCountry.id] || TIN_NAMES[selectedCountry.sharedFrom || ''] : null;
  const requirements = selectedCountry ? REQUIREMENTS_MAP[selectedCountry.id] || REQUIREMENTS_MAP[selectedCountry.sharedFrom || ''] : [];

  return (
    <div className="station-main registry-page fade-in">
      <header className="registry-header flex-row flex-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
        <div className="flex-col" style={{ gap: '4px' }}>
          <h1 className="station-title-main flex-row" style={{ gap: '12px', fontSize: '1.5rem' }}>
            <GlobeIcon size={24} style={{ color: 'var(--primary-color)' }} />
            REGISTRO JURISDICCIONAL GLOBAL
          </h1>
          <p className="station-registry-item-meta">
            CATÁLOGO MAESTRO DE PAÍSES Y COBERTURA DE VALIDACIÓN ALGORÍTMICA.
          </p>
        </div>

        <div className="flex-row registry-stats-container" style={{ gap: '32px' }}>
          <div className="flex-row registry-stats-group" style={{ gap: '24px' }}>
             <div className="flex-col registry-stat-item" style={{ alignItems: 'flex-end' }}>
               <div className="station-label">COBERTURA TOTAL</div>
               <div className="flex-row" style={{ gap: '8px', fontFamily: 'var(--font-mono)' }}>
                 <span className="station-title-main" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>{stats.covered}</span>
                 <span className="station-registry-item-meta">/ {stats.total} ({stats.percent}%)</span>
               </div>
             </div>
             <div className="flex-col registry-stat-item" style={{ alignItems: 'flex-end' }}>
               <div className="station-label">OFICIALES (GOV)</div>
               <div className="flex-row" style={{ gap: '8px', fontFamily: 'var(--font-mono)' }}>
                 <span className="station-title-main" style={{ fontSize: '1.5rem', color: 'var(--status-ok)' }}>{stats.official}</span>
                 <span className="station-registry-item-meta">READY</span>
               </div>
             </div>
          </div>
          
          <div className="flex-row registry-search-wrapper" style={{ position: 'relative' }}>
            <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
            <input
              type="text"
              placeholder="BUSCAR PAÍS O ISO2..."
              className="station-input registry-search-input"
              style={{ paddingLeft: '36px', width: '280px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="station-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredCountries.map((country) => (
          <div 
            key={country.id}
            className="station-card flex-col"
            style={{ padding: '16px', position: 'relative', overflow: 'hidden', cursor: 'default' }}
          >
            {/* Background Decorator */}
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, pointerEvents: 'none' }}>
              <FlagResolver code={country.id} width={80} height={80} />
            </div>

            <div className="flex-row" style={{ gap: '16px', position: 'relative', zIndex: 1 }}>
              <div style={{ padding: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
                <FlagResolver code={country.id} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              </div>
              <div className="flex-col" style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-row flex-between">
                  <span className="station-label" style={{ marginBottom: 0 }}>{country.id}</span>
                  {country.hasPlugin && (
                    <span className={`station-badge ${country.isOfficial === false ? 'station-badge-blue' : 'success'}`} style={{ fontSize: '8px' }}>
                      <ShieldCheckIcon size={8} style={{ marginRight: '4px' }} />
                      {country.isOfficial === false ? 'UNOFFICIAL' : 'OFFICIAL'}
                    </span>
                  )}
                </div>
                <h3 className="station-title-main" style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {country.name.toUpperCase()}
                </h3>
                {country.sharedFrom && (
                  <div className="flex-row" style={{ gap: '6px', marginTop: '2px' }}>
                     <LinkIcon size={10} style={{ opacity: 0.5 }} />
                     <span className="station-registry-item-meta" style={{ fontSize: '0.65rem', color: 'var(--primary-color)', opacity: 0.8 }}>
                        SIGUE A
                     </span>
                     <FlagResolver code={country.sharedFrom} style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
                     <span className="station-registry-item-meta" style={{ fontSize: '0.65rem', fontWeight: 800 }}>{country.sharedFrom}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-row flex-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)', opacity: 0.5 }}>
              <span className="station-registry-item-meta" style={{ fontSize: '0.6rem' }}>
                 {country.sharedFrom ? 'VALIDACIÓN HEREDADA' : 'ISO ALPHA-2 STANDARD'}
              </span>
              <button 
                onClick={() => setSelectedCountry(country)}
                className="station-btn tiny secondary" 
                style={{ padding: '2px 6px', fontSize: '0.6rem' }}
              >
                DETALLES <ExternalLinkIcon size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedCountry && (
        <div 
          className="station-modal-overlay fade-in" 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}
          onClick={() => setSelectedCountry(null)}
        >
          <div 
            className="station-card registry-modal slide-up" 
            style={{ 
              width: '100%', maxWidth: '540px', padding: '32px', position: 'relative',
              background: '#0a0c10', border: '1px solid var(--primary-color)',
              boxShadow: '0 0 50px rgba(56, 189, 248, 0.15), 0 20px 40px rgba(0,0,0,0.6)',
              maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="station-btn tiny secondary" 
              style={{ 
                position: 'absolute', right: '20px', top: '20px', borderRadius: '50%', 
                width: '32px', height: '32px', padding: 0, border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onClick={() => setSelectedCountry(null)}
            >
              <XIcon size={16} />
            </button>

            <header className="registry-modal-header flex-row mb-8" style={{ gap: '24px', alignItems: 'flex-start' }}>
              <div className="registry-modal-flag-box" style={{ padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FlagResolver code={selectedCountry.id} style={{ width: '72px', height: '72px', borderRadius: '8px' }} />
              </div>
              <div className="flex-col" style={{ flex: 1 }}>
                <div className="station-label" style={{ marginBottom: '4px', letterSpacing: '0.1rem' }}>JURISDICCIÓN {selectedCountry.id}</div>
                <h2 className="station-title-main registry-modal-title" style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>{selectedCountry.name.toUpperCase()}</h2>
                {selectedCountry.sharedFrom && (
                  <div className="flex-row mt-1" style={{ gap: '6px' }}>
                    <LinkIcon size={12} style={{ color: 'var(--primary-color)' }} />
                    <span className="station-registry-item-meta" style={{ color: 'var(--primary-color)', opacity: 1, fontSize: '0.7rem' }}>
                      VALIDACIÓN HEREDADA DE: {selectedCountry.sharedFrom}
                    </span>
                  </div>
                )}
              </div>
            </header>

            <div className="flex-col" style={{ gap: '24px' }}>
              {/* Technical Status Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="flex-col p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                   <div className="station-label" style={{ fontSize: '0.6rem' }}>MOTOR REGTECH</div>
                   <div className="flex-row" style={{ gap: '8px', marginTop: '4px' }}>
                      <ShieldCheckIcon size={14} style={{ color: selectedCountry.hasPlugin ? 'var(--status-ok)' : '#666' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedCountry.hasPlugin ? '#fff' : '#666' }}>
                         {selectedCountry.hasPlugin ? 'ACTIVE_READY' : 'GENERIC_FALLBACK'}
                      </span>
                   </div>
                </div>
                <div className="flex-col p-4" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                   <div className="station-label" style={{ fontSize: '0.6rem' }}>NIVEL DE CONFIANZA</div>
                   <div style={{ marginTop: '4px' }}>
                      <span className={`station-badge ${selectedCountry.isOfficial === false ? 'station-badge-blue' : 'success'}`} style={{ fontSize: '0.65rem', padding: '2px 10px' }}>
                         {selectedCountry.isOfficial === false ? 'RESEARCH' : 'GOVERNMENTAL'}
                      </span>
                   </div>
                </div>
              </div>

              {/* Plugin Details */}
              {pluginInfo ? (
                <div className="flex-col" style={{ gap: '20px' }}>
                  <div className="flex-col" style={{ gap: '8px' }}>
                    <div className="station-label flex-row" style={{ gap: '8px', color: 'var(--primary-color)' }}>
                      <ZapIcon size={14} /> IDENTIFICADOR FISCAL (TIN)
                    </div>
                    <div className="station-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div className="flex-row flex-between mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700 }}>NOMBRE LOCAL:</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.9rem' }}>
                             {tinName?.es || tinName?.en || 'TIN / TAX ID'}
                          </span>
                       </div>
                       <div className="flex-row flex-between">
                          <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700 }}>EJEMPLO FORMATO:</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.05rem' }}>
                             {pluginInfo.placeholder}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="flex-col" style={{ gap: '8px' }}>
                    <div className="station-label flex-row" style={{ gap: '8px' }}>
                      <InfoIcon size={14} /> DESCRIPCIÓN TÉCNICA DEL PLUGIN
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', margin: 0 }}>
                      {pluginInfo.description}
                    </p>
                  </div>

                  <div className="flex-col" style={{ gap: '8px' }}>
                    <div className="station-label flex-row" style={{ gap: '8px' }}>
                      <FileTextIcon size={14} /> CAMPOS BIOGRÁFICOS REQUERIDOS
                    </div>
                    <div className="flex-row flex-wrap" style={{ gap: '10px' }}>
                       {requirements.length > 0 ? requirements.map((r: any) => (
                         <span key={r.key} style={{ 
                            background: 'rgba(56, 189, 248, 0.08)', 
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            color: 'var(--primary-color)',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '2px'
                          }}>
                            {r.key.toUpperCase()}
                         </span>
                       )) : (
                         <span style={{ fontSize: '0.75rem', opacity: 0.4, fontStyle: 'italic' }}>
                            SIN REQUISITOS ADICIONALES (SOLO FORMATO ESTRUCTURAL)
                         </span>
                       )}
                    </div>
                  </div>

                  <footer className="flex-row flex-between pt-6 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex-row" style={{ gap: '8px', opacity: 0.4 }}>
                       <ClockIcon size={14} />
                       <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>VERSIÓN: {pluginInfo.lastUpdated}</span>
                    </div>
                    <div className="flex-row" style={{ gap: '8px', opacity: 0.4 }}>
                       <GlobeIcon size={14} />
                       <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>SINC: {pluginInfo.source}</span>
                    </div>
                  </footer>
                </div>
              ) : (
                <div className="flex-col flex-center p-8" style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '4px', textAlign: 'center' }}>
                   <InfoIcon size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                   <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '300px' }}>
                      ESTA JURISDICCIÓN NO CUENTA CON UN PLUGIN DE VALIDACIÓN ESPECÍFICO.
                      SE APLICARÁ VALIDACIÓN GENÉRICA.
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredCountries.length === 0 && (
        <div className="station-empty-state flex-col">
          <GlobeIcon size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
          <p>NO SE ENCONTRARON PAÍSES QUE COINCIDAN CON LA BÚSQUEDA.</p>
        </div>
      )}

      <style jsx>{`
        .station-grid {
          margin-bottom: 40px;
        }
        .station-card:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .station-badge-blue {
          background: rgba(0, 150, 255, 0.1);
          color: #0096ff;
          border: 1px solid rgba(0, 150, 255, 0.2);
        }

        @media (max-width: 1024px) {
           .registry-header {
             flex-direction: column;
             align-items: flex-start !important;
             gap: 24px;
           }
           .registry-stats-container {
             width: 100%;
             justify-content: space-between;
           }
        }

        @media (max-width: 768px) {
           .registry-stats-container {
             flex-direction: column;
             gap: 20px !important;
           }
           .registry-stats-group {
             width: 100%;
             justify-content: space-between;
           }
           .registry-search-wrapper {
             width: 100%;
           }
           .registry-search-input {
             width: 100% !important;
           }
           .registry-modal {
             padding: 24px !important;
             margin: 0;
           }
           .registry-modal-header {
             flex-direction: column;
             align-items: center;
             text-align: center;
             gap: 16px !important;
           }
           .registry-modal-title {
             font-size: 1.3rem !important;
           }
        }
      `}</style>
    </div>
  );
}
