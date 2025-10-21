import React from "react";
import KpiCard from "../../components/KpiCard";
import PayrollClient from "./PayrollClient";
import { ExportButtons } from "./ExportButtons";
import { BACKEND_URL, callIntent } from "../../lib/api";

function ShimmerCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse">
      <div className="h-3 bg-slate-200 rounded mb-2 w-24"></div>
      <div className="h-6 bg-slate-200 rounded mb-1 w-16"></div>
      <div className="h-3 bg-slate-200 rounded w-32"></div>
    </div>
  );
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-slate-800 rounded shadow-lg">
        {content}
      </div>
    </div>
  );
}

const STUB = {
  kpis: [
    { id: "payroll_total", label: "Payroll Total (MTD)", value: 84200, period: "MTD", state: "caution" },
    { id: "headcount", label: "Headcount", value: 18, ft: 14, pt: 4, state: "good" },
    { id: "cost_per_emp", label: "Cost per Employee (mo)", value: 4689, state: "stable" },
    { id: "hiring_runway", label: "Hiring Runway (mo)", value: 5.4, state: "caution" },
  ],
  snapshot: {
    by_role: [
      { role: "Tech", headcount: 5, avg_comp_month: 7200, pct_of_payroll: 0.43 },
      { role: "Ops",  headcount: 7, avg_comp_month: 4200, pct_of_payroll: 0.35 },
      { role: "Sales",headcount: 3, avg_comp_month: 5000, pct_of_payroll: 0.18 },
      { role: "Admin",headcount: 3, avg_comp_month: 3100, pct_of_payroll: 0.04 }
    ],
    trend: [
      { month: "2025-07", payroll: 78000 },
      { month: "2025-08", payroll: 82000 },
      { month: "2025-09", payroll: 84200 }
    ],
    payroll_pct_of_revenue: 0.38
  },
  planner: { inputs_example: { role: "Field Tech", base_salary: 62000, benefits_pct: 12, payroll_tax_pct: 7.65, overhead_pct: 6, one_time_costs: 1800, start_month: "2025-11" } },
  affordability_result: { fully_loaded_monthly: 62000/12 * (1 + 0.12 + 0.0765 + 0.06), one_time_costs: 1800, monthly_cash_delta: -712, runway_change_months: -0.6, earliest_affordable_start: "2026-01", decision: "borderline" },
  roi_per_headcount: { role_type: "revenue", expected_revenue_lift_month: 4800, net_gain_month: 4800 -  (62000/12 * (1 + 0.12 + 0.0765 + 0.06)), roi_x: 1.4, payback_months: 9 },
  forecast: [
    { month: "2025-11", payroll: 86800 },
    { month: "2025-12", payroll: 86800 },
    { month: "2026-01", payroll: 92000 }
  ],
  export: { pdf_available: true, csv_available: true }
};

async function fetchPayrollFull() {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/payroll/full`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: "demo", range: "MTD", horizon: "12m", include_benchmarks: true }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`payroll full API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // Try secondary fallback via callIntent helper if available
    try {
      const intentResp = await callIntent("payroll_hiring", { company_id: "demo", range: "MTD" }, "demo");
      if (intentResp) return intentResp;
    } catch (ie) {
      // ignore and fall through to stub
    }
    return STUB;
  }
}

export default async function PayrollPage() {
  const data = await fetchPayrollFull();

  const kpis = data.kpis || [];
  const snapshot = data.snapshot || {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Payroll & Hiring</h1>
        <p className="text-sm text-slate-600">Track payroll, forecast hiring costs, and analyze affordability.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {kpis.map((k: any) => {
          const tooltipContent = k.id === 'payroll_total' ? 'Total gross payroll expenses for the selected period' :
                               k.id === 'headcount' ? 'Total employees including full-time and part-time workers' :
                               k.id === 'cost_per_emp' ? 'Average monthly cost per employee including salary, taxes, benefits, and overhead' :
                               k.id === 'hiring_runway' ? 'Months of payroll coverage at current burn rate (Cash ÷ Monthly Payroll)' :
                               'Key payroll metric for planning and analysis';
          
          return (
            <Tooltip key={k.id} content={tooltipContent}>
              <KpiCard 
                title={k.label} 
                value={typeof k.value === 'number' ? (k.id === 'cost_per_emp' ? `$${k.value}` : (k.id === 'payroll_total' ? `$${k.value}` : String(k.value))) : String(k.value || '—')} 
                subtitle={k.period ? k.period : undefined} 
              />
            </Tooltip>
          );
        })}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Current Payroll Snapshot</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2">Role / Dept</th>
                  <th className="pb-2">Headcount</th>
                  <th className="pb-2">Avg comp (mo)</th>
                  <th className="pb-2">% of payroll</th>
                </tr>
              </thead>
              <tbody>
                {(snapshot.by_role || []).map((r: any) => (
                  <tr key={r.role} className="border-t">
                    <td className="py-2">{r.role}</td>
                    <td className="py-2">{r.headcount}</td>
                    <td className="py-2">${r.avg_comp_month}</td>
                    <td className="py-2">{Math.round((r.pct_of_payroll||0)*100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <div className="text-xs text-slate-500 mb-2">Payroll trend (last months)</div>
              <svg className="w-full h-24" viewBox="0 0 200 50" preserveAspectRatio="none">
                {(() => {
                  const trend = (data.snapshot?.trend || []) as { month: string; payroll: number }[];
                  if (trend.length === 0) return null;
                  const maxPayroll = Math.max(...trend.map((t) => Number(t.payroll)), 1);
                  const points = trend
                    .map((p, i) => {
                      const x = (i / Math.max(1, trend.length - 1)) * 200;
                      const y = 50 - (Number(p.payroll) / maxPayroll) * 45;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ");
                  return <polyline fill="none" stroke="#0f766e" strokeWidth={2} points={points} />;
                })()}
              </svg>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Hiring Planner & Affordability</div>
          <PayrollClient initialPlanner={data.planner?.inputs_example} />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">ROI per Headcount & Productivity</div>
          <div className="text-sm text-slate-600">{data.roi_per_headcount ? `Expected revenue lift: $${data.roi_per_headcount.expected_revenue_lift_month}/mo · Payback ${data.roi_per_headcount.payback_months} mo` : '—'}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Forecast & Seasonality</div>
          <div className="text-sm text-slate-600">12-month forecast snapshot below.</div>
          <ul className="text-sm mt-2 space-y-1">
            {(data.forecast||[]).map((f:any)=> (
              <li key={f.month} className="flex justify-between"><span>{f.month}</span><span>${f.payroll}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Cash & Runway Impact</div>
          <div className="text-sm text-slate-600">Runway: {data.kpis?.find((k:any)=>k.id==='hiring_runway')?.value || '—'} mo</div>
          <div className="mt-2 text-xs text-slate-500">Bands: 🟢 &lt;35% · 🟡 35–50% · 🔴 &gt;50%</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Compliance & Deadlines</div>
          <div className="text-sm text-slate-600">Payroll tax filing reminders and pay period cadence.</div>
        </div>
      </section>

      <ExportButtons data={data} />
    </div>
  );
}
