import React from "react";
import KpiCard from "../../components/KpiCard";
import InsightsClient from "./InsightsClient";
import { callIntent } from "../../lib/api";

// Server component: fetch backend-first via callIntent("business_insights", input, "demo")
const STUB = {
  kpis: [
    { id: "top_performing", label: "Top Performing Area", value: "Service Revenue +12% MoM", benchmark: "Top quartile vs peers", state: "good" },
    { id: "weakest_area", label: "Weakest Area / Risk", value: "AR Aging +10 days", benchmark: "Below median", state: "bad" },
    { id: "profit_driver", label: "Profitability Driver", value: "Labor utilization +2.4 pts", state: "good" },
    { id: "efficiency_score", label: "Efficiency Score", value: 73, peer_median: 65, state: "good" },
    { id: "growth_index", label: "Growth Opportunity Index", value: 82, state: "good" }
  ],
  current_pulse: {
    summary: [
      "Revenue up 6% MoM; COGS up 8% — margins tighter.",
      "Cash flow healthy; AR collections slowing.",
      "Payroll stable; marketing ROI improving."
    ],
    strengths: ["Repeat customer sales", "Low fixed cost ratio", "High utilization"],
    weaknesses: ["Rising vendor costs", "Slow collections", "High churn"],
    heatmap: [
      { dept: "Sales", metrics: { revenue_growth: "good", margin_pct: "caution", cost_efficiency: "good", ar_days: "caution" } },
      { dept: "Ops", metrics: { revenue_growth: "stable", margin_pct: "caution", cost_efficiency: "bad", ar_days: "good" } }
    ]
  },
  internal_analysis: {
    profitability_trends: { text: "Gross margins declined from 41% → 37% last quarter.", delta_pct: -4.0 },
    expense_outliers: { text: "Software costs grew 24% with no revenue lift.", category: "Software", delta_pct: 24.0 },
    cash_health: { text: "Runway ~4.8 months; slightly above peers.", runway_months: 4.8 },
    labor_productivity: { text: "Revenue/employee up 9% from utilization gains.", delta_pct: 9.0 },
    trends: [
      { metric: "margin_pct", series: [0.41, 0.39, 0.37] },
      { metric: "expense_ratio", series: [0.58, 0.60, 0.61] },
      { metric: "revenue", series: [120000, 128000, 135000] }
    ]
  },
  peers: {
    benchmarks: { rev_per_employee: 128000, peer_median_rev_per_employee: 115000, dso_days_peer: 36 },
    insights: ["Peers reduced DSO from 42 → 36 days.", "Top-quartile firms trimmed COGS 6% via vendor renegotiations."],
    sources: ["QuickBooks Cohort", "SBA/Census", "Public Filings", "Pinecone Peers"],
    confidence: "medium"
  },
  recommendations: {
    revenue_growth: [
      { text: "Raise prices by 3%", expected_impact: { margin_pts: 1.8 }, confidence: "high", timeframe: "short", peer_validation: "Seen in 62% of peers", cta: { run_in_scenarios: true } },
      { text: "Launch maintenance package", expected_impact: { revenue_pct: 6 }, confidence: "medium", timeframe: "medium", peer_validation: "Recurring uplift ~9%" }
    ],
    cost_efficiency: [ { text: "Renegotiate supplier contracts", expected_impact: { cogs_pct: -5 }, confidence: "medium", timeframe: "short" } ],
    cash_liquidity: [ { text: "Shorten terms 45→35 days", expected_impact: { monthly_cash: 14000 }, confidence: "high", timeframe: "short" } ],
    operations: [ { text: "Cross-train staff for seasonality", expected_impact: { utilization_pct: 3 }, confidence: "medium", timeframe: "medium" } ]
  },
  efficiency_roi: {
    ratios: { revenue_per_employee: 128000, expense_ratio: 0.58, labor_utilization_pct: 78 },
    roi_by_initiative: [ { name: "Customer retention", roi_x: 4.3, state: "good" }, { name: "Operations software", roi_x: 0.9, state: "bad" } ],
    ai_summary: ["Most efficient spend: customer retention programs.", "Least efficient: software subscriptions (low ROI)."]
  },
  opportunities: [
    { id: "geo_expansion", title: "Expand to adjacent zip codes", description: "Customer base concentrated; nearby demand visible.", score: 78, priority: "high", confidence: "medium" },
    { id: "recurring_contracts", title: "Add recurring contracts", description: "Move one-time jobs to subscriptions.", score: 84, priority: "high", confidence: "high" }
  ],
  charts: {
    profit_driver_breakdown: [ { driver: "Price", impact: 22000 }, { driver: "COGS", impact: -18000 }, { driver: "Volume", impact: 9000 } ],
    peer_radar: { margins: 0.36, growth: 0.08, liquidity: 0.62 },
    opportunity_matrix: [ { name: "Recurring contracts", impact: "high", difficulty: "medium" }, { name: "Geo expansion", impact: "medium", difficulty: "low" } ],
    efficiency_trendline: [ { month: "2025-07", score: 68 }, { month: "2025-08", score: 71 }, { month: "2025-09", score: 73 } ]
  },
  export: { pdf_available: true, weekly_digest_available: true }
};

export default async function Page() {
  const apiRoot = process.env.NEXT_PUBLIC_API_URL;
  const endpoint = apiRoot ? `${apiRoot.replace(/\/$/, "")}/api/ai/insights/full` : undefined;

  // Build request payload
  const payload = { company_id: "demo", range: "MTD", horizon: "12m", include_peers: true };

  let data: any = STUB;
  let usedStub = true;
  try {
    // Prefer callIntent if available (lib/api exports it)
    if (typeof callIntent === "function") {
      const res = await callIntent("business_insights", payload, "demo");
      if (res && typeof res === "object") {
        data = res;
        usedStub = false;
      }
    } else if (endpoint) {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        data = json;
        usedStub = false;
      }
    }
  } catch (err) {
    // keep stub and log server-side
    console.error("insights fetch failed:", err);
  }

  // Render server component page skeleton and hydrate client with data
  return (
    <main className="p-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Business Insights</h1>
          <p className="text-sm text-slate-500 mt-1">Analyst & Advisor view — performance, benchmarks, and recommended actions.</p>
        </div>
        <div className="text-sm text-slate-500">{usedStub ? "Using stub data" : "Live data"}</div>
      </header>

      {/* KPI cards */}
      <section aria-labelledby="kpis">
        <div id="kpis" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {(data.kpis || []).map((k: any, idx: number) => {
            const sectionMap = ['pulse', 'analysis', 'peers', 'recs', 'eff'];
            const targetSection = sectionMap[idx] || 'pulse';
            
            return (
              <div 
                key={k.id || k.label} 
                className="cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => {
                  const element = document.getElementById(targetSection);
                  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <KpiCard 
                  title={k.label} 
                  value={k.value?.toString?.() ?? "—"} 
                  subtitle={k.benchmark ?? (k.peer_median ? `Peer median: ${k.peer_median}` : undefined)} 
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Hydrated interactive client; pass the full data object */}
      <InsightsClient initialData={data} />
    </main>
  );
}
