'use client';

/**
 * @purpose Renderiza un componente de tabla para el sistema de gestión de aprendizaje (LMS) en la aplicación ABDAnalytics, mostrando distribución de calificaciones y análisis de preguntas gráficos.
 * @purpose_en Renders a tab component for the LMS (Learning Management System) in the ABDAnalytics application, displaying grade distribution and question analysis charts.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1cfnjug
 * @lastUpdated 2026-06-21T09:13:07.254Z
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
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import type { DashboardMetrics } from '@/types/dashboard-metrics';
import { CustomTooltip } from './CustomTooltip';

interface LmsTabProps {
  metrics: DashboardMetrics;
}

const CHART_COLORS = [
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
];

export default function LmsTab({ metrics }: LmsTabProps) {
  const t = useTranslations('analytics');
  const gradeDistributionData = [
    { name: t('fail'), count: metrics.lms.gradeDistribution.fail },
    { name: t('pass'), count: metrics.lms.gradeDistribution.pass },
    { name: t('remarkable'), count: metrics.lms.gradeDistribution.remarkable },
    { name: t('outstanding'), count: metrics.lms.gradeDistribution.outstanding }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gauss Grade Distribution Chart */}
        <div className="glass-panel p-6 rounded-none flex flex-col gap-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            {t('gradeDistribution')}
          </h4>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="hsl(188 85% 48%)" radius={0}>
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning curve progression */}
        <div className="glass-panel p-6 rounded-none flex flex-col gap-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            {t('learningCurve')}
          </h4>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.lms.learningCurve} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} className="font-mono" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="averageGrade" stroke="hsl(188 85% 48%)" fill="rgba(14, 165, 233, 0.1)" radius={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distractor Telemetry */}
      <div className="glass-panel p-6 rounded-none flex flex-col gap-6">
        <h4 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
          {t('distractorTelemetry')}
        </h4>
        <div className="flex flex-col gap-4">
          {metrics.lms.distractorTelemetry.map((q, idx) => (
            <div key={idx} className="border border-border/30 p-5 bg-card/20 flex flex-col gap-3 font-mono text-xs">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                <span className="font-bold uppercase tracking-wide text-foreground">{q.questionText}</span>
                <span className="px-2 py-0.5 border border-destructive/30 text-destructive text-[10px] uppercase font-bold w-fit">
                  {t('failRate', { rate: q.incorrectRate })}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {q.optionsFrequency.map((opt, oIdx) => (
                  <div key={oIdx} className="p-2 border border-border/30 bg-background/50 flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-[8px] uppercase">OPCIÓN {opt.optionIndex}</span>
                    <span className="font-bold text-primary">{opt.frequency}% Frec.</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
