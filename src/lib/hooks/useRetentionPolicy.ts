'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db/db';
import { purgeOldAuditRecords } from '@/lib/utils/audit-retention';

/**
 * useRetentionPolicy
 * Hook industrial para la gestión del ciclo de vida de los datos locales.
 * Purga registros de auditoría antiguos para mantener la base de datos lean.
 */
export function useRetentionPolicy(retentionDays: number = 30, active: boolean = false) {
  useEffect(() => {
    if (!active) return;

    const executePurge = async () => {
      // 0. Manual industrial purge (Settings-based)
      await purgeOldAuditRecords().catch(console.error);

      const now = Date.now();
      const expirationMs = retentionDays * 24 * 60 * 60 * 1000;
      const threshold = now - expirationMs;

      try {
        // Guard: double-check db instance availability
        if (!db.audit_history_v6) return;

        // 1. Purgar audit_history por antigüedad
        const deletedCount = await db.audit_history_v6
          .where('timestamp')
          .below(threshold)
          .delete();

        if (deletedCount > 0) {
          console.log(`[RETENTION_POLICY] Purged ${deletedCount} expired audit records.`);
        }

        // 2. Control de volumen (Hard Limit: 10k registros)
        const totalCount = await db.audit_history_v6.count();
        if (totalCount > 10000) {
          const overLimit = totalCount - 10000;
          const oldestRecords = await db.audit_history_v6
            .orderBy('timestamp')
            .limit(overLimit)
            .primaryKeys();
          
          await db.audit_history_v6.bulkDelete(oldestRecords);
          console.log(`[RETENTION_POLICY] Volumetric purge: ${overLimit} records removed.`);
        }
      } catch (err) {
        console.error('[RETENTION_POLICY] Error during data lifecycle purge:', err);
      }
    };

    // Ejecutar al arranque de la aplicación
    executePurge();
    
    // Y cada 24 horas si la sesión se mantiene abierta
    const interval = setInterval(executePurge, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [retentionDays, active]);
}
