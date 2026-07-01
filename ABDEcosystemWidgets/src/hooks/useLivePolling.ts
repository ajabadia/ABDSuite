"use client";

/**
 * @purpose Gestiona el seguimiento de las registros de auditoría para un inquilino específico.
 * @purpose_en Manages live polling of audit logs for a specific tenant.
 * @refactorable false
 * @classification Custom Hook
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:1eu6rjj
 * @lastUpdated 2026-06-26T09:59:41.553Z
 */

// Hook for live polling of audit logs
import { useState, useEffect, useRef, useCallback } from 'react';
import type { AuditLog } from '../types.js';

interface UseLivePollingOptions {
  tenantId: string;
  pollInterval?: number; // ms
}

export function useLivePolling({ tenantId, pollInterval = 5000 }: UseLivePollingOptions) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const isLiveRef = useRef(isLive);
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  const fetchLogs = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/admin/audit?tenantId=${tenantId}&limit=50`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data: AuditLog[] = await res.json();
      if (!isInitial && knownIdsRef.current.size > 0) {
        const incoming = new Set<string>();
        data.forEach((log) => {
          if (log._id && !knownIdsRef.current.has(log._id)) {
            incoming.add(log._id);
          }
        });
        if (incoming.size > 0) {
          setNewLogIds((prev) => new Set([...prev, ...incoming]));
          setTimeout(() => {
            setNewLogIds((prev) => {
              const next = new Set(prev);
              incoming.forEach((id) => next.delete(id));
              return next;
            });
          }, 2500);
        }
      }
      knownIdsRef.current = new Set(data.map((l) => l._id!).filter(Boolean) as string[]);
      setLogs(data);
      setLastFetched(new Date());
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error(err); }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [tenantId]);

  // initial load
  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  // polling
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      if (isLiveRef.current) fetchLogs(false);
    }, pollInterval);
    return () => clearInterval(interval);
  }, [isLive, pollInterval, fetchLogs]);

  const toggleLive = () => setIsLive((prev) => !prev);

  return { logs, loading, newLogIds, isLive, toggleLive, lastFetched };
}
