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
  UnlockIcon
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
    <div className="flex-col fade-in" style={{ gap: '24px' }}>
      
      <div className="flex-row" style={{ gap: '24px' }}>
        {/* BLOQUE 1: MOTOR DE SEGURIDAD */}
        <section className="station-card" style={{ flex: 1 }}>
          <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
             <ShieldCheckIcon size={18} color="var(--primary-color)" />
             <h3 className="station-form-section-title" style={{ margin: 0 }}>MOTOR_DE_SEGURIDAD</h3>
          </div>
          
          <div className="flex-col" style={{ gap: '16px' }}>
             <div className="flex-row" style={{ justifyContent: 'space-between', padding: '16px', background: 'rgba(var(--primary-color-rgb), 0.05)', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
                <div className="flex-col">
                   <span className="station-registry-item-meta" style={{ fontWeight: 800 }}>ESTADO_IK (MASTER_KEY)</span>
                   <span className="station-title-main" style={{ fontSize: '1.2rem', color: installationKey ? 'var(--status-ok)' : 'var(--status-err)' }}>
                      {installationKey ? 'UNLOCKED' : 'LOCKED'}
                   </span>
                </div>
                {installationKey ? <UnlockIcon size={24} color="var(--status-ok)" /> : <LockIcon size={24} color="var(--status-err)" />}
             </div>

             <div className="flex-col" style={{ gap: '8px' }}>
                <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                   <span className="station-registry-item-meta">ÚLTIMO_ACCESO</span>
                   <span className="station-title-main">{lastIkUnlock ? new Date(lastIkUnlock.timestamp).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                   <span className="station-registry-item-meta">OPERADOR_ACTIVO</span>
                   <span className="station-title-main">{currentOperator?.username?.toUpperCase() || 'NONE'}</span>
                </div>
                <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                   <span className="station-registry-item-meta">ENCRYPTION_ENGINE</span>
                   <span className="station-title-main">AES-GCM-256 (NIST_P256)</span>
                </div>
             </div>
          </div>
        </section>

        {/* BLOQUE 2: SECURITY HEALTH TÉCNICO (RAW) */}
        <section className="station-card" style={{ flex: 1 }}>
           <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
              <ActivityIcon size={18} color="var(--primary-color)" />
              <h3 className="station-form-section-title" style={{ margin: 0 }}>SECURITY_HEALTH_TELEMETRY</h3>
           </div>
           <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="station-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>AUTH_FAIL_COUNT</span>
                 <span className="station-title-main" style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>
                    12 / {telemetryConfig?.security?.securityThresholds?.failedAuthHigh}
                 </span>
              </div>
              <div className="station-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>RBAC_MUTATIONS</span>
                 <span className="station-title-main" style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>
                    2 / {telemetryConfig?.security?.securityThresholds?.rbacChangesAttention}
                 </span>
              </div>
              <div className="station-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>DATA_SYNC_ERRS</span>
                 <span className="station-title-main" style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>
                    0 / {telemetryConfig?.security?.securityThresholds?.dataOpsErrorAttention}
                 </span>
              </div>
              <div className="station-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>INACTIVITY_LOCKS</span>
                 <span className="station-title-main" style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>
                    4 / {telemetryConfig?.security?.securityThresholds?.inactivityLocksHigh}
                 </span>
              </div>
           </div>
           <div className="station-registry-sync-header" style={{ marginTop: '16px' }}>
              <span className="station-shimmer-text" style={{ fontSize: '0.65rem' }}>
                 * Los valores superados activarán alertas automáticas en el Supervisor Audit Dashboard.
              </span>
           </div>
        </section>
      </div>

      {/* BLOQUE 3: MAPPING HEALTH (LETTER STATION) */}
      <section className="station-card">
         <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
            <MapIcon size={18} color="var(--primary-color)" />
            <h3 className="station-form-section-title" style={{ margin: 0 }}>MAPPING_BRAIN_HEALTH (THRESHOLD: {Math.round(mappingThreshold * 100)}%)</h3>
         </div>
         
         <div className="station-registry-scroller" style={{ maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
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
                           <td className="station-registry-item-meta" style={{ fontSize: '0.7rem' }}>{row.presetName}</td>
                           <td className="station-title-main">{row.templateName}</td>
                           <td className="station-registry-item-meta" style={{ fontSize: '0.7rem' }}>{row.mappingName}</td>
                           <td style={{ textAlign: 'right' }}>
                              <span className="station-title-main" style={{ fontSize: '0.8rem' }}>{Math.round(row.coverage * 100)}%</span>
                              <span className="station-registry-item-meta" style={{ fontSize: '0.6rem', marginLeft: '6px' }}>({row.mappedCount}/{row.totalVars})</span>
                           </td>
                           <td style={{ textAlign: 'center' }}>
                              <span className={`station-badge ${ok ? 'station-badge-blue' : 'station-badge-orange'} tiny`}>
                                 {ok ? 'COMPLIANT' : 'UNDER_THRESHOLD'}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
                  {mappingHealth.length === 0 && (
                    <tr><td colSpan={5} className="station-empty-state" style={{ height: '100px' }}>NO_MAPPINGS_REGISTERED_IN_THIS_UNIT</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* BLOQUE 4: GOLDEN QA REGISTRY */}
      <section className="station-card">
         <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
            <AwardIcon size={18} color="var(--primary-color)" />
            <h3 className="station-form-section-title" style={{ margin: 0 }}>GOLDEN_MASTER_REGISTRY</h3>
         </div>
         
         <div className="station-registry-scroller" style={{ maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
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
                        <td className="station-registry-item-meta" style={{ fontSize: '0.7rem' }}>{templates?.find(t => t.id === g.templateId)?.name || g.templateId}</td>
                        <td className="station-title-main">{g.codDocumento}</td>
                        <td><span className="station-badge station-badge-blue tiny">v{g.version}</span></td>
                        <td className="station-registry-item-meta" style={{ fontSize: '10px' }}>{g.layoutHash.substring(0, 16)}...</td>
                        <td className="station-registry-item-meta">{g.lastVerifiedAt ? new Date(g.lastVerifiedAt).toLocaleString() : 'NEVER'}</td>
                     </tr>
                  ))}
                  {goldenTests?.length === 0 && (
                     <tr><td colSpan={5} className="station-empty-state" style={{ height: '100px' }}>NO_GOLDEN_MASTERS_DEFINED</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* BLOQUE 5: GAWEB GOLDEN PROFILES */}
      <section className="station-card">
         <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6, justifyContent: 'space-between' }}>
            <div className="flex-row" style={{ alignItems: 'center', gap: '10px' }}>
               <ShieldCheckIcon size={18} color="var(--primary-color)" />
               <h3 className="station-form-section-title" style={{ margin: 0 }}>GAWEB_GOLDEN_MANAGEMENT</h3>
            </div>
            <button className="station-btn tiny" onClick={handleSeedProfiles}>SEED_INDUSTRIAL_SPECS</button>
         </div>
         
         <div className="station-registry-scroller" style={{ maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
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
                        <td className="station-title-main">{p.name}</td>
                        <td className="station-registry-item-meta">{p.codigoDocumento}</td>
                        <td><span className="station-badge station-badge-blue tiny">{p.formatoCarta}</span></td>
                        <td className="station-registry-item-meta">{p.validationRules.length} ACTIVE_RULES</td>
                        <td>
                          <span className={`station-badge ${p.active ? 'station-badge-blue' : 'station-badge-orange'} tiny`}>
                             {p.active ? 'ACTIVE_AUDIT' : 'DISABLED'}
                          </span>
                        </td>
                     </tr>
                  ))}
                  {gawebProfiles?.length === 0 && (
                     <tr><td colSpan={5} className="station-empty-state" style={{ height: '100px' }}>NO_GOLDEN_PROFILES_LOADED</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
};
