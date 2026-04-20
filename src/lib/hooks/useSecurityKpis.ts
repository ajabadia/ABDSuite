import { useState, useEffect } from 'react';
import { db } from '@/lib/db/db';
import { UnifiedAuditRecord } from '@/lib/types/audit.types';

export interface SecurityKpis {
  failedAuthCount: number;
  sessionLocks: {
    inactivity: number;
    manual: number;
  };
  rbacChangesCount: number;
  dataOps: {
    success: number;
    failed: number;
    total: number;
  };
  ikUnlocks: number;
}

/**
 * Industrial Hook for calculating Security KPIs (Phase 14.3 Refined).
 * Implements granular filtering for forensics and health summaries.
 */
export function useSecurityKpis(fromTs: number, toTs: number) {
  const [kpis, setKpis] = useState<SecurityKpis>({
    failedAuthCount: 0,
    sessionLocks: { inactivity: 0, manual: 0 },
    rbacChangesCount: 0,
    dataOps: { success: 0, failed: 0, total: 0 },
    ikUnlocks: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function calculate() {
      setIsLoading(true);
      try {
        const records = await db.audit_history_v6
          .where('timestamp')
          .between(fromTs, toTs, true, true)
          .toArray();

        // 1. Failed Auth
        const failedAuthCount = records.filter(r => 
          r.category === 'AUTH' && 
          (r.action === 'AUTHLOGINFAILURE' || r.action === 'AUTHMFAFAILURE' || r.action === 'AUTHLOCKOUTPIN')
        ).length;

        // 2. Session Locks
        let inactivity = 0;
        let manual = 0;
        records.filter(r => r.action === 'AUTHSESSIONLOCK').forEach(r => {
          if (r.details?.includes('"reason":"INACTIVITY"')) inactivity++;
          else manual++; // Defaults to MANUAL if not specified or explicit
        });

        // 3. RBAC Changes
        const rbacChangesCount = records.filter(r => r.category === 'RBAC').length;

        // 4. Data Operations
        const dataOpsRecords = records.filter(r => 
          r.category === 'DATA' && 
          (r.action === 'DATADUMPEXPORTEND' || r.action === 'DATADUMPIMPORTEND' || r.action === 'SYNCEXPORTEND' || r.action === 'SYNCIMPORTEND')
        );
        const dataSuccess = dataOpsRecords.filter(r => (r.status as string) === 'SUCCESS' || (r.status as string) === 'INFO').length;
        const dataFailed = dataOpsRecords.filter(r => (r.status as string) === 'ERROR' || (r.status as string) === 'WARNING').length;

        // 5. IK Unlocks
        const ikUnlocks = records.filter(r => r.action === 'CRYPTOIKUNLOCK').length;

        setKpis({
          failedAuthCount,
          sessionLocks: { inactivity, manual },
          rbacChangesCount,
          dataOps: {
            success: dataSuccess,
            failed: dataFailed,
            total: dataOpsRecords.length
          },
          ikUnlocks
        });
      } catch (err) {
        console.error('[ABDFN-KPIS] Forensic calculation failed', err);
      } finally {
        setIsLoading(false);
      }
    }

    calculate();
  }, [fromTs, toTs]);

  return { kpis, isLoading };
}
