"use client";

import { useEffect, useState } from "react";
import { callIntent } from "@/lib/api";
import Link from "next/link";

type KPIBlock = {
  active_count?: number;
  potential_value?: number;
  avg_fit_score?: number;      // 0..1
  event_readiness?: number;    // 0..1
  historical_roi?: number;     // 0..1
};

type BenchItem = { metric: string; value: number; peer_percentile: number };

type OppItem = {
  title: string;
  category: "grant" | "event" | "bid" | "partner" | "weather" | "lead" | string;
  date?: string;
  deadline?: string;
  fit_score?: number;
  roi_est?: number;
  weather?: string;
  link?: string;
};

type Visual = {
  type: "bar" | "line";
  title: string;
  labels: string[];
  values: number[];
};

type OppResult = {
  kpis?: KPIBlock;
  insights?: string[];
  items?: OppItem[];
  benchmarks?: BenchItem[];
  visuals?: Visual[];
  assumptions?: { company_id: string; inputs: Record<string, any> };
};

export default function OpportunitiesPage() {
  const [region, setRegion] = useState<string>("Austin, TX");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<OppResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchOpps(r: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const resp = await callIntent("opportunities", { region: r }, "demo");
      // resp shape: { intent, company_id, result }
      setData(resp?.result as OppResult);
    } catch (e: any) {
      setError(e?.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpps(region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fmtMoney(n?: number) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
  function pct(n?: number) {
    if (typeof n !== "number") return "—";
    // if already 0..1, show %
    const v = n <= 1 ? n * 100 : n;
    return `${v.toFixed(0)}%`;
  }

  const k = data?.kpis || {};
  const insights = data?.insights || [];
  const items = data?.items || [];
  const benches = data?.benchmarks || [];
  const visuals = data?.visuals || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Opportunities</h1>
        <div className="flex gap-2">
          <input
            className="border rounded-md px-3 py-2 text-sm"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Region (e.g., Austin, TX)"
          />
          <button
            onClick={() => fetchOpps(region)}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm bg-black text-white disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard title="Active opportunities" value={k.active_count ?? 0} />
        <KpiCard title="Potential value" value={fmtMoney(k.potential_value)} />
        <KpiCard title="Avg fit score" value={pct(k.avg_fit_score)} />
        <KpiCard title="Event readiness" value={pct(k.event_readiness)} />
        <KpiCard title="Historical ROI" value={pct(k.historical_roi)} />
      </div>

      {/* Insights */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Insights</h2>
        {insights.length === 0 ? (
          <div className="text-sm text-slate-500">No insights returned.</div>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {insights.map((b, i) => (
              <li key={i} className="text-sm">{b}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Items */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Upcoming items</h2>
        {items.length === 0 ? (
          <div className="text-sm text-slate-500">No items found.</div>
        ) : (
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Deadline</Th>
                  <Th>Fit</Th>
                  <Th>ROI</Th>
                  <Th>Notes / Link</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <Td>{it.title}</Td>
                    <Td><Badge>{it.category}</Badge></Td>
                    <Td>{it.date || "—"}</Td>
                    <Td>{it.deadline || "—"}</Td>
                    <Td>{pct(it.fit_score)}</Td>
                    <Td>{pct(it.roi_est)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {it.weather && <span className="text-xs text-slate-500">{it.weather}</span>}
                        {it.link && (
                          <Link className="text-xs text-blue-600 underline" href={it.link} target="_blank">
                            open
                          </Link>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Visuals (simple render) */}
      {visuals.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-3">Visuals</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visuals.map((v, i) => (
              <div key={i} className="border rounded-md p-4">
                <div className="font-medium mb-2">{v.title}</div>
                <div className="text-xs text-slate-500 mb-2">({v.type})</div>
                {/* Simple tabular fallback so we don’t need a chart lib right now */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <tbody>
                      {v.labels.map((label, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-1 pr-4 text-slate-600">{label}</td>
                          <td className="py-1">{v.values[idx]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Raw JSON (debug) */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-slate-500">Debug JSON</summary>
        <pre className="mt-2 text-xs bg-slate-50 p-3 rounded-md overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-xl font-semibold">{value ?? "—"}</div>
    </div>
  );
}

function Badge({ children }: { children: any }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function Th({ children }: { children: any }) {
  return <th className="text-left px-3 py-2 text-xs font-semibold">{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td className="px-3 py-2">{children}</td>;
}
