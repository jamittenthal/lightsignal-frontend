"use client";
import { useState } from "react";
import { callOrchestrator } from "../../lib/api"; // relative import

export default function Overview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runAI() {
    setLoading(true); setErr(null);
    try {
      const j = await callOrchestrator("render_financial_overview for company_id=demo");
      setData(j);
    } catch (e:any) {
      setErr(e.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Financial Overview</h2>
        <button
          onClick={runAI}
          disabled={loading}
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Run AI Overview"}
        </button>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Revenue", value: data.kpis?.revenue },
              { label: "Net Income", value: data.kpis?.net_income },
              { label: "Operating Margin", value: (data.kpis?.operating_margin ?? 0) * 100, suffix: "%" },
              { label: "Cash", value: data.kpis?.cash_balance },
            ].map((k, i) => (
              <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="text-xl font-semibold">
                  {typeof k.value === "number"
                    ? (k.suffix === "%" ? k.value.toFixed(1) + "%" : Intl.NumberFormat().format(k.value))
                    : "—"}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium">Insights</h3>
            <ul className="list-disc pl-6 text-sm space-y-1">
              {(data.insights ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
