'use client';

/**
 * @purpose Gestiona el rendimiento y la funcionalidad del drawer de chat para mensajes de incidentes en una aplicación ABDQuiz.
 * @purpose_en Manages the rendering and functionality of a chat drawer for incident messages in an ABDQuiz application.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:r25a9o
 * @lastUpdated 2026-07-02T18:47:30.936Z
 */

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, X, Send, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { getIncidentMessagesAction, sendIncidentMessageAction } from '@/actions/incidents';
import { cn } from '@/lib/utils';

interface ChatMessage {
  sender: 'student' | 'professor';
  text: string;
  createdAt: string;
}

interface IncidentChatDrawerProps {
  attemptId: string;
  tenantId: string;
}

const POLL_INTERVAL_MS = 6000;

export function IncidentChatDrawer({ attemptId, tenantId: _tenantId }: IncidentChatDrawerProps) {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [_incidentId, setIncidentId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const lastPolledAtRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  const fetchMessages = useCallback(async () => {
    try {
      const result = await getIncidentMessagesAction(attemptId, lastPolledAtRef.current ?? undefined);
      if (result.success && result.messages) {
        if (result.incidentId) {
          setIncidentId(result.incidentId);
        }
        if (result.messages.length > 0) {
          setMessages(result.messages as ChatMessage[]);
          if (lastPolledAtRef.current && !openRef.current) {
            setUnread(prev => prev + (result.messages as ChatMessage[]).filter(m => m.sender === 'professor').length);
          }
        }
      }
      lastPolledAtRef.current = new Date().toISOString();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    startTransition(() => { fetchMessages(); });
    const interval = setInterval(() => {
      startTransition(() => { fetchMessages(); });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expanded, messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendIncidentMessageAction(attemptId, input.trim());
      if (result.success) {
        setInput('');
        lastPolledAtRef.current = null;
        await fetchMessages();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-primary-foreground border border-primary/50 shadow-xl hover:bg-primary/90 transition-all cursor-pointer"
        aria-label={t('incidentChatOpen')}
      >
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-mono font-bold px-1 leading-none rounded-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <MessageSquare className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 flex flex-col bg-card border border-border shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-foreground font-bold">
            {t('incidentChatTitle')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setExpanded(!expanded); setUnread(0); }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('incidentChatMinimize')}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('incidentChatClose')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="flex-1 overflow-y-auto max-h-60 p-3 flex flex-col gap-2 bg-black/10">
            {loading ? (
              <p className="text-[9px] font-mono text-muted-foreground text-center py-4">{t('incidentChatLoading')}</p>
            ) : messages.length === 0 ? (
              <p className="text-[9px] font-mono text-muted-foreground text-center py-4">
                {t('incidentChatEmpty')}
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[80%] px-3 py-2 text-[11px] leading-relaxed',
                    msg.sender === 'student'
                      ? 'ml-auto bg-primary/20 border border-primary/30'
                      : 'mr-auto bg-white/5 border border-border'
                  )}
                >
                  <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground block mb-1">
                    {msg.sender === 'student' ? t('incidentChatYou') : t('incidentChatProfessor')}
                  </span>
                  <p className="text-foreground break-words">{msg.text}</p>
                  <span className="font-mono text-[7px] text-muted-foreground block mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t('incidentChatPlaceholder')}
              disabled={sending}
              className="flex-1 bg-black/20 border border-border px-3 py-2 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="p-2 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all disabled:opacity-30 cursor-pointer"
              aria-label={t('incidentChatSend')}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
