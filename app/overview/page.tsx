import React from "react";
import KpiCard from "@/components/KpiCard";
import { callIntent } from "@/lib/api";

type FinancialData = any;

const SAFE_STUB: FinancialData = {
  kpis: {
    revenue_mtd: 128000,
    revenue_qtd: 372000,
    revenue_ytd: 1265000,
    gross_margin_pct: 0.38,
    opex_ratio_pct: 0.28,
    net_margin_pct: 0.12,
    cash_flow_mtd: 22000,
    runway_months: 7.2,
    ai_confidence_pct: 0.87,
    industry_notes: ["You’re in the top 40% for your industry."],
  },
  insights: [
    "Gross margin improved 2.1% MoM.",
    "Cash conversion slowed; consider faster invoice collection.",
  ],
  liquidity: { current_ratio: 1.8, quick_ratio: 1.4, dte: 0.9, interest_cover: 3.7 },
  efficiency: { dso_days: 36, dpo_days: 42, inv_turns: 6.2, ccc_days: 36 + 365 / 6.2 - 42 },
  cashflow: {
    burn_rate_monthly: 32000,
    runway_months: 7.2,
    forecast: [
      { month: "+1", base: 15000, best: 28000, worst: -5000 },
      { month: "+2", base: 12000, best: 26000, worst: -8000 },
      { month: "+3", base: 9000, best: 24000, worst: -12000 },
    ],
    net_trend_3mo: "positive",
  },
  variance: [
    { metric: "Revenue", actual: 128000, forecast: 124800, variance_pct: 0.025 },
    { metric: "COGS", actual: 79360, forecast: 80000, variance_pct: -0.008 },
    { metric: "Expenses", actual: 35840, forecast: 36000, variance_pct: -0.004 },
    { metric: "Net Profit", actual: 12800, forecast: 8800, variance_pct: 0.455 },
  ],
  risks: [
    { title: "Overtime costs raised COGS", note: "Margin dropped 1.1% from overtime", mitigation: "Rebalance schedule; add part-time shift", confidence_pct: 0.72, percentile: 60 },
    { title: "February cash flow risk", note: "Projected -$18k in worst case", mitigation: "Accelerate AR; delay non-critical capex", confidence_pct: 0.66, percentile: 55 },
  ],
};

async function fetchData() {
  try {
    const resp = await callIntent("financial_overview", { action: "load" }, "demo");
    return resp || SAFE_STUB;
  } catch (e) {
    return SAFE_STUB;
  }
}

