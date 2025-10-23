"use client";

import React, { useEffect, useState } from "react";
import KpiCard from "@/lib/components/KpiCard";
import { TrendlineChart, RadarChart, OpportunityMatrix } from "@/components/charts/SimpleCharts";
import { callIntent, BACKEND_URL } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

type HealthData = any;

const STUB: HealthData = {
  kpis: [
    { id: "overall", label: "Overall Business Health", value: 84, state: "good", trend_delta: +2 },
    { id: "financial", label: "Financial Health", value: 82, state: "good", note: "Strong margins; healthy liquidity" },
    { id: "operational", label: "Operational Health", value: 73, state: "caution", note: "Minor delays; good uptime" },
    { id: "customer", label: "Customer Health", value: 88, state: "good", note: "High sentiment & loyalty" },
    { id: "risk", label: "Risk Exposure", value: 80, state: "good", note: "2 open compliance items" },
    { id: "growth", label: "Growth Momentum", value: 76, state: "caution", note: "Steady upward trend" },
    { id: "ai_conf", label: "AI Confidence Index", value: 0.97, formatted: "97%", state: "good" }
  ],
  overview: {
    summary: "Score is 84 (strong). Top driver: healthy margins. Weakest: inventory turns 12% below peers.",
    trend_12mo: [
      { month: "2024-11", score: 78 }, { month: "2024-12", score: 79 },
      { month: "2025-01", score: 80 }, { month: "2025-02", score: 80 },
      { month: "2025-03", score: 81 }, { month: "2025-04", score: 81 },
      { month: "2025-05", score: 82 }, { month: "2025-06", score: 82 },
      { month: "2025-07", score: 83 }, { month: "2025-08", score: 82 },
      { month: "2025-09", score: 82 }, { month: "2025-10", score: 84 }
    ],
    peer_compare: { yours: 84, peer_avg: 80 }
  },
  categories: {},
  alerts: [],
  heatmap: [],
  recommendations: [],
  coach_examples: [],
  export: { pdf_available: true, csv_available: true }
};

function stateColor(score: number | undefined) {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-600";
}

