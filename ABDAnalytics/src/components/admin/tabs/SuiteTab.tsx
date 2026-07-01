'use client';

/**
 * @purpose Renderiza un componente de tabla que muestra indicadores clave de rendimiento (KPIs) para una interfaz de análisis ABDSuite, incluyendo el número de estudiantes, licencias activas y intentos fallidos de inicio de sesión.
 * @purpose_en Renders a tab component displaying key performance indicators (KPIs) for an ABDSuite analytics dashboard, including student count, active licenses, and failed logins.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1o0gabn
 * @lastUpdated 2026-06-21T09:15:50.506Z
 */

import React from 'react';
import { Users, Award, Database, ShieldCheck, Server, AppWindow, ShieldAlert } from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard-metrics';

interface SuiteTabProps {
  metrics: DashboardMetrics;
  locale: string;
}

export default function SuiteTab({ metrics, locale }: SuiteTabProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 flex flex-col gap-3 rounded-none relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className={`console-status-dot ${metrics.isDemoMode ? 'warning' : 'online'}`} />
            <span className="font-mono text-[8px] text-muted-foreground uppercase">{metrics.isDemoMode ? 'SIM' : 'LIVE'}</span>
          </div>
          <div className="text-muted-foreground"><Users className="w-5 h-5 text-primary" /></div>
          <span className="console-breadcrumb">{locale === 'es' ? 'ESTUDIANTES ACTIVOS' : 'ACTIVE STUDENTS'}</span>
          <span className="text-2xl font-mono font-bold tracking-tight">{metrics.suiteSummary.totalStudents}</span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-3 rounded-none relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className={`console-status-dot ${metrics.isDemoMode ? 'warning' : 'online'}`} />
            <span className="font-mono text-[8px] text-muted-foreground uppercase">{metrics.isDemoMode ? 'SIM' : 'LIVE'}</span>
          </div>
          <div className="text-muted-foreground"><Award className="w-5 h-5 text-primary" /></div>
          <span className="console-breadcrumb">{locale === 'es' ? 'TASA FINALIZACIÓN' : 'COMPLETION RATE'}</span>
          <span className="text-2xl font-mono font-bold tracking-tight">{metrics.suiteSummary.completionRate}%</span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-3 rounded-none relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className={`console-status-dot ${metrics.isDemoMode ? 'warning' : 'online'}`} />
            <span className="font-mono text-[8px] text-muted-foreground uppercase">{metrics.isDemoMode ? 'SIM' : 'LIVE'}</span>
          </div>
          <div className="text-muted-foreground"><Database className="w-5 h-5 text-primary" /></div>
          <span className="console-breadcrumb">{locale === 'es' ? 'ALMACENAMIENTO TOTAL' : 'TOTAL STORAGE'}</span>
          <span className="text-2xl font-mono font-bold tracking-tight">{formatBytes(metrics.suiteSummary.storageUsedBytes)}</span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-3 rounded-none relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className={`console-status-dot ${metrics.suiteSummary.systemHealth === 'HEALTHY' ? 'online' : 'error'}`} />
            <span className="font-mono text-[8px] text-muted-foreground uppercase">{metrics.suiteSummary.systemHealth}</span>
          </div>
          <div className="text-muted-foreground"><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <span className="console-breadcrumb">{locale === 'es' ? 'SALUD DE LA SUITE' : 'SUITE HEALTH'}</span>
          <span className="text-2xl font-mono font-bold tracking-tight text-foreground uppercase">{metrics.suiteSummary.systemHealth}</span>
        </div>
      </div>

      {/* Central System Status Details */}
      <div className="glass-panel p-6 rounded-none flex flex-col gap-6">
        <h3 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
          {locale === 'es' ? 'ESTADO GENERAL DEL SERVICIO' : 'GENERAL SERVICE STATE'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-xs">
          <div className="border border-border/30 p-4 flex flex-col gap-1.5 bg-card/20">
            <span className="text-muted-foreground text-[9px] uppercase tracking-wider">
              {locale === 'es' ? 'PUERTO DEL MICROSERVICIO' : 'MICROSERVICE PORT'}
            </span>
            <span className="font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              3700 (ABDAnalytics)
            </span>
          </div>
          <div className="border border-border/30 p-4 flex flex-col gap-1.5 bg-card/20">
            <span className="text-muted-foreground text-[9px] uppercase tracking-wider">
              {locale === 'es' ? 'APLICACIONES CON LICENCIA ACTIVA' : 'ACTIVE LICENSED APPS'}
            </span>
            <span className="font-bold flex items-center gap-2">
              <AppWindow className="w-4 h-4 text-primary" />
              {metrics.suiteSummary.activeLicensesCount} (AUTH, QUIZ, GOBERNANZA)
            </span>
          </div>
          <div className="border border-border/30 p-4 flex flex-col gap-1.5 bg-card/20">
            <span className="text-muted-foreground text-[9px] uppercase tracking-wider">
              {locale === 'es' ? 'ACCESOS FALLIDOS (24H)' : 'FAILED LOGINS (24H)'}
            </span>
            <span className="font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              {metrics.suiteSummary.failedLogins24h}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
