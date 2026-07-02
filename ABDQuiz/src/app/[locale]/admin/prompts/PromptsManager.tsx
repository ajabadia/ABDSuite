'use client';

/**
 * @purpose Gestiona plantilla CRUD con editor, lista y test playground.
 * @purpose_en Manages prompt template CRUD with editor, listing, and test playground.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:7,sig:4ptdu0
 * @lastUpdated 2026-06-26T10:02:23.832Z
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Loader2 } from 'lucide-react';
import {
  getPromptTemplatesAction,
  savePromptTemplateAction,
  togglePromptTemplateActiveAction,
  type PromptTemplateData,
} from '@/actions/prompt-actions';
import { PromptCard } from './PromptCard';
import { PromptEditor, INITIAL_FORM, type FormState } from './PromptEditor';

interface PromptsManagerProps {
  tenantId: string;
  tenantSuffix: string;
}

export function PromptsManager({ tenantId, tenantSuffix }: PromptsManagerProps) {
  const [prompts, setPrompts] = useState<PromptTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refreshPrompts = useCallback(async () => {
    setLoading(true);
    const result = await getPromptTemplatesAction(tenantId);
    if (result.success && result.data) {
      setPrompts(result.data);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshPrompts();
  }, [refreshPrompts]);

  const handleEdit = (p: PromptTemplateData) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      systemPrompt: p.systemPrompt,
      userPromptTemplate: p.userPromptTemplate,
      temperature: p.temperature,
    });
    setError(null);
  };

  const handleNew = () => {
    setEditingId('new');
    setForm(INITIAL_FORM);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await savePromptTemplateAction(
      {
        name: form.name,
        systemPrompt: form.systemPrompt,
        userPromptTemplate: form.userPromptTemplate,
        temperature: form.temperature,
      },
      tenantId
    );

    if (result.success) {
      setEditingId(null);
      setForm(INITIAL_FORM);
      await refreshPrompts();
    } else {
      setError(result.error || 'Error saving prompt template');
    }

    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    await togglePromptTemplateActiveAction(id, tenantId);
    await refreshPrompts();
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError(null);
  };

  const activePrompts = prompts.filter((p) => p.active);
  const inactivePrompts = prompts.filter((p) => !p.active);

  if (editingId) {
    return (
      <PromptEditor
        editingId={editingId}
        form={form}
        error={error}
        saving={saving}
        onChange={setForm}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground">
            Prompt Templates
          </h2>
        </div>
        <Button
          className="rounded-none font-mono text-[10px] tracking-widest uppercase h-11 px-6"
          onClick={handleNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : prompts.length === 0 ? (
        <Card className="p-10 bg-card/20 border-border rounded-none flex flex-col items-center justify-center text-center gap-4">
          <Brain className="w-10 h-10 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            No prompt templates configured. Create the first one to start customizing AI behavior.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
              ACTIVE ({activePrompts.length})
            </span>
            {activePrompts.map((p) => (
              <PromptCard
                key={p._id}
                prompt={p}
                onEdit={() => handleEdit(p)}
                onToggle={() => handleToggle(p._id)}
              />
            ))}
          </div>

          {inactivePrompts.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
                ARCHIVED VERSIONS ({inactivePrompts.length})
              </span>
              {inactivePrompts.map((p) => (
                <PromptCard
                  key={p._id}
                  prompt={p}
                  onEdit={() => handleEdit(p)}
                  onToggle={() => handleToggle(p._id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
