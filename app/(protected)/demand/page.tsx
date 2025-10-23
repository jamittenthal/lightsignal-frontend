import React from "react";
import KpiCard from "@/components/KpiCard";
import DemandClient from "./DemandClient";
import DemandSimulator from "./DemandSimulator";
import DemandMap from "./DemandMap";
import { BACKEND_URL, callIntent } from "@/lib/api";

const STUB = {
  kpis: [
    { id: "forecast_30d", label: "Forecasted Demand (30d)", value: 12800, delta_pct: 0.12, confidence: "high", note: "+12% vs last month", state: "good" },
    { id: "event_impact", label: "Event Impact Index", value: 89, state: "good" },
    { id: "weather_influence", label: "Weather Influence Score", value: 75, state: "good" },
    { id: "seasonality_effect", label: "Seasonality Effect", value: 0.24, formatted: "+24%", state: "good" },
    { id: "risk_level", label: "Demand Risk Level", value: "Moderate", variance_pct: 0.18, state: "caution" }
  ],
  timeline: [
    { date: "2025-10-22", p5: 340, p50: 410, p95: 520, markers: ["sunny"] },
    { date: "2025-10-23", p5: 330, p50: 395, p95: 505, markers: [] }
  ],
  heatmap: [
    { date: "2025-10-22", intensity: 72, events: ["market"], weather: "sunny" },
    { date: "2025-10-23", intensity: 58, events: [], weather: "rain" }
  ],
  events: [
    { id: "EVT-CLEARWATER-FOOD", title: "Clearwater Food Festival", date: "2025-10-25", predicted_boost_pct: 18, attendance_est: 7000, roi_note: "Last year ROI ~2.4×", weather: { rain_pct: 10 } }
  ],
  weather: { forecast_14d: [{ date: "2025-10-25", temp_f: 76, rain_pct: 10, wind_mph: 7, alert: null }], influence_score: 75 },
  seasonality: { effect_pct: 24, notes: ["Holiday boost expected late November"] },
  products_services: [ { segment: "Tacos", delta_pct: 15, confidence: "high" }, { segment: "Drinks", delta_pct: 8, confidence: "medium" } ],
  peers: { peer_growth_pct: 0.05, your_forecast_pct: 0.09, commentary: "Your forecast exceeds peers; keep staffing steady.", sources: ["QuickBooks Cohort","Pinecone Peers"], confidence: "medium" },
  simulator_example: { inputs: { add_events: 2, discount_pct: 10 }, outputs: { revenue_delta_pct: 14, margin_delta_pts: -3.2, staffing_delta_fte: 1.5 } },
  alerts: [ { text: "Rain next week may lower revenue ~8%; consider delivery.", severity: "medium", cta: "Adjust Forecast" } ],
  map: { regions: [{ name: "Downtown", lat: 27.965, lng: -82.8, intensity: 0.76 }], events: [{ id: "EVT-CLEARWATER-FOOD", lat: 27.98, lng: -82.82, label: "Food Fest" }], alerts: [] },
  export: { pdf_available: true }
};

async function fetchDemandFull() {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/demand/full`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: "demo", horizon: "12m", range: "30d", include_events: true, include_weather: true, include_peers: true }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`demand full API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // try secondary fallback via callIntent helper if available
    try {
      const intentResp = await callIntent("demand_forecasting", { company_id: "demo", horizon: "12m", range: "30d" }, "demo");
      if (intentResp) return intentResp;
    } catch (ie) {
      // ignore and fall through to stub
    }
    return STUB;
  }
}

export default async function DemandPage() {
  const data = await fetchDemandFull();

  const kpis = data.kpis || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Demand Forecasting</h1>
        <p className="text-sm text-slate-600">Market radar and forecast advisor — projections, events, weather, peers, and what-if scenarios.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {kpis.map((k: any) => (
          <KpiCard key={k.id} title={k.label} value={typeof k.value === 'number' ? (k.id==='forecast_30d' ? `$${k.value}` : String(k.value)) : String(k.value || '—')} subtitle={k.note}>
            {k.confidence && <div className="text-xs text-slate-400 mt-2">Confidence: {k.confidence}</div>}
          </KpiCard>
        ))}
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <DemandClient initialData={data} />
        </div>

        <div className="rounded-2xl border bg-white p-4 space-y-4">
          <DemandSimulator />
        </div>
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Weather & Geographic Intelligence</div>
          <DemandMap mapData={data.map} />
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Weather Forecast</div>
          <div className="space-y-2 text-sm">
            {(data.weather?.forecast_14d || []).slice(0, 5).map((w: any) => (
              <div key={w.date} className="flex justify-between items-center">
                <span>{new Date(w.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <span>{w.temp_f}°F</span>
                  <span className="text-slate-500">{w.rain_pct}%</span>
                  {w.alert && <span className="text-red-600">⚠️</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Influence Score: {data.weather?.influence_score || '—'}/100
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Local Events & External Factors</div>
          <ul className="text-sm space-y-2">
            {(data.events || []).map((e: any) => (
              <li key={e.id} className="border p-2 rounded">
                <div className="font-semibold">{e.title}</div>
                <div className="text-xs text-slate-500">{e.date} · Est. boost: {e.predicted_boost_pct}% · Attendance: {e.attendance_est}</div>
                <div className="text-sm mt-1">{e.roi_note}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Peers & Industry Trends</div>
          <div className="text-sm text-slate-600">Peer avg growth: {data.peers?.peer_growth_pct ? `${(data.peers.peer_growth_pct*100).toFixed(1)}%` : '—'}</div>
          <div className="text-sm mt-2">{data.peers?.commentary || '—'}</div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Alerts & Recommendations</div>
          <ul className="space-y-2 text-sm">
            {(data.alerts || []).map((a:any, i:number) => (
              <li key={i} className="p-2 border rounded">
                <div>{a.text}</div>
                <div className="text-xs text-slate-500 mt-1">Severity: {a.severity}</div>
                {a.cta && <div className="mt-2"><button className="px-3 py-1 rounded bg-teal-600 text-white text-sm">{a.cta}</button></div>}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Export & Share</div>
          <div className="text-sm text-slate-600">{data.export?.pdf_available ? 'PDF export available' : 'PDF export not available'}</div>
          <div className="mt-3 space-x-2">
            <button className="px-3 py-1 rounded border">Export PDF</button>
            <button className="px-3 py-1 rounded border">Share</button>
          </div>
        </div>
      </section>
    </div>
  );
}
