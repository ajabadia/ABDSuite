'use client';

/**
 * @purpose Renderiza una pestaña en la interfaz administrativa que muestra métricas de seguridad, incluyendo tasas de adopción del MFA y total logins.
 * @purpose_en Renders a tab in the admin interface displaying security metrics, including MFA adoption rates and total logins.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:1u2wcgz
 * @lastUpdated 2026-06-21T09:13:11.768Z
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import type { DashboardMetrics } from '@/types/dashboard-metrics';
import { CustomTooltip } from './CustomTooltip';

interface SecurityTabProps {
  metrics: DashboardMetrics;
}

export default function SecurityTab({ metrics }: SecurityTabProps) {
  const t = useTranslations('analytics');
  const mfaPieData = [
    { name: 'MFA ENROLLED', value: metrics.security.mfaEnrolledRate },
    { name: 'MFA BYPASS / INACTIVE', value: 100 - metrics.security.mfaEnrolledRate }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MFA Adoption Chart */}
        <div className="glass-panel p-6 rounded-none flex flex-col gap-4 lg:col-span-1">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            {t('mfaAdoption')}
          </h4>
          <div className="w-full h-64 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={mfaPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="hsl(188 85% 48%)" />
                  <Cell fill="rgba(239, 68, 68, 0.2)" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-mono font-black">{metrics.security.mfaEnrolledRate}%</span>
              <span className="text-[9px] font-mono text-muted-foreground uppercase">{t('enrolled')}</span>
            </div>
          </div>
        </div>

        {/* Login failures timeline */}
        <div className="glass-panel p-6 rounded-none flex flex-col gap-4 lg:col-span-2">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            {t('failedLoginsTimeline')}
          </h4>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.security.failedLoginsTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="step" dataKey="count" stroke="hsl(38 92% 52%)" fill="rgba(245, 158, 11, 0.1)" radius={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SSO / Telemetry detail metrics */}
      <div className="glass-panel p-6 rounded-none flex flex-col gap-6 font-mono text-xs">
        <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
          {t('operationalSecurityMetrics')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-border/30 p-4 bg-card/20 flex flex-col gap-1">
            <span className="text-muted-foreground text-[9px] uppercase">
              {t('totalLogins24h')}
            </span>
            <span className="text-lg font-bold">{metrics.security.totalLogins24h}</span>
          </div>
          <div className="border border-border/30 p-4 bg-card/20 flex flex-col gap-1">
            <span className="text-muted-foreground text-[9px] uppercase">
              {t('mfaGracePeriod')}
            </span>
            <span className="text-lg font-bold">{metrics.security.mfaBypassActiveCount}</span>
          </div>
          <div className="border border-border/30 p-4 bg-card/20 flex flex-col gap-1">
            <span className="text-muted-foreground text-[9px] uppercase">
              {t('ssoMitigationTimeout')}
            </span>
            <span className="text-lg font-bold">
              {'5000 ms'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
