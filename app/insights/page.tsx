"use client";
import { useState } from "react";
import { callResearch } from "../../lib/api";

export default function Insights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runResearch() {
    setLoading(true); setErr(null);
    try {
      const prompt = "For an HVAC small business in Florida (company_id=demo), list 4 near-term market bullets and a 1–2 sentence 'so what'. Include sources.";
      const j = await callResearch(prompt);
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
        <h2 className="text-xl font-semibold">Market Insights</h2>
        <button onClick={runResearch} disabled={loading} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">
          {loading ? "Researching…" : "Run Research"}
        </button>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {data && (
        <>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {(data.bullets ?? []).map((b: string, i: number) => <li key={i}>{b}</li>)}
          </ul>
          <div className="text-sm"><span className="font-medium">So what:</span> {data.so_what}</div>
          <div className="text-xs text-slate-500">Sources: {(data.sources ?? []).join(" • ")}</div>
        </>
      )}
    </main>
  );
}
