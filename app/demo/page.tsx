"use client";

import React, { useEffect, useState } from "react";
import { callIntent } from "../../lib/api";

type KPI = {
  label: string;
  value: number | string;
  unit?: string;
  trend_pct?: number;
  href?: string;
};

type DashboardData = any;

const COMPANY_ID = process.env.NEXT_PUBLIC_DEMO_COMPANY_ID || "demo";

function Trend({ pct }: { pct?: number }) {
  if (pct === undefined || pct === null) return null;
  const up = pct >= 0;
  const arrow = up ? "▲" : "▼";
  const color = up ? "text-emerald-600" : "text-rose-600";
  const sign = up ? "+" : "";
  return <span className={`ml-2 text-xs ${color}`}>{arrow} {sign}{pct.toFixed(1)}%</span>;
}

function Card({ kpi }: { kpi?: Partial<KPI> }) {
  if (!kpi) return null;
  const label = kpi.label ?? "—";
  const value = kpi.value ?? "—";
  const unit = kpi.unit ? ` ${kpi.unit}` : "";
  const body = (
    <div className="p-4 rounded-xl border bg-white hover:shadow-sm transition">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">
        {value}{unit} <Trend pct={kpi.trend_pct} />
      </div>
      <div className="mt-2 text-xs text-gray-400">Click for details</div>
    </div>
  );
  if (kpi.href) return <a href={kpi.href}>{body}</a>;
  return body;
}

export default function DemoDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const resp = await callIntent("dashboard", { action: "load" }, COMPANY_ID);
      const result = (resp && (resp.result ?? resp)) as DashboardData;
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const k = data?.kpis ?? {};
  const snapshot = data?.snapshot;
  const insights = data?.insights ?? [];
  const reminders = data?.reminders ?? [];
  const summary = data?.summary ?? "Demo data — sample only.";

  return (
    <div className="space-y-6">
      <div className="p-3 bg-amber-50 border rounded-full text-sm inline-block">Demo Mode — data is sample only</div>
      <main className="p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card kpi={{ ...(k.revenue_mtd ?? {}), href: "/overview" }} />
          <Card kpi={{ ...(k.net_profit_margin ?? {}), href: "/overview" }} />
          <Card kpi={{ ...(k.cashflow_mtd ?? {}), href: "/overview" }} />
          <Card kpi={{ ...(k.runway_months ?? {}), href: "/overview" }} />
          <Card kpi={{ ...(k.ai_health_score ?? {}), href: "/overview" }} />
        </section>

        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">AI Business Insights</h2>
            <a className="text-sm text-blue-600 hover:underline" href="/overview">Explore more →</a>
          </div>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-700">
            {insights.length === 0 && <li>No insights yet.</li>}
            {insights.map((it: any, i: number) => <li key={i}>{it.text}</li>)}
          </ul>
        </section>

        <footer className="sticky bottom-3">
          <div className="text-xs text-gray-600 px-3 py-2 border rounded-full inline-block bg-white">
            {summary}
          </div>
        </footer>
      </main>
      {loading && <div className="fixed inset-0 bg-black/5 pointer-events-none" aria-hidden />}
    </div>
  );
}
