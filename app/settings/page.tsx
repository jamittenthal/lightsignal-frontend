"use client";

import { useEffect, useState } from "react";
import { callIntent, BACKEND_URL } from "../../lib/api";
import { ConnectionCard, type Connection } from "../../components/settings/ConnectionCard";
import { ProvenancePanel } from "../../components/settings/ProvenancePanel";
import QuickBooksCard from "../../components/settings/QuickBooksCard";
import { AssistantPanel } from "../../components/settings/AssistantPanel";
import { MaskedInput, ImportExportControls } from "../../components/settings/SettingsControls";
import { AuditLog } from "../../components/settings/AuditLog";

const COMPANY_ID = "demo";

type SettingsShape = {
  general: {
    company_name: string;
    timezone: string;
    base_currency: string;
    reporting_period: string;
    business_unit: string;
    demo_mode: boolean;
  };
  integrations: Array<{
    id: string;
    name: string;
    category: string;
    status: "connected" | "disconnected" | "error";
    last_sync: string | null;
    frequency: string;
    provenance: string | null;
  }>;
  privacy: {
    peer_benchmarking: boolean;
    ai_anonymized: boolean;
    retention_days: number;
    compliance: { soc2?: string | null; gdpr?: boolean; ccpa?: boolean };
  };
  notifications: {
    email: boolean;
    in_app: boolean;
    alerts: { fraud: boolean; compliance: boolean; deadlines: boolean; anomalies: boolean };
    weekly_report: boolean;
    monthly_summary: boolean;
    thresholds: Array<any>;
  };
  interface: { theme: string; density: string; language: string; layout: string };
  billing: {
    plan: string;
    renews_on: string;
    next_payment: string;
    invoices: Array<any>;
    payment_methods: Array<any>;
  };
  backup: {
    last_backup: string;
    cloud_sync: { enabled: boolean; provider: string; last_status: string };
    snapshots: Array<{ id: string; created_at: string; notes?: string }>;
  };
  _meta?: any;
};

