'use client';

/**
 * @purpose Gestiona y muestra una lista de incidentes abiertos, permitiendo a los administradores visualizar mensajes, enviar respuestas y resolver incidentes.
 * @purpose_en Manages and displays a list of open incidents, allowing administrators to view messages, send responses, and resolve incidents.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:s11ovq
 * @lastUpdated 2026-07-02T18:47:19.451Z
 */

import { useState, useEffect, useCallback, startTransition, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Send, MessageSquare, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { listOpenIncidentsAction, getIncidentMessagesAction, sendIncidentMessageAction, resolveIncidentAction } from '@/actions/incidents';
import { cn } from '@/lib/utils';

interface IncidentSummary {
  _id: string;
  attemptId: string;
  studentId: string;
  status: 'open' | 'resolved';
  messageCount: number;
  lastMessage: { text: string; sender: string; createdAt: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  sender: 'student' | 'professor';
  text: string;
  createdAt: string;
}

export function IncidentsManager({ tenantId }: { tenantId: string }) {
  const t = useTranslations('admin');
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const result = await listOpenIncidentsAction(tenantId);
      if (result.success && result.data) {
        setIncidents(result.data as IncidentSummary[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    startTransition(() => { fetchIncidents(); });
    const interval = setInterval(() => { fetchIncidents(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const loadMessages = useCallback(async (incidentId: string) => {
    const inc = incidents.find(i => i._id === incidentId);
    if (!inc) return;
    setMessagesLoading(true);
    setSelectedId(incidentId);
    try {
      const result = await getIncidentMessagesAction(inc.attemptId, undefined, tenantId);
      if (result.success && result.messages) {
        setMessages(result.messages as ChatMessage[]);
      }
    } catch {
      // silent
    } finally {
      setMessagesLoading(false);
    }
  }, [incidents, tenantId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedId || sending) return;
    const inc = incidents.find(i => i._id === selectedId);
    if (!inc) return;
    setSending(true);
    try {
      await sendIncidentMessageAction(inc.attemptId, input.trim(), tenantId);
      setInput('');
      await loadMessages(selectedId);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    setResolving(incidentId);
    try {
      await resolveIncidentAction(incidentId, tenantId);
      await fetchIncidents();
      if (selectedId === incidentId) {
        setSelectedId(null);
        setMessages([]);
      }
    } catch {
      // silent
    } finally {
      setResolving(null);
    }
  };

  const filteredIncidents = incidents.filter(inc => filter === 'all' || inc.status === filter);
  const selectedIncident = incidents.find(i => i._id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {(['open', 'resolved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider border transition-all cursor-pointer',
                filter === f ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-transparent border-border text-muted-foreground hover:border-primary/30'
              )}
              aria-label={f === 'open' ? t('incidentsFilterOpen') : f === 'resolved' ? t('incidentsFilterResolved') : t('incidentsFilterAll')}
            >
              {f === 'open' ? t('incidentsFilterOpen') : f === 'resolved' ? t('incidentsFilterResolved') : t('incidentsFilterAll')}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-mono text-[10px] text-muted-foreground">{t('incidentsLoading')}</p>
        ) : filteredIncidents.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground">{t('incidentsEmpty')}</p>
        ) : (
          filteredIncidents.map((inc) => (
            <button
              key={inc._id}
              onClick={() => loadMessages(inc._id)}
              aria-label={`${inc.studentId.slice(0, 12)}...`}
              className={cn(
                'flex flex-col gap-2 p-4 border text-left transition-all cursor-pointer',
                selectedId === inc._id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-card/20 border-border hover:border-primary/30 hover:bg-card/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {inc.status === 'open' ? (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {inc.studentId.slice(0, 12)}...
                  </span>
                </div>
                <span className="font-mono text-[8px] text-muted-foreground">
                  {t('incidentsMessageCount', { count: inc.messageCount })}
                </span>
              </div>
              {inc.lastMessage && (
                <p className="font-mono text-[9px] text-foreground truncate">
                  {inc.lastMessage.text}
                </p>
              )}
              <span className="font-mono text-[8px] text-muted-foreground">
                {new Date(inc.updatedAt).toLocaleString()}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="lg:col-span-2 flex flex-col gap-4">
        {!selectedIncident ? (
          <div className="flex items-center justify-center h-64 border border-dashed border-border">
            <p className="font-mono text-[10px] text-muted-foreground">
              {t('incidentsSelectOne')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 bg-card/20 border border-border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-foreground font-bold">
                    Incidencia
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground">
                    {t('incidentStudent')} {selectedIncident.studentId}
                  </span>
                </div>
              </div>
              {selectedIncident.status === 'open' && (
                <button
                  onClick={() => handleResolve(selectedIncident._id)}
                  disabled={resolving === selectedIncident._id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-700/40 text-green-400 font-mono text-[9px] uppercase tracking-wider hover:bg-green-900/30 transition-all disabled:opacity-30 cursor-pointer"
                  aria-label={t('incidentsResolve')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {resolving === selectedIncident._id ? t('incidentsResolving') : t('incidentsResolve')}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-96 p-4 flex flex-col gap-3 bg-black/10 border border-border">
              {messagesLoading ? (
                <p className="font-mono text-[10px] text-muted-foreground text-center py-8">{t('incidentsLoadingMessages')}</p>
              ) : messages.length === 0 ? (
                <p className="font-mono text-[10px] text-muted-foreground text-center py-8">
                  {t('incidentsNoMessages')}
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[75%] px-4 py-3',
                      msg.sender === 'student'
                        ? 'ml-auto bg-primary/20 border border-primary/30'
                        : 'mr-auto bg-white/5 border border-border'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                        {msg.sender === 'student' ? t('incidentSenderStudent') : t('incidentSenderProfessor')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.text}</p>
                    <span className="font-mono text-[8px] text-muted-foreground block mt-2">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedIncident.status === 'open' && (
              <div className="flex items-center gap-3 p-4 bg-card/20 border border-border">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={t('incidentsReplyPlaceholder')}
                  disabled={sending}
                  className="flex-1 bg-black/30 border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="p-3 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all disabled:opacity-30 cursor-pointer"
                  aria-label={t('incidentChatSend')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
