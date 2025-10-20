"use client";

import { useEffect, useState } from "react";
// Use RELATIVE import so it works without alias config:
import { callIntent } from "../lib/api";

type KPI = {
  label: string;
  value: number | string;
  unit?: string;
  trend_pct?: number;  // positive = up, negative = down
  href?: string;       // click-through to /overview
};

type Insight = { text: string };
type Reminder = {
  id: string;
  text: string;
  due?: string;
  severity?: "low" | "med" | "high";
  status?: "open" | "done" | "snoozed";
};

type DashboardData = {
  kpis: {
    revenue_mtd?: KPI;
    net_profit_margin?: KPI & { margin_pct?: number };
    cashflow_mtd?: KPI;
    runway_months?: KPI;
    ai_health_score?: KPI;
  };
  snapshot?: {
    headline?: string;         // "Revenue up 7.2% vs last month · ..."
    alerts?: Array<{ kind: "red" | "yellow" | "green"; text: string }>;
  };
  insights?: Insight[];
  reminders?: Reminder[];
  summary?: string;            // footer strip
};

const COMPANY_ID = "demo";

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
  if (kpi.href) {
    return <a href={kpi.href} title="Open in Financial Overview">{body}</a>;
  }
  return body;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [advisorQ, setAdvisorQ] = useState("");
  const [advisorA, setAdvisorA] = useState<string | null>(null);

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

  async function runQuickForecast(days: number) {
    setLoading(true);
    try {
      await callIntent("dashboard", { action: "quick_forecast", horizon_days: days }, COMPANY_ID);
      alert(`Quick forecast generated for ${days} days (check Financial Overview).`);
    } catch (e: any) {
      alert(e?.message ?? "Forecast failed");
    } finally {
      setLoading(false);
    }
  }

  async function askAdvisor() {
    if (!advisorQ.trim()) return;
    setLoading(true);
    setAdvisorA(null);
    try {
      const resp = await callIntent("dashboard", { action: "ask_advisor", question: advisorQ }, COMPANY_ID);
      const result = (resp && (resp.result ?? resp)) as any;
      setAdvisorA(result?.advisor_reply ?? "No answer returned.");
      setAdvisorQ("");
    } catch {
      setAdvisorA("Sorry — advisor failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function updateReminder(id: string, op: "complete" | "snooze" | "delegate") {
    setLoading(true);
    try {
      await callIntent("dashboard", { action: "update_reminder", id, op }, COMPANY_ID);
      await load();
    } finally {
      setLoading(false);
    }
  }

  const k = data?.kpis ?? {};
  const snapshot = data?.snapshot;
  const insights = data?.insights ?? [];
  const reminders = data?.reminders ?? [];
  const summary = data?.summary ?? "Cash healthy · Margins strong · No critical risks detected.";

  return (
    <main className="p-6 space-y-6">
      {/* KPI row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card kpi={{ ...(k.revenue_mtd ?? {}), href: "/overview" }} />
        <Card kpi={{ ...(k.net_profit_margin ?? {}), href: "/overview" }} />
        <Card kpi={{ ...(k.cashflow_mtd ?? {}), href: "/overview" }} />
        <Card kpi={{ ...(k.runway_months ?? {}), href: "/overview" }} />
        <Card kpi={{ ...(k.ai_health_score ?? {}), href: "/overview" }} />
      </section>

      {/* Snapshot + alerts */}
      <section className="space-y-3">
        <div className="text-sm text-gray-600">
          <strong>At-a-Glance:</strong> {snapshot?.headline ?? "—"}
        </div>
        <div className="flex flex-wrap gap-2">
          {snapshot?.alerts?.map((a, i) => {
            const chip =
              a.kind === "red" ? "bg-rose-50 text-rose-700 border border-rose-200" :
              a.kind === "yellow" ? "bg-amber-50 text-amber-700 border border-amber-200" :
              "bg-emerald-50 text-emerald-700 border border-emerald-200";
            return (
              <span key={i} className={`px-2 py-1 text-xs rounded-full ${chip}`}>{a.text}</span>
            );
          })}
        </div>
      </section>

      {/* AI Insights */}
      <section className="p-4 border rounded-xl bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">AI Business Insights</h2>
          <a className="text-sm text-blue-600 hover:underline" href="/overview">Explore more →</a>
        </div>
        <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-700">
          {insights.length === 0 && <li>No insights yet.</li>}
          {insights.map((it, i) => <li key={i}>{it.text}</li>)}
        </ul>
      </section>

      {/* Quick Actions */}
      <section className="p-4 border rounded-xl bg-white space-y-3">
        <h2 className="text-base font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => runQuickForecast(30)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Run 30-day Forecast</button>
          <button onClick={() => runQuickForecast(60)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Run 60-day Forecast</button>
          <button onClick={() => runQuickForecast(90)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Run 90-day Forecast</button>
          <a href="/overview" className="px-3 py-2 rounded-lg border hover:bg-gray-50">Add Expense/Revenue</a>
          <a href="/overview" className="px-3 py-2 rounded-lg border hover:bg-gray-50">View Full Financial Overview</a>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={advisorQ}
            onChange={(e) => setAdvisorQ(e.target.value)}
            placeholder='Ask AI Advisor (e.g., "Can I afford to hire next month?")'
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button onClick={askAdvisor} className="px-3 py-2 rounded-lg bg-black text-white">Ask</button>
        </div>
        {advisorA && <div className="text-sm text-gray-700 mt-2">AI Advisor: {advisorA}</div>}
      </section>

      {/* Reminders */}
      <section className="p-4 border rounded-xl bg-white">
        <h2 className="text-base font-semibold mb-2">Upcoming Reminders</h2>
        {reminders.length === 0 && <div className="text-sm text-gray-500">No reminders.</div>}
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center justify-between border rounded-lg p-2">
              <div>
                <div className="text-sm">{r.text}</div>
                {r.due && <div className="text-xs text-gray-500">Due: {r.due}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateReminder(r.id, "snooze")} className="text-xs px-2 py-1 border rounded-lg">Snooze</button>
                <button onClick={() => updateReminder(r.id, "complete")} className="text-xs px-2 py-1 border rounded-lg">Complete</button>
                <button onClick={() => updateReminder(r.id, "delegate")} className="text-xs px-2 py-1 border rounded-lg">Delegate</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Summary strip */}
      <footer className="sticky bottom-3">
        <div className="text-xs text-gray-600 px-3 py-2 border rounded-full inline-block bg-white">
          {summary}
        </div>
      </footer>

      {loading && (
        <div className="fixed inset-0 bg-black/5 pointer-events-none" aria-hidden />
      )}
    </main>
  );
}