export default function HealthClient({ initial }: { initial?: HealthData }) {
  const [data, setData] = useState<HealthData | null>(initial || STUB);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/health/full`;
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: "demo", range: "12m", include_peers: true, include_breakdowns: true }),
          cache: "no-store",
        });
        if (!resp.ok) throw new Error(`health API failed (${resp.status})`);
        const json = await resp.json();
        if (!mounted) return;
        setData((prev:any) => ({ ...prev, ...json }));
      } catch (e) {
        // fallback: try secondary callIntent if available
        try {
          const ci = await callIntent("business_health", { range: "12m", include_peers: true }, "demo");
          if (mounted && ci) setData((prev:any) => ({ ...prev, ...ci }));
        } catch (e2) {
          // keep stub; show non-fatal toast
          toast.warning("Health data unavailable", "Showing safe fallback data.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [toast]);

  function acknowledgeAlert(id: string) {
    // optimistic UI
    setAcknowledged(prev => ({ ...prev, [id]: true }));
    toast.info("Alert acknowledged", "We'll keep it in the record.");
    // do server patch (best-effort)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || BACKEND_URL}/api/alerts/ack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: "demo", alert_id: id }),
    }).catch(() => {});
  }

  function resolveAlert(id: string) {
    setAcknowledged(prev => ({ ...prev, [id]: true }));
    toast.success("Alert resolved", "Marked resolved locally.");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || BACKEND_URL}/api/alerts/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: "demo", alert_id: id }),
    }).catch(() => {});
  }

  function simulate(actionId: string) {
    // basic simulate payload — per spec should POST to /scenarios
    const payload = { scenario_name: `Simulate:${actionId}`, levers: [{ lever: actionId, delta_pct: 5 }] };
    fetch(`${process.env.NEXT_PUBLIC_API_URL || BACKEND_URL}/api/ai/scenarios/full`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: "demo", ...payload }),
    })
      .then(() => toast.success("Simulation started", "See Scenario Lab for results."))
      .catch(() => toast.error("Simulation failed", "Could not start scenario."));
  }

  const kpis = data?.kpis || [];
  const overview = data?.overview || {};
  const alerts = data?.alerts || [];
  const heatmap = data?.heatmap || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k:any) => (
          <div key={k.id} className="col-span-1">
            <KpiCard title={k.label} value={k.id === 'ai_conf' && k.formatted ? k.formatted : (k.value?.toString?.() ?? '—')}>
              <div className="mt-2 text-sm text-slate-500">{k.note}</div>
              <div className={`mt-1 text-sm ${stateColor(k.value)}`}>{k.state ? k.state : ''} {k.trend_delta != null ? (<span className="ml-2 text-xs">{k.trend_delta > 0 ? '↑' : k.trend_delta < 0 ? '↓' : '→' }</span>) : null}</div>
            </KpiCard>
          </div>
        ))}
      </div>

      {/* Overview Section */}
      <section id="overview" className="space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold">Overview Dashboard</h2>
          <div className="text-sm text-slate-500">AI summary</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm text-slate-600">AI diagnosis</div>
              <div className="mt-2 text-lg font-medium">{overview?.summary || '— missing data'}</div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">12-month Health Score</div>
                <div className="text-sm text-slate-500">MoM deltas</div>
              </div>
              <div className="mt-3">
                {/* use TrendlineChart with transformed data */}
                <TrendlineChart data={[{ metric: 'health_score', series: (overview?.trend_12mo || []).map((m:any)=>m.score) }]} width={600} height={160} />
              </div>
              <div className="mt-3 text-sm text-slate-500">Peer: {overview?.peer_compare?.peer_avg ?? '—'} · Yours: {overview?.peer_compare?.yours ?? '—'}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm text-slate-600">Quadrants</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(data?.kpis || []).filter((kp:any)=>['financial','operational','customer','risk','growth'].includes(kp.id)).map((kp:any)=> (
                  <div key={kp.id} className="rounded-lg border p-3 bg-white">
                    <div className="text-sm font-medium">{kp.label}</div>
                    <div className={`mt-1 text-lg font-semibold ${stateColor(kp.value)}`}>{kp.value ?? '—'}</div>
                    <div className="text-xs text-slate-500 mt-1">{kp.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm text-slate-600">Peer Comparison Radar</div>
              <div className="mt-3">
                <RadarChart data={{ margins: 0.8, growth: 0.75, liquidity: 0.85 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Section */}
      <section id="financial" className="space-y-4">
        <h3 className="text-lg font-semibold">Financial Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Sub-metrics</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries((data?.categories?.financial?.submetrics) || {}).map(([key,val]:any)=> (
                <div key={key} className="rounded-full border px-3 py-1 text-sm text-slate-700">{key.replace(/_/g,' ')}: {typeof val === 'number' ? (val<1 ? (Math.round(val*100))+'%' : val) : String(val)}</div>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-500">{(data?.categories?.financial?.notes||[]).slice(0,2).join(' · ') || '— missing data'}</div>
          </div>

          <div className="md:col-span-2 rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Charts & Notes</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrendlineChart data={[{ metric: 'net_margin_pct', series: (data?.overview?.trend_12mo || []).map((m:any)=>m.score/100) }]} width={400} height={120} />
              <div>
                <div className="text-sm font-medium">Recommendations</div>
                <ul className="list-disc ml-5 mt-2 text-sm text-slate-600">
                  <li>Optimize pricing on low-margin SKUs</li>
                  <li>Reduce OPEX by 8% in low-ROI channels</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Section */}
      <section id="operational" className="space-y-4">
        <h3 className="text-lg font-semibold">Operational Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Sub-metrics</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries((data?.categories?.operational?.submetrics) || {}).map(([key,val]:any)=> (
                <div key={key} className="rounded-full border px-3 py-1 text-sm text-slate-700">{key.replace(/_/g,' ')}: {typeof val === 'number' ? (val<1 ? (Math.round(val*100))+'%' : val) : String(val)}</div>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-500">{(data?.categories?.operational?.notes||[]).slice(0,2).join(' · ') || '— missing data'}</div>
          </div>

          <div className="md:col-span-2 rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Benchmarks & Actions</div>
            <div className="mt-3">
              <OpportunityMatrix data={[{ name: 'Raise ROP', impact: 'high', difficulty: 'low' }, { name: 'Hire Temp', impact: 'medium', difficulty: 'medium' }]} />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Section */}
      <section id="customer" className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Sub-metrics</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries((data?.categories?.customer?.submetrics) || {}).map(([key,val]:any)=> (
                <div key={key} className="rounded-full border px-3 py-1 text-sm text-slate-700">{key.replace(/_/g,' ')}: {typeof val === 'number' ? (val<1 ? (Math.round(val*100))+'%' : val) : String(val)}</div>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-500">{(data?.categories?.customer?.notes||[]).slice(0,2).join(' · ') || '— missing data'}</div>
          </div>

          <div className="md:col-span-2 rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Sentiment & Keywords</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 bg-white">
                <div className="text-sm font-medium">Sentiment Split</div>
                <div className="mt-3 text-lg">{((data?.categories?.customer?.submetrics?.sentiment_score || 0) * 100).toFixed ? ((data?.categories?.customer?.submetrics?.sentiment_score || 0)*100).toFixed(0)+'%' : '—'}</div>
              </div>

              <div className="rounded-lg border p-4 bg-white">
                <div className="text-sm font-medium">Top Keywords</div>
                <div className="mt-2 text-sm text-slate-600">{(data?.categories?.customer?.keywords || []).slice(0,10).map((k:any)=>k.term).join(', ') || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Section */}
      <section id="risk" className="space-y-4">
        <h3 className="text-lg font-semibold">Risk Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Sub-metrics</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries((data?.categories?.risk?.submetrics) || {}).map(([key,val]:any)=> (
                <div key={key} className="rounded-full border px-3 py-1 text-sm text-slate-700">{key.replace(/_/g,' ')}: {typeof val === 'number' ? (val<1 ? (Math.round(val*100))+'%' : val) : String(val)}</div>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-500">{(data?.categories?.risk?.notes||[]).slice(0,2).join(' · ') || '— missing data'}</div>
          </div>

          <div className="md:col-span-2 rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Risk Timeline</div>
            <div className="mt-3 text-sm text-slate-500">(Timeline placeholder)</div>
          </div>
        </div>
      </section>

      {/* Growth Section */}
      <section id="growth" className="space-y-4">
        <h3 className="text-lg font-semibold">Growth Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Sub-metrics</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries((data?.categories?.growth?.submetrics) || {}).map(([key,val]:any)=> (
                <div key={key} className="rounded-full border px-3 py-1 text-sm text-slate-700">{key.replace(/_/g,' ')}: {typeof val === 'number' ? (val<1 ? (Math.round(val*100))+'%' : val) : String(val)}</div>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-500">{(data?.categories?.growth?.notes||[]).slice(0,2).join(' · ') || '— missing data'}</div>
          </div>

          <div className="md:col-span-2 rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-600">Peer comparison & Actions</div>
            <div className="mt-3">
              <div className="text-sm text-slate-500">Peers: {data?.overview?.peer_compare?.peer_avg ?? '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section id="alerts" className="space-y-4">
        <h3 className="text-lg font-semibold">Business Health Alerts</h3>
        <div className="space-y-2">
          {alerts.length === 0 && <div className="text-sm text-slate-500">No alerts</div>}
          {alerts.map((a:any)=> (
            <div key={a.id} className="rounded-lg border bg-white p-4 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{a.text}</div>
                <div className="text-xs text-slate-500 mt-1">Category: {a.category}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>simulate(a.id)} className="text-sm text-blue-600 underline">Simulate in Scenario Lab</button>
                <button onClick={()=>acknowledgeAlert(a.id)} className="text-sm px-3 py-1 rounded border">Acknowledge</button>
                <button onClick={()=>resolveAlert(a.id)} className="text-sm px-3 py-1 rounded bg-red-600 text-white">Resolve</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Heatmap */}
      <section id="heatmap" className="space-y-4">
        <h3 className="text-lg font-semibold">Category Performance Heatmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heatmap.length === 0 && <div className="text-sm text-slate-500">— missing data</div>}
          {heatmap.map((h:any)=> (
            <div key={h.category} className="rounded-lg border bg-white p-4">
              <div className="text-sm font-medium">{h.category}</div>
              <div className={`mt-2 text-2xl font-semibold ${h.score != null ? (h.score>=80? 'text-emerald-600': h.score>=60? 'text-amber-500' : 'text-red-600') : 'text-slate-500'}`}>{h.score ?? '—'}</div>
              <div className="text-xs text-slate-500 mt-2">{h.status} · Benchmark: {h.benchmark ?? '—'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section id="recommendations" className="space-y-4">
        <h3 className="text-lg font-semibold">Recommendations & Action Plan</h3>
        <div className="space-y-2">
          {recommendations.length === 0 && <div className="text-sm text-slate-500">No recommendations</div>}
          {recommendations.map((r:any)=> (
            <div key={r.id} className="rounded-lg border bg-white p-4 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{r.action}</div>
                <div className="text-xs text-slate-500 mt-1">Impact: {r.impact_pts ?? '-'} · Effort: {r.effort} · Timeline: {r.timeline}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm px-3 py-1 rounded border">Send to Task Manager</button>
                <button onClick={()=>simulate(r.id)} className="text-sm px-3 py-1 rounded bg-blue-600 text-white">Simulate in Scenario Lab</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coach */}
      <section id="coach" className="space-y-4">
        <h3 className="text-lg font-semibold">AI Health Advisor</h3>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Ask the Health Advisor</div>
          <div className="mt-3 text-sm text-slate-500">(Chat placeholder) — posts to /api/ai/health/ask</div>
        </div>
      </section>

      {/* Exports */}
      <section id="export" className="space-y-4">
        <h3 className="text-lg font-semibold">Reports & Exports</h3>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border">Download Business Health (PDF)</button>
          <button className="px-3 py-2 rounded border">Download Quarterly Trend (CSV)</button>
        </div>
      </section>

      <div className="text-sm text-slate-400">{loading ? 'Updating...' : ''}</div>
    </div>
  );
}
