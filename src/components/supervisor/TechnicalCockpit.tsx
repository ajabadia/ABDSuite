'use client';

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useTelemetryConfig } from '@/lib/context/TelemetryContext';
import { computeMappingHealth } from '@/lib/utils/letter-mapping-health';
import { 
  ShieldCheckIcon, 
  MapIcon, 
  ActivityIcon, 
  LockIcon, 
  AwardIcon,
  UnlockIcon,
  AlertTriangleIcon
} from '@/components/common/Icons';

export const TechnicalCockpit: React.FC = () => {
  const { t } = useLanguage();
  const { installationKey, currentOperator } = useWorkspace();
  const { config: telemetryConfig } = useTelemetryConfig();
  const mappingThreshold = telemetryConfig?.security?.mappingThresholds?.minCoverage ?? 1.0;

  const handleSeedProfiles = async () => {
    const profileX12345: any = {
      id: 'gaweb-golden-X12345-04-v1',
      name: 'GAWEB v1.3 · PDF A4 ventana izquierda · X12345',
      version: '1.0.0',
      active: 1,
      codigoDocumento: 'X12345',
      formatoCarta: '04',
      entorno: 'ABDFN01',
      sourceType: 'GAWEB_GAWEB',
      createdAt: Date.now(),
      createdBy: 'system',
      updatedAt: Date.now(),
      updatedBy: 'system',
      notes: 'Perfil Golden basado en Diseño GAWEB v1.3 y Protocolo PDF v4.',
      contentMode: 'PDF_NAME',
      contentSpec: { pdfNameField: 'PDF_NAME' },
      recordLayout: [
        { name: 'FORMATO_CARTA', start: 2, end: 3, length: 2, format: 'ALFANUMERICO', required: true, allowedValues: ['01', '02', '03', '04', '05'], role: 'ROUTING' },
        { name: 'FECHA_GENERACION', start: 4, end: 11, length: 8, format: 'FECHA_YYYYMMDD', required: true, role: 'BUSQUEDA' },
        { name: 'CODIGO_DOCUMENTO', start: 27, end: 32, length: 6, format: 'ALFANUMERICO', required: true, role: 'IDENTIFICADOR' },
        { name: 'PDF_NAME', start: 212, end: 251, length: 40, format: 'ALFANUMERICO', required: true, role: 'IDENTIFICADOR' }
      ],
      validationRules: [
        { id: 'REQ_FECHAS', type: 'REQUIRED_FIELD', description: 'Fecha de generación y carta obligatorias.', fields: ['FECHA_GENERACION', 'FECHA_CARTA_BUSQUEDA'], params: { required: true } },
        { id: 'REQ_DESTINO_MINIMO', type: 'AT_LEAST_ONE_IN_GROUP', description: 'Al menos un destinatario.', fields: ['CLALF', 'CLASE_CONTRATO', 'CODIGO_CONTRATO'], params: { minSelected: 1 } },
        { id: 'FORMATO_CARTA_ES_04', type: 'VALUE_IN_SET', description: 'Debe ser formato 04.', fields: ['FORMATO_CARTA'], params: { allowedValues: ['04'] } }
      ],
      breakingRuleIds: ['FORMATO_CARTA_ES_04', 'REQ_FECHAS']
    };
    await db.gaweb_golden_profiles_v6.put(profileX12345);
    alert("SEED_COMPLETE: GAWEB_GOLDEN_V1_READY");
  };

  // Database Queries
  const templates = useLiveQuery(() => db.lettertemplates_v6.toArray(), []);
  const mappings = useLiveQuery(() => db.lettermappings_v6.toArray(), []);
  const presets = useLiveQuery(() => db.presets_v6.toArray(), []);
  const goldenTests = useLiveQuery(() => db.golden_tests_v6.toArray(), []);
  const gawebProfiles = useLiveQuery(() => db.gaweb_golden_profiles_v6.toArray(), []);
  
  const lastIkUnlock = useLiveQuery(async () => {
    return db.audit_history_v6
      .where('module')
      .equals('SECURITY')
      .reverse()
      .filter(r => r.action === 'CRYPTOIKUNLOCK' || r.action === 'SESSION_LOGIN')
      .first();
  }, []);

  // Compute Mapping Health
  const mappingHealth = useMemo(() => {
    if (!templates || !mappings) return [];
    return computeMappingHealth(
      templates, 
      mappings, 
      (id) => presets?.find(p => p.id === id)?.name ?? '---'
    );
  }, [templates, mappings, presets]);

  return (
    <div className="technical-cockpit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
      
      {/* BLOQUE 1: MOTOR DE SEGURIDAD */}
      <section className="station-card">
        <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
           <ShieldCheckIcon size={18} color="var(--primary-color)" />
           <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900 }}>MOTOR_DE_SEGURIDAD</h3>
        </div>
        
        <div className="flex-col" style={{ gap: '16px' }}>
           <div className="flex-row" style={{ justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              <div className="flex-col">
                 <span style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>ESTADO_IK (MASTER_KEY)</span>
                 <span style={{ fontSize: '1.2rem', fontWeight: 900, color: installationKey ? 'var(--status-ok)' : 'var(--status-err)' }}>
                    {installationKey ? 'UNLOCKED' : 'LOCKED'}
                 </span>
              </div>
              {installationKey ? <UnlockIcon size={24} color="var(--status-ok)" /> : <LockIcon size={24} color="var(--status-err)" />}
           </div>

           <div className="station-tech-summary">
              <div className="station-tech-item">
                 <span className="station-tech-label">ÚLTIMO_ACCESO</span>
                 <span>{lastIkUnlock ? new Date(lastIkUnlock.timestamp).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="station-tech-item">
                 <span className="station-tech-label">OPERADOR_ACTIVO</span>
                 <span>{currentOperator?.username?.toUpperCase() || 'NONE'}</span>
              </div>
              <div className="station-tech-item">
                 <span className="station-tech-label">ENCRYPTION_ENGINE</span>
                 <span>AES-GCM-256 (NIST_P256)</span>
              </div>
           </div>
        </div>
      </section>

      {/* BLOQUE 2: SECURITY HEALTH TÉCNICO (RAW) */}
      <section className="station-card">
         <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ActivityIcon size={18} color="var(--primary-color)" />
            <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900 }}>SECURITY_HEALTH_TELEMETRY</h3>
         </div>
         <div className="grid-2-technical" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="metric-box-technical">
               <span className="label">AUTH_FAIL_COUNT</span>
               <span className="val" style={{ color: 'var(--text-primary)' }}>12 / {telemetryConfig?.security?.securityThresholds?.failedAuthHigh}</span>
            </div>
            <div className="metric-box-technical">
               <span className="label">RBAC_MUTATIONS</span>
               <span className="val">2 / {telemetryConfig?.security?.securityThresholds?.rbacChangesAttention}</span>
            </div>
            <div className="metric-box-technical">
               <span className="label">DATA_SYNC_ERRS</span>
               <span className="val">0 / {telemetryConfig?.security?.securityThresholds?.dataOpsErrorAttention}</span>
            </div>
            <div className="metric-box-technical">
               <span className="label">INACTIVITY_LOCKS</span>
               <span className="val">4 / {telemetryConfig?.security?.securityThresholds?.inactivityLocksHigh}</span>
            </div>
         </div>
         <div style={{ marginTop: '16px', padding: '10px', border: '1px solid rgba(var(--primary-color-rgb), 0.2)', borderRadius: '4px', background: 'rgba(var(--primary-color-rgb), 0.05)' }}>
            <p style={{ fontSize: '0.65rem', margin: 0, opacity: 0.7, lineHeight: 1.4 }}>
               * Los valores superados activarán alertas automáticas en el Supervisor Audit Dashboard.
            </p>
         </div>
      </section>

      {/* BLOQUE 3: MAPPING HEALTH (LETTER STATION) */}
      <section className="station-card" style={{ gridColumn: 'span 2' }}>
         <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <MapIcon size={18} color="var(--primary-color)" />
            <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900 }}>MAPPING_BRAIN_HEALTH (THRESHOLD: {Math.round(mappingThreshold * 100)}%)</h3>
         </div>
         
         <div className="station-table-container">
            <table className="station-table">
               <thead>
                  <tr>
                     <th>PRESET</th>
                     <th>PLANTILLA</th>
                     <th>MAPPING_ID</th>
                     <th style={{ textAlign: 'right' }}>COBERTURA</th>
                     <th style={{ textAlign: 'center' }}>STATUS</th>
                  </tr>
               </thead>
               <tbody>
                  {mappingHealth.map(row => {
                     const ok = row.coverage >= mappingThreshold;
                     return (
                        <tr key={row.id}>
                           <td style={{ fontSize: '0.7rem', opacity: 0.8 }}>{row.presetName}</td>
                           <td style={{ fontWeight: 700 }}>{row.templateName}</td>
                           <td style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{row.mappingName}</td>
                           <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                              {Math.round(row.coverage * 100)}% <span style={{ opacity: 0.3, fontWeight: 400 }}>({row.mappedCount}/{row.totalVars})</span>
                           </td>
                           <td style={{ textAlign: 'center' }}>
                              <span className={`station-badge ${ok ? 'success' : 'warn'} tiny`}>
                                 {ok ? 'COMPLIANT' : 'UNDER_THRESHOLD'}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
                  {mappingHealth.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', opacity: 0.4 }}>NO_MAPPINGS_REGISTERED_IN_THIS_UNIT</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* BLOQUE 4: GOLDEN QA REGISTRY */}
      <section className="station-card" style={{ gridColumn: 'span 2' }}>
         <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <AwardIcon size={18} color="var(--primary-color)" />
            <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900 }}>GOLDEN_MASTER_REGISTRY</h3>
         </div>
         
         <div className="station-table-container">
            <table className="station-table">
               <thead>
                  <tr>
                     <th>TEMPLATE_ID</th>
                     <th>CODE</th>
                     <th>VERSION</th>
                     <th>LAYOUT_HASH</th>
                     <th>LAST_VERIFIED</th>
                  </tr>
               </thead>
               <tbody>
                  {goldenTests?.map(g => (
                     <tr key={g.id}>
                        <td style={{ fontSize: '0.7rem' }}>{templates?.find(t => t.id === g.templateId)?.name || g.templateId}</td>
                        <td style={{ fontWeight: 800 }}>{g.codDocumento}</td>
                        <td><span className="station-badge success tiny">v{g.version}</span></td>
                        <td style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>{g.layoutHash.substring(0, 16)}...</td>
                        <td style={{ opacity: 0.7 }}>{g.lastVerifiedAt ? new Date(g.lastVerifiedAt).toLocaleString() : 'NEVER'}</td>
                     </tr>
                  ))}
                  {goldenTests?.length === 0 && (
                     <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', opacity: 0.4 }}>NO_GOLDEN_MASTERS_DEFINED</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* BLOQUE 5: GAWEB GOLDEN PROFILES */}
      <section className="station-card" style={{ gridColumn: 'span 2' }}>
         <div className="section-header-technical" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', justifyContent: 'space-between' }}>
            <div className="flex-row" style={{ alignItems: 'center', gap: '10px' }}>
               <ShieldCheckIcon size={18} color="var(--primary-color)" />
               <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 900 }}>GAWEB_GOLDEN_MANAGEMENT</h3>
            </div>
            <button className="station-btn tiny" onClick={handleSeedProfiles}>SEED_INDUSTRIAL_SPECS</button>
         </div>
         
         <div className="station-table-container">
            <table className="station-table">
               <thead>
                  <tr>
                     <th>PROFILE_NAME</th>
                     <th>DOC_CODE</th>
                     <th>FORMAT</th>
                     <th>RULES</th>
                     <th>STATUS</th>
                  </tr>
               </thead>
               <tbody>
                  {gawebProfiles?.map((p: any) => (
                     <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.codigoDocumento}</td>
                        <td><span className="station-badge success tiny">{p.formatoCarta}</span></td>
                        <td>{p.validationRules.length} ACTIVE_RULES</td>
                        <td>
                          <span className={`station-badge ${p.active ? 'success' : 'warn'} tiny`}>
                             {p.active ? 'ACTIVE_AUDIT' : 'DISABLED'}
                          </span>
                        </td>
                     </tr>
                  ))}
                  {gawebProfiles?.length === 0 && (
                     <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', opacity: 0.4 }}>NO_GOLDEN_PROFILES_LOADED</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      <style jsx>{`
        .station-tech-summary {
           display: grid;
           grid-template-columns: 1fr;
           gap: 8px;
        }
        .station-tech-item {
           display: flex;
           justify-content: space-between;
           font-size: 0.7rem;
           border-bottom: 1px solid rgba(255,255,255,0.05);
           padding-bottom: 4px;
        }
        .station-tech-label { opacity: 0.4; font-weight: 800; }
        .metric-box-technical {
           background: rgba(0,0,0,0.2);
           border: 1px solid rgba(255,255,255,0.05);
           padding: 12px;
           border-radius: 4px;
        }
        .metric-box-technical .label { font-size: 0.55rem; opacity: 0.4; display: block; margin-bottom: 4px; font-weight: 800; }
        .metric-box-technical .val { font-family: var(--font-mono); font-weight: bold; font-size: 1rem; color: var(--primary-color); }
        .txt-ok { color: var(--status-ok); }
        .txt-err { color: var(--status-err); }
      `}</style>

    </div>
  );
};
