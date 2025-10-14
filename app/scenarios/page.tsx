"use client";
import { useEffect, useRef, useState } from "react";
import { chatOrchestrator, type ChatMessage } from "../../lib/api";

type KPIMap = Record<string, number>;
type Visual =
  | { type: "bar"; title?: string; labels?: unknown; values?: unknown }
  | { type: "line"; title?: string; labels?: unknown; series?: unknown; values?: unknown };

type Norm = {
  base: KPIMap;
  scenario: KPIMap;
  delta: KPIMap;
  insights?: string[];
  benchmarks?: { metric: string; value?: number; peer_percentile?: number; peer_median?: number }[];
  visuals?: Visual[];
  _raw?: any;
};

const ORDER = [
  "revenue_annual",
  "revenue_ttm",
  "gross_profit_ttm",
  "ebitda_ttm",
  "net_income_ttm",
  "net_income",
  "cash_on_hand",
  "monthly_burn",
  "runway_months",
  "gross_margin",
  "ebitda_margin",
  "current_ratio",
  "debt_to_equity",
  "jobs_per_month",
  "avg_ticket",
  "headcount",
];

const LABELS: Record<string, string> = {
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

const FORMATS: Partial<Record<string, "currency" | "percent" | "number">> = {
  revenue_annual: "currency",
  revenue_ttm: "currency",
  gross_profit_ttm: "currency",
  ebitda_ttm: "currency",
  net_income_ttm: "currency",
  net_income: "currency",
  cash_on_hand: "currency",
  monthly_burn: "currency",
  runway_months: "number",
  gross_margin: "percent",
  ebitda_margin: "percent",
  current_ratio: "number",
  debt_to_equity: "number",
  jobs_per_month: "number",
  avg_ticket: "currency",
  headcount: "number",
};

const SEED: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I’m the Scenario Lab. Describe any change (e.g., “Buy a $50k truck at 7.5% for 36 months”, “Hire 2 techs at $28/hr”, “Expand to Austin next spring”). I’ll simulate Base vs Scenario and show KPIs.",
  },
];

