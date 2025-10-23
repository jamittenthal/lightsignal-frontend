"use client";

import React, { useEffect, useMemo, useState } from "react";
import { callIntent, BACKEND_URL } from "@/lib/api";
import KpiCard from "@/components/KpiCard";
import { useToast } from "@/components/ui/ToastProvider";
import { LiabilityForecastChart, ExpenseMixChart, PeerComparisonChart, SetAsideChart } from "@/components/charts/TaxCharts";
import { ScenarioLabModal, ReminderModal } from "@/components/ui/TaxModals";
import { Tooltip, ProvenanceBadge, InfoTooltip } from "@/components/ui/Tooltip";

const COMPANY_ID = "demo";

const STUB = {
  kpis: [
    { id: "tax_liability_ytd", label: "Estimated Tax Liability (YTD)", value: 46230, formatted: "$46,230", as_of_qtr: "Q3", state: "caution" },
    { id: "deductions_identified", label: "Identified Deduction Opportunities", count: 12, value_total: 14200, formatted_value: "$14,200", state: "good" },
    { id: "effective_tax_rate", label: "Effective Tax Rate", value: 0.148, peer_avg: 0.192, formatted: "14.8% vs 19.2%", state: "good" },
    { id: "savings_potential", label: "Tax Savings Potential", value: 8700, formatted: "$8,700/yr", state: "good" },
    { id: "next_milestone", label: "Next Tax Milestone", value: "Q4 Estimated Payment — 2026-01-15", state: "stable" },
    { id: "plan_score", label: "Quarterly Tax Plan Score", value: 85, state: "good" }
  ],
  overview: {
    summary: "Effective rate at 14.8% due to accelerated depreciation and Sec. 179. Year-end estimate $46.2K; potential savings $8.7K via retirement and R&D credits.",
    charts: {
      liability_forecast: [
        { quarter: "Q4", projected: 11600, planned_payments: 8000 }
      ],
      expense_mix: [
        { category: "Deductible", pct: 0.82 },
        { category: "Non-deductible", pct: 0.18 }
      ],
      peer_compare: { yours: 0.148, peer_avg: 0.192 }
    }
  },
  opportunities: [
    { id: "sec179_vehicle", title: "Section 179 vehicle deduction", estimate: 7500, confidence: "high", irs_ref: "§179", provenance: ["QuickBooks"], actions: ["send_to_accountant","add_priority","simulate"] },
    { id: "home_office", title: "Home office allocation", estimate: 1200, confidence: "medium", irs_ref: "Pub 587", provenance: ["QuickBooks"] }
  ],
  benchmarks: {
    effective_rate: { yours: 0.148, peer_avg: 0.192 },
    deduction_rate: 0.34,
    credit_utilization: 0.18,
    entity_mix: { llc: 0.42, s_corp: 0.31, c_corp: 0.12, sole_prop: 0.15 },
    notes: ["Peers with S-Corp election show ~16% lower SE tax burden."]
  },
  deduction_finder: [
    { category: "Vehicle", item: "Mileage + maintenance", estimate: 3100, confidence: "medium", peer_adoption_pct: 0.62 },
    { category: "Retirement", item: "Solo 401(k)", estimate: 4500, confidence: "high", peer_adoption_pct: 0.28 }
  ],
  quarterly_plan: {
    next_due_date: "2026-01-15",
    estimate_due: 11600,
    set_aside_weekly: 1150,
    scenarios: [
      { name: "Buy equipment now", delta_liability: -2400 },
      { name: "Defer to Q1", delta_liability: 0 }
    ]
  },
  entity_analysis: {
    current: "llc_sp",
    options: [
      { type: "s_corp", est_savings_year: 4200, notes: "Base salary $65k + distributions" },
      { type: "c_corp", est_savings_year: 0, notes: "Double taxation risk" }
    ]
  },
  depreciation: {
    summary: "179 available on two vehicles; bonus on coffee equipment.",
    timeline: [
      { month: "2025-12", write_off: 32000 },
      { month: "2026-01", write_off: 4800 }
    ]
  },
  priority_actions: [
    { id: "p-sec179", text: "Maximize Section 179 before 12/31", impact: 32000, deadline: "2025-12-31", difficulty: "medium" },
    { id: "p-401k", text: "Establish Solo 401(k)", impact: 22500, deadline: "2025-12-31", difficulty: "low" }
  ],
  coach_examples: [
    { q: "What’s my current estimated tax bill?", a: "About $46.2K YTD; next payment estimated $11.6K due 1/15." }
  ],
  export: { pdf_available: true, csv_available: true }
};

