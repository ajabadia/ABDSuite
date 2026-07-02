'use client';

/**
 * @purpose Renderiza un componente de tarjeta para mostrar y gestionar plantillas de instrucciones, incluyendo su estado, versión y acciones como editar y archivar/reactivar.
 * @purpose_en Renders a card component for displaying and managing prompt templates, including their status, version, and actions like edit and archive/reactivate.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:u356pq
 * @lastUpdated 2026-07-02T18:09:57.625Z
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle2, XCircle, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { type PromptTemplateData } from '@/actions/prompt-actions';

interface PromptCardProps {
  prompt: PromptTemplateData;
  onEdit: () => void;
  onToggle: () => void;
}

export function PromptCard({ prompt, onEdit, onToggle }: PromptCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-5 bg-card/30 border-border rounded-none hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Brain className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <span className="text-sm font-bold font-mono uppercase tracking-tight">
              {prompt.name}
            </span>
            <span className="ml-3 text-[8px] font-mono text-muted-foreground/50">
              v{prompt.version}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {prompt.active ? (
            <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-500 uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              <XCircle className="w-3 h-3" /> Archived
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60 block mb-1">
                Temperature
              </span>
              <span className="text-xs font-mono text-foreground">{prompt.temperature}</span>
            </div>
            <div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60 block mb-1">
                Required Variables
              </span>
              <div className="flex flex-wrap gap-1">
                {prompt.requiredVariables.map((v) => (
                  <span key={v} className="text-[8px] font-mono px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary">
                    {'{{'}{v}{'}}'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60 block mb-1">
              System Prompt
            </span>
            <div className="p-3 bg-black/10 border border-border/30 text-[10px] font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed max-h-[100px] overflow-y-auto rounded-none">
              {prompt.systemPrompt}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60 block mb-1">
              User Prompt Template
            </span>
            <div className="p-3 bg-black/10 border border-border/30 text-[10px] font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed max-h-[100px] overflow-y-auto rounded-none">
              {prompt.userPromptTemplate}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="rounded-none font-mono text-[8px] tracking-widest uppercase h-9 px-4"
              onClick={onEdit}
            >
              <Save className="w-3 h-3 mr-1.5" />
              Edit
            </Button>
            {prompt.active ? (
              <Button
                variant="outline"
                className="rounded-none font-mono text-[8px] tracking-widest uppercase h-9 px-4"
                onClick={onToggle}
              >
                <XCircle className="w-3 h-3 mr-1.5" />
                Archive
              </Button>
            ) : (
              <Button
                variant="outline"
                className="rounded-none font-mono text-[8px] tracking-widest uppercase h-9 px-4 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={onToggle}
              >
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                Reactivate
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
