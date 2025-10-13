"use client";
import { useEffect, useState } from "react";
import { computeKpis, getBenchmarks, getFinancials } from "../../lib/finance";
import { callOrchestrator } from "../../lib/api";

type BenchItem = { metric: string; peer_median: number; peer_top_quartile: number };
type View = {
  kpis?: Record<string, number>;
  months?: string[];
  revenue?: number[];
  ebitda?: number[];
  bench?: BenchItem[];
  insights?: string[];
};

type Fmt = "currency" | "percent" | "number";

export default function Overview() {
  const [view, setView] = useState<View>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [fin, k, b] = await Promise.all([
          getFinancials("demo"),
          computeKpis("demo"),
          getBenchmarks("demo"),
        ]);

        const months = fin.pl.map((r) => r.month);
        const revenue = fin.pl.map((r) => r.revenue);
        const gp = fin.pl.map((r) => r.revenue - r.cogs);
        const opex = fin.pl.map((r) => r.opex);
        const ebitda = gp.map((g, i) => g - opex[i]);

        let insights: string[] | undefined = undefined;
        try {
          const res = await callOrchestrator(
            "write_insights for overview company_id=demo (3 bullets)"
          );
          insights = res?.insights ?? undefined;
        } catch {
          /* optional */
        }

        setView({
          kpis: k.kpis,
          months,
          revenue,
          ebitda,
          bench: b.benchmarks,
          insights,
        });
      } catch (e: any) {
        setErr(e.message || "failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const k = view.kpis || {};

  // ✅ Explicitly type this array so fmt is the literal union, not a generic string
  const cards: { label: string; value?: number; fmt?: Fmt }[] = [
    { label: "Revenue (TTM)", value: k.revenue_ttm, fmt: "currency" },
    { label: "EBITDA (TTM)", value: k.ebitda_ttm, fmt: "currency" },
    { label: "Gross Margin", value: (k.gross_margin ?? 0) * 100, fmt: "percent" },
    { label: "EBITDA Margin", value: (k.ebitda_margin ?? 0) * 100, fmt: "percent" },
    { label: "Current Ratio", value: k.current_ratio, fmt: "number" },
    { label: "Debt / Equity", value: k.debt_to_equity, fmt: "number" },
    { label: "CCC (days)", value: k.ccc_days, fmt: "number" },
    { label: "Runway (mo)", value: k.runway_months, fmt: "number" },
  ];

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Financial Overview</h2>
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
      </header>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-xl font-semibold mt-1">
              {fmt(c.value, c.fmt)}
            </div>
          </div>
        ))}
      </section>

      {/* Simple inline chart (Revenue & EBITDA) */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border">
        <h3 className="font-medium mb-4">Revenue & EBITDA (last 12 months)</h3>
        <MiniChart
          months={view.months || []}
          series={[
            { name: "Revenue", data: view.revenue || [] },
            { name: "EBITDA", data: view.ebitda || [] },
          ]}
        />
      </section>

      {/* Benchmarks */}
      <section className="rounded-2xl bg-white p-4 shadow-sm border">
        <h3 className="font-medium mb-3">
          Benchmarks (peer median / top quartile)
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {(view.bench || []).map((b, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-3 border">
              <div className="text-slate-500">{labelize(b.metric)}</div>
              <div className="mt-1">
                <span className="font-medium">
                  {displayMetric(b.metric, b.peer_median)}
                </span>
                <span className="text-slate-500">  /  </span>
                <span>{displayMetric(b.metric, b.peer_top_quartile)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insights */}
      {view.insights && (
        <section className="rounded-2xl bg-white p-4 shadow-sm border">
          <h3 className="font-medium mb-2">Insights</h3>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {view.insights.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function fmt(v?: number, kind: Fmt = "number") {
  if (typeof v !== "number") return "—";
  if (kind === "currency")
    return Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);
  if (kind === "percent") return `${v.toFixed(1)}%`;
  return Number.isInteger(v) ? v.toString() : v.toFixed(2);
}

function labelize(metric: string) {
  const map: Record<string, string> = {
    gross_margin: "Gross Margin",
    ebitda_margin: "EBITDA Margin",
    current_ratio: "Current Ratio",
    debt_to_equity: "Debt / Equity",
    ccc_days: "Cash Conversion Cycle",
    revenue_growth: "Revenue Growth",
  };
  return map[metric] || metric;
}

function displayMetric(metric: string, v: number) {
  if (metric.includes("margin") || metric.includes("growth"))
    return `${(v * 100).toFixed(1)}%`;
  if (metric.includes("ratio")) return v.toFixed(2);
  if (metric.includes("ccc")) return `${v.toFixed(0)}d`;
  return v.toString();
}

/** Minimal inline chart using SVG, no extra libs */
function MiniChart({
  months,
  series,
}: {
  months: string[];
  series: { name: string; data: number[] }[];
}) {
  const w = 800,
    h = 220,
    pad = 32;
  const maxY = Math.max(1, ...series.flatMap((s) => s.data));
  const stepX = (w - pad * 2) / Math.max(1, months.length - 1);

  function linePath(data: number[]) {
    return data
      .map((y, i) => {
        const x = pad + i * stepX;
        const yy = h - pad - (y / maxY) * (h - pad * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${yy}`;
      })
      .join(" ");
  }

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h} className="min-w-full">
        {/* axes */}
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="#e2e8f0"
        />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e2e8f0" />
        {/* series */}
        {series.map((s, idx) => (
          <g key={idx}>
            <path
              d={linePath(s.data)}
              fill="none"
              stroke={idx === 0 ? "#0ea5e9" : "#10b981"}
              strokeWidth={2}
            />
          </g>
        ))}
        {/* x labels */}
        {months.map((m, i) => {
          const x = pad + i * stepX;
          return (
            <text
              key={m}
              x={x}
              y={h - 8}
              fontSize="10"
              textAnchor="middle"
              fill="#64748b"
            >
              {m.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