export default async function FinancialOverviewPage() {
  const data: FinancialData = await fetchData();
  const k = data.kpis || {};

  const pct = (v: number | undefined | null) => (v == null ? "—" : `${Math.round((v as number) * 1000) / 10}%`);
  const money = (v: number | undefined | null) => (v == null ? "—" : `$${(v as number).toLocaleString()}`);

  const grossState = (pctNum: number | undefined | null) => {
    if (pctNum == null) return "gray";
    if (pctNum > 0.4) return "green";
    if (pctNum >= 0.25) return "yellow";
    return "red";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Financial Overview</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <a href="#revenue" className="block">
          <KpiCard title={`💰 Total Revenue (MTD)`} value={money(k.revenue_mtd)} subtitle={`QTD ${money(k.revenue_qtd)} · YTD ${money(k.revenue_ytd)}`}>
            <div className="text-sm text-slate-500 mt-2">{(k.industry_notes && k.industry_notes[0]) || "You’re in the top 40% for your industry."}</div>
          </KpiCard>
        </a>

        <a href="#profitability" className="block">
          <KpiCard title={`📊 Gross Profit / Margin`} value={pct(k.gross_margin_pct)} subtitle={`Formula: (Revenue − COGS) ÷ Revenue`}>
            <div className="mt-2">
              <span className={`px-2 py-1 rounded-full text-xs ${grossState(k.gross_margin_pct) === 'green' ? 'bg-emerald-100 text-emerald-800' : grossState(k.gross_margin_pct) === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{grossState(k.gross_margin_pct)}</span>
            </div>
          </KpiCard>
        </a>

        <a href="#expenses" className="block">
          <KpiCard title={`🧾 Operating Expenses`} value={pct(k.opex_ratio_pct)} subtitle={`Expense ratio ${pct(k.opex_ratio_pct)}`}>
            <div className="text-sm text-slate-500 mt-2">Expense ratio guidance: Good &lt;30%, Caution 30–45%, Bad &gt;45%</div>
          </KpiCard>
        </a>

        <a href="#net" className="block">
          <KpiCard title={`📈 Net Profit / Margin`} value={`${money(undefined)} / ${pct(k.net_margin_pct)}`} subtitle={money(undefined)}>
            <div className="text-sm text-slate-500 mt-2">Margin vs sector avg</div>
          </KpiCard>
        </a>

        <a href="#cash" className="block">
          <KpiCard title={`💧 Cash Flow (MTD)`} value={money(k.cash_flow_mtd)}>
            <div className="text-sm text-slate-500 mt-2">Green if positive; Red if sustained negative</div>
          </KpiCard>
        </a>

        <a href="#runway" className="block">
          <KpiCard title={`🔋 Runway (Months)`} value={k.runway_months?.toString() || "—"}>
            <div className="text-sm text-slate-500 mt-2">6+ green · 3–5 yellow · &lt;3 red</div>
          </KpiCard>
        </a>

        <a href="#ai" className="block">
          <KpiCard title={`⚙️ AI Confidence Score`} value={`${k.ai_confidence_pct ? Math.round(k.ai_confidence_pct * 100) : "—"}%`}>
            <div className="text-sm text-slate-500 mt-2">High if &gt;85% data coverage</div>
          </KpiCard>
        </a>
      </div>

      {/* Sections */}
      <div id="revenue" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1) Revenue & Profitability Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Line chart (MTD/QTD/YTD vs targets)</div>
            <div className="h-48 flex items-center justify-center text-slate-400">[Line chart placeholder]</div>
            <div className="mt-3 text-sm">Tooltip: % vs forecast</div>

            <div className="mt-4">
              <div className="font-medium">Gross Margin</div>
              <div className="text-sm text-slate-600">Formula: (Revenue − COGS) ÷ Revenue</div>
              <div className="mt-2 flex gap-2 text-sm">
                <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">Good &gt;40%</div>
                <div className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">Moderate 25–40%</div>
                <div className="px-2 py-1 bg-red-50 text-red-700 rounded">Poor &lt;25%</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="font-medium">Profit Waterfall</div>
              <div className="h-32 flex items-center justify-center text-slate-400">[Waterfall placeholder: Revenue → COGS → OpEx → EBITDA → Taxes → Net Profit]</div>
            </div>

            <div className="mt-4 rounded border p-3 bg-slate-50">
              <div className="font-medium">Price Optimization Insight (AI)</div>
              <div className="text-sm text-slate-600">Benchmark pricing vs Pinecone vectors. Suggest small price experiments to measure elasticity.</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-medium">Revenue Highlights</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {(data.insights || []).map((t: any, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div id="expenses" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2) Expense & Cost Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Pie chart: top 5 categories</div>
            <div className="h-48 flex items-center justify-center text-slate-400">[Pie chart placeholder]</div>

            <div className="mt-4">
              <div className="font-medium">Expense-to-Revenue ratio</div>
              <div className="text-sm text-slate-600">{pct(k.opex_ratio_pct)} — Guidance: Good &lt;30%, Caution 30–45%, Bad &gt;45%</div>
            </div>

            <div className="mt-4">
              <div className="font-medium">AI Suggestions</div>
              <div className="text-sm text-slate-600">Examples: reduce admin costs → runway +0.5 months; renegotiate vendor contracts.</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-medium">Top Expense Categories</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {(data.expense_breakdown || []).slice?.(0, 5)?.map((e: any, i: number) => (
                <li key={i}>{e.category} — {e.amount ? `$${e.amount}` : "—"} ({e.pct ? `${Math.round(e.pct*100)}%` : "—"})</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div id="liquidity" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3) Liquidity & Solvency</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Current Ratio</div>
            <div className="text-lg font-semibold">{data.liquidity?.current_ratio ?? "—"}</div>
            <div className="text-xs text-slate-500">{(data.liquidity?.current_ratio ?? 0) >= 1.5 ? 'Good' : (data.liquidity?.current_ratio ?? 0) >=1.0 ? 'Caution' : 'Risk'}</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Quick Ratio</div>
            <div className="text-lg font-semibold">{data.liquidity?.quick_ratio ?? "—"}</div>
            <div className="text-xs text-slate-500">{(data.liquidity?.quick_ratio ?? 0) >= 1.2 ? 'Good' : (data.liquidity?.quick_ratio ?? 0) >=0.8 ? 'Caution' : 'Risk'}</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Debt-to-Equity</div>
            <div className="text-lg font-semibold">{data.liquidity?.dte ?? "—"}</div>
            <div className="text-xs text-slate-500">Lower is better</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Interest Coverage</div>
            <div className="text-lg font-semibold">{data.liquidity?.interest_cover ?? "—"}</div>
            <div className="text-xs text-slate-500">{(data.liquidity?.interest_cover ?? 0) >= 3 ? 'Good' : (data.liquidity?.interest_cover ?? 0) >=1.5 ? 'Caution' : 'Risk'}</div>
          </div>
        </div>
      </div>

      <div id="efficiency" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4) Efficiency & Working Capital</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">AR Turnover / DSO</div>
            <div className="text-lg font-semibold">{data.efficiency?.dso_days ?? "—"} days</div>
            <div className="text-xs text-slate-500">Lower is better</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">AP Turnover / DPO</div>
            <div className="text-lg font-semibold">{data.efficiency?.dpo_days ?? "—"} days</div>
            <div className="text-xs text-slate-500">Manage vendor terms</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Inventory Turns</div>
            <div className="text-lg font-semibold">{data.efficiency?.inv_turns ?? "—"}</div>
            <div className="text-xs text-slate-500">Higher is better</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Cash Conversion Cycle (CCC)</div>
            <div className="text-lg font-semibold">{Math.round((data.efficiency?.ccc_days as number) ?? 0)}</div>
            <div className="text-xs text-slate-500">Target &lt;60 days</div>
          </div>
        </div>
      </div>

      <div id="cash" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5) Cash Flow & Runway</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-medium">Burn Rate</div>
            <div className="text-2xl font-semibold">{money(data.cashflow?.burn_rate_monthly)}</div>
            <div className="text-sm text-slate-500 mt-2">Runway: {data.cashflow?.runway_months ?? k.runway_months} months</div>

            <div className="mt-4">
              <div className="text-sm text-slate-500">3–6 month forecast (base/best/worst)</div>
              <div className="h-32 flex items-center justify-center text-slate-400">[Forecast placeholder]</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-medium">Net Cash Flow (3-mo)</div>
            <div className="text-lg font-semibold">{(data.cashflow?.net_trend_3mo as string) ?? "—"}</div>
            <div className="text-sm text-slate-500 mt-2">Positive / Negative / Stable</div>
          </div>
        </div>
      </div>

      <div id="forecast" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6) Forecast & Variance Analysis</h2>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Variance (Actual vs Forecast)</div>
            <div className="space-x-2">
              <button className="px-3 py-1 bg-slate-100 rounded">Base</button>
              <button className="px-3 py-1 bg-white border rounded">Optimistic</button>
              <button className="px-3 py-1 bg-white border rounded">Pessimistic</button>
            </div>
          </div>

          <table className="w-full mt-4 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Metric</th>
                <th className="pb-2">Actual</th>
                <th className="pb-2">Forecast</th>
                <th className="pb-2">Variance</th>
              </tr>
            </thead>
            <tbody>
              {(data.variance || []).map((v: any, i: number) => {
                const pct = (v.variance_pct ?? 0) * 100;
                const cls = Math.abs(pct) <= 5 ? 'bg-emerald-50 text-emerald-800' : Math.abs(pct) <=10 ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800';
                return (
                  <tr key={i} className="border-t">
                    <td className="py-2">{v.metric}</td>
                    <td className="py-2">{money(v.actual)}</td>
                    <td className="py-2">{money(v.forecast)}</td>
                    <td className="py-2"><span className={`px-2 py-1 rounded text-xs ${cls}`}>{(Math.round(pct*10)/10)}%</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div id="risks" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7) AI Risk Monitor & Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.risks || []).map((r: any, i: number) => (
            <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-slate-600 mt-1">{r.note}</div>
              <div className="text-sm text-slate-500 mt-2">Mitigation: {r.mitigation}</div>
              <div className="text-xs text-slate-400 mt-2">Confidence: {Math.round((r.confidence_pct||0)*100)}% · Percentile: {r.percentile ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="drilldowns" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">8) Drilldowns, Reports & Exports</h2>
        <div className="rounded-2xl border bg-white p-4 shadow-sm flex gap-3">
          <button disabled className="px-3 py-2 bg-slate-100 rounded">Export CSV</button>
          <button disabled className="px-3 py-2 bg-slate-100 rounded">Export PDF</button>
          <button className="px-3 py-2 bg-white border rounded">Add AI Note</button>
        </div>
      </div>

    </div>
  );
}
