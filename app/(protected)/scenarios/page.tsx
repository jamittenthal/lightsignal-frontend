'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchScenarioFull } from "../../lib/api";

const COMPANY_ID = "demo";

function Badge({ children, tone = "neutral" }: { 
  children?: React.ReactNode; 
  tone?: "good" | "caution" | "bad" | "neutral" 
}) {
  const cls = tone === "good" ? "bg-emerald-50 text-emerald-700" : 
              tone === "caution" ? "bg-amber-50 text-amber-700" :
              tone === "bad" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700";
  const fallback = tone === 'good' ? '🟢' : tone === 'caution' ? '🟡' : tone === 'bad' ? '🔴' : '—';
  return <span className={`px-2 py-1 text-xs rounded-full border ${cls}`}>{children ?? fallback}</span>;
}

const STUB_DATA = {
  kpis: [
    { id: "rev_delta", label: "Revenue Δ", delta_pct: 7.2, base: 142300, scenario: 152600 },
    { id: "cogs_delta", label: "COGS Δ", delta_pct: -3.1, base: 89500, scenario: 86700 },
    { id: "ni_delta", label: "Net Income Δ", delta_pct: 17.5, base: 17100, scenario: 20100 },
    { id: "cash_runway", label: "Cash / Runway", delta_pct: 33.3, base: 6.0, scenario: 8.0 },
    { id: "capex_delta", label: "CapEx Δ", delta_pct: 12.2, base: 8900, scenario: 9986 },
    { id: "debt_ratio", label: "Debt Ratio", delta_pct: -5.4, base: 0.37, scenario: 0.35 }
  ],
  waterfall: [
    { driver: "Revenue Growth", delta_profit: 5200 },
    { driver: "Cost Reduction", delta_profit: 2800 },
    { driver: "Margin Expansion", delta_profit: 1900 },
    { driver: "OpEx Optimization", delta_profit: -400 }
  ],
  advisor: {
    summary: "This scenario shows moderate upside with manageable risk. Consider implementing revenue initiatives in phases to mitigate execution risk.",
    recommendations: [
      { text: "Phase revenue initiatives over 18m timeline", priority: "high" },
      { text: "Monitor cash flow monthly during ramp", priority: "medium" },
      { text: "Secure credit line before expansion", priority: "low" }
    ]
  },
  peers: {
    used_priors: true,
    sources: ["Industry reports", "Peer benchmarks", "Public filings"],
    benchmarks: {
      gross_margin_pct: 0.42,
      rev_per_employee: 185000,
      ccc_days: 45
    }
  },
  projections: [
    { year: 1, base_rev: 142300, scen_rev: 152600 },
    { year: 2, base_rev: 148400, scen_rev: 165800 },
    { year: 3, base_rev: 155000, scen_rev: 180200 }
  ],
  bands: [
    { period: "Q1", p5: 12500, p50: 14200, p95: 16800 },
    { period: "Q2", p5: 13100, p50: 15000, p95: 17600 },
    { period: "Q3", p5: 13800, p50: 15900, p95: 18500 }
  ],
  tornado: [
    { variable: "Market Size", low_impact: -8500, high_impact: 12000 },
    { variable: "Pricing", low_impact: -6200, high_impact: 9800 },
    { variable: "Competition", low_impact: -4100, high_impact: 3600 }
  ],
  stress: [
    { name: "Recession Scenario", min_cash: 85000, dscr: 1.2 },
    { name: "Supply Chain Shock", min_cash: 92000, dscr: 1.4 },
    { name: "Competitive Response", min_cash: 78000, dscr: 1.1 }
  ]
};

function ScenariosContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [horizon, setHorizon] = useState<string>("12m");
  const [mcRuns, setMcRuns] = useState<number>(1000);
  const [leversText, setLeversText] = useState<string>('{"revenue_growth": 0.15, "cost_reduction": 0.08}');
  const [stressText, setStressText] = useState<string>('{"recession_prob": 0.25, "supply_shock": 0.15}');
  const [chat, setChat] = useState<any[]>([]);
  const [inputText, setInputText] = useState<string>("");

  // Handle lever query parameter from payroll page
  useEffect(() => {
    const leverParam = searchParams?.get('lever');
    if (leverParam) {
      try {
        const leverData = JSON.parse(decodeURIComponent(leverParam));
        if (leverData.category === 'staffing') {
          const staffingLevers = {
            hire_count: leverData.value || 1,
            avg_salary: leverData.avg_salary || 62000,
            role: leverData.role || 'New Hire'
          };
          setLeversText(JSON.stringify(staffingLevers, null, 2));
          setChat([
            { role: 'assistant', text: `Auto-loaded staffing scenario: ${leverData.role} hire at $${leverData.avg_salary}/yr. Review assumptions and run simulation.` }
          ]);
        }
      } catch (e) {
        console.warn('Failed to parse lever query parameter:', e);
      }
    }
  }, [searchParams]);

  // Fetch scenario data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await fetchScenarioFull({ company_id: COMPANY_ID });
        setData(result);
      } catch (error) {
        console.error('Failed to fetch scenario data:', error);
        setData(STUB_DATA);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function kpiTone(kpi: any): "good" | "caution" | "bad" {
    const delta = kpi.delta_pct ?? 0;
    if (delta >= 10) return "good";
    if (delta >= 0) return "caution";
    return "bad";
  }

  function downloadCSV() {
    const csvData = (data?.kpis ?? STUB_DATA.kpis).map((k: any) => 
      `${k.label},${k.base ?? k.base_rev ?? ''},${k.scenario ?? k.scen_rev ?? ''},${k.delta_pct ?? ''}%`
    ).join('\n');
    const blob = new Blob([`Metric,Base,Scenario,Change\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario_analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  async function runSimulation() {
    setLoading(true);
    let leversParsed, stressParsed;
    try { leversParsed = JSON.parse(leversText); } catch { leversParsed = []; }
    try { stressParsed = JSON.parse(stressText); } catch { stressParsed = []; }

    const body = {
      company_id: COMPANY_ID,
      scenario: { name: 'Custom scenario', horizon, mc_runs: mcRuns, levers: leversParsed, stress: stressParsed }
    };

    try {
      const result = await fetchScenarioFull(body);
      setData(result);
    } catch (error) {
      console.error('Simulation failed:', error);
      setData(STUB_DATA);
    } finally {
      setLoading(false);
    }
  }

  function appendChat(role: string, text: string) {
    setChat((c) => [...c, { role, text }]);
  }

  function sendChat() {
    if (!inputText.trim()) return;
    appendChat('user', inputText.trim());
    setInputText('');
    
    // naive echo assistant for now; backend would replace
    setTimeout(() => {
      appendChat('assistant', `Thanks — noted: "${inputText.trim()}". Confirm assumptions on the right and press Run Simulation.`);
    }, 500);
  }

  const kpis = data?.kpis ?? STUB_DATA.kpis;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scenario Planning Lab</h1>
          <p className="text-gray-600 mt-1">Analyze scenarios with AI-powered insights and peer intelligence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Export CSV
          </button>
          <button onClick={exportPDF} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Export PDF
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k: any) => (
          <div key={k.id} className="p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600">{k.label}</div>
                <div className="text-lg font-semibold mt-1">
                  {k.delta_pct !== undefined ? `${k.delta_pct > 0 ? '+' : ''}${k.delta_pct}%` :
                   k.roi_pct !== undefined ? `${k.roi_pct}%` :
                   k.base_dscr !== undefined ? `${k.scenario_dscr ?? k.base_dscr}` : '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Base: {k.base ?? k.base_rev ?? k.base_dscr ?? '—'} ·
                  Scenario: {k.scenario ?? k.scen_rev ?? k.scenario_dscr ?? '—'}
                </div>
              </div>
              <div className="text-right">
                <Badge tone={kpiTone(k)} />
                <div className="text-xs text-gray-400 mt-2">AI conf. — {k._meta?.confidence_pct ? `${Math.round(k._meta.confidence_pct*100)}%` : '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversational Builder (left) */}
        <aside className="col-span-1 bg-white border rounded-xl p-4">
          <h2 className="font-semibold">AI Scenario Builder</h2>
          
          <div className="mt-3">
            <div className="h-56 overflow-auto border rounded p-2 bg-slate-50">
              {chat.length === 0 && (
                <div className="text-sm text-gray-500">
                  Start by asking a question, e.g. "Can I afford a $200k tractor?"
                </div>
              )}
              
              {chat.map((m: any, i: number) => (
                <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block rounded-lg px-3 py-2 max-w-[90%] ${
                    m.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about scenarios, investments, or what-ifs..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              />
              <button onClick={sendChat} className="px-3 py-2 rounded-lg bg-black text-white">
                Send
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium">Assumptions</h3>
            <textarea 
              value={leversText} 
              onChange={(e) => setLeversText(e.target.value)} 
              className="w-full mt-2 p-2 border rounded h-24 text-xs" 
            />
            <div className="text-xs text-gray-500 mt-2">Supported lever categories: Revenue & Demand; Costs & Margins; Staffing; Capex & Assets; Financing; Working Capital; Expansion & Strategy; Risks & Shocks.</div>
            
            <div className="mt-3">
              <label className="text-sm font-medium">Time Horizon</label>
              <select 
                value={horizon} 
                onChange={(e) => setHorizon(e.target.value)}
                className="w-full mt-1 p-2 border rounded text-sm"
              >
                <option value="6m">6m</option>
                <option value="12m">12m</option>
                <option value="18m">18m</option>
                <option value="24m">24m</option>
              </select>
            </div>
            
            <div className="mt-3">
              <label className="text-sm font-medium">Monte Carlo Runs</label>
              <input 
                type="number" 
                min="100" 
                max="10000" 
                value={mcRuns} 
                onChange={(e) => setMcRuns(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded text-sm"
              />
            </div>
            
            <button 
              onClick={runSimulation}
              disabled={loading}
              className="w-full mt-3 px-3 py-2 rounded-lg bg-black text-white disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </aside>

        {/* Results Dashboard (middle + right) */}
        <section className="col-span-1 lg:col-span-2 space-y-4">
          <div className="p-4 bg-white border rounded-xl">
            <h2 className="font-semibold flex items-center gap-2">
              Results Dashboard
              <Badge tone="good">Live</Badge>
            </h2>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Profit Waterfall</h3>
                <ul className="mt-2">
                  {(data?.waterfall ?? STUB_DATA.waterfall).map((w: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm"><span>{w.driver}</span><span>{w.delta_profit >=0 ? '+' : ''}${w.delta_profit}</span></li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Revenue Projections</h3>
                <ul className="mt-2">
                  {(data?.projections ?? STUB_DATA.projections).map((y: any, i: number) => (
                    <div key={i} className="flex justify-between"><span>Year {y.year}</span><span>Base Rev ${y.base_rev} → Scen ${y.scen_rev}</span></div>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border rounded-xl">
            <h3 className="font-semibold">AI Advisor</h3>
            <p className="text-sm text-gray-600 mt-2">{(data?.advisor?.summary ?? STUB_DATA.advisor.summary)}</p>
            <div className="mt-3">
              {(data?.advisor?.recommendations ?? STUB_DATA.advisor.recommendations).map((r: any, i: number) => (
                <div key={i} className="p-3 border rounded">
                  <span className="text-sm">{r.text}</span>
                  <Badge tone={r.priority === 'high' ? 'bad' : r.priority === 'medium' ? 'caution' : 'good'}>{r.priority}</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Peer Intelligence + Stress Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold flex items-center gap-2">
            Peer Intelligence
            <Badge tone="good">Beta</Badge>
          </h3>
          <div className="mt-1 text-sm text-gray-600">Used priors: {(data?.peers?.used_priors ?? data?.used_priors ?? false) ? 'true' : 'false'}</div>
          
          <div className="mt-3 space-y-1">
            <div>Gross margin: {(data?.peers?.benchmarks?.gross_margin_pct ?? STUB_DATA.peers.benchmarks.gross_margin_pct) * 100}%</div>
            <div>Rev / Employee: ${(data?.peers?.benchmarks?.rev_per_employee ?? STUB_DATA.peers.benchmarks.rev_per_employee).toLocaleString()}</div>
            <div>CCC days: {data?.peers?.benchmarks?.ccc_days ?? STUB_DATA.peers.benchmarks.ccc_days}</div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Sources: {(data?.peers?.sources ?? STUB_DATA.peers.sources).join(', ')}</div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold flex items-center gap-2">
            Stress Tests
            <Badge tone="caution">Active</Badge>
          </h3>
          
          <div className="mt-3 space-y-2">
            {(data?.stress ?? STUB_DATA.stress).map((s: any, i: number) => (
              <div key={i} className="p-2 border rounded text-sm">
                <div className="flex justify-between font-medium">
                  <span>{s.name}</span>
                  <span className="text-xs text-gray-500">DSCR: {s.dscr}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Min cash: ${s.min_cash?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="space-y-4">
        <div className="p-4 bg-white border rounded-xl">
          <h3 className="font-semibold">Advanced Analytics</h3>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded">
              <h3 className="text-sm font-medium">Tornado (sensitivity)</h3>
              <ul className="mt-2 space-y-1">
                {(data?.tornado ?? STUB_DATA.tornado).map((t: any, i: number) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{t.variable}</span>
                    <span className="text-xs">{t.low_impact} to {t.high_impact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 border rounded">
              <h3 className="text-sm font-medium">Cash Curve (bands)</h3>
              <ul className="mt-2 space-y-1">
                {(data?.bands ?? STUB_DATA.bands).map((b: any, i: number) => (
                  <div key={i} className="flex justify-between"><span>{b.period}</span><span>{b.p5}/{b.p50}/{b.p95}</span></div>
                ))}
              </ul>
            </div>

            <div className="p-3 border rounded">
              <h3 className="text-sm font-medium">Export Options</h3>
              <div className="mt-2 space-y-1">
                <button onClick={downloadCSV} className="block w-full text-left text-sm py-1 hover:bg-gray-50">�� CSV Export</button>
                <button onClick={exportPDF} className="block w-full text-left text-sm py-1 hover:bg-gray-50">📄 PDF Report</button>
                <button className="block w-full text-left text-sm py-1 hover:bg-gray-50">🔗 Share Link</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/5 pointer-events-none flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="text-sm text-gray-600">Running simulation...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={
      <div className="p-4 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ScenariosContent />
    </Suspense>
  );
}
