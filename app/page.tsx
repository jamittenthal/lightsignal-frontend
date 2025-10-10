"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import KpiCard from "@/components/KpiCard";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const r = await api.post("/api/overview", { company_id: "demo", periods: 12 });
      setData(r.data);
    })();
  }, []);

  if (!data) return <div>Loading...</div>;

  const k = data.kpis;

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <ProvenanceBadge source={data.financials.provenance.source} confidence={k.confidence} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Revenue (MTD)" value={`$${k.revenue_mtd.toLocaleString()}`} />
        <KpiCard title="Net Income (MTD)" value={`$${k.net_income_mtd.toLocaleString()}`} />
        <KpiCard title="Margin %" value={`${k.margin_pct.toFixed(1)}%`} />
        <KpiCard title="Cash" value={`$${k.cash_available.toLocaleString()}`} />
        <KpiCard title="Runway" value={`${k.runway_months.toFixed(1)} mo`} />
      </div>

      <section>
        <h3 className="mb-2 font-medium">AI Insights</h3>
        <ul className="space-y-2">
          {data.insights.map((s: string, i: number) => (
            <li key={i} className="rounded-xl bg-white p-3 text-sm shadow-sm">{s}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
