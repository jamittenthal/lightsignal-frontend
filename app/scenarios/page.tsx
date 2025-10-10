"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ScenarioLab() {
  const [price, setPrice] = useState(0);
  const [heads, setHeads] = useState(0);
  const [result, setResult] = useState<any>(null);

  async function run() {
    const r = await api.post("/api/scenario", {
      company_id: "demo",
      name: "Quick Test",
      inputs: { price_change_pct: Number(price), headcount_delta: Number(heads) }
    });
    setResult(r.data);
  }

  return (
    <main className="grid gap-6">
      <h2 className="text-xl font-semibold">Scenario Planning Lab</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="rounded-xl bg-white p-4 shadow-sm">
          Price Δ %
          <input className="mt-2 w-full rounded border p-2" value={price} onChange={(e) => setPrice(e.target.value as any)} />
        </label>
        <label className="rounded-xl bg-white p-4 shadow-sm">
          Headcount Δ
          <input className="mt-2 w-full rounded border p-2" value={heads} onChange={(e) => setHeads(e.target.value as any)} />
        </label>
        <button onClick={run} className="self-end rounded-xl bg-slate-900 px-4 py-3 text-white">Run Scenario</button>
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-medium">Base</h3>
            <pre className="text-sm">{JSON.stringify(result.base, null, 2)}</pre>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-medium">Scenario</h3>
            <pre className="text-sm">{JSON.stringify(result.scenario, null, 2)}</pre>
          </div>
        </div>
      )}
    </main>
  );
}
