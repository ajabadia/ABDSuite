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
             <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.tech_motor_security')}</h3>
          </div>
          
          <div className="flex-col" style={{ gap: '16px' }}>
             <div className="flex-row" style={{ justifyContent: 'space-between', padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
                <div className="flex-col">
                   <span className="station-registry-item-meta" style={{ fontWeight: 800 }}>{t('supervisor.tech_ik_status')}</span>
                   <span className="station-title-main" style={{ fontSize: '1.2rem', color: installationKey ? 'var(--status-ok)' : 'var(--status-err)' }}>
                      {installationKey ? t('supervisor.tech_unlocked') : t('supervisor.tech_locked')}
                   </span>
                </div>
                {installationKey ? <UnlockIcon size={24} color="var(--status-ok)" /> : <LockIcon size={24} color="var(--status-err)" />}
             </div>

             <div className="flex-col" style={{ gap: '8px' }}>
                <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                   <span className="station-registry-item-meta">{t('supervisor.tech_last_access')}</span>
                   <span className="station-title-main">{lastIkUnlock ? new Date(lastIkUnlock.timestamp).toLocaleString() : t('supervisor.tech_never')}</span>
                </div>
                <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                   <span className="station-registry-item-meta">{t('supervisor.tech_active_operator')}</span>
                   <span className="station-title-main">{currentOperator?.username?.toUpperCase() || t('common.none')}</span>
                </div>
                <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                   <span className="station-registry-item-meta">{t('supervisor.tech_encryption_engine')}</span>
                   <span className="station-title-main">AES-GCM-256 (NIST_P256)</span>
                </div>
             </div>
          </div>
        </section>

        {/* BLOQUE 2: SECURITY HEALTH TÉCNICO (RAW) */}
        <section className="station-card" style={{ flex: 1 }}>
           <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
              <ActivityIcon size={18} color="var(--primary-color)" />
              <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.tech_security_telemetry')}</h3>
           </div>
           <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="station-card" style={{ padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>{t('supervisor.tech_auth_fails')}</span>
                 <span className="station-title-main" style={{ fontSize: '1.1rem', color: 'var(--primary-color)', display: 'block', marginTop: '4px' }}>
                    12 / {telemetryConfig?.security?.securityThresholds?.failedAuthHigh}
                 </span>
              </div>
              <div className="station-card" style={{ padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>{t('supervisor.tech_rbac_mutations')}</span>
                 <span className="station-title-main" style={{ fontSize: '1.1rem', color: 'var(--primary-color)', display: 'block', marginTop: '4px' }}>
                    2 / {telemetryConfig?.security?.securityThresholds?.rbacChangesAttention}
                 </span>
              </div>
              <div className="station-card" style={{ padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>{t('supervisor.tech_sync_errors')}</span>
                 <span className="station-title-main" style={{ fontSize: '1.1rem', color: 'var(--primary-color)', display: 'block', marginTop: '4px' }}>
                    0 / {telemetryConfig?.security?.securityThresholds?.dataOpsErrorAttention}
                 </span>
              </div>
              <div className="station-card" style={{ padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                 <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>{t('supervisor.tech_inactivity_locks')}</span>
                 <span className="station-title-main" style={{ fontSize: '1.1rem', color: 'var(--primary-color)', display: 'block', marginTop: '4px' }}>
                    4 / {telemetryConfig?.security?.securityThresholds?.inactivityLocksHigh}
                 </span>
              </div>
           </div>
           <div className="station-registry-sync-header" style={{ marginTop: '16px' }}>
              <span className="station-shimmer-text" style={{ fontSize: '0.65rem' }}>
                 {t('supervisor.tech_threshold_hint')}
              </span>
           </div>
        </section>
      </div>

      {/* BLOQUE 3: MAPPING HEALTH (LETTER STATION) */}
      <section className="station-card">
         <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
            <MapIcon size={18} color="var(--primary-color)" />
            <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.tech_mapping_health')} (THRESHOLD: {Math.round(mappingThreshold * 100)}%)</h3>
         </div>
         
         <div className="station-registry-scroller" style={{ maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
            <table className="station-table">
               <thead>
                  <tr>
                     <th>{t('supervisor.tech_table.preset').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.template').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.mapping_id').toUpperCase()}</th>
                     <th style={{ textAlign: 'right' }}>{t('supervisor.tech_table.coverage').toUpperCase()}</th>
                     <th style={{ textAlign: 'center' }}>{t('supervisor.tech_table.status').toUpperCase()}</th>
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
                                 {ok ? t('supervisor.tech_compliant') : t('supervisor.tech_under_threshold')}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
                  {mappingHealth.length === 0 && (
                    <tr><td colSpan={5} className="station-empty-state" style={{ height: '100px' }}>{t('supervisor.no_data').toUpperCase()}</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* BLOQUE 4: GOLDEN QA REGISTRY */}
      <section className="station-card">
         <div className="flex-row" style={{ gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
            <AwardIcon size={18} color="var(--primary-color)" />
            <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.tech_golden_registry')}</h3>
         </div>
         
         <div className="station-registry-scroller" style={{ maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
            <table className="station-table">
               <thead>
                  <tr>
                     <th>{t('supervisor.tech_table.template').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.code').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.version').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.hash').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.last_verified').toUpperCase()}</th>
                  </tr>
               </thead>
               <tbody>
                  {goldenTests?.map(g => (
                     <tr key={g.id}>
                        <td className="station-registry-item-meta" style={{ fontSize: '0.7rem' }}>{templates?.find(t => t.id === g.templateId)?.name || g.templateId}</td>
                        <td className="station-title-main">{g.codDocumento}</td>
                        <td><span className="station-badge station-badge-blue tiny">v{g.version}</span></td>
                        <td className="station-registry-item-meta" style={{ fontSize: '10px' }}>{g.layoutHash.substring(0, 16)}...</td>
                        <td className="station-registry-item-meta">{g.lastVerifiedAt ? new Date(g.lastVerifiedAt).toLocaleString() : t('supervisor.tech_never')}</td>
                     </tr>
                  ))}
                  {goldenTests?.length === 0 && (
                     <tr><td colSpan={5} className="station-empty-state" style={{ height: '100px' }}>{t('supervisor.no_data').toUpperCase()}</td></tr>
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
               <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.tech_gaweb_management')}</h3>
            </div>
            <button className="station-btn tiny" onClick={handleSeedProfiles}>{t('supervisor.tech_seed_industrial')}</button>
         </div>
         
         <div className="station-registry-scroller" style={{ maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
            <table className="station-table">
               <thead>
                  <tr>
                     <th>{t('supervisor.tech_table.profile_name').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.doc_code').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.format').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.rules').toUpperCase()}</th>
                     <th>{t('supervisor.tech_table.status').toUpperCase()}</th>
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
                             {p.active ? t('supervisor.tech_table.active_audit') : t('supervisor.tech_table.disabled')}
                          </span>
                        </td>
                     </tr>
                  ))}
                  {gawebProfiles?.length === 0 && (
                     <tr><td colSpan={5} className="station-empty-state" style={{ height: '100px' }}>{t('supervisor.no_data').toUpperCase()}</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
};
