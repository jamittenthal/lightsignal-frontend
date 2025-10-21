import { useState } from "react";

export type Connection = {
  id: string;
  name: string;
  category?: string;
  status: "connected" | "disconnected" | "error";
  last_sync_iso?: string | null;
  last_sync_ms?: number;
  data_used?: string[];
  provenance?: {
    baseline_source: string | null;
    used_priors: boolean;
    prior_weight: number;
    confidence: "low" | "medium" | "high";
  };
  actions?: {
    connect?: boolean;
    test?: boolean;
    resync?: boolean;
    disconnect?: boolean;
  };
  diagnostics?: {
    missing_scopes?: string[];
    notes?: string[];
  };
};

interface ConnectionCardProps {
  conn: Connection;
  onAction: (action: string, providerId: string) => Promise<void>;
}

export function ConnectionCard({ conn, onAction }: ConnectionCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      await onAction(action, conn.id);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = 
    conn.status === 'connected' ? 'text-emerald-600' :
    conn.status === 'error' ? 'text-rose-600' : 'text-gray-600';

  return (
    <div className="border rounded-xl bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-sm font-semibold">
              {conn.name[0]}
            </div>
            <div>
              <div className="font-semibold">{conn.name}</div>
              <div className="text-xs text-gray-500">{conn.category ?? "—"}</div>
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className={statusColor}>
            {conn.status}
          </div>
          <div className="text-xs text-gray-400">
            {conn.last_sync_iso ? new Date(conn.last_sync_iso).toLocaleDateString() : "—"}
          </div>
          {conn.last_sync_ms && (
            <div className="text-xs text-gray-400">
              {conn.last_sync_ms}ms
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        <div className="text-xs text-gray-500">Data used</div>
        <div className="mt-1">
          {(conn.data_used || []).length ? (conn.data_used || []).join(", ") : "—"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {conn.actions?.connect && conn.status !== 'connected' && (
          <button
            onClick={() => handleAction('connect')}
            disabled={loading}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Connect
          </button>
        )}
        {conn.actions?.test && (
          <button
            onClick={() => handleAction('test')}
            disabled={loading}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Test
          </button>
        )}
        {conn.actions?.resync && conn.status === 'connected' && (
          <button
            onClick={() => handleAction('resync')}
            disabled={loading}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Re-sync
          </button>
        )}
        {conn.actions?.disconnect && conn.status === 'connected' && (
          <button
            onClick={() => handleAction('disconnect')}
            disabled={loading}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
        <div className="px-2 py-1 bg-slate-50 rounded text-xs">
          {conn.provenance?.baseline_source ?? '—'}
        </div>
        {conn.status === 'error' && (
          <div className="w-full mt-2 p-2 bg-rose-50 text-rose-700 rounded text-xs">
            Error: {conn.diagnostics?.notes?.join(', ') || 'Connection failed'} — 
            <button className="underline ml-1">View diagnostics</button>
          </div>
        )}
      </div>
    </div>
  );
}