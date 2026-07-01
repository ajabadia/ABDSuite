'use client';

/**
 * @purpose Renderiza una ventana modal que muestra la historia de auditoría para una entidad específica, incluyendo tablas para visualizar registros y estadísticas.
 * @purpose_en Renders a modal displaying audit history for a specific entity, including tabs for viewing logs and statistics.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:1unjzfl
 * @lastUpdated 2026-06-26T09:59:28.856Z
 */

import React, { useState, useEffect } from 'react';
import { X, Activity, FileText, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '../utils.js';
import { ActionBadge } from './ActionBadge.js';
import type { AuditLog } from '../types.js';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  translations?: {
    title?: string;
    tabHistory?: string;
    tabStats?: string;
    loading?: string;
    emptyEvents?: string;
    underConstruction?: string;
  };
}

export function AuditHistoryModal({
  isOpen,
  onClose,
  tenantId,
  entityType,
  entityId,
  entityName,
  translations
}: AuditHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLogs([]);
      setActiveTab('history');
      setLoading(false);
      return;
    }

    // Fetch the audit logs for this specific entity
    // We assume the host application proxies /api/admin/audit
    // or we fetch from a shared logs service endpoint.
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/audit?tenantId=${tenantId}&entityType=${entityType}&entityId=${entityId}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') { console.error("Failed to fetch audit history", err); }
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isOpen, tenantId, entityType, entityId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[85vh] bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded border border-border bg-background text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                {translations?.title || 'Historial de Auditoría'}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {entityName ? `${entityName} (${entityId})` : entityId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded border border-transparent hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-4 border-b border-border bg-background">
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
              activeTab === 'history' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <FileText className="w-4 h-4" />
            {translations?.tabHistory || 'Registro de Eventos'}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
              activeTab === 'stats' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            {translations?.tabStats || 'Estadísticas'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-secondary/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {translations?.loading || 'Cargando historial...'}
              </span>
            </div>
          ) : activeTab === 'history' ? (
            logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest">{translations?.emptyEvents || 'No hay eventos registrados'}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log._id} className="p-3 rounded border border-border bg-card flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ActionBadge action={log.action} />
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                          {log.appId}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    
                    <div className="text-xs text-foreground/80 font-medium">
                      {log.userEmail}
                    </div>

                    {log.changedFields && (
                      <div className="mt-2 p-2 bg-muted/20 border border-border/50 rounded font-mono text-[9px] text-muted-foreground overflow-x-auto">
                        <pre>{JSON.stringify(log.changedFields, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-muted-foreground">
              <BarChart3 className="w-8 h-8 opacity-20" />
              <span className="text-xs font-bold uppercase tracking-widest">{translations?.underConstruction || 'Gráficos en construcción'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
