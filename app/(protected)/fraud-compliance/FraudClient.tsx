"use client";
import React, { useEffect, useState } from "react";
import KpiCard from "../../components/KpiCard";
import { BACKEND_URL, callIntent } from "../../lib/api";
import { Tooltip, InfoTooltip, ProvenanceBadge } from "../../components/ui/Tooltip";

const STUB = {
  "kpis": [
    { "id": "fraud_score", "label": "Fraud Risk Score", "value": 26, "state": "good", "trend_12m": [22,24,23,25,24,26,27,25,24,26,26,26] },
    { "id": "compliance_score", "label": "Compliance Readiness Score", "value": 86, "state": "good", "note": "2 pending renewals" },
    { "id": "active_alerts", "label": "Active Alerts", "value": 3, "state": "caution" },
    { "id": "last_scan", "label": "Last System Scan", "value": "2025-10-22T10:12:00Z", "state": "stable" },
    { "id": "suspicious_30d", "label": "Suspicious Transactions (30D)", "value": 2, "state": "caution" },
    { "id": "verified_pct", "label": "Verified Vendors/Customers %", "value": 0.92, "formatted": "92%", "state": "good" },
    { "id": "upcoming_deadlines", "label": "Upcoming Deadlines / Expirations", "value": 5, "state": "caution" }
  ],
  "overview": {
    "summary": "Fraud risk low at 26. One vendor invoice pending verification. Compliance strong (86/100). 3 documents expiring this quarter.",
    "next_deadlines": [
      { "id": "tax-q4", "title": "Quarterly Sales Tax", "due_date": "2026-01-15", "urgency": "🟧" },
      { "id": "permit-city", "title": "City Food Permit", "due_date": "2025-12-18", "urgency": "🟧" },
      { "id": "ins-gl", "title": "General Liability Insurance", "due_date": "2025-11-30", "urgency": "🟧" }
    ]
  },
  "transactions": [
    { "id": "tx-1001", "date": "2025-10-08", "party": "Global Supply Ltd", "amount": 5230, "issue": "3× usual amount", "risk": "medium", "actions": ["review"] },
    { "id": "tx-0992", "date": "2025-10-04", "party": "Apex Logistics", "amount": 1950, "issue": "Duplicate invoice #5521", "risk": "high", "actions": ["verify","flag_accountant"] }
  ],
  "verifications": [
    { "name": "Apex Logistics", "type": "vendor", "verified": true,  "last_checked": "2025-10-08", "notes": "Active (US-OK)" },
    { "name": "Global Supply Ltd", "type": "vendor", "verified": false, "last_checked": "2025-10-08", "notes": "Inactive (UK) — flagged" },
    { "name": "Lily’s Café", "type": "customer", "verified": true, "last_checked": "2025-10-08", "notes": "Local business" }
  ],
  "documents": [
    { "id": "doc-food", "document": "City Food Permit", "type": "License", "status": "active", "expiration": "2025-12-18", "renewal_needed": false },
    { "id": "doc-gl", "document": "General Liability Insurance", "type": "Policy", "status": "expiring", "expiration": "2025-11-30", "renewal_needed": true },
    { "id": "doc-biz", "document": "Business License", "type": "License", "status": "expired", "expiration": "2025-09-30", "renewal_needed": true }
  ],
  "calendar": {
    "items": [
      { "id": "cal-1", "title": "Quarterly Sales Tax", "date": "2026-01-15", "status": "🟧" },
      { "id": "cal-2", "title": "City Permit Renewal", "date": "2025-12-18", "status": "🟧" },
      { "id": "cal-3", "title": "Worker’s Comp Policy", "date": "2025-11-30", "status": "🟧" }
    ],
    "ics_available": true
  },
  "alerts": [
    { "id": "alrt-1", "date": "2025-10-08", "category": "Fraud", "description": "Vendor 'Global Supply Ltd' invoice 3× normal size", "severity": "high", "status": "open" },
    { "id": "alrt-2", "date": "2025-10-05", "category": "Compliance", "description": "Insurance policy expiring in 21 days", "severity": "medium", "status": "open" },
    { "id": "alrt-3", "date": "2025-10-02", "category": "Licensing", "description": "Business license expired", "severity": "high", "status": "open" }
  ],
  "scores": {
    "fraud": { "score": 26, "weights": { "anomalies": 0.30, "verification": 0.25, "refunds": 0.20, "timing_freq": 0.15, "watchlists": 0.10 } },
    "compliance": { "score": 86, "weights": { "licenses": 0.30, "tax": 0.25, "insurance": 0.20, "safety": 0.15, "docs": 0.10 } }
  },
  "integrations": [
    { "id": "qbo", "name": "QuickBooks", "status": "connected" },
    { "id": "plaid", "name": "Plaid", "status": "connected" },
    { "id": "sos", "name": "Sec. of State", "status": "connected" }
  ],
  "export": { "pdf_available": true, "csv_available": true, "ics_available": true }
};

