"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ProvenanceBadge from "../../lib/components/ProvenanceBadge";
import { TrendlineChart, BarChart, RadarChart, OpportunityMatrix } from "../../components/charts/SimpleCharts";

function SmallBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block text-xs px-2 py-1 rounded-full bg-slate-100 border text-slate-700">{children}</span>;
}

function Tooltip({ text }: { text: string }) {
  return <span className="text-xs text-slate-500">{text}</span>;
}

export default function InsightsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const d = initialData || {};

  function runScenario(leverId?: string) {
    // Pre-fill query via URL params; simple lever mapping
    const params = new URLSearchParams();
    if (leverId === "price_up_3") params.set("lever", "price_up_3");
    else if (leverId === "shorten_terms") params.set("lever", "shorten_terms_45_35");
    else params.set("from", "insights");
    router.push(`/scenarios?${params.toString()}`);
  }

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Clickable KPI section anchors */}
      <section className="rounded-2xl bg-white shadow-sm border p-4">
        <div className="text-sm text-slate-600 mb-3">Click sections below to navigate:</div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pulse', label: '💹 Business Pulse' },
            { id: 'analysis', label: '🤖 AI Analysis' },
            { id: 'peers', label: '👥 Peer Intelligence' },
            { id: 'recs', label: '🧭 Recommendations' },
            { id: 'eff', label: '⚙️ Efficiency' },
            { id: 'opp', label: '🚀 Opportunities' },
            { id: 'reports', label: '📊 Reports' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="text-sm rounded-full border px-3 py-1 hover:bg-slate-50 transition-colors"
            >
              {section.label}
            </button>
          ))}
        </div>
      </section>

      {/* 1. Current Business Pulse */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="pulse">
        <div className="flex items-center justify-between">
          <h2 id="pulse" className="text-lg font-semibold">💹 Current Business Pulse</h2>
          <div className="flex items-center gap-2">
            <SmallBadge>Live</SmallBadge>
            <Tooltip text="Performance summary generated from financials and trends." />
          </div>
        </div>

        <div className="mt-3 text-sm space-y-2">
          {(d.current_pulse?.summary || []).map((s: string, i: number) => (
            <div key={i}>{s}</div>
          ))}
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-2">Top 3 Strengths</div>
            <ul className="list-disc pl-6">
              {(d.current_pulse?.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Top 3 Weaknesses</div>
            <ul className="list-disc pl-6">
              {(d.current_pulse?.weaknesses || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium mb-2">Performance Heatmap</div>
          <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Department</th>
                  <th className="p-2">Revenue Growth</th>
                  <th className="p-2">Margin %</th>
                  <th className="p-2">Cost Efficiency</th>
                  <th className="p-2">AR Days</th>
                </tr>
              </thead>
              <tbody>
                {(d.current_pulse?.heatmap || []).map((row: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 font-medium">{row.dept}</td>
                    {['revenue_growth','margin_pct','cost_efficiency','ar_days'].map((k) => (
                      <td key={k} className="p-2">
                        <HeatCell state={row.metrics?.[k]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 2. AI Data Analysis (Internal Performance) */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="analysis">
        <div className="flex items-center justify-between">
          <h2 id="analysis" className="text-lg font-semibold">🤖 AI Data Analysis (Internal Performance)</h2>
          <Tooltip text="Automatically analyzes QuickBooks and historical data." />
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium">Profitability Trends</div>
            <div className="text-sm mt-1">{d.internal_analysis?.profitability_trends?.text ?? '—'}</div>
          </div>
          <div>
            <div className="font-medium">Expense Outliers</div>
            <div className="text-sm mt-1">{d.internal_analysis?.expense_outliers?.text ?? '—'}</div>
          </div>
          <div>
            <div className="font-medium">Cash Health</div>
            <div className="text-sm mt-1">{d.internal_analysis?.cash_health?.text ?? '—'}</div>
          </div>
          <div>
            <div className="font-medium">Labor Productivity</div>
            <div className="text-sm mt-1">{d.internal_analysis?.labor_productivity?.text ?? '—'}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium mb-2">Trendlines</div>
          <TrendlineChart data={d.internal_analysis?.trends || []} />
        </div>

        <div className="mt-3 text-xs text-slate-600 space-y-1">
          <div><strong>Gross Margin:</strong> (Revenue – COGS) ÷ Revenue — measures production efficiency.</div>
          <div><strong>Runway:</strong> Cash ÷ Burn Rate — how long you can operate without new funding.</div>
        </div>
      </section>

      {/* 3. Peer & Market Intelligence */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="peers">
        <div className="flex items-center justify-between">
          <h2 id="peers" className="text-lg font-semibold">👥 Peer & Market Intelligence</h2>
          <div className="flex items-center gap-2">
            <SmallBadge>{d.peers?.confidence ?? 'unknown'}</SmallBadge>
            <Tooltip text="Benchmarks and examples from peer cohort." />
          </div>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium">Benchmark Comparison</div>
            <div className="text-sm mt-1">Your revenue per employee = {d.peers?.benchmarks?.rev_per_employee ?? '—'} vs peer median {d.peers?.benchmarks?.peer_median_rev_per_employee ?? '—'}.</div>
            <ul className="mt-2 list-disc pl-6 text-sm">
              {(d.peers?.insights || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-medium">Competitive Landscape</div>
            <div className="text-sm mt-1">Agents summarize tactics that have worked for peers.</div>
            <div className="mt-2 text-sm">
              {(d.peers?.sources || []).map((s: string, i: number) => (
                <div key={i} className="inline-block mr-2 mt-1"><ProvenanceBadge source={s} /></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Strategic & Tactical Recommendations */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="recs">
        <div className="flex items-center justify-between">
          <h2 id="recs" className="text-lg font-semibold">🧭 Strategic & Tactical Recommendations</h2>
          <Tooltip text="Actionable recommendations with impact and confidence." />
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-2">Revenue Growth Actions</div>
            {(d.recommendations?.revenue_growth || []).map((r: any, i: number) => (
              <ActionCard key={i} item={r} onRun={() => runScenario('price_up_3')} />
            ))}
          </div>
          <div>
            <div className="font-medium mb-2">Cost Efficiency Actions</div>
            {(d.recommendations?.cost_efficiency || []).map((r: any, i: number) => (
              <ActionCard key={i} item={r} onRun={() => runScenario()} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Efficiency & ROI Focus */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="eff">
        <h2 id="eff" className="text-lg font-semibold">⚙️ Efficiency & ROI Focus</h2>
        <div className="mt-3 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-3">
            <div className="text-sm text-slate-500">Revenue per Employee</div>
            <div className="text-xl font-semibold">${d.efficiency_roi?.ratios?.revenue_per_employee ?? '—'}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-sm text-slate-500">Expense Ratio</div>
            <div className="text-xl font-semibold">{(d.efficiency_roi?.ratios?.expense_ratio ?? '—')}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-sm text-slate-500">Labor Utilization</div>
            <div className="text-xl font-semibold">{d.efficiency_roi?.ratios?.labor_utilization_pct ?? '—'}%</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="font-medium mb-2">ROI by Initiative</div>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {(d.efficiency_roi?.roi_by_initiative || []).map((r: any, i: number) => (
              <div key={i} className="rounded-xl border p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-slate-500 text-sm">ROI: {r.roi_x}x</div>
                </div>
                <div className="text-sm">
                  {r.state === 'good' ? <span className="text-green-600">🟢</span> : <span className="text-red-600">🔴</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Growth & Opportunity Detection */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="opp">
        <h2 id="opp" className="text-lg font-semibold">🚀 Growth & Opportunity Detection</h2>
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          {(d.opportunities || []).map((o: any, i: number) => (
            <div key={o.id || i} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-sm text-slate-500">{o.description}</div>
                </div>
                <div className="text-sm text-slate-700">Score: {o.score}</div>
              </div>
              <div className="mt-2 flex gap-2">
                <button className="rounded-md bg-black text-white px-3 py-1 text-sm" onClick={() => runScenario(o.id)}>Run in Scenario Lab</button>
                <button className="rounded-md border px-3 py-1 text-sm">Add to Action Plan</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Visual Insight Reports */}
      <section className="rounded-2xl bg-white shadow-sm border p-4" aria-labelledby="reports">
        <h2 id="reports" className="text-lg font-semibold">📊 Visual Insight Reports</h2>
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <BarChart data={d.charts?.profit_driver_breakdown || []} />
          <RadarChart data={d.charts?.peer_radar || {}} />
        </div>
        <div className="mt-4">
          <OpportunityMatrix data={d.charts?.opportunity_matrix || []} />
        </div>
      </section>

      {/* 8. Export & Sharing */}
      <section className="rounded-2xl bg-white shadow-sm border p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Export & Sharing</div>
          <div className="text-sm text-slate-500">One-page PDF export and weekly digest options.</div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2">Export PDF</button>
          <button className="rounded-md border px-3 py-2">Schedule Weekly Digest</button>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ item, onRun }: { item: any; onRun?: () => void }) {
  return (
    <div className="rounded-xl border p-3 mb-2">
      <div className="font-medium">{item.text}</div>
      <div className="text-sm text-slate-500">Impact: {JSON.stringify(item.expected_impact)}</div>
      <div className="mt-2 flex gap-2">
        {item.cta?.run_in_scenarios ? <button className="rounded-md bg-black text-white px-3 py-1 text-sm" onClick={onRun}>Run in Scenario Lab</button> : null}
        <button className="rounded-md border px-3 py-1 text-sm">Export</button>
      </div>
    </div>
  );
}

function HeatCell({ state }: { state: string | undefined }) {
  const map: Record<string, string> = { good: "bg-emerald-100 text-emerald-800", caution: "bg-yellow-100 text-yellow-800", bad: "bg-red-100 text-red-800", stable: "bg-slate-100 text-slate-700" };
  const cls = map[state] || "bg-slate-50 text-slate-700";
  return <div className={`inline-block px-2 py-1 rounded ${cls}`}>{state ?? '—'}</div>;
}