"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import KpiCard from "@/components/KpiCard";

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

type PlannerInputs = {
  role: string;
  base_salary: number;
  hourly: boolean;
  hours_per_week?: number;
  benefits_pct: number;
  payroll_tax_pct: number;
  overhead_pct: number;
  one_time_costs: number;
  start_month: string;
};

export default function PayrollClient({ initialPlanner }: { initialPlanner?: Partial<PlannerInputs> }) {
  const router = useRouter();
  const [inputs, setInputs] = useState<PlannerInputs>({
    role: initialPlanner?.role || "Field Tech",
    base_salary: initialPlanner?.base_salary || 62000,
    hourly: false,
    hours_per_week: initialPlanner?.hours_per_week || 40,
    benefits_pct: initialPlanner?.benefits_pct || 12,
    payroll_tax_pct: initialPlanner?.payroll_tax_pct || 7.65,
    overhead_pct: initialPlanner?.overhead_pct || 6,
    one_time_costs: initialPlanner?.one_time_costs || 1800,
    start_month: initialPlanner?.start_month || new Date().toISOString().slice(0,7),
  });

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAffordability() {
    setRunning(true);
    setError(null);
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/payroll/affordability`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: "demo", input: inputs }),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`Affordability API failed (${resp.status}): ${txt}`);
      }
      const json = await resp.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  }

  function sendToScenario() {
    // Create lever payload and navigate to /scenarios with query
    const payload = {
      category: "staffing",
      key: "hire_count",
      value: 1,
      avg_salary: inputs.base_salary,
      role: inputs.role,
    };
    // encode in query for simplicity
    const q = encodeURIComponent(JSON.stringify(payload));
    router.push(`/scenarios?lever=${q}`);
  }

  async function addPlannedHire() {
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/payroll/planned-hire`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: "demo", hire: inputs }),
      });
      if (resp.ok) {
        alert(`Planned hire added: ${inputs.role} — $${inputs.base_salary}/yr`);
      } else {
        throw new Error(`Failed to add planned hire (${resp.status})`);
      }
    } catch (e: any) {
      alert(`Error adding planned hire: ${e?.message || String(e)}`);
    }
  }

  function exportCSV() {
    const csvData = [
      ['Field', 'Value'],
      ['Role', inputs.role],
      ['Base Salary', inputs.base_salary],
      ['Benefits %', inputs.benefits_pct],
      ['Payroll Tax %', inputs.payroll_tax_pct],
      ['Overhead %', inputs.overhead_pct],
      ['One-time Costs', inputs.one_time_costs],
      ['Start Month', inputs.start_month],
      ...(result ? [
        ['Fully Loaded Monthly', result.fully_loaded_monthly],
        ['Decision', result.decision],
        ['Runway Change (mo)', result.runway_change_months]
      ] : [])
    ];
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_planner_${inputs.role.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {running ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <>
            <KpiCard title="Planner Role" value={inputs.role} />
            <Tooltip content="Fully loaded cost includes base salary plus payroll taxes, benefits, and overhead expenses">
              <KpiCard title="Fully loaded (est)" value={result?.fully_loaded_monthly ? `$${Math.round(result.fully_loaded_monthly)}` : "—"} subtitle={result?.decision ? `Decision: ${result.decision}` : undefined}>
                <div className="mt-2 text-xs text-slate-500">Fully loaded = salary + payroll taxes + benefits + overhead</div>
              </KpiCard>
            </Tooltip>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Hiring Planner</div>
          <div className="space-y-2">
            <label className="block">
              <div className="text-xs text-slate-500">Role title</div>
              <input className="mt-1 w-full rounded border px-2 py-1" value={inputs.role} onChange={(e)=>setInputs({...inputs, role: e.target.value})} />
            </label>

            <Tooltip content="Annual base salary before taxes, benefits, and other costs">
              <label className="block">
                <div className="text-xs text-slate-500">Base salary (annual)</div>
                <input type="number" className="mt-1 w-full rounded border px-2 py-1" value={inputs.base_salary} onChange={(e)=>setInputs({...inputs, base_salary: Number(e.target.value)})} />
              </label>
            </Tooltip>

            <div className="grid grid-cols-2 gap-2">
              <Tooltip content="Healthcare, retirement, and other employee benefits as percentage of salary">
                <label className="block">
                  <div className="text-xs text-slate-500">Benefits %</div>
                  <input type="number" className="mt-1 w-full rounded border px-2 py-1" value={inputs.benefits_pct} onChange={(e)=>setInputs({...inputs, benefits_pct: Number(e.target.value)})} />
                </label>
              </Tooltip>
              <Tooltip content="Social Security, Medicare, and unemployment taxes (typically ~7.65%)">
                <label className="block">
                  <div className="text-xs text-slate-500">Payroll tax %</div>
                  <input type="number" className="mt-1 w-full rounded border px-2 py-1" value={inputs.payroll_tax_pct} onChange={(e)=>setInputs({...inputs, payroll_tax_pct: Number(e.target.value)})} />
                </label>
              </Tooltip>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-xs text-slate-500">Overhead %</div>
                <input type="number" className="mt-1 w-full rounded border px-2 py-1" value={inputs.overhead_pct} onChange={(e)=>setInputs({...inputs, overhead_pct: Number(e.target.value)})} />
              </label>
              <label className="block">
                <div className="text-xs text-slate-500">One-time costs</div>
                <input type="number" className="mt-1 w-full rounded border px-2 py-1" value={inputs.one_time_costs} onChange={(e)=>setInputs({...inputs, one_time_costs: Number(e.target.value)})} />
              </label>
            </div>

            <label className="block">
              <div className="text-xs text-slate-500">Start month</div>
              <input type="month" className="mt-1 rounded border px-2 py-1" value={inputs.start_month} onChange={(e)=>setInputs({...inputs, start_month: e.target.value})} />
            </label>

            <div className="flex flex-wrap gap-2 mt-2">
              <button className="rounded bg-slate-800 text-white px-3 py-1 disabled:opacity-50" onClick={runAffordability} disabled={running}>{running?"Running…":"Run Affordability"}</button>
              <button className="rounded border px-3 py-1" onClick={sendToScenario}>Send to Scenario Lab</button>
              <button className="rounded border px-3 py-1" onClick={addPlannedHire}>Add as Planned Hire</button>
              <button className="rounded border px-3 py-1" onClick={exportCSV}>Export CSV</button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Affordability Result</div>
          {result ? (
            <div className="space-y-2 text-sm">
              <div>Decision: <strong>{result.decision || "—"}</strong></div>
              <div>Fully-loaded monthly: <strong>{result.fully_loaded_monthly ? `$${Math.round(result.fully_loaded_monthly)}` : "—"}</strong></div>
              <div>One-time costs: <strong>{result.one_time_costs ? `$${Math.round(result.one_time_costs)}` : "—"}</strong></div>
              <div>Runway change: <strong>{typeof result.runway_change_months === 'number' ? `${result.runway_change_months > 0 ? '+' : ''}${result.runway_change_months.toFixed(1)} mo` : '—'}</strong></div>
              <div>Earliest affordable start: <strong>{result.earliest_affordable_start || '—'}</strong></div>
              <div className="text-xs text-slate-500">Tip: Fully loaded cost = salary + payroll taxes + benefits + overhead</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Run the affordability test to see results.</div>
          )}
        </div>
      </section>
    </div>
  );
}
