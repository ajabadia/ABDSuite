'use client';

/**
 * @purpose Renderiza una plantilla para editar y probar instrucciones de inteligencia artificial, incluyendo plantillas del sistema y del usuario, configuraciones de temperatura y funcionalidad de prueba.
 * @purpose_en Renders a form for editing and testing AI prompts, including system and user templates, temperature settings, and test functionality.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:7,sig:qb4vrj
 * @lastUpdated 2026-07-02T18:09:59.623Z
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Brain, Eye, Play, Loader2, Save } from 'lucide-react';
import { testPromptAction } from '@/actions/prompt-actions';
import { extractPromptVariables } from '@/services/ai/promptUtils';

interface FormState {
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
}

const INITIAL_FORM: FormState = {
  name: '',
  systemPrompt: '',
  userPromptTemplate: '',
  temperature: 0.7,
};

interface PromptEditorProps {
  editingId: string;
  form: FormState;
  error: string | null;
  saving: boolean;
  onChange: (form: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PromptEditor({
  editingId,
  form,
  error,
  saving,
  onChange,
  onSave,
  onCancel,
}: PromptEditorProps) {
  const [testVars, setTestVars] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTest = async (systemPrompt: string, userTemplate: string) => {
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);

    const result = await testPromptAction({
      systemPrompt,
      userPromptTemplate: userTemplate,
      variables: testVars,
    });

    if (result.success && result.data) {
      setTestResult(result.data);
    } else {
      setTestError(result.error || 'Test failed');
    }

    setTestLoading(false);
  };

  const setForm = (partial: Partial<FormState>) => onChange({ ...form, ...partial });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-6">
        <Card className="p-6 bg-card/30 border-border rounded-none">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground">
              {editingId === 'new' ? 'New Prompt Template' : 'Edit Prompt Template'}
            </h2>
          </div>

          <Separator className="bg-border mb-6" />

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Name *
              </label>
              <input
                type="text"
                className="w-full bg-transparent border border-border px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-none"
                placeholder="e.g. question_generation"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                System Prompt *
              </label>
              <textarea
                className="w-full bg-transparent border border-border px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-none min-h-[120px] resize-y"
                value={form.systemPrompt}
                onChange={(e) => setForm({ systemPrompt: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                User Prompt Template *
              </label>
              <textarea
                className="w-full bg-transparent border border-border px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-none min-h-[120px] resize-y font-mono"
                value={form.userPromptTemplate}
                onChange={(e) => {
                  setForm({ userPromptTemplate: e.target.value });
                  setTestVars({});
                }}
              />
              <p className="text-[8px] font-mono text-muted-foreground/50 mt-1">
                Use {'{{variable}}'} placeholders. Variables are auto-detected from the template.
              </p>

              {form.userPromptTemplate && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {extractPromptVariables(form.userPromptTemplate).map((v) => (
                    <span key={v} className="text-[8px] font-mono px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary">
                      {'{{'}{v}{'}}'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  className="w-full bg-transparent border border-border px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-none"
                  value={form.temperature}
                  onChange={(e) => setForm({ temperature: parseFloat(e.target.value) || 0.7 })}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                className="rounded-none font-mono text-[10px] tracking-widest uppercase h-11 px-6"
                onClick={onSave}
                disabled={saving || !form.name || !form.systemPrompt || !form.userPromptTemplate}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
              <Button
                variant="outline"
                className="rounded-none font-mono text-[10px] tracking-widest uppercase h-11 px-6"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="p-6 bg-card/30 border-border rounded-none">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-foreground">
              Test Playground
            </h2>
          </div>

          <Separator className="bg-border mb-6" />

          <div className="flex flex-col gap-4">
            <p className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider">
              Enter test values for each detected variable:
            </p>

            {extractPromptVariables(form.userPromptTemplate).map((key) => (
              <div key={key}>
                <label className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground mb-1 block">
                  {'{{'}{key}{'}}'}
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent border border-border px-3 py-2 text-[10px] font-mono text-foreground focus:outline-none focus:border-primary rounded-none"
                  placeholder={`Value for ${key}`}
                  value={testVars[key] || ''}
                  onChange={(e) => setTestVars({ ...testVars, [key]: e.target.value })}
                />
              </div>
            ))}

            <Button
              className="rounded-none font-mono text-[10px] tracking-widest uppercase h-11 px-6 mt-2"
              variant="outline"
              onClick={() => handleTest(form.systemPrompt, form.userPromptTemplate)}
              disabled={testLoading}
            >
              {testLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-2" />
              )}
              {testLoading ? 'Generating...' : 'Test Prompt'}
            </Button>

            {testError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400 mt-2">
                {testError}
              </div>
            )}

            {testResult && (
              <div className="mt-4">
                <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
                  Generated Output:
                </label>
                <div className="p-4 bg-black/20 border border-border/50 text-[11px] font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto rounded-none">
                  {testResult}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export { INITIAL_FORM };
export type { FormState };