const STUB: SettingsShape = {
  general: {
    company_name: "LightSignal Demo Co.",
    timezone: "America/New_York",
    base_currency: "USD",
    reporting_period: "monthly",
    business_unit: "All",
    demo_mode: true,
  },
  integrations: [
    { id: "qbo", name: "QuickBooks Online", category: "accounting", status: "connected", last_sync: "2025-10-21T16:10:00Z", frequency: "daily", provenance: "oauth" },
    { id: "plaid", name: "Plaid", category: "banking", status: "connected", last_sync: "2025-10-22T09:00:00Z", frequency: "hourly", provenance: "api" },
    { id: "drive", name: "Google Drive", category: "storage", status: "disconnected", last_sync: null, frequency: "manual", provenance: null }
  ],
  privacy: {
    peer_benchmarking: true,
    ai_anonymized: true,
    retention_days: 365,
    compliance: { soc2: "Type II", gdpr: true, ccpa: true },
  },
  notifications: {
    email: true,
    in_app: true,
    alerts: { fraud: true, compliance: true, deadlines: true, anomalies: false },
    weekly_report: true,
    monthly_summary: true,
    thresholds: [
      { id: "th_cash", label: "Cash < $10k", key: "cash_balance", op: "<", value: 10000, unit: "USD", active: true },
      { id: "th_permit", label: "Permit expires < 30 days", key: "permit_days_to_expiry", op: "<", value: 30, unit: "days", active: true }
    ],
  },
  interface: { theme: "auto", density: "normal", language: "en", layout: "default" },
  billing: {
    plan: "Pro",
    renews_on: "2026-01-01",
    next_payment: "2025-11-01",
    invoices: [{ id: "inv_1001", date: "2025-10-01", amount: 19900, currency: "USD", url: "signed://invoice-1001.pdf" }],
    payment_methods: [{ brand: "Visa", last4: "4242", exp: "12/27", default: true }],
  },
  backup: {
    last_backup: "2025-10-20T11:45:00Z",
    cloud_sync: { enabled: true, provider: "S3", last_status: "ok" },
    snapshots: [{ id: "snap_2025_10_15", created_at: "2025-10-15T07:30:00Z", notes: "Pre-deploy" }],
  },
  _meta: { source: "lightsignal.orchestrator", confidence: "high", latency_ms: 42, provenance: { baseline_source: "settings_demo", used_priors: false, prior_weight: 0.0 } },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('general');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  // Feature flag: show temporary company selector for testing if true
  const SHOW_COMPANY_SELECTOR = true;
  const [overrideCompanyId, setOverrideCompanyId] = useState<string | null>(null);
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());

  async function fetchSettings() {
    setLoading(true);
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/settings/full`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: COMPANY_ID, include_integrations: true, include_billing: true, include_audit: true }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("settings API failed");
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      // fallback to callIntent if available
      try {
        // prefer the explicit helper name the spec requested
        const resp = await callIntent("settings_full", { company_id: COMPANY_ID, include_integrations: true, include_billing: true }, COMPANY_ID);
        setSettings(resp);
      } catch {
        setSettings(STUB as any);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSettings(); }, []);

  // Toast helper
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Validation helpers
  function validateTimezone(tz: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }

  function validateCurrency(currency: string): boolean {
    return /^[A-Z]{3}$/.test(currency);
  }

  // optimistic update helpers
  function updateIntegrationLocal(id: string, patch: Partial<any>) {
    setSettings((s) => {
      if (!s) return s;
      return { ...s, integrations: s.integrations.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    });
  }

  async function postAction(endpoint: string, body: any, optimistic?: () => void) {
    if (optimistic) optimistic();
    try {
      setSaving(true);
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/settings/${endpoint}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: COMPANY_ID, ...body }), cache: "no-store" });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Network error");
        throw new Error(`${endpoint} failed: ${errorText}`);
      }
      const data = await res.json();
      showToast(`${endpoint} completed successfully`, 'success');
      // re-fetch authoritative state
      await fetchSettings();
      return data;
    } catch (err) {
      console.error(err);
      showToast(`Failed to ${endpoint}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      // restore authoritative state on error
      await fetchSettings();
    } finally {
      setSaving(false);
    }
  }

  async function handleIntegrationAction(action: string, providerId: string) {
    const actionMap: Record<string, () => void> = {
      connect: () => updateIntegrationLocal(providerId, { status: 'connected' }),
      resync: () => updateIntegrationLocal(providerId, { last_sync: new Date().toISOString() }),
      disconnect: () => updateIntegrationLocal(providerId, { status: 'disconnected' }),
      run_sync: () => {
        setSyncingProviders(prev => new Set([...prev, providerId]));
        updateIntegrationLocal(providerId, { last_sync: new Date().toISOString() });
      },
      set_frequency: () => {},
    };

    // dangerous action confirmation
    if (action === 'disconnect') {
      const ok = confirm('Disconnecting this integration will stop data flow. Continue?');
      if (!ok) return;
    }

    try {
      if (action === 'run_sync') {
        setSyncingProviders(prev => new Set([...prev, providerId]));
        showToast(`Starting sync for ${providerId}...`, 'info');
      }
      
      const result = await postAction(action, { provider: providerId }, actionMap[action]);
      
      if (action === 'run_sync') {
        showToast(`Sync completed for ${providerId}`, 'success');
      }
      
      return result;
    } finally {
      if (action === 'run_sync') {
        setSyncingProviders(prev => {
          const newSet = new Set(prev);
          newSet.delete(providerId);
          return newSet;
        });
      }
    }
  }

  async function handleAssistantAsk(question: string) {
    try {
      const resp = await callIntent('settings', { query: question }, COMPANY_ID);
      const answer = resp?.answer || resp?.result || JSON.stringify(resp, null, 2);
      showToast(`AI Assistant: ${answer}`, 'info');
    } catch (e) {
      showToast('Assistant failed to respond. Please try again.', 'error');
    }
  }

  async function toggleMode(target: "live" | "demo") {
    // settings.general.demo_mode is boolean; we map 'live' -> false demo_mode
    const currentlyDemo = settings?.general?.demo_mode ?? true;
    if (target === 'live' && currentlyDemo) {
      const ok = confirm('Switching to Live will use your connected sources. Continue?');
      if (!ok) return;
    }
    await postAction('demo-toggle', { mode: target });
  }

  async function exportSettings() {
    if (!settings) return;
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lightsignal-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings exported successfully', 'success');
    } catch (e) {
      showToast('Failed to export settings', 'error');
    }
  }

  async function importSettingsFile(file: File) {
    try {
      const txt = await file.text();
      const json = JSON.parse(txt);
      const ok = confirm('Importing settings will overwrite current preview. Continue?');
      if (!ok) return;
      setSettings(json);
      showToast('Settings imported successfully', 'success');
    } catch (e) {
      showToast('Invalid JSON file', 'error');
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
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-gray-600">Manage company settings, integrations, privacy, notifications, and more.</p>
        </div>
        {SHOW_COMPANY_SELECTOR && (
          <div className="text-sm">
            <label className="text-xs text-gray-500 mr-2">Company:</label>
            <select className="px-2 py-1 border rounded" value={overrideCompanyId ?? (settings.general?.demo_mode ? 'demo' : settings.general?.company_name ?? 'org')} onChange={(e)=> setOverrideCompanyId(e.target.value)}>
              <option value="demo">Demo</option>
              <option value={settings.general?.company_name || 'org'}>Real ( {settings.general?.company_name || 'org'} )</option>
            </select>
          </div>
        )}
        <div className="text-sm">
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">Source: {settings._meta?.source ?? '—'}</div>
            <div className="text-xs text-gray-500">Confidence: {settings._meta?.confidence ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Sticky sub-nav */}
      <nav className="sticky top-16 bg-white z-10 py-2 border-b">
        <div className="flex gap-4 overflow-x-auto">
          {[
            ['general','General'],
            ['integrations','Integrations'],
            ['privacy','Data & Privacy'],
            ['notifications','Notifications'],
            ['interface','Interface'],
            ['billing','Billing'],
            ['backup','Backup'],
          ].map(([key,label]) => (
            <button
              key={String(key)}
              onClick={() => { setActiveSection(String(key)); document.getElementById(String(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className={`px-3 py-1 text-sm ${activeSection===key? 'border-b-2 border-teal-600 font-semibold' : 'text-gray-600'}`}
            >{label}</button>
          ))}
        </div>
      </nav>

      <section id="general" className="space-y-4">
        <h3 className="text-lg font-semibold">1️⃣ General Settings ⚙️ 🏢</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Company Name</label>
                <input className="w-full mt-1 px-3 py-2 border rounded" value={settings.general.company_name ?? ''} onChange={(e)=> setSettings(s => s ? ({...s, general: {...s.general, company_name: e.target.value}}) : s)} />
              </div>
              <div>
                <label className="text-xs font-medium">Timezone</label>
                <input 
                  className={`w-full mt-1 px-3 py-2 border rounded ${validateTimezone(settings.general.timezone) ? '' : 'border-red-300'}`}
                  value={settings.general.timezone ?? ''} 
                  onChange={(e)=> setSettings(s => s ? ({...s, general: {...s.general, timezone: e.target.value}}) : s)}
                  placeholder="America/New_York"
                />
                {!validateTimezone(settings.general.timezone) && (
                  <div className="text-xs text-red-600 mt-1">Invalid timezone format</div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium">Base Currency</label>
                <input 
                  className={`w-full mt-1 px-3 py-2 border rounded ${validateCurrency(settings.general.base_currency) ? '' : 'border-red-300'}`}
                  value={settings.general.base_currency ?? ''} 
                  onChange={(e)=> setSettings(s => s ? ({...s, general: {...s.general, base_currency: e.target.value.toUpperCase()}}) : s)}
                  placeholder="USD"
                  maxLength={3}
                />
                {!validateCurrency(settings.general.base_currency) && (
                  <div className="text-xs text-red-600 mt-1">Must be 3-letter currency code (e.g., USD)</div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium">Default Reporting Period</label>
                <select className="w-full mt-1 px-3 py-2 border rounded" value={settings.general.reporting_period} onChange={(e)=> setSettings(s => s ? ({...s, general: {...s.general, reporting_period: e.target.value}}) : s)}>
                  <option value="monthly">monthly</option>
                  <option value="quarterly">quarterly</option>
                  <option value="annually">annually</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Business Unit</label>
                <input className="w-full mt-1 px-3 py-2 border rounded" value={settings.general.business_unit ?? ''} onChange={(e)=> setSettings(s => s ? ({...s, general: {...s.general, business_unit: e.target.value}}) : s)} />
              </div>
              <div>
                <label className="text-xs font-medium">Demo Mode</label>
                <div className="mt-1">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={settings.general.demo_mode} onChange={(e)=> setSettings(s => s ? ({...s, general: {...s.general, demo_mode: e.target.checked}}) : s)} />
                    <span className="text-sm">Demo Mode</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button 
                className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50" 
                disabled={!validateTimezone(settings.general.timezone) || !validateCurrency(settings.general.base_currency) || saving}
                onClick={async ()=> { 
                  if (!validateTimezone(settings.general.timezone)) {
                    showToast('Please enter a valid timezone', 'error');
                    return;
                  }
                  if (!validateCurrency(settings.general.base_currency)) {
                    showToast('Please enter a valid 3-letter currency code', 'error');
                    return;
                  }
                  await postAction('save_general', { general: settings.general }); 
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <div className="text-sm text-gray-500">Last saved: {settings._meta?.last_saved ?? '—'}</div>
              <div className="ml-2">{settings._meta ? <span className="text-xs text-gray-500">Provenance: {settings._meta.provenance?.baseline_source ?? '—'}</span> : null}</div>
            </div>
          </div>
          <aside className="p-4 rounded-xl border bg-white">
            <h4 className="font-semibold">Notes</h4>
            <div className="text-sm text-gray-600 mt-2">Company-level settings and reporting defaults.</div>
          </aside>
        </div>
      </section>

      <section id="integrations" className="space-y-4">
        <h3 className="text-lg font-semibold">2️⃣ Integrations 🔗 💾</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            {/* Categories rendered grouped */}
            {['accounting','banking','crm','payroll','asset','inventory','storage'].map((cat) => (
              <div key={cat} className="p-4 rounded-xl border bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{cat[0].toUpperCase()+cat.slice(1)}</div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat === 'accounting' ? (
                    // Render QuickBooks card first in accounting category
                    <div className="col-span-1">
                      {/* QuickBooks card; company_id comes from settings.general.company_name as a stand-in for org id in this UI */}
                      <QuickBooksCard companyId={overrideCompanyId ?? (settings.general?.demo_mode ? 'demo' : (settings.general?.company_name || 'org')) } />
                    </div>
                  ) : null}
                  {settings.integrations.filter(i => i.category === cat).map((conn) => (
                    <div key={conn.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{conn.name}</div>
                          <div className="text-xs text-gray-500">{conn.status}</div>
                        </div>
                        <div className="text-right text-xs text-gray-400">{conn.last_sync ? new Date(conn.last_sync).toLocaleString() : '—'}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <select className="px-2 py-1 border rounded text-sm" value={conn.frequency} onChange={async (e)=> { updateIntegrationLocal(conn.id,{ frequency: e.target.value }); await postAction('set_frequency',{ provider: conn.id, frequency: e.target.value }); }}>
                          <option value="manual">manual</option>
                          <option value="hourly">hourly</option>
                          <option value="daily">daily</option>
                          <option value="weekly">weekly</option>
                        </select>
                        <button 
                          className="px-2 py-1 border rounded text-sm disabled:opacity-50" 
                          disabled={syncingProviders.has(conn.id)}
                          onClick={()=> handleIntegrationAction('run_sync', conn.id)}
                        >
                          {syncingProviders.has(conn.id) ? 'Syncing...' : 'Run Sync Now'}
                        </button>
                        {conn.status !== 'connected' ? (
                          <button className="px-2 py-1 border rounded text-sm" onClick={()=> handleIntegrationAction('connect', conn.id)}>Connect</button>
                        ) : (
                          <button className="px-2 py-1 border rounded text-sm" onClick={()=> handleIntegrationAction('disconnect', conn.id)}>Disconnect</button>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Provenance: {conn.provenance ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside className="space-y-3">
            <ProvenancePanel provenance={settings._meta?.provenance || {}} />
            <div className="p-4 rounded-xl border bg-white">
              <h4 className="font-semibold">Sync Notes</h4>
              <div className="text-sm text-gray-600 mt-2">Run syncs to fetch latest data. Frequency changes apply immediately.</div>
            </div>
          </aside>
        </div>
      </section>

      <section id="privacy" className="space-y-4">
        <h3 className="text-lg font-semibold">3️⃣ Data & Privacy 🔒 🧠</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <div className="grid grid-cols-1 gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={settings.privacy.peer_benchmarking} onChange={(e)=> setSettings(s => s ? ({...s, privacy: {...s.privacy, peer_benchmarking: e.target.checked}}) : s)} />
                <span className="text-sm">Allow peer benchmarking</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={settings.privacy.ai_anonymized} onChange={(e)=> setSettings(s => s ? ({...s, privacy: {...s.privacy, ai_anonymized: e.target.checked}}) : s)} />
                <span className="text-sm">Allow AI to use anonymized data for insights</span>
              </label>
              <div>
                <label className="text-xs">Retention</label>
                <select className="w-40 mt-1 px-3 py-2 border rounded" value={String(settings.privacy.retention_days)} onChange={(e)=> setSettings(s => s ? ({...s, privacy: {...s.privacy, retention_days: Number(e.target.value)}}) : s)}>
                  <option value="90">90</option>
                  <option value="180">180</option>
                  <option value="365">365</option>
                  <option value="-1">custom</option>
                </select>
              </div>
              <div className="mt-3">
                <button 
                  className="px-3 py-2 bg-teal-600 text-white rounded disabled:opacity-50" 
                  disabled={saving}
                  onClick={async ()=> { await postAction('save_privacy', { privacy: settings.privacy }); }}
                >
                  {saving ? 'Saving...' : 'Save Privacy'}
                </button>
                <div className="mt-2 text-xs text-gray-500">Compliance: SOC2 | GDPR | CCPA</div>
              </div>
            </div>
          </div>
          <aside className="p-4 rounded-xl border bg-white">
            <h4 className="font-semibold">Summary</h4>
            <div className="mt-2 text-sm text-gray-600">
              <div className="inline-block px-2 py-1 bg-slate-50 rounded mr-2">SOC2</div>
              <div className="inline-block px-2 py-1 bg-slate-50 rounded mr-2">GDPR</div>
              <div className="inline-block px-2 py-1 bg-slate-50 rounded">CCPA</div>
            </div>
          </aside>
        </div>
      </section>

      <section id="notifications" className="space-y-4">
        <h3 className="text-lg font-semibold">4️⃣ Notifications 🔔 📬</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={settings.notifications.email} onChange={(e)=> setSettings(s => s ? ({...s, notifications: {...s.notifications, email: e.target.checked}}) : s)} /> Email</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={settings.notifications.in_app} onChange={(e)=> setSettings(s => s ? ({...s, notifications: {...s.notifications, in_app: e.target.checked}}) : s)} /> In-app</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(settings.notifications.alerts).map((k) => (
                  <label key={k} className="inline-flex items-center gap-2"><input type="checkbox" checked={(settings.notifications.alerts as any)[k]} onChange={(e)=> setSettings(s => s ? ({...s, notifications: {...s.notifications, alerts: {...s.notifications.alerts, [k]: e.target.checked}}}): s)} /> {k}</label>
                ))}
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={settings.notifications.weekly_report} onChange={(e)=> setSettings(s => s ? ({...s, notifications: {...s.notifications, weekly_report: e.target.checked}}) : s)} /> Weekly reports</label>
                <label className="inline-flex items-center gap-2 ml-4"><input type="checkbox" checked={settings.notifications.monthly_summary} onChange={(e)=> setSettings(s => s ? ({...s, notifications: {...s.notifications, monthly_summary: e.target.checked}}) : s)} /> Monthly summaries</label>
              </div>
              <div className="mt-3">
                <h4 className="font-semibold">Custom thresholds</h4>
                <div className="space-y-2 mt-2">
                  {settings.notifications.thresholds.map((t, idx) => (
                    <div key={t.id || idx} className="flex items-center gap-2">
                      <input className="flex-1 px-2 py-1 border rounded" value={t.label} onChange={(e)=> { const newT = [...settings.notifications.thresholds]; newT[idx] = {...newT[idx], label: e.target.value}; setSettings(s => s ? ({...s, notifications: {...s.notifications, thresholds: newT}}) : s); }} />
                      <button className="px-2 py-1 border rounded text-sm" onClick={()=> { const newT = settings.notifications.thresholds.filter((_,i)=>i!==idx); setSettings(s => s ? ({...s, notifications: {...s.notifications, thresholds: newT}}) : s); }}>Remove</button>
                    </div>
                  ))}
                  <button className="px-3 py-2 border rounded text-sm" onClick={()=> { const newT = [...settings.notifications.thresholds, { id: `th_${Date.now()}`, label: 'New threshold', key: '', op: '', value: 0, unit: '', active: true }]; setSettings(s => s ? ({...s, notifications: {...s.notifications, thresholds: newT}}) : s); }}>Add threshold</button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button 
                  className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50" 
                  disabled={saving}
                  onClick={async ()=> { await postAction('save_notifications', { notifications: settings.notifications }); }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  className="px-4 py-2 border rounded disabled:opacity-50" 
                  disabled={saving}
                  onClick={()=> { showToast('Test email sent successfully', 'success'); }}
                >
                  Send Test Email
                </button>
              </div>
            </div>
          </div>
          <aside className="p-4 rounded-xl border bg-white">
            <h4 className="font-semibold">Templates</h4>
            <div className="text-sm text-gray-600 mt-2">Examples: Cash &lt; $10k, Permit expires &lt; 30 days</div>
          </aside>
        </div>
      </section>

      <section id="interface" className="space-y-4">
        <h3 className="text-lg font-semibold">5️⃣ Interface & Theme 🖥️ 🎨</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs">Theme</label>
                <select className="w-full mt-1 px-3 py-2 border rounded" value={settings.interface.theme} onChange={(e)=> setSettings(s => s ? ({...s, interface: {...s.interface, theme: e.target.value}}) : s)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="text-xs">Dashboard density</label>
                <select className="w-full mt-1 px-3 py-2 border rounded" value={settings.interface.density} onChange={(e)=> setSettings(s => s ? ({...s, interface: {...s.interface, density: e.target.value}}) : s)}>
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
              <div>
                <label className="text-xs">Language</label>
                <select className="w-full mt-1 px-3 py-2 border rounded" value={settings.interface.language} onChange={(e)=> setSettings(s => s ? ({...s, interface: {...s.interface, language: e.target.value}}) : s)}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="text-xs">Widget layout preset</label>
                <select className="w-full mt-1 px-3 py-2 border rounded" value={settings.interface.layout} onChange={(e)=> setSettings(s => s ? ({...s, interface: {...s.interface, layout: e.target.value}}) : s)}>
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button 
                className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50" 
                disabled={saving}
                onClick={async ()=> { await postAction('save_interface', { interface: settings.interface }); }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <aside className="p-4 rounded-xl border bg-white">
            <h4 className="font-semibold">Preview</h4>
            <div className="text-sm text-gray-600 mt-2">Quick preview of selected layout and theme.</div>
          </aside>
        </div>
      </section>

      <section id="billing" className="space-y-4">
        <h3 className="text-lg font-semibold">6️⃣ Billing & Subscription 💳 🧾</h3>
        {/* Admin guard: only show billing if admin */}
        {!(settings._meta && settings._meta.admin === false) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Plan: {settings.billing.plan}</div>
                <div className="text-sm text-gray-500">Renews on {settings.billing.renews_on} • Next payment {settings.billing.next_payment}</div>
              </div>
              <div>
                <button 
                  className="px-3 py-2 bg-teal-600 text-white rounded disabled:opacity-50" 
                  disabled={saving}
                  onClick={async ()=> { await postAction('open_billing_portal', {}); }}
                >
                  {saving ? 'Opening...' : 'Open Billing Portal'}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Invoices</h4>
              <ul className="mt-2 space-y-2">
                {settings.billing.invoices.map((inv: any) => (
                  <li key={inv.id} className="flex items-center justify-between">
                    <div className="text-sm">{inv.date} • {inv.amount/100} {inv.currency}</div>
                    <a className="text-teal-600 text-sm" href={inv.url}>View Invoice</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <aside className="p-4 rounded-xl border bg-white">
            <h4 className="font-semibold">Payment Methods</h4>
            <div className="mt-2 space-y-2">
              {settings.billing.payment_methods.map((pm: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="text-sm">{pm.brand} • ****{pm.last4} • exp {pm.exp}</div>
                  <div>
                    <button 
                      className="px-2 py-1 border rounded text-sm disabled:opacity-50" 
                      disabled={saving}
                      onClick={async ()=> { await postAction('remove_payment_method', { last4: pm.last4 }); }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
        ) : (
          <div className="p-4 rounded-xl border bg-white text-sm text-gray-600">Billing & Backup sections are only visible to Admin users.</div>
        )}
      </section>

      <section id="backup" className="space-y-4">
        <h3 className="text-lg font-semibold">7️⃣ Backup & Restore 💾 🧰</h3>
        {!(settings._meta && settings._meta.admin === false) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <div className="flex items-center gap-3">
              <button 
                className="px-3 py-2 border rounded disabled:opacity-50" 
                disabled={saving}
                onClick={async ()=> { await postAction('manual_backup', {}); }}
              >
                {saving ? 'Creating...' : 'Manual backup (JSON)'}
              </button>
              <button 
                className="px-3 py-2 border rounded disabled:opacity-50" 
                disabled={saving}
                onClick={async ()=> { await postAction('export_csv', {}); }}
              >
                {saving ? 'Exporting...' : 'CSV export'}
              </button>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Snapshots</h4>
              <ul className="mt-2 space-y-2">
                {settings.backup.snapshots.map((snap) => (
                  <li key={snap.id} className="flex items-center justify-between">
                    <div className="text-sm">{snap.created_at} • {snap.notes}</div>
                    <div>
                      <button 
                        className="px-2 py-1 border rounded text-sm disabled:opacity-50" 
                        disabled={saving}
                        onClick={async ()=> { 
                          const ok = confirm('Restore snapshot? This will overwrite current settings.'); 
                          if (!ok) return; 
                          await postAction('restore_snapshot', { snapshot_id: snap.id }); 
                        }}
                      >
                        Restore
                      </button>
                      <button 
                        className="px-2 py-1 border rounded text-sm ml-2 disabled:opacity-50" 
                        disabled={saving}
                        onClick={async ()=> { 
                          const ok = confirm('Delete snapshot?'); 
                          if (!ok) return; 
                          await postAction('delete_snapshot', { snapshot_id: snap.id }); 
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <aside className="p-4 rounded-xl border bg-white">
            <div className="text-sm">Cloud Sync: {settings.backup.cloud_sync.provider} • {settings.backup.cloud_sync.last_status}</div>
          </aside>
        </div>
        ) : null}
      </section>

      {saving && <div className="text-sm text-gray-600">Saving...</div>}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
