"use client";
import { useEffect, useRef, useState } from "react";
import { chatOrchestrator, type ChatMessage } from "../../lib/api";

/**
 * Scenario Lab — chat-first simulator with rich rendering
 * - Accepts any free-form user message
 * - Calls /api/orchestrator_chat
 * - Detects either result shape:
 *   A) { kpis: { <name>_base, <name>_scenario }, benchmarks:[], insights:[], visuals:[] }
 *   B) { base:{kpis:{}}, scenario:{kpis:{}}, delta:{kpis:{}}, assumptions, notes }
 * - Renders Base / Scenario / Delta KPI cards, Benchmarks, Insights, and Charts (SVG)
 */

type KPIKey =
  | "revenue_ttm"
  | "gross_profit_ttm"
  | "ebitda_ttm"
  | "net_income_ttm"
  | "gross_margin"
  | "ebitda_margin"
  | "current_ratio"
  | "debt_to_equity"
  | "ccc_days"
  | "runway_months"
  // also support ad-hoc names like "net_income", "cash_on_hand", etc:
  | "net_income"
  | "cash_on_hand"
  | string;

type KPIMap = Record<KPIKey, number>;

type Normalized = {
  base: KPIMap;
  scenario: KPIMap;
  delta: KPIMap; // scenario - base
  insights?: string[];
  benchmarks?: { metric: string; value?: number; peer_percentile?: number; peer_median?: number; peer_top_quartile?: number }[];
  visuals?: Array<
    | {
        type: "bar";
        title?: string;
        labels: string[];
        values: number[];
      }
    | {
        type: "line";
        title?: string;
        labels: string[];
        series: { name: string; data: number[] }[];
      }
  >;
  assumptions?: any;
  notes?: string[];
};

const LABELS: Record<string, string> = {
  revenue_ttm: "Revenue (TTM)",
  gross_profit_ttm: "Gross Profit (TTM)",
  ebitda_ttm: "EBITDA (TTM)",
  net_income_ttm: "Net Income (TTM)",
  net_income: "Net Income",
  cash_on_hand: "Cash on Hand",
  gross_margin: "Gross Margin",
  ebitda_margin: "EBITDA Margin",
  current_ratio: "Current Ratio",
  debt_to_equity: "Debt / Equity",
  ccc_days: "Cash Conversion Cycle (d)",
  runway_months: "Runway (mo)",
};

const FORMATS: Partial<Record<string, "currency" | "percent" | "number">> = {
  revenue_ttm: "currency",
  gross_profit_ttm: "currency",
  ebitda_ttm: "currency",
  net_income_ttm: "currency",
  net_income: "currency",
  cash_on_hand: "currency",
  gross_margin: "percent",
  ebitda_margin: "percent",
  current_ratio: "number",
  debt_to_equity: "number",
  ccc_days: "number",
  runway_months: "number",
};

const ORDER: string[] = [
  "revenue_ttm",
  "gross_profit_ttm",
  "ebitda_ttm",
  "net_income_ttm",
  "net_income",
  "cash_on_hand",
  "gross_margin",
  "ebitda_margin",
  "current_ratio",
  "debt_to_equity",
  "ccc_days",
  "runway_months",
];

const SEED: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I’m the Scenario Lab. Describe any change (e.g., “Buy a $50k truck at 7.5% for 36 months”, “Hire 2 techs at $28/hr”, “Raise prices 3% next quarter”). I’ll simulate Base vs Scenario and show KPIs.",
  },
];

