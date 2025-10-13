"use client";
import { useState } from "react";
import { callOrchestrator } from "../../lib/api";

export default function Scenarios() {
  const [loan, setLoan] = useState(50000);
  const [rate, setRate] = useState(7.5);
  const [capex, setCapex] = useState(50000);
  const [price, setPrice] = useState(0);
  const [headcount, setHeadcount] = useState(0);
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runScenario() {
    setLoading(true);
    const prompt = `run_equipment_purchase_sim for company_id=demo, inputs:{loan_amount:${loan},interest_rate:${rate},capex_amount:${capex},price_change_pct:${price},headcount_delta:${headcount}}`;
    const j = await callOrchestrator(prompt);
    setRes(j);
    setLoading(false);
  }

  return (
    <main className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Scenario Lab</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <label className="text-sm">Loan ($)
          <input type="number" value={loan} onChange={e=>setLoan(+e.target.value)} className="w-full rounded-lg border p-2"/>
        </label>
        <label className="text-sm">Rate (%)
          <input type="number" step="0.1" value={rate} onChange={e=>setRate(+e.target.value)} className="w-full rounded-lg border p-2"/>
        </label>
        <label className="text-sm">Capex ($)
          <input type="number" value={capex} onChange={e=>setCapex(+e.target.value)} className="w-full rounded-lg border p-2"/>
        </label>
        <label className="text-sm">Price Δ (%)
          <input type="number" step="0.1" value={price} onChange={e=>setPrice(+e.target.value)} className="w-full rounded-lg border p-2"/>
        </label>
        <label className="text-sm">Headcount Δ
          <input type="number" value={headcount} onChange={e=>setHeadcount(+e.target.value)} className="w-full rounded-lg border p-2"/>
        </label>
      </div>

      <button onClick={runScenario} disabled={loading} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">
        {loading ? "Simulating…" : "Run Scenario"}
      </button>

      {res && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-medium mb-2">Results</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(res, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
