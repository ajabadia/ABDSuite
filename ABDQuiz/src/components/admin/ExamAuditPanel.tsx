'use client';

/**
 * @purpose Renderiza un panel interativo y visual para que los profesores puedan auditorizar la cobertura objetiva del currículum en una prueba.
 * @purpose_en Renders an interactive and visual panel for teachers to audit curriculum objective coverage in an exam.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:19auwqv
 * @lastUpdated 2026-06-23T23:21:27.889Z
 */

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExamAuditReport } from '../../services/quiz/ExamAuditorService';

interface ExamAuditPanelProps {
  report: ExamAuditReport;
  onClose?: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  sufficient: 'bg-emerald-950/60 text-emerald-450 border border-emerald-900',
  scarce: 'bg-amber-950/60 text-amber-450 border border-amber-900',
  missing: 'bg-red-950/60 text-red-450 border border-red-900',
};

export default function ExamAuditPanel({ report, onClose }: ExamAuditPanelProps) {
  const t = useTranslations('admin');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sufficient' | 'scarce' | 'missing'>('all');

  const filteredDetails = report.details.filter(d => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const filterLabelKey = (status: string) => {
    switch (status) {
      case 'all': return 'filterAll';
      case 'sufficient': return 'filterSufficient';
      case 'scarce': return 'filterScarce';
      case 'missing': return 'filterMissing';
      default: return 'filterAll';
    }
  };

  const statusLabelKey = (status: string) => {
    switch (status) {
      case 'sufficient': return 'statusSufficient';
      case 'scarce': return 'statusScarce';
      case 'missing': return 'statusMissing';
      default: return '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🛡️</span> {t('examAuditTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('examAuditAnalyzing')}: <span className="font-semibold text-slate-200">{report.examName}</span>
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            aria-label={t('close')}
          >
            {t('close')}
          </button>
        )}
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-slate-450 uppercase tracking-wider">{t('coveragePercent')}</span>
          <span className="text-3xl font-extrabold text-amber-500 mt-2">{report.coveragePercentage}%</span>
          <span className="text-xs text-slate-400 mt-1">
            {report.coveredObjectives} {t('coveredObjectives', { total: report.totalObjectives })}
          </span>
        </div>

        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-slate-450 uppercase tracking-wider">{t('uncoveredObjectives')}</span>
          <span className="text-3xl font-extrabold text-red-500 mt-2">
            {report.details.filter(d => d.status === 'missing').length}
          </span>
          <span className="text-xs text-slate-400 mt-1">{t('requireNewQuestions')}</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-slate-450 uppercase tracking-wider">{t('unclassifiedQuestions')}</span>
          <span className="text-3xl font-extrabold text-cyan-500 mt-2">{report.unclassifiedQuestionsCount}</span>
          <span className="text-xs text-slate-400 mt-1">{t('needsObjectiveAssoc')}</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-400">{t('filterObjectives')}:</span>
        {(['all', 'sufficient', 'scarce', 'missing'] as const).map(status => {
          const count = status === 'all' 
            ? report.details.length 
            : report.details.filter(d => d.status === status).length;

          const label = t(filterLabelKey(status));
          const isActive = filterStatus === status;
          
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              aria-label={`${label} (${count})`}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                isActive 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'bg-slate-800 text-slate-350 hover:bg-slate-750'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* List of Details */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-850 text-xs font-semibold text-slate-400 tracking-wider">
              <th className="p-3 pl-4">{t('codeHeader')}</th>
              <th className="p-3">{t('objectiveHeader')}</th>
              <th className="p-3 text-center">{t('questionsHeader')}</th>
              <th className="p-3 pr-4 text-center">{t('statusHeader')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-sm">
            {filteredDetails.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-450 italic">
                  {t('noObjectivesFilter')}
                </td>
              </tr>
            ) : (
              filteredDetails.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30 transition">
                  <td className="p-3 pl-4 font-mono text-xs text-slate-400">
                    {item.module}-{item.block}.{item.objectiveIndex}
                  </td>
                  <td className="p-3 text-slate-200 text-xs leading-relaxed max-w-md">
                    {item.objectiveText}
                  </td>
                  <td className="p-3 text-center font-semibold font-mono text-xs text-slate-300">
                    {item.questionCount}
                  </td>
                  <td className="p-3 pr-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[item.status] || ''}`}>
                      {t(statusLabelKey(item.status))}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