export default function ScenariosChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [norm, setNorm] = useState<Norm | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, norm]);

  async function send(text: string) {
    const userMsg: ChatMessage = { role: "user", content: text };
    const history: ChatMessage[] = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setNorm(null);

    try {
      const nudged: ChatMessage[] = history.map((m, idx) =>
        idx === history.length - 1 && m.role === "user"
          ? { role: "user", content: `scenario_chat: ${m.content} (company_id=demo)` }
          : m
      );
      const res = await chatOrchestrator(nudged);
      setMessages((prev) => [...prev, res.message]);
      if (res.parsed) setNorm(normalize(res.parsed));
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry—something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const t = input.trim();
      if (t && !loading) send(t);
    }
  }

  const suggestions = [
    "Expand to Austin next spring",
    "Hire 2 techs at $28/hr starting in January",
    "Raise prices by 3% next quarter",
    "Buy a $50k van at 7.5% for 36 months",
  ];

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Scenario Lab (Chat)</h2>
        {loading && <div className="text-sm text-slate-500">Simulating…</div>}
      </div>

      <div className="rounded-2xl bg-white shadow-sm border p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50"
              onClick={() => send(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="h-[46vh] overflow-y-auto space-y-3 pr-1 border rounded-xl p-3 mb-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <Typing />}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe your scenario… any text works."
            className="flex-1 rounded-xl border px-3 py-2"
          />
          <button
            onClick={() => {
              const t = input.trim();
              if (t && !loading) send(t);
            }}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {norm && (
        <section className="rounded-2xl bg-white shadow-sm border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Results</h3>
            <button
              className="text-xs underline underline-offset-2 text-slate-500"
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "Hide raw JSON" : "Show raw JSON"}
            </button>
          </div>

          {/* Verdict banner if present */}
          {"_raw" in (norm as any) && (norm as any)._raw?.verdict && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                (norm as any)._raw.verdict.affordable ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
              }`}
            >
              <div className="font-medium mb-1">Affordability verdict</div>
              <div>{(norm as any)._raw.verdict.summary}</div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <KpiPanel title="Base" kpis={norm.base} />
            <KpiPanel title="Scenario" kpis={norm.scenario} />
            <KpiPanel title="Δ (Scenario - Base)" kpis={norm.delta} emphasizeDelta />
          </div>

          {norm.benchmarks && norm.benchmarks.length > 0 && (
            <div>
              <div className="font-medium mb-2">Benchmarks</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {norm.benchmarks.map((b, i) => (
                  <div key={i} className="rounded-full border px-3 py-1 bg-slate-50">
                    <span className="text-slate-500 mr-1">{b.metric}:</span>
                    {typeof b.value === "number" ? b.value : b.peer_median ?? "—"}
                    {typeof b.peer_percentile === "number" && (
                      <span className="text-slate-500 ml-2">{b.peer_percentile}pctl</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {norm.visuals && norm.visuals.length > 0 && (
            <div className="space-y-4">
              {norm.visuals
                .map((vv) => sanitizeVisual(vv))
                .filter(Boolean)
                .map((v, i) =>
                  v!.type === "bar" ? (
                    <BarChart
                      key={i}
                      title={v!.title}
                      labels={(v as any).labels}
                      values={(v as any).values}
                    />
                  ) : (
                    <LineChart
                      key={i}
                      title={v!.title}
                      labels={(v as any).labels}
                      series={(v as any).series}
                    />
                  )
                )}
            </div>
          )}

          {norm.insights && norm.insights.length > 0 && (
            <div className="rounded-xl bg-slate-50 border p-3 text-sm">
              <div className="font-medium mb-1">Insights</div>
              <ul className="list-disc pl-6">
                {norm.insights.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {showRaw && (
            <div className="rounded-xl bg-slate-50 border p-3 text-xs overflow-auto">
              <pre>{JSON.stringify(norm._raw, null, 2)}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-slate-900 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-900 rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
function Typing() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-slate-100 text-slate-500 px-4 py-2 text-sm">
        Thinking…
      </div>
    </div>
  );
}

function KpiPanel({
  title,
  kpis,
  emphasizeDelta = false,
}: {
  title: string;
  kpis: KPIMap;
  emphasizeDelta?: boolean;
}) {
  const keys = Object.keys(kpis);
  const ordered = [...ORDER.filter((k) => keys.includes(k)), ...keys.filter((k) => !ORDER.includes(k))];
  return (
    <div className="rounded-xl border p-3">
      <div className="font-medium mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {ordered.map((k) => {
          const v = kpis[k];
          const safe = typeof v === "number" && Number.isFinite(v);
          return (
            <div key={k} className="rounded-lg bg-white border p-2">
              <div className="text-xs text-slate-500">{LABELS[k] || titleize(k)}</div>
              <div className={`text-sm font-semibold ${emphasizeDelta ? colorDelta(v, k) : ""}`}>
                {safe ? fmtValue(k, v) : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtValue(key: string, v: number) {
  const fmt = FORMATS[key] || inferFmt(key);
  if (fmt === "currency") return Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  if (fmt === "percent") {
    const pct = Math.abs(v) > 1 ? v : v * 100;
    return `${pct.toFixed(1)}%`;
  }
  return Number.isInteger(v) ? v.toString() : v.toFixed(2);
}
function inferFmt(k: string): "currency" | "percent" | "number" {
  if (k.includes("margin") || k.includes("growth") || k.endsWith("_pct")) return "percent";
  if (k.includes("revenue") || k.includes("profit") || k.includes("income") || k.includes("cash") || k.includes("ticket")) return "currency";
  return "number";
}
function colorDelta(v: number | undefined, k: string) {
  if (typeof v !== "number") return "";
  const badWhenUp = ["debt_to_equity", "monthly_burn"];
  const good = !badWhenUp.includes(k) ? v > 0 : v < 0;
  if (v === 0) return "";
  return good ? "text-emerald-600" : "text-rose-600";
}
function titleize(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/* -------- Charts + sanitizers -------- */

function sanitizeVisual(v: Visual) {
  try {
    if (!v || typeof v !== "object" || !("type" in v)) return null;
    if (v.type === "bar") {
      const labels = Array.isArray(v.labels) ? (v.labels as any[]).map(String) : [];
      const values = Array.isArray(v.values)
        ? (v.values as any[]).map((n) => (typeof n === "number" ? n : Number(n))).filter((n) => Number.isFinite(n))
        : [];
      if (labels.length && values.length && labels.length === values.length) {
        return { type: "bar" as const, title: v.title, labels, values };
      }
      return null;
    }
    if (v.type === "line") {
      const labels = Array.isArray(v.labels) ? (v.labels as any[]).map(String) : [];
      // Accept either series[] or a single values[] (convert to one series)
      let series: { name: string; data: number[] }[] = [];
      if (Array.isArray((v as any).series)) {
        series = ((v as any).series as any[]).map((s, idx) => ({
          name: String(s?.name ?? `Series ${idx + 1}`),
          data: Array.isArray(s?.data)
            ? (s.data as any[]).map((n) => (typeof n === "number" ? n : Number(n))).filter((n) => Number.isFinite(n))
            : [],
        }));
      } else if (Array.isArray((v as any).values)) {
        const vals = ((v as any).values as any[]).map((n) => (typeof n === "number" ? n : Number(n))).filter((n) => Number.isFinite(n));
        series = [{ name: "Series 1", data: vals }];
      }
      series = series.filter((s) => s.data.length === labels.length && labels.length > 0);
      if (labels.length && series.length) {
        return { type: "line" as const, title: v.title, labels, series };
      }
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

function BarChart({ title, labels, values }: { title?: string; labels: string[]; values: number[] }) {
  const w = 800, h = 220, pad = 32, gap = 12;
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const barW = (w - pad * 2 - gap * (values.length - 1)) / Math.max(values.length, 1);
  return (
    <div className="overflow-x-auto">
      <div className="mb-2 font-medium">{title || "Chart"}</div>
      <svg width={w} height={h} className="min-w-full">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e2e8f0" />
        {values.map((v, i) => {
          const x = pad + i * (barW + gap);
          const height = (Math.abs(v) / maxAbs) * (h - pad * 2);
          const y = v >= 0 ? h - pad - height : h - pad;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={height} fill={v >= 0 ? "#0ea5e9" : "#f43f5e"} />
              <text x={x + barW / 2} y={h - 8} fontSize="10" textAnchor="middle" fill="#64748b">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({ title, labels, series }: { title?: string; labels: string[]; series: { name: string; data: number[] }[] }) {
  const w = 800, h = 220, pad = 32;
  const maxY = Math.max(1, ...series.flatMap((s) => s.data));
  const stepX = (w - pad * 2) / Math.max(1, labels.length - 1);
  function path(data: number[]) {
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
      <div className="mb-2 font-medium">{title || "Chart"}</div>
      <svg width={w} height={h} className="min-w-full">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e2e8f0" />
        {series.map((s, idx) => (
          <g key={s.name + idx}>
            <path d={path(s.data)} fill="none" stroke={idx === 0 ? "#0ea5e9" : "#10b981"} strokeWidth={2} />
          </g>
        ))}
        {labels.map((m, i) => {
          const x = pad + i * stepX;
          return (
            <text key={m + i} x={x} y={h - 8} fontSize="10" textAnchor="middle" fill="#64748b">
              {m}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* -------- Normalizer -------- */

function normalize(raw: any): Norm {
  // Structured shape already
  if (raw?.base?.kpis && raw?.scenario?.kpis) {
    const base = asNumMap(raw.base.kpis);
    const scenario = asNumMap(raw.scenario.kpis);
    const delta = raw.delta?.kpis ? asNumMap(raw.delta.kpis) : subtractMaps(scenario, base);
    return {
      base,
      scenario,
      delta,
      insights: Array.isArray(raw.insights) ? raw.insights : [],
      benchmarks: Array.isArray(raw.benchmarks) ? raw.benchmarks : [],
      visuals: Array.isArray(raw.visuals) ? raw.visuals : [],
      _raw: raw,
    };
  }

  // Old flattened kpi_base/kpi_scenario shape
  if (raw?.kpis && typeof raw.kpis === "object") {
    const base: KPIMap = {};
    const scenario: KPIMap = {};
    for (const [k, v] of Object.entries(raw.kpis)) {
      const n = toNum(v);
      if (!Number.isFinite(n)) continue;
      if (k.endsWith("_base")) base[k.replace(/_base$/, "")] = n;
      else if (k.endsWith("_scenario")) scenario[k.replace(/_scenario$/, "")] = n;
    }
    const delta = subtractMaps(scenario, base);
    return {
      base,
      scenario,
      delta,
      insights: Array.isArray(raw.insights) ? raw.insights : [],
      benchmarks: Array.isArray(raw.benchmarks) ? raw.benchmarks : [],
      visuals: Array.isArray(raw.visuals) ? raw.visuals : [],
      _raw: raw,
    };
  }

  return { base: {}, scenario: {}, delta: {}, _raw: raw };
}
function asNumMap(obj: any): KPIMap {
  const out: KPIMap = {};
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const n = toNum(v);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}
function subtractMaps(a: KPIMap, b: KPIMap): KPIMap {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: KPIMap = {};
  keys.forEach((k) => {
    const av = toNum(a[k]);
    const bv = toNum(b[k]);
    out[k] = (Number.isFinite(av) ? av : 0) - (Number.isFinite(bv) ? bv : 0);
  });
  return out;
}
function toNum(v: any): number {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
