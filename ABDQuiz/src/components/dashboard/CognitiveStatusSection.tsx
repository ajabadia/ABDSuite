'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import type { CourseProgress, ObjectiveProgress } from '@/actions/course-progress';

interface CognitiveStatusSectionProps {
  courses: CourseProgress[];
}

export function CognitiveStatusSection({ courses }: CognitiveStatusSectionProps) {
  const d = useTranslations('dashboard');
  const a = useTranslations('analytics');

  const allObjectives = courses.flatMap(c => c.objectives);

  const strengths = allObjectives.filter(o => o.status === 'mastered');
  const weaknesses = allObjectives.filter(o => o.status === 'in_progress');

  if (strengths.length === 0 && weaknesses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground">
          {d('cognitiveProfile')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-emerald-500 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {a('cognitiveStrength')} ({strengths.length})
          </h3>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {strengths.length > 0 ? (
              strengths.map(obj => (
                <div
                  key={`${obj.module}-${obj.objectiveIndex}`}
                  className="p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 font-mono text-[10px] flex justify-between items-center"
                >
                  <span className="truncate max-w-[80%]" title={obj.objectiveText}>
                    {obj.module} &bull; {obj.objectiveText}
                  </span>
                  <span className="font-bold shrink-0">{obj.accuracy}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic font-sans">{d('noStrengths')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-amber-500 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {a('cognitiveWeakness')} ({weaknesses.length})
          </h3>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {weaknesses.length > 0 ? (
              weaknesses.map(obj => (
                <div
                  key={`${obj.module}-${obj.objectiveIndex}`}
                  className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-300 font-mono text-[10px] flex justify-between items-center"
                >
                  <span className="truncate max-w-[80%]" title={obj.objectiveText}>
                    {obj.module} &bull; {obj.objectiveText}
                  </span>
                  <span className="font-bold shrink-0">{obj.accuracy}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic font-sans">{d('noWeaknesses')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
