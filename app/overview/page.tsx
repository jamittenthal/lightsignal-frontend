"use client";

import { useEffect, useState } from "react";
import { callOrchestrator } from "../../lib/api";
import KpiCard from "@/components/KpiCard";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

type KPIs = Record<string, unknown>;
type Benchmark = { metric: string; value?: number; peer_percentile?: number };

export default function Overview() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [insights, setInsights] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await callOrchestrator(
          "render_financial_overview for company_id=demo"
        );

        const parsed = (res.parsed ?? {}) as any;
        // Support both shapes: {kpis:{...}} OR {base:{kpis:{...}}}
        const k = parsed?.kpis || parsed?.base?.kpis || {};
        const bms: Benchmark[] = Array.isArray(parsed?.benchmarks)
          ? parsed.benchmarks
          : [];
        const ins: string[] | undefined = Array.isArray(parsed?.insights)
          ? parsed.insights
          : undefined;

        setKpis(k as KPIs);
        setBenchmarks(bms);
        setInsights(ins);
      } catch (err) {
        console.error("Error loading overview:", err);
        setError("Failed to load financial overview.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-slate-500 text-sm">
        Loading company overview...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-red-600 text-sm">
        {error}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">
        Financial Overview
      </h1>

      {kpis && Object.keys(kpis).length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(kpis as Record<string, unknown>).map(([key, value]) => (
            <KpiCard
              key={key}
              title={labelForKey(key)}
              value={formatValue(key, value)}
            />
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm">No KPI data available.</div>
      )}

      {benchmarks && benchmarks.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-700 mb-2">
            Peer Benchmarks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchmarks.map((b, i) => (
              <div
                key={i}
                className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm"
              >
                <div className="text-sm text-slate-600 font-medium">
                  {b.metric}
                </div>
                <div className="text-xl font-semibold">
                  {typeof b.value === "number" ? b.value : "—"}
                </div>
                <div className="text-xs text-slate-400">
                  Peer percentile:{" "}
                  {typeof b.peer_percentile === "number"
                    ? b.peer_percentile
                    : "—"}
                  %
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights && insights.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-700 mb-2">
            Key Insights
          </h2>
        <ul className="list-disc list-inside text-slate-600 space-y-1">
            {insights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <ProvenanceBadge source="quickbooks" confidence="medium" />
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function labelForKey(k: string): string {
  const MAP: Record<string, string> = {
    revenue_annual: "Revenue (Annual)",
    revenue_ttm: "Revenue (TTM)",
    gross_profit_ttm: "Gross Profit (TTM)",
    ebitda_ttm: "EBITDA (TTM)",
    net_income_ttm: "Net Income (TTM)",
    net_income: "Net Income",
    cash_on_hand: "Cash on Hand",
    monthly_burn: "Monthly Burn",
    runway_months: "Runway (mo)",
    gross_margin: "Gross Margin",
    ebitda_margin: "EBITDA Margin",
    current_ratio: "Current Ratio",
    debt_to_equity: "Debt / Equity",
    jobs_per_month: "Jobs / Month",
    avg_ticket: "Avg Ticket",
    headcount: "Headcount",
  };
  return MAP[k] ?? titleize(k);
}

function titleize(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function inferFormat(k: string): "currency" | "percent" | "number" {
  if (k.includes("margin") || k.includes("growth") || k.endsWith("_pct"))
    return "percent";
  if (
    k.includes("revenue") ||
    k.includes("profit") ||
    k.includes("income") ||
    k.includes("cash") ||
    k.includes("ticket")
  )
    return "currency";
  return "number";
}

function formatValue(key: string, v: unknown): string {
  if (typeof v === "number") {
    const fmt = inferFormat(key);
    if (fmt === "currency")
      return Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v);
    if (fmt === "percent") {
      const pct = Math.abs(v) > 1 ? v : v * 100;
      return `${pct.toFixed(1)}%`;
    }
    return Number.isInteger(v) ? v.toString() : v.toFixed(2);
  }
  if (typeof v === "string") return v;
  if (v == null) return "—";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
