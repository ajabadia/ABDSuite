'use client';

/**
 * @purpose Renderiza un componente de tabla para métricas de gobernanza, incluyendo el uso de almacenamiento de espacio y métricas adicionales espaciales.
 * @purpose_en Renders a tab component for governance metrics, including space storage utilization and additional spatial metrics.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:13y9wss
 * @lastUpdated 2026-06-21T09:13:02.247Z
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import type { DashboardMetrics } from '@/types/dashboard-metrics';
import { CustomTooltip } from './CustomTooltip';

interface GovernanceTabProps {
  metrics: DashboardMetrics;
}

const CHART_COLORS = [
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
];

export default function GovernanceTab({ metrics }: GovernanceTabProps) {
  const t = useTranslations('analytics');
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      {/* Space Storage Utilization Stacked Chart */}
      <div className="glass-panel p-6 rounded-none flex flex-col gap-4">
        <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
          {t('spaceStorageUtilization')}
        </h4>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.governance.spaceUtilization} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" tickFormatter={(v) => `${(v / 1024 / 1024 / 1024).toFixed(1)} GB`} />
              <YAxis dataKey="spaceName" type="category" stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="storageBytesUsed" fill="hsl(188 85% 48%)" radius={0}>
                {metrics.governance.spaceUtilization.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Application licenses and Spaces count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
        <div className="glass-panel p-6 rounded-none flex flex-col gap-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            {t('licensedApplicationsRegistry')}
          </h4>
          <div className="flex flex-col gap-2">
            {metrics.governance.licensedApps.map((app, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border border-border/30 bg-card/20">
                <span className="font-bold uppercase tracking-wider">{app.appId}</span>
                <div className="flex items-center gap-3">
                  {app.expirationDate && (
                    <span className="text-[10px] text-muted-foreground uppercase">{t('expiresLabel')}{new Date(app.expirationDate).toLocaleDateString()}</span>
                  )}
                  <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
                    app.status === 'active' ? 'border-primary/30 text-primary' : 'border-destructive/30 text-destructive'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-none flex flex-col gap-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            {t('additionalSpatialMetrics')}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border/30 p-4 bg-card/20 flex flex-col gap-1">
              <span className="text-muted-foreground text-[8px] uppercase">
                {t('totalSpacesCreated')}
              </span>
              <span className="text-xl font-bold">{metrics.governance.totalSpacesCreated}</span>
            </div>
            <div className="border border-border/30 p-4 bg-card/20 flex flex-col gap-1">
              <span className="text-muted-foreground text-[8px] uppercase">
                {locale === 'es' ? 'COLABORADORES ACTIVOS' : 'ACTIVE COLLABORATORS'}
              </span>
              <span className="text-xl font-bold">{metrics.governance.activeCollaboratorsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