function fmtDate(d:any){
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}

function getKpiTooltip(kpiId: string): string {
  const tooltips = {
    'fraud_score': '🟢 0–30 low; 🟡 31–70 watch; 🔴 71+ critical.',
    'compliance_score': 'How up-to-date/complete required docs/filings are.',
    'active_alerts': 'Count of unresolved fraud/compliance flags.',
    'last_scan': 'Timestamp of latest sweep across transactions & docs.',
    'suspicious_30d': 'Count of items outside norms.',
    'verified_pct': 'Portion verified via EIN/registries.',
    'upcoming_deadlines': 'Licenses/permits/filings approaching renewal.'
  };
  return tooltips[kpiId as keyof typeof tooltips] || '';
}

function getKpiState(value: any, kpiId: string): 'good' | 'caution' | 'critical' {
  if (kpiId === 'fraud_score') {
    const score = Number(value) || 0;
    if (score <= 30) return 'good';
    if (score <= 70) return 'caution';
    return 'critical';
  }
  if (kpiId === 'compliance_score') {
    const score = Number(value) || 0;
    if (score >= 85) return 'good';
    if (score >= 70) return 'caution';
    return 'critical';
  }
  // For others, use existing state or default to good
  return 'good';
}

function formatKpiValue(kpi: any): string {
  if (kpi.formatted) return kpi.formatted;
  if (typeof kpi.value === 'number') {
    if (kpi.id === 'verified_pct') return `${Math.round((kpi.value||0)*100)}%`;
    if (kpi.id === 'last_scan') return fmtDate(kpi.value);
    return String(kpi.value);
  }
  if (kpi.id === 'last_scan') return fmtDate(kpi.value);
  return String(kpi.value || '—');
}

function getKpiIcon(kpiId: string): string {
  const icons = {
    'fraud_score': '🧠',
    'compliance_score': '📜',
    'active_alerts': '⚠️',
    'last_scan': '🧾',
    'suspicious_30d': '💳',
    'verified_pct': '🕵️‍♂️',
    'upcoming_deadlines': '⏰'
  };
  return icons[kpiId as keyof typeof icons] || '📊';
}