export default function ScenariosChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [norm, setNorm] = useState<Normalized | null>(null);
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
      // Nudge only the last user message to mark it as a scenario; backend can do this too.
      const nudged: ChatMessage[] = history.map((m, idx) =>
        idx === history.length - 1 && m.role === "user"
          ? { role: "user", content: `scenario_chat: ${m.content} (company_id=demo)` }
          : m
      );
      const res = await chatOrchestrator(nudged);

      // Always show the assistant's text reply as a bubble
      setMessages((prev) => [...prev, res.message]);

      // If model returned JSON, normalize and render it
      if (res.parsed) {
        setNorm(normalizeResult(res.parsed));
      }
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
      const text = input.trim();
      if (text && !loading) send(text);
    }
  }

  const suggestions = [
    "Buy a $50k truck at 7.5% for 36 months",
    "Hire 2 field techs at $28/hr starting next month",
    "Raise prices by 3% next quarter",
    "Cut overtime by 10% and add 1 dispatcher",
  ];

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Scenario Lab (Chat)</h2>
        {loading && <div className="text-sm text-slate-500">Simulating…</div>}
      </div>

      <div className="rounded-2xl bg-white shadow-sm border p-4">
        {/* Suggestions (optional) */}
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

        {/* Chat history */}
        <div className="h-[46vh] overflow-y-auto space-y-3 pr-1 border rounded-xl p-3 mb-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <Typing />}
          <div ref={endRef} />
        </div>

        {/* Input */}
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

      {/* Normalized result rendering */}
      {norm && (
        <section className="rounded-2xl bg-white shadow-sm border p-4 space-y-4">
          <h3 className="font-medium">Results</h3>

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
              {norm.visuals.map((v, i) =>
                v.type === "bar" ? (
                  <BarChart key={i} title={v.title} labels={v.labels} values={v.values} />
                ) : (
                  <LineChart key={i} title={v.title} labels={v.labels} series={(v as any).series} />
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
        </section>
      )}
    </main>
  );
}

/* ---------- UI bits ---------- */

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
  // choose a stable order first, then include any extra keys
  const keysInKpis = Object.keys(kpis);
  const ordered = [...ORDER.filter((k) => keysInKpis.includes(k)), ...keysInKpis.filter((k) => !ORDER.includes(k))];

  return (
    <div className="rounded-xl border p-3">
      <div className="font-medium mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {ordered.map((k) => (
          <div key={k} className="rounded-lg bg-white border p-2">
            <div className="text-xs text-slate-500">{LABELS[k] || titleize(k)}</div>
            <div className={`text-sm font-semibold ${emphasizeDelta ? colorDelta(kpis[k], k) : ""}`}>
              {fmtValue(k, kpis[k])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtValue(key: string, v: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  const fmt = FORMATS[key] || inferFormatFromKey(key);
  if (fmt === "currency") return Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  if (fmt === "percent") {
    // accept either 0..1 or -100..100 style; normalize if needed
    const pct = Math.abs(v) > 1 ? v : v * 100;
    return `${pct.toFixed(1)}%`;
  }
  return Number.isInteger(v) ? v.toString() : v.toFixed(2);
}
function inferFormatFromKey(k: string): "currency" | "percent" | "number" {
  if (k.includes("margin") || k.includes("growth") || k.endsWith("_pct")) return "percent";
  if (k.includes("revenue") || k.includes("profit") || k.includes("income") || k.includes("cash")) return "currency";
  return "number";
}
function colorDelta(v: number | undefined, k: string) {
  if (typeof v !== "number") return "";
  // good if positive for margins/income/cash; bad if positive for debt_to_equity, ccc_days
  const badWhenUp = ["debt_to_equity", "ccc_days"];
  const good = !badWhenUp.includes(k) ? v > 0 : v < 0;
  if (v === 0) return "";
  return good ? "text-emerald-600" : "text-rose-600";
}
function titleize(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/* ---------- Charts (SVG, no libs) ---------- */

function BarChart({ title, labels, values }: { title?: string; labels: string[]; values: number[] }) {
  const w = 800, h = 220, pad = 32, barGap = 12;
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const barW = (w - pad * 2 - barGap * (values.length - 1)) / Math.max(values.length, 1);
  return (
    <div className="overflow-x-auto">
      <div className="mb-2 font-medium">{title || "Chart"}</div>
      <svg width={w} height={h} className="min-w-full">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e2e8f0" />
        {values.map((v, i) => {
          const x = pad + i * (barW + barGap);
          const height = (Math.abs(v) / maxAbs) * (h - pad * 2);
          const y = v >= 0 ? h - pad - height : h - pad; // (for negatives)
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

function LineChart({
  title,
  labels,
  series,
}: {
  title?: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}) {
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

/* ---------- Normalizer ---------- */

function normalizeResult(raw: any): Normalized {
  // Case B: { base:{kpis}, scenario:{kpis}, delta:{kpis}, ... }
  if (raw?.base?.kpis && raw?.scenario?.kpis) {
    const base = raw.base.kpis as KPIMap;
    const scenario = raw.scenario.kpis as KPIMap;
    const delta = raw.delta?.kpis ?? subtractMaps(scenario, base);
    return {
      base,
      scenario,
      delta,
      insights: raw.notes || raw.insights,
      benchmarks: raw.benchmarks,
      visuals: raw.visuals,
      assumptions: raw.assumptions,
      notes: raw.notes,
    };
  }

  // Case A: { kpis: { <name>_base, <name>_scenario, ... }, benchmarks, insights, visuals }
  if (raw?.kpis && typeof raw.kpis === "object") {
    const base: KPIMap = {};
    const scenario: KPIMap = {};
    Object.entries(raw.kpis as Record<string, number>).forEach(([key, val]) => {
      if (key.endsWith("_base")) {
        base[key.replace(/_base$/, "")] = val as number;
      } else if (key.endsWith("_scenario")) {
        scenario[key.replace(/_scenario$/, "")] = val as number;
      } else {
        // ignore or keep as-is if already neutral
      }
    });
    const delta = subtractMaps(scenario, base);
    return {
      base,
      scenario,
      delta,
      insights: raw.insights,
      benchmarks: raw.benchmarks,
      visuals: raw.visuals,
    };
  }

  // Fallback: nothing structured
  return { base: {}, scenario: {}, delta: {} };
}

function subtractMaps(a: KPIMap, b: KPIMap): KPIMap {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: KPIMap = {};
  keys.forEach((k) => {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    out[k] = av - bv;
  });
  return out;
}
