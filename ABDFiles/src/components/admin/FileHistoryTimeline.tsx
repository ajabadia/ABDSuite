'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, DownloadCloud, RefreshCw, Trash2, Loader2 } from 'lucide-react';

interface FileEvent {
  eventId: string;
  action: 'UPLOAD' | 'DOWNLOAD' | 'OVERWRITE' | 'DELETE';
  userId: string;
  fileHash: string;
  fileSize: number;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  UPLOAD: <UploadCloud className="w-4 h-4 text-emerald-400" />,
  DOWNLOAD: <DownloadCloud className="w-4 h-4 text-sky-400" />,
  OVERWRITE: <RefreshCw className="w-4 h-4 text-amber-400" />,
  DELETE: <Trash2 className="w-4 h-4 text-red-400" />,
};

export default function FileHistoryTimeline({ assetId }: { assetId: string }) {
  const [events, setEvents] = useState<FileEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/documents/${assetId}/file-events`);
      if (res.ok) setEvents(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, [assetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <span className="font-mono text-[10px] text-muted-foreground uppercase">
        No file events recorded
      </span>
    );
  }

  return (
    <div className="relative flex flex-col gap-0">
      {events.map((evt, idx) => (
        <div key={evt.eventId} className="flex gap-3 relative pb-5 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-card/60 border border-border/40 flex items-center justify-center z-10">
              {ACTION_ICON[evt.action]}
            </div>
            {idx < events.length - 1 && (
              <div className="w-px flex-1 bg-border/30 mt-0" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1 font-mono text-[10px] flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-foreground">
                {evt.action}
              </span>
              <span className="text-[8px] text-muted-foreground ml-auto shrink-0">
                {new Date(evt.createdAt).toLocaleString()}
              </span>
            </div>
            <span className="text-[8px] text-muted-foreground break-all">
              SHA-256: {evt.fileHash}
            </span>
            <span className="text-[8px] text-muted-foreground">
              {(evt.fileSize / 1024).toFixed(2)} KB &mdash; {evt.userId}
              {evt.ipAddress && ` — ${evt.ipAddress}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
