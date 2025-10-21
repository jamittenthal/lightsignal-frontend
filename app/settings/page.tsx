"use client";

import { useEffect, useState } from "react";
import { callIntent, BACKEND_URL } from "../../lib/api";
import { ConnectionCard, type Connection } from "../../components/settings/ConnectionCard";
import { ProvenancePanel } from "../../components/settings/ProvenancePanel";
import { AssistantPanel } from "../../components/settings/AssistantPanel";
import { MaskedInput, ImportExportControls } from "../../components/settings/SettingsControls";
import { AuditLog } from "../../components/settings/AuditLog";

const COMPANY_ID = "demo";

type SettingsShape = {
  mode: "demo" | "live";
  connections: Connection[];
  provenance: { baseline_source?: string | null; sources?: string[]; used_priors?: boolean; prior_weight?: number; confidence?: "low" | "medium" | "high" };
  schedule?: { next_sync_human?: string; cron?: string };
  webhooks?: Record<string, { status: string }>;
  audit?: Array<{ at: string; action: string; provider: string; result: string }>;
  assistant_suggestions?: string[];
};

const STUB: SettingsShape = {
  mode: "demo",
  connections: [
    {
      id: "quickbooks",
      name: "QuickBooks",
      category: "financials",
      status: "connected",
      last_sync_iso: "2025-10-18T14:22:10Z",
      last_sync_ms: 1840,
      data_used: ["Revenue", "Expenses", "Balance Sheet"],
      provenance: { baseline_source: "quickbooks_demo", used_priors: false, prior_weight: 0.0, confidence: "medium" },
      actions: { connect: true, test: true, resync: true, disconnect: true },
      diagnostics: { missing_scopes: [], notes: [] },
    },
    {
      id: "benchmarks",
      name: "Peer Benchmarks (Pinecone)",
      category: "benchmarks",
      status: "connected",
      last_sync_iso: "2025-10-17T09:01:00Z",
      data_used: ["Peer Ratios", "Industry Medians"],
      provenance: { baseline_source: "peers_demo", used_priors: true, prior_weight: 0.4, confidence: "medium" },
      actions: { connect: true, test: true, resync: true, disconnect: true },
    },
    {
      id: "weather",
      name: "Weather",
      category: "weather",
      status: "connected",
      last_sync_iso: "2025-10-20T12:00:00Z",
      data_used: ["Forecast", "Seasonality"],
      provenance: { baseline_source: "openweather_demo", used_priors: false, prior_weight: 0.0, confidence: "medium" },
      actions: { connect: true, test: true, resync: true, disconnect: true },
    },
    {
      id: "gdrive",
      name: "Google Drive",
      category: "documents",
      status: "disconnected",
      last_sync_iso: null,
      data_used: ["Docs"],
      provenance: { baseline_source: null, used_priors: false, prior_weight: 0.0, confidence: "low" },
      actions: { connect: true, test: false, resync: false, disconnect: false },
      diagnostics: { missing_scopes: ["drive.readonly"], notes: ["Not connected"] },
    },
  ],
  provenance: { baseline_source: "quickbooks_demo", sources: ["QuickBooks Cohort", "Public Filings"], used_priors: true, prior_weight: 0.4, confidence: "medium" },
  schedule: { next_sync_human: "Tonight at 2:00 AM", cron: "0 2 * * *" },
  webhooks: { quickbooks: { status: "ok" }, gdrive: { status: "not_configured" } },
  audit: [
    { at: "2025-10-20T12:33:00Z", action: "test", provider: "quickbooks", result: "ok" },
    { at: "2025-10-19T18:05:00Z", action: "disconnect", provider: "gdrive", result: "success" },
  ],
  assistant_suggestions: [
    "QuickBooks connected. Consider switching to Live mode to use real financials.",
    "Google Drive disconnected — missing scope drive.readonly.",
  ],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchSettings() {
    setLoading(true);
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/settings/full`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: COMPANY_ID, include_diagnostics: true }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("settings API failed");
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      // fallback to callIntent if available
      try {
        const resp = await callIntent("settings", { company_id: COMPANY_ID, include_diagnostics: true }, COMPANY_ID);
        setSettings(resp);
      } catch {
        setSettings(STUB as any);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSettings(); }, []);

  // optimistic update helpers
  function updateConnLocal(id: string, patch: Partial<Connection>) {
    setSettings((s) => {
      if (!s) return s;
      return { ...s, connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    });
  }

  async function postAction(endpoint: string, body: any, optimistic?: () => void) {
    if (optimistic) optimistic();
    try {
      setSaving(true);
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/settings/${endpoint}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: COMPANY_ID, ...body }), cache: "no-store" });
      if (!res.ok) throw new Error(`action ${endpoint} failed`);
      const data = await res.json();
      // re-fetch authoritative state
      await fetchSettings();
      return data;
    } catch (err) {
      console.error(err);
      // swallow — show toast in real app
      await fetchSettings();
    } finally {
      setSaving(false);
    }
  }

  async function handleConnectionAction(action: string, providerId: string) {
    const actionMap: Record<string, () => void> = {
      connect: () => updateConnLocal(providerId, { status: 'connected' }),
      resync: () => updateConnLocal(providerId, { last_sync_iso: new Date().toISOString() }),
      disconnect: () => updateConnLocal(providerId, { status: 'disconnected' }),
    };

    return postAction(action, { provider: providerId }, actionMap[action]);
  }

  async function handleAssistantAsk(question: string) {
    try {
      const resp = await callIntent('settings', { query: question }, COMPANY_ID);
      const answer = resp?.answer || resp?.result || JSON.stringify(resp, null, 2);
      alert(`AI Assistant: ${answer}`);
    } catch (e) {
      alert('Assistant failed to respond. Please try again.');
    }
  }

  async function toggleMode(target: "live" | "demo") {
    if (target === 'live' && settings?.mode !== 'live') {
      const ok = confirm('Switching to Live will use your connected sources. Continue?');
      if (!ok) return;
    }
    await postAction('demo-toggle', { mode: target });
  }

  async function exportSettings() {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lightsignal-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importSettingsFile(file: File) {
    const txt = await file.text();
    try {
      const json = JSON.parse(txt);
      const ok = confirm('Importing settings will overwrite current preview. Continue?');
      if (!ok) return;
      setSettings(json);
    } catch (e) {
      alert('Invalid JSON file');
    }
  }

  async function saveApiKey(provider: string, key: string) {
    return postAction('api-key', { provider, key });
  }

  if (!settings) {
    // shimmer placeholders
    return (
      <main className="space-y-4">
        <h2 className="text-xl font-semibold">Settings & Data Connections</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-white animate-pulse h-40" />
          <div className="p-4 rounded-xl border bg-white animate-pulse h-40" />
          <div className="p-4 rounded-xl border bg-white animate-pulse h-40" />
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Settings & Data Connections</h2>
          <p className="text-sm text-gray-600">Manage integrations, demo/live mode, and API connections.</p>
        </div>
        <div className="text-sm">
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">Mode: {settings.mode.toUpperCase()}</div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={settings.mode === 'live'} onChange={(e) => toggleMode(e.target.checked ? 'live' : 'demo')} />
              <span className="text-sm">Demo / Live</span>
            </label>
          </div>
          <div className="mt-1 text-xs text-gray-400">Demo mode uses sample data; Live mode uses your connected sources (QuickBooks, peers, weather)</div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.connections.map((conn) => (
              <ConnectionCard key={conn.id} conn={conn} onAction={handleConnectionAction} />
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl border bg-white">
            <h3 className="font-semibold">Sync Schedule & Webhooks</h3>
            <div className="mt-2 text-sm text-gray-700">Next scheduled sync: {settings.schedule?.next_sync_human ?? '—'}</div>
            <div className="mt-2 text-sm text-gray-700">Cron: {settings.schedule?.cron ?? '—'}</div>
            <div className="mt-3">
              <h4 className="text-sm font-semibold">Webhooks</h4>
              <ul className="mt-2 text-sm">
                {Object.keys(settings.webhooks || {}).map((k) => (
                  <li key={k}>{k}: {(settings.webhooks as any)[k].status}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl border bg-white">
            <h3 className="font-semibold">API Keys & Secrets</h3>
            <div className="mt-2 text-sm text-gray-600">API keys are masked and never displayed after save.</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <MaskedInput
                label="Weather API Key"
                onSaveAndTest={(key) => saveApiKey('weather', key)}
              />
              <MaskedInput
                label="RFP Aggregator Key"
                onSaveAndTest={(key) => saveApiKey('rfp', key)}
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl border bg-white">
            <ImportExportControls
              onExport={exportSettings}
              onImport={importSettingsFile}
            />
            <div className="mt-4">
              <AuditLog entries={settings.audit || []} />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <ProvenancePanel provenance={settings.provenance || {}} />
          <AssistantPanel 
            suggestions={settings.assistant_suggestions || []}
            onAsk={handleAssistantAsk}
          />
          <div className="border rounded-xl bg-white p-4">
            <h3 className="font-semibold">Permissions & Scopes</h3>
            <div className="mt-2 text-sm text-gray-700">
              {settings.connections.map((c) => (
                <div key={c.id} className="mt-2">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-500">Requested scopes: {(c.diagnostics?.missing_scopes && c.diagnostics.missing_scopes.length) ? c.diagnostics.missing_scopes.join(', ') : '—'}</div>
                  <div className="mt-1 text-xs">Limit scope <input type="checkbox" className="ml-2" /></div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {saving && <div className="text-sm text-gray-600">Saving...</div>}
    </main>
  );
}