export default function FraudClient(){
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try {
        const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
        const url = `${apiRoot.replace(/\/$/, "")}/api/ai/fraud/full`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: "demo", range: "30d", include_integrations: true, include_calendar: true, refresh_if_stale_minutes: 60 }),
          cache: "no-store",
        });
        if (!resp.ok) throw new Error(`fraud full API failed (${resp.status})`);
        const json = await resp.json();
        if (!mounted) return;
        setData(json);
      } catch (e:any) {
        try {
          const intentResp = await callIntent("fraud_compliance", { company_id: "demo", range: "30d", include_integrations: true }, "demo");
          if (intentResp) { setData(intentResp); setLoading(false); return; }
        } catch (ie){ /* ignore */ }
        setError((e && e.message) || "failed");
        setData(STUB);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return ()=>{ mounted = false; };
  }, []);

  const kpis = data?.kpis || [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading ? STUB.kpis : kpis).map((k:any)=> {
          const state = getKpiState(k.value, k.id);
          const stateColor = state === 'good' ? 'text-green-600' : state === 'caution' ? 'text-yellow-600' : 'text-red-600';
          const stateBg = state === 'good' ? 'bg-green-50' : state === 'caution' ? 'bg-yellow-50' : 'bg-red-50';
          
          return (
            <div key={k.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${stateBg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getKpiIcon(k.id)}</span>
                  <div className="text-xs text-slate-500">{k.label}</div>
                </div>
                <InfoTooltip content={getKpiTooltip(k.id)} />
              </div>
              <div className={`text-lg font-semibold mt-1 ${stateColor}`}>
                {formatKpiValue(k)}
              </div>
              {k.note && <div className="text-xs text-slate-400 mt-1">{k.note}</div>}
              {data?._meta && <ProvenanceBadge sources={data._meta.sources} confidence={data._meta.confidence} className="mt-2" />}
            </div>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <div className="text-lg font-semibold">Overview Dashboard</div>
              <InfoTooltip content="Quadrant layout panes: Fraud Risk Trend (12 mo), Compliance Gauge, Active Alerts list, Next Deadlines." />
            </div>
            <div className="text-xs text-slate-400">
              {loading ? 'Loading…' : error ? `Using stub (${error})` : 'Live data'}
            </div>
          </div>

          {/* AI Summary Banner */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">🛡️</span>
              <div>
                <div className="text-sm font-medium text-blue-900 mb-1">AI Summary</div>
                <div className="text-sm text-blue-800">{data?.overview?.summary || STUB.overview.summary}</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Fraud Risk Trend Chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-semibold text-slate-600">Fraud Risk Trend (12 mo)</div>
                <InfoTooltip content="Monthly fraud risk scores over the past 12 months" />
              </div>
              <svg className="w-full h-32 bg-slate-50 rounded-lg p-2" viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const trend = (data?.kpis || STUB.kpis).find((kk:any)=>kk.id==='fraud_score')?.trend_12m || STUB.kpis[0].trend_12m;
                  if (!trend) return null;
                  const max = Math.max(...trend.map((n:any)=>Number(n||0)),1);
                  const points = trend.map((t:any,i:number)=> `${(i/(Math.max(1,trend.length-1))*190 + 5).toFixed(1)},${(70-(Number(t)/max)*60 + 5).toFixed(1)}`).join(' ');
                  return (
                    <>
                      <polyline fill="none" stroke="#ef4444" strokeWidth={2} points={points} />
                      {trend.map((t:any,i:number)=> (
                        <circle 
                          key={i} 
                          cx={(i/(Math.max(1,trend.length-1))*190 + 5)} 
                          cy={(70-(Number(t)/max)*60 + 5)} 
                          r="2" 
                          fill="#ef4444" 
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Compliance Gauge */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-semibold text-slate-600">Compliance Gauge</div>
                <InfoTooltip content="Overall compliance readiness score out of 100" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {(data?.scores?.compliance?.score ?? STUB.scores.compliance.score)} / 100
                </div>
                <div className="text-xs text-slate-500">
                  {(data?.kpis || STUB.kpis).find((k:any)=>k.id==='compliance_score')?.note || ''}
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(data?.scores?.compliance?.score ?? STUB.scores.compliance.score)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Deadlines */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-sm font-semibold text-slate-600">Next Deadlines</div>
              <InfoTooltip content="Upcoming compliance deadlines and renewal dates" />
            </div>
            <div className="space-y-2">
              {(data?.overview?.next_deadlines || STUB.overview.next_deadlines).map((d:any)=> (
                <div key={d.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <span>{d.urgency}</span>
                    <div className="text-sm">{d.title}</div>
                  </div>
                  <div className="text-xs text-slate-500">{d.due_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🚨</span>
            <div className="text-lg font-semibold">Active Alerts</div>
            <InfoTooltip content="Consolidated unresolved flags across all categories" />
          </div>
          <div className="space-y-3">
            {(data?.alerts || STUB.alerts).slice(0, 5).map((a:any)=> (
              <div key={a.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium">{a.category}</div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    a.severity === 'high' ? 'bg-red-100 text-red-800' :
                    a.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {a.severity}
                  </span>
                </div>
                <div className="text-sm text-slate-600 mb-2">{a.description}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-400">{a.date}</div>
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">
                    Review
                  </button>
                </div>
              </div>
            ))}
            {(data?.alerts || STUB.alerts).length > 5 && (
              <div className="text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  View All {(data?.alerts || STUB.alerts).length} Alerts
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💳</span>
            <div className="text-lg font-semibold">Fraud Monitoring</div>
            <InfoTooltip content="Flagged transactions with filters (date/risk/vendor/platform)" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <select className="text-sm border rounded px-2 py-1">
              <option>All Dates</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <select className="text-sm border rounded px-2 py-1">
              <option>All Risk Levels</option>
              <option>High Risk</option>
              <option>Medium Risk</option>
              <option>Low Risk</option>
            </select>
            <select className="text-sm border rounded px-2 py-1">
              <option>All Vendors</option>
              <option>New Vendors</option>
              <option>Verified Vendors</option>
            </select>
            <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
              Apply Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-3"><input type="checkbox" className="mr-2" />Date</th>
                  <th className="pb-3">Vendor/Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Issue</th>
                  <th className="pb-3">Risk</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.transactions || STUB.transactions).map((t:any)=> (
                  <tr key={t.id} className="border-t hover:bg-slate-50">
                    <td className="py-3">
                      <input type="checkbox" className="mr-2" />
                      {t.date}
                    </td>
                    <td className="py-3 font-medium">{t.party}</td>
                    <td className="py-3">${t.amount.toLocaleString()}</td>
                    <td className="py-3">{t.issue}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.risk === 'high' ? 'bg-red-100 text-red-800' :
                        t.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {t.risk === 'high' ? '🔴' : t.risk === 'medium' ? '🟡' : '🟢'} {t.risk}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                          Review
                        </button>
                        <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                          Confirm Valid
                        </button>
                        <button className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200">
                          Flag
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bulk Actions */}
          <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600">0 items selected</div>
            <div className="flex gap-2">
              <button className="text-sm bg-slate-200 text-slate-700 px-3 py-1 rounded hover:bg-slate-300">
                Mark Reviewed
              </button>
              <button className="text-sm bg-green-200 text-green-800 px-3 py-1 rounded hover:bg-green-300">
                Confirm Valid
              </button>
              <button className="text-sm bg-orange-200 text-orange-800 px-3 py-1 rounded hover:bg-orange-300">
                Flag for Accountant
              </button>
            </div>
          </div>

          {/* Common Patterns Callouts */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Common Fraud Patterns Detected</div>
            <div className="text-xs text-blue-800 flex flex-wrap gap-2">
              <span className="bg-blue-100 px-2 py-1 rounded">Duplicate invoice</span>
              <span className="bg-blue-100 px-2 py-1 rounded">Out-of-hours</span>
              <span className="bg-blue-100 px-2 py-1 rounded">Round numbers</span>
              <span className="bg-blue-100 px-2 py-1 rounded">New vendor</span>
              <span className="bg-blue-100 px-2 py-1 rounded">High-risk country</span>
              <span className="bg-blue-100 px-2 py-1 rounded">Abnormal frequency</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🧾</span>
            <div className="text-lg font-semibold">Vendor & Customer Verification</div>
            <InfoTooltip content="Entities with verification status and last checked time" />
          </div>
          <div className="space-y-3">
            {(data?.verifications || STUB.verifications).map((v:any, idx:number)=> (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm">{v.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{v.type}</div>
                  </div>
                  <div className="flex gap-1">
                    {v.verified && (
                      <>
                        <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">SOS</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">EIN</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">OFAC</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-600 mb-2">{v.notes}</div>
                <div className="text-xs text-slate-400 mb-2">Last checked: {v.last_checked}</div>
                <div className="flex gap-1">
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">
                    Re-check
                  </button>
                  <button className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 px-2 py-1 rounded">
                    Upload W-9
                  </button>
                  {!v.verified && (
                    <button className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded">
                      Mark Verified
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📋</span>
            <div className="text-lg font-semibold">Compliance Management</div>
            <InfoTooltip content="Document grid/table grouped by category (Licenses, Permits, Tax, Insurance, Safety, Certifications)" />
          </div>

          {/* Document Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">All</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Licenses</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Permits</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Tax</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Insurance</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Safety</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-3">Document</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Expiration</th>
                  <th className="pb-3">Renewal Needed</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.documents || STUB.documents).map((d:any)=> (
                  <tr key={d.id} className="border-t hover:bg-slate-50">
                    <td className="py-3 font-medium">{d.document}</td>
                    <td className="py-3">{d.type}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        d.status === 'active' ? 'bg-green-100 text-green-800' :
                        d.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                        d.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3">{d.expiration}</td>
                    <td className="py-3">
                      {d.renewal_needed ? (
                        <span className="text-orange-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-green-600">No</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                          Upload/Replace
                        </button>
                        {d.renewal_needed && (
                          <button className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200">
                            Renew
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* File Upload Area */}
          <div className="mt-6 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-slate-500 mb-2">
              <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Drag & drop documents here or click to browse
            </div>
            <div className="text-xs text-slate-400">
              Supports PDF, JPG, PNG. Auto-parsing for expiration dates and issuer info.
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <button className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200">
                📁 Browse Files
              </button>
              <button className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200">
                ☁️ Google Drive
              </button>
              <button className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200">
                📦 Dropbox
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📆</span>
            <div className="text-lg font-semibold">Compliance Calendar</div>
            <InfoTooltip content="Timeline/calendar of deadlines with urgency colors: 🟥 overdue, 🟧 <30 days, 🟩 current" />
          </div>

          {/* Calendar View Toggle */}
          <div className="flex gap-2 mb-4">
            <button className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">Month</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200">Week</button>
            <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200">List</button>
          </div>

          <div className="space-y-3">
            {(data?.calendar?.items || STUB.calendar.items).map((c:any)=> (
              <div key={c.id} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium">{c.title}</div>
                  <span className="text-lg">{c.status}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{c.date}</div>
                <div className="flex gap-1">
                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                    View Details
                  </button>
                  <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                    Mark Complete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Export Calendar */}
          <div className="mt-6 p-3 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Export Calendar</div>
            <button 
              className="w-full text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
              onClick={() => {
                const icsUrl = (data?.export?.ics_available ? 
                  (process.env.NEXT_PUBLIC_API_URL || BACKEND_URL) + '/api/export.ics?intent=fraud_compliance&company_id=demo' : 
                  '#'
                );
                if (icsUrl !== '#') window.open(icsUrl, '_blank');
              }}
            >
              📅 Export .ICS Calendar
            </button>
            <div className="text-xs text-slate-500 mt-1 text-center">
              Import into Outlook, Google Calendar, Apple Calendar
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🚨</span>
          <div className="text-lg font-semibold">Active Alerts Feed</div>
          <InfoTooltip content="Consolidated feed across Fraud/Compliance/Vendor/Safety with filtering and actions" />
        </div>

        {/* Alert Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">All</button>
          <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Fraud</button>
          <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Compliance</button>
          <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Vendor</button>
          <button className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200">Safety</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b">
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-3">Date</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.alerts || STUB.alerts).map((a:any)=> (
                <tr key={a.id} className="border-t hover:bg-slate-50">
                  <td className="py-3">{a.date}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      a.category === 'Fraud' ? 'bg-red-100 text-red-800' :
                      a.category === 'Compliance' ? 'bg-blue-100 text-blue-800' :
                      a.category === 'Licensing' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {a.category}
                    </span>
                  </td>
                  <td className="py-3 max-w-xs truncate" title={a.description}>{a.description}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      a.severity === 'high' ? 'bg-red-100 text-red-800' :
                      a.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      a.status === 'open' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                        Review
                      </button>
                      <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                        Resolve
                      </button>
                      <button className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200">
                        Snooze
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📈</span>
            <div className="text-lg font-semibold">Scores & Reports</div>
            <InfoTooltip content="Score breakdown flyout for Fraud Risk & Compliance Readiness (weights + drivers)" />
          </div>
          
          {/* Score Breakdown */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium mb-2">Fraud Risk Score Breakdown</div>
              <div className="text-xs text-slate-600 mb-3">
                Current Score: <span className="font-bold text-lg text-red-600">{(data?.scores?.fraud?.score ?? STUB.scores.fraud.score)}</span>
              </div>
              <div className="space-y-2">
                {data?.scores?.fraud?.weights ? Object.entries(data.scores.fraud.weights).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <div className="text-xs capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xs font-medium">{((value as number) * 100).toFixed(0)}%</div>
                  </div>
                )) : (
                  <div className="text-xs text-slate-500">Weight details unavailable</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium mb-2">Compliance Score Breakdown</div>
              <div className="text-xs text-slate-600 mb-3">
                Current Score: <span className="font-bold text-lg text-green-600">{(data?.scores?.compliance?.score ?? STUB.scores.compliance.score)}</span>
              </div>
              <div className="space-y-2">
                {data?.scores?.compliance?.weights ? Object.entries(data.scores.compliance.weights).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <div className="text-xs capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xs font-medium">{((value as number) * 100).toFixed(0)}%</div>
                  </div>
                )) : (
                  <div className="text-xs text-slate-500">Weight details unavailable</div>
                )}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="space-y-2">
            <div className="text-sm font-medium mb-3">Export Reports</div>
            <button 
              className="w-full text-sm bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 mb-2"
              onClick={() => {
                const pdfUrl = data?.export?.pdf_available ? 
                  (process.env.NEXT_PUBLIC_API_URL || BACKEND_URL) + '/api/export.pdf?intent=fraud_compliance&company_id=demo' : 
                  '#';
                if (pdfUrl !== '#') window.open(pdfUrl, '_blank');
              }}
            >
              📄 Fraud & Compliance Summary (PDF)
            </button>
            <button 
              className="w-full text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
              onClick={() => {
                const csvUrl = data?.export?.csv_available ? 
                  (process.env.NEXT_PUBLIC_API_URL || BACKEND_URL) + '/api/export.csv?intent=fraud_compliance&company_id=demo' : 
                  '#';
                if (csvUrl !== '#') window.open(csvUrl, '_blank');
              }}
            >
              📊 Detailed Audit Report (CSV)
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔗</span>
            <div className="text-lg font-semibold">Integrations & Provenance</div>
            <InfoTooltip content="Connected data sources and provenance information" />
          </div>
          
          <div className="space-y-3 mb-6">
            {(data?.integrations || STUB.integrations).map((i:any)=> (
              <div key={i.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    i.status === 'connected' ? 'bg-green-500' : 
                    i.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{i.status}</div>
                  </div>
                </div>
                <button className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded hover:bg-slate-200">
                  {i.status === 'connected' ? 'Configure' : 'Connect'}
                </button>
              </div>
            ))}
          </div>

          {/* Data Quality Notice */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-1">Data Quality</div>
            <div className="text-xs text-blue-800">
              All data includes provenance tracking and confidence scoring. 
              Real backend data overrides stub data when available.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