export default function TaxPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scenarioModal, setScenarioModal] = useState<{ isOpen: boolean; opportunity?: any }>({ isOpen: false });
  const [reminderModal, setReminderModal] = useState<{ isOpen: boolean; item?: any }>({ isOpen: false });
  const { success, error, info } = useToast();

  async function fetchFull() {
    setLoading(true);
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/tax/full`;
      const body = { company_id: COMPANY_ID, year: 2025, include_peers: true, include_assets: true, include_entity_analysis: true, range: "YTD" };
      const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      if (!resp.ok) throw new Error("tax API failed");
      const json = await resp.json();
      setData(json);
      return;
    } catch (e) {
      // fallback to callIntent helper if available
      try {
        const resp = await callIntent("tax_optimization", { company_id: COMPANY_ID, year: 2025, range: "YTD" }, COMPANY_ID);
        if (resp) {
          setData(resp);
          return;
        }
      } catch (err) {
        // ignore
      }
      // last resort: show STUB
      setData(STUB as any);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFull(); }, []);

  const kpis = useMemo(() => data?.kpis || [], [data]);

  function formatCurrency(v: number | undefined) {
    if (v == null) return "—";
    return v.toLocaleString ? `$${v.toLocaleString()}` : `$${v}`;
  }

  function getKpiTooltip(id: string) {
    const tooltips = {
      tax_liability_ytd: "Current year's projected taxes based on live accounting data",
      deductions_identified: "Count & total value of potential deductions not yet applied",
      effective_tax_rate: "Tax expense ÷ net income — compared to industry peers",
      savings_potential: "Amount the business could save with optimized structure & deductions",
      next_milestone: "Upcoming filing or payment date",
      plan_score: "Readiness rating based on projections, set-asides, and compliance"
    };
    return tooltips[id as keyof typeof tooltips] || "Tax optimization metric";
  }

  function getStateColor(state: string) {
    const colors = {
      good: "bg-green-100 text-green-800",
      caution: "bg-yellow-100 text-yellow-800",
      warning: "bg-red-100 text-red-800",
      stable: "bg-blue-100 text-blue-800"
    };
    return colors[state as keyof typeof colors] || "bg-gray-100 text-gray-800";
  }

  async function postAction(endpoint: string, body: any) {
    setSaving(true);
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/tax/${endpoint}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: COMPANY_ID, ...body }), cache: "no-store" });
      if (!res.ok) throw new Error(`${endpoint} failed`);
      const j = await res.json();
      success("Action completed", `${endpoint} request successful`);
      return j;
    } catch (err) {
      console.error(err);
      error("Action failed", `Unable to complete ${endpoint} request`);
    } finally {
      setSaving(false);
    }
  }

  if (!data || loading) {
    return (
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Tax Optimization</h2>
            <p className="text-sm text-gray-600">AI strategist for deductions, entity efficiency, and timing.</p>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-white animate-pulse h-28" />
          <div className="p-4 rounded-xl border bg-white animate-pulse h-28" />
          <div className="p-4 rounded-xl border bg-white animate-pulse h-28" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-white animate-pulse h-48" />
          <div className="p-4 rounded-xl border bg-white animate-pulse h-48" />
          <div className="p-4 rounded-xl border bg-white animate-pulse h-48" />
        </div>
      </main>
    );
  }

  // helper to map plan score color
  function planScoreBadge(score: number | undefined) {
    if (score == null) return <span className="text-sm">—</span>;
    const cls = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
    return <span className={cls}>{score}</span>;
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tax Optimization</h2>
          <p className="text-sm text-gray-600">AI strategist for deductions, entity efficiency, and timing.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border bg-white px-3 py-1 text-sm hover:bg-gray-50" onClick={() => fetchFull()}>Recompute</button>
          <button 
            className="rounded-md bg-sky-600 text-white px-3 py-1 text-sm hover:bg-sky-700" 
            onClick={() => { 
              if (data?.export?.pdf_available) {
                success('Export Started', 'Tax optimization report will download shortly');
              } else {
                error('Export Unavailable', 'PDF export not available'); 
              }
            }}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <section id="kpis">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((k: any) => (
            <div key={k.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
                <span>{k.label}</span>
                <InfoTooltip content={getKpiTooltip(k.id)} />
                {k.as_of_qtr && <span className="text-xs text-gray-400">({k.as_of_qtr})</span>}
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {k.formatted ?? (k.value != null ? formatCurrency(k.value) : (k.count != null ? k.count : '—'))}
                {k.id === 'plan_score' && planScoreBadge(k.value)}
              </div>
              <div className="text-sm text-slate-500">{k.formatted_value ?? k.peer_avg ? `vs peers ${Math.round((k.peer_avg||0)*1000)/10}%` : ''}</div>
              <div className="mt-2 flex items-center gap-2">
                {k.state && <span className={`text-xs px-2 py-1 rounded-full ${getStateColor(k.state)}`}>{k.state}</span>}
                {k.provenance && <ProvenanceBadge sources={k.provenance} confidence={k.confidence} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl border bg-white">
          <h3 className="font-semibold">Tax Overview Dashboard</h3>
          <p className="mt-2 text-sm text-gray-700">{data.overview?.summary ?? '—'}</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-md border bg-slate-50">
              <div className="text-xs text-gray-500 mb-2">Liability Forecast</div>
              <LiabilityForecastChart data={data.overview?.charts?.liability_forecast || []} />
            </div>
            <div className="p-3 rounded-md border bg-slate-50">
              <div className="text-xs text-gray-500 mb-2">Expense Mix</div>
              <ExpenseMixChart data={data.overview?.charts?.expense_mix || []} />
            </div>
            <div className="p-3 rounded-md border bg-slate-50">
              <div className="text-xs text-gray-500 mb-2">Peer Compare</div>
              <PeerComparisonChart data={data.overview?.charts?.peer_compare} />
            </div>
          </div>
        </div>

        <aside className="p-4 rounded-xl border bg-white">
          <h4 className="font-semibold">Plan Score</h4>
          <div className="mt-3 text-3xl font-bold">{planScoreBadge(data.kpis?.find((k:any)=>k.id==='plan_score')?.value)}</div>
          <div className="mt-2 text-sm text-gray-600">Readiness rating based on projections, set-asides, and compliance.</div>
        </aside>
      </section>

      {/* Opportunities */}
      <section id="opportunities" className="space-y-3">
        <h3 className="font-semibold">Tax Optimization AI Engine</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.opportunities?.map((op:any)=> (
            <div key={op.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {op.title}
                    <InfoTooltip content={`IRS Reference: ${op.irs_ref || 'N/A'}`} />
                  </div>
                  <div className="text-sm text-gray-500">
                    Estimate: {formatCurrency(op.estimate)} · Confidence: 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${op.confidence === 'high' ? 'bg-green-100 text-green-800' : op.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {op.confidence ?? '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <ProvenanceBadge sources={op.provenance} confidence={op.confidence} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                    onClick={()=> postAction('priorities/save', { assignee: 'accountant', opportunity_id: op.id })}
                  >
                    Send to Accountant
                  </button>
                  <button 
                    className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                    onClick={()=> setReminderModal({ isOpen: true, item: op })}
                  >
                    Add to Priority Plan
                  </button>
                  <button 
                    className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                    onClick={()=> setScenarioModal({ isOpen: true, opportunity: op })}
                  >
                    Run in Scenario Lab
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmarks */}
      <section id="benchmarks" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl border bg-white">
          <h3 className="font-semibold">Peer & Industry Benchmarking</h3>
          <div className="mt-2 text-sm text-gray-700">Effective Rate: {data.benchmarks?.effective_rate?.yours ? `${Math.round((data.benchmarks.effective_rate.yours||0)*1000)/10}%` : '—'} vs {data.benchmarks?.effective_rate?.peer_avg ? `${Math.round((data.benchmarks.effective_rate.peer_avg||0)*1000)/10}%` : '—'}</div>
          <div className="mt-2 text-sm text-gray-700">Deduction Rate: {data.benchmarks?.deduction_rate ? `${Math.round((data.benchmarks.deduction_rate||0)*100)}%` : '—'}</div>
          <div className="mt-3 text-sm text-gray-700">{(data.benchmarks?.notes||[]).map((n:any,idx:number)=>(<div key={idx} className="mt-1">{n}</div>))}</div>
        </div>
        <aside className="p-4 rounded-xl border bg-white">
          <h4 className="font-semibold">Entity Mix</h4>
          <div className="mt-2 text-sm text-gray-700">LLC: {Math.round((data.benchmarks?.entity_mix?.llc||0)*100)}% · S-Corp: {Math.round((data.benchmarks?.entity_mix?.s_corp||0)*100)}%</div>
        </aside>
      </section>

      {/* Deduction Finder */}
      <section id="finder" className="space-y-3">
        <h3 className="font-semibold">Deduction & Credit Finder</h3>
        <div className="flex gap-2 flex-wrap">
          {['Vehicle','Depreciation','R&D','Energy','Retirement','Insurance','Education','Charitable'].map((c)=> (
            <button key={c} className="rounded-full border px-3 py-1 text-sm bg-white hover:bg-gray-50">{c}</button>
          ))}
        </div>
        <div className="mt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="py-2">Item</th>
                <th className="py-2">Estimate</th>
                <th className="py-2">Confidence</th>
                <th className="py-2">Peer Adoption</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.deduction_finder||[]).map((d:any, idx:number)=> (
                <tr key={idx} className="border-t">
                  <td className="py-2">{d.item}</td>
                  <td className="py-2">{formatCurrency(d.estimate)}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${d.confidence === 'high' ? 'bg-green-100 text-green-800' : d.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {d.confidence}
                    </span>
                  </td>
                  <td className="py-2">{d.peer_adoption_pct ? `${Math.round((d.peer_adoption_pct||0)*100)}%` : '—'}</td>
                  <td className="py-2">
                    <button 
                      className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50 mr-2" 
                      onClick={()=> postAction('priorities/save', { assignee: 'accountant', item: d.item })}
                    >
                      Send to Accountant
                    </button>
                    <button 
                      className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                      onClick={()=> setReminderModal({ isOpen: true, item: d })}
                    >
                      Add Reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Planner */}
      <section id="planner" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded-xl border bg-white">
          <h3 className="font-semibold">Quarterly Tax Planner</h3>
          <div className="mt-2 text-sm text-gray-700">Next due: {data.quarterly_plan?.next_due_date ?? '—'}</div>
          <div className="mt-2 text-sm text-gray-700">Estimate due: {formatCurrency(data.quarterly_plan?.estimate_due)}</div>

          <div className="mt-4">
            <label className="text-sm block">Set-aside per week</label>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              value={data.quarterly_plan?.set_aside_weekly || 0} 
              onChange={(e)=>{
                const v = Number(e.target.value);
                setData((d:any)=> ({...d, quarterly_plan: {...d.quarterly_plan, set_aside_weekly: v}}));
              }} 
              className="w-full"
            />
            <div className="mt-2 text-sm text-gray-700">Suggested weekly transfer: {formatCurrency(data.quarterly_plan?.set_aside_weekly)}</div>

            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Accumulation Forecast</div>
              <SetAsideChart 
                weeklyAmount={data.quarterly_plan?.set_aside_weekly || 0} 
                weeksUntilDue={12} 
              />
            </div>

            <div className="mt-4">
              <div className="flex gap-2">
                {data.quarterly_plan?.scenarios?.map((s:any,idx:number)=> (
                  <button 
                    key={idx} 
                    className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                    onClick={()=> info('Scenario Impact', `${s.name} → Tax impact: ${formatCurrency(s.delta_liability)}`)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <aside className="p-4 rounded-xl border bg-white">
          <h4 className="font-semibold">Quick Calculator</h4>
          <div className="mt-2 text-sm text-gray-700">Weekly set-aside: {formatCurrency(data.quarterly_plan?.set_aside_weekly)}</div>
          <div className="mt-2 text-sm text-gray-700">
            12-week total: {formatCurrency((data.quarterly_plan?.set_aside_weekly || 0) * 12)}
          </div>
          <div className="mt-3">
            <button 
              className="rounded-md bg-sky-600 text-white px-3 py-1 text-sm hover:bg-sky-700" 
              onClick={()=> data?.export?.pdf_available ? success('Export Started', 'Plan PDF will download shortly') : error('Export Unavailable', 'PDF export not available')}
            >
              Export Plan PDF
            </button>
          </div>
        </aside>
      </section>

      {/* Entity Analysis */}
      <section id="entity" className="space-y-3">
        <h3 className="font-semibold">Entity Structure Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-white">
            <div className="font-semibold">Current: {data.entity_analysis?.current ?? '—'}</div>
            <div className="mt-2 text-sm text-gray-700">Options:</div>
            <ul className="mt-2 text-sm text-gray-700">
              {data.entity_analysis?.options?.map((o:any,idx:number)=>(<li key={idx}>{o.type}: {o.est_savings_year ? formatCurrency(o.est_savings_year) : '—'} — {o.notes}</li>))}
            </ul>
            <div className="mt-3">
              <button className="rounded-md border px-2 py-1 text-sm" onClick={()=> alert('Discuss with CPA (placeholder)')}>Discuss with CPA</button>
            </div>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl border bg-white">
            <h4 className="font-semibold">Comparison (read-only)</h4>
            <div className="mt-2 text-sm text-gray-700">Compare current vs S-Corp / C-Corp / LLC-S (visual placeholder).</div>
          </div>
        </div>
      </section>

      {/* Depreciation */}
      <section id="depreciation" className="space-y-3">
        <h3 className="font-semibold">Depreciation & Asset Optimization</h3>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-700">{data.depreciation?.summary ?? '—'}</div>
          <div className="mt-3 text-sm text-gray-700">Timeline: {(data.depreciation?.timeline||[]).map((t:any)=> `${t.month}: ${formatCurrency(t.write_off)}`).join(' · ')}</div>
          <div className="mt-3">
            <a href="/assets" className="text-sky-600">Go to Asset Management →</a>
          </div>
        </div>
      </section>

      {/* Priority Actions */}
      <section id="priorities" className="space-y-3">
        <h3 className="font-semibold">Priority Action Planner</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.priority_actions?.map((p:any)=>(
            <div key={p.id} className="p-4 rounded-xl border bg-white">
              <div className="font-semibold flex items-center gap-2">
                {p.text}
                <InfoTooltip content={`Deadline: ${p.deadline}, Difficulty: ${p.difficulty}`} />
              </div>
              <div className="text-sm text-gray-600">
                Impact: {formatCurrency(p.impact)} · Due: {p.deadline} · 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${p.difficulty === 'low' ? 'bg-green-100 text-green-800' : p.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {p.difficulty}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                  onClick={()=> postAction('priorities/save', { assignee: 'accountant', priority_id: p.id })}
                >
                  Send to Accountant
                </button>
                <button 
                  className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                  onClick={()=> setReminderModal({ isOpen: true, item: p })}
                >
                  Add Reminder
                </button>
                <button 
                  className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" 
                  onClick={()=> setScenarioModal({ isOpen: true, opportunity: p })}
                >
                  Run in Scenario Lab
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coach */}
      <section id="coach" className="space-y-3">
        <h3 className="font-semibold">AI Tax Coach</h3>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-gray-700">Ask a question to the Tax Coach (posts to /api/ai/tax/ask)</div>
          <CoachBox onAsk={async (q:string)=>{
            try {
              const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
              const url = `${apiRoot.replace(/\/$/, "")}/api/ai/tax/ask`;
              const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ company_id: COMPANY_ID, question: q }), cache: 'no-store' });
              if (!res.ok) throw new Error('coach failed');
              const j = await res.json();
              success('Tax Coach Response', j.answer || JSON.stringify(j));
            } catch (e) {
              try {
                const resp = await callIntent('tax_coach', { query: q }, COMPANY_ID);
                info('Tax Coach Response', resp?.answer || JSON.stringify(resp));
              } catch {
                error('Coach Error', 'Coach failed to respond');
              }
            }
          }} />
        </div>
      </section>

      {/* Exports & Collaboration */}
      <section id="reports" className="space-y-3">
        <h3 className="font-semibold">Reports & Collaboration</h3>
        <div className="flex gap-2">
          <button 
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50" 
            onClick={()=> success('Export Started', 'Tax Optimization Report will download shortly')}
          >
            Export Tax Optimization Report
          </button>
          <button 
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50" 
            onClick={()=> info('Invite Sent', 'Accountant invite link generated (placeholder)')}
          >
            Invite Accountant
          </button>
        </div>
      </section>

      {saving && <div className="text-sm text-gray-600">Saving...</div>}

      {/* Modals */}
      <ScenarioLabModal 
        isOpen={scenarioModal.isOpen}
        onClose={() => setScenarioModal({ isOpen: false })}
        opportunity={scenarioModal.opportunity}
      />
      
      <ReminderModal 
        isOpen={reminderModal.isOpen}
        onClose={() => setReminderModal({ isOpen: false })}
        item={reminderModal.item}
      />
    </main>
  );
}

function CoachBox({ onAsk }:{ onAsk: (q:string)=>Promise<void> }){
  const [q, setQ] = useState('');
  return (
    <div className="space-y-2">
      <input className="w-full rounded-md border px-3 py-2" placeholder="Ask the Tax Coach..." value={q} onChange={(e)=>setQ(e.target.value)} />
      <div className="flex gap-2">
        <button className="rounded-md bg-sky-600 text-white px-3 py-1 text-sm" onClick={async ()=>{ if (q.trim()) { await onAsk(q); setQ(''); } }}>Ask</button>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={()=>{ setQ(''); }}>Clear</button>
      </div>
    </div>
  );
}
