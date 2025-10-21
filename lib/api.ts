// lib/api.ts — UI helpers, safe for Vercel (SSR/CSR).

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://lightsignal-backend.onrender.com";

// ---------- shared types ----------
export type ChatMessage = {
  // allow both 'ai' and 'assistant' since different components use both
  role: "user" | "ai" | "assistant" | "system";
  text?: string;      // some components use 'text'
  content?: string;   // some components use 'content' — allow both
  json?: any;
};

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [k: string]: JSONValue; }
interface JSONArray extends Array<JSONValue> {}

// ---------- low-level HTTP ----------
async function getJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status})`);
  return (await res.json()) as T;
}
async function postJSON<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}
async function patchJSON<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PATCH ${url} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

// ---------- callIntent with flexible arg order ----------
function normalizeIntentArgs(
  a?: string | JSONObject,
  b?: string | JSONObject
): { companyId: string; input: JSONObject } {
  let companyId = "demo";
  let input: JSONObject = {};
  const isStr = (v: any): v is string => typeof v === "string";
  const isObj = (v: any): v is JSONObject =>
    v != null && typeof v === "object" && !Array.isArray(v);

  // Accept both: (intent, "demo", {...}) OR (intent, {...}, "demo")
  if (isStr(a) && (isObj(b) || b === undefined)) {
    companyId = a;
    input = (b as JSONObject) || {};
  } else if ((isObj(a) || a === undefined) && (isStr(b) || b === undefined)) {
    input = (a as JSONObject) || {};
    companyId = (b as string) || "demo";
  } else {
    if (isObj(a)) input = a;
    if (isStr(a)) companyId = a;
    if (isObj(b)) input = b;
    if (isStr(b)) companyId = b;
  }
  return { companyId, input };
}

export function callIntent(
  intent: string,
  companyId?: string,
  input?: JSONObject
): Promise<any>;
export function callIntent(
  intent: string,
  input?: JSONObject,
  companyId?: string
): Promise<any>;
export function callIntent(
  intent: string,
  a?: string | JSONObject,
  b?: string | JSONObject
): Promise<any> {
  const { companyId, input } = normalizeIntentArgs(a, b);

  // Special-case the dashboard intent to prefer a backend-first dashboard endpoint
  // and fall back to a safe stub if the request fails.
  if (intent === "dashboard") {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/dashboard`;
    return (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, input }),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`dashboard request failed (${res.status})`);
        return (await res.json()) as any;
      } catch (err) {
        // Safe UI-friendly stub fallback
        return {
          kpis: {
            revenue_mtd: { label: "Revenue (MTD)", value: 128000, unit: "USD", trend_pct: 7.2, href: "/overview" },
            net_profit_margin: { label: "Net Profit / Margin %", value: 35840, unit: "USD", trend_pct: 2.3, margin_pct: 28.0, href: "/overview" },
            cashflow_mtd: { label: "Cash Flow (MTD)", value: 9100, unit: "USD", trend_pct: -3.1, href: "/overview" },
            // include alternate key name to be forgiving
            cash_flow_mtd: { label: "Cash Flow (MTD)", value: 9100, unit: "USD", trend_pct: -3.1, href: "/overview" },
            runway_months: { label: "Runway (Months)", value: 5, trend_pct: 0.0, href: "/overview" },
            ai_health_score: { label: "AI Health Score", value: 82, unit: "/100", trend_pct: 1.0, href: "/overview" },
          },
          snapshot: {
            headline: "Revenue up 7.2% vs last month · Expenses flat · Profit margin improved to 28%",
            alerts: [{ kind: "green", text: "Ahead of target" }],
          },
          // keep legacy-friendly fields the user requested
          alerts_object: { low_cash: false, spend_spike: false, ahead_of_target: true },
          insights: [
            { text: "Your profit margin improved, but cash conversion slowed — consider faster invoice collection." },
            { text: "Labor costs trending 11% above peers in your industry." },
            { text: "You could safely increase marketing by 5% to maintain margin and growth." },
          ],
          reminders: [
            { id: "tax", text: "Quarterly tax payment due in 6 days." },
            { id: "insurance", text: "Renew business insurance next week." },
            { id: "payroll", text: "Payroll approval pending." },
            { id: "invoices", text: "Invoice follow-up: 3 clients overdue." },
          ],
          summary: "Cash healthy · Margins strong · No critical risks detected.",
          summary_status: "Cash healthy · Margins strong · No critical risks detected.",
          ok: true,
        } as any;
      }
    })();
  }

  // Special-case financial_overview: backend-first via NEXT_PUBLIC_API_URL, safe UI stub fallback
  if (intent === "financial_overview") {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/intent`;
    return (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "financial_overview", company_id: companyId, input }),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`financial_overview request failed (${res.status})`);
        return (await res.json()) as any;
      } catch (err) {
        // Safe UI-friendly stub fallback matching requested minimal shape
        return {
          kpis: {
            revenue_mtd: 128000,
            revenue_qtd: 372000,
            revenue_ytd: 1265000,
            gross_margin_pct: 0.38,
            opex_ratio_pct: 0.28,
            net_margin_pct: 0.12,
            cash_flow_mtd: 22000,
            runway_months: 7.2,
            ai_confidence_pct: 0.87,
            industry_notes: ["You’re in the top 40% for your industry."],
          },
          insights: [
            "Gross margin improved 2.1% MoM.",
            "Cash conversion slowed; consider faster invoice collection.",
          ],
          liquidity: { current_ratio: 1.8, quick_ratio: 1.4, dte: 0.9, interest_cover: 3.7 },
          efficiency: { dso_days: 36, dpo_days: 42, inv_turns: 6.2, ccc_days: 36 + 365 / 6.2 - 42 },
          cashflow: {
            burn_rate_monthly: 32000,
            runway_months: 7.2,
            forecast: [
              { month: "+1", base: 15000, best: 28000, worst: -5000 },
              { month: "+2", base: 12000, best: 26000, worst: -8000 },
              { month: "+3", base: 9000, best: 24000, worst: -12000 },
            ],
          },
          variance: [
            { metric: "Revenue", actual: 128000, forecast: 124800, variance_pct: 0.025 },
            { metric: "COGS", actual: 79360, forecast: 80000, variance_pct: -0.008 },
            { metric: "Expenses", actual: 35840, forecast: 36000, variance_pct: -0.004 },
            { metric: "Net Profit", actual: 12800, forecast: 8800, variance_pct: 0.455 },
          ],
          risks: [
            { title: "Overtime costs raised COGS", note: "Margin dropped 1.1% from overtime", mitigation: "Rebalance schedule; add part-time shift", confidence_pct: 0.72, percentile: 60 },
            { title: "February cash flow risk", note: "Projected -$18k in worst case", mitigation: "Accelerate AR; delay non-critical capex", confidence_pct: 0.66, percentile: 55 },
          ],
        } as any;
      }
    })();
  }

  return postJSON(`${BACKEND_URL}/api/intent`, {
    intent,
    company_id: companyId,
    input,
  });
}

export function callOrchestrator(
  intent: string,
  a?: string | JSONObject,
  b?: string | JSONObject
) {
  return callIntent(intent, a as any, b as any);
}

// ---------- Chat helpers ----------
export async function callResearch(query: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query });
}

// Accept BOTH string and ChatMessage[]
export async function chatOrchestrator(
  messages: string | ChatMessage[],
  companyId: string = "demo"
) {
  if (typeof messages === "string") {
    return callIntent("business_insights", companyId, { query: messages });
  }
  // Normalize ChatMessage[] -> transcript array {role, content}
  const transcript = (messages || []).map((m) => ({
    // map 'ai' to 'assistant' for consistency when sending to LLM-style APIs
    role: m.role === "ai" ? "assistant" : m.role,
    content: m.text ?? m.content ?? "",
  }));
  return callIntent("business_insights", companyId, { transcript });
}

// ---------- Opportunities helpers (watchlist + CSV) ----------
export type WatchItem = {
  id?: string;
  company_id?: string; // optional so UI calls don't type-error
  title?: string;
  category?: string;
  date?: string;
  deadline?: string;
  status?: string;
  notes?: string;
  pinned?: boolean;
  meta?: Record<string, any>;
  [k: string]: any;
};

export function exportCSVUrl(
  companyId: string = "demo",
  intent: string = "opportunities"
) {
  return `${BACKEND_URL}/api/export.csv?company_id=${encodeURIComponent(
    companyId
  )}&intent=${encodeURIComponent(intent)}`;
}

export async function listWatchlist(companyId: string = "demo"): Promise<WatchItem[]> {
  try {
    return await getJSON<WatchItem[]>(
      `${BACKEND_URL}/api/watchlist?company_id=${encodeURIComponent(companyId)}`
    );
  } catch {
    return [] as WatchItem[];
  }
}

// Accept BOTH:
//   updateWatchItem("id", { status: "pinned" }, "demo")
//   updateWatchItem({ id, status: "pinned", company_id: "demo" })
export async function updateWatchItem(
  a: string | (WatchItem & { id: string }),
  b?: Partial<WatchItem>,
  c?: string
): Promise<WatchItem[]> {
  if (typeof a === "string") {
    const id = a;
    const patch = b || {};
    const companyId = typeof c === "string" ? c : "demo";
    try {
      return await patchJSON<WatchItem[]>(
        `${BACKEND_URL}/api/watchlist/${encodeURIComponent(
          id
        )}?company_id=${encodeURIComponent(companyId)}`,
        patch
      );
    } catch {
      return [] as WatchItem[];
    }
  } else {
    const obj = a as WatchItem & { id: string };
    const { id, company_id, ...patch } = obj;
    const companyId = company_id || "demo";
    try {
      return await patchJSON<WatchItem[]>(
        `${BACKEND_URL}/api/watchlist/${encodeURIComponent(
          id
        )}?company_id=${encodeURIComponent(companyId)}`,
        patch
      );
    } catch {
      return [] as WatchItem[];
    }
  }
}

export async function addToWatchlist(
  item: WatchItem,
  companyId: string = "demo"
): Promise<WatchItem[]> {
  try {
    return await postJSON<WatchItem[]>(
      `${BACKEND_URL}/api/watchlist?company_id=${encodeURIComponent(companyId)}`,
      item
    );
  } catch {
    return [item] as WatchItem[];
  }
}

// ---------- Opportunity profiles (flexible) ----------
export type OpportunityProfile = {
  id: string;
  company?: string;
  summary?: string;
  fields?: Record<string, any>;
  [k: string]: any;
};

// getOpportunityProfile("id","demo") OR getOpportunityProfile({id},"demo")
export async function getOpportunityProfile(
  a: string | { id: string },
  b?: string
): Promise<OpportunityProfile | null> {
  const id = typeof a === "string" ? a : a?.id;
  const _companyId = typeof b === "string" ? b : "demo";
  // stubbed until backend route exists
  return { id, summary: "stub", fields: {} };
}

// upsertOpportunityProfile("id", profile, "demo") OR upsertOpportunityProfile(profile, "demo")
export async function upsertOpportunityProfile(
  a: any,
  b?: any,
  c?: any
): Promise<OpportunityProfile> {
  let id: string = "draft";
  let profile: OpportunityProfile = { id: "draft" };
  let _companyId = "demo";

  if (typeof a === "string") {
    id = a;
    profile = (b || {}) as OpportunityProfile;
    _companyId = typeof c === "string" ? c : "demo";
  } else {
    const p = (a || {}) as OpportunityProfile;
    id = p.id || "draft";
    profile = p;
    _companyId = typeof b === "string" ? b : "demo";
  }
  return { id, ...profile };
}

// ---------- Scenario Lab: accept BOTH call styles ----------
/**
 * Accepts:
 *   1) simulateOpportunity("Price +5%", [{ lever: "price", delta_pct: 5 }], "demo")
 *   2) simulateOpportunity(itemObject, "demo")  // item has title/name
 */
export async function simulateOpportunity(a: any, b?: any, c?: any) {
  let scenario_name = "Quick Sim";
  let companyId = "demo";
  let levers: Array<{ lever: string; delta_pct?: number; delta_abs?: number }> = [];

  if (typeof a === "string" && Array.isArray(b)) {
    // Style #1: (name, levers[], companyId?)
    scenario_name = a;
    levers = b;
    companyId = typeof c === "string" ? c : "demo";
  } else {
    // Style #2: (itemObject, companyId?)
    const item = a || {};
    scenario_name = item.title || item.name || "Quick Sim";
    companyId = typeof b === "string" ? b : "demo";
    // quick simulate: no explicit levers array
  }

  return callIntent("scenario_planning_lab", companyId, {
    scenario_name,
    levers,
  });
}

// ---------- Scenario Lab: backend-first endpoint ----------
export async function fetchScenarioFull(body: any, companyId: string = "demo") {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/scenarios/full`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, ...body }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`scenarios API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // Fallback to callIntent if available
    try {
      return await callIntent("scenario_full", { company_id: companyId, ...body }, companyId);
    } catch (fallbackError) {
      // Safe stub fallback
      return {
        kpis: [
          { id: "rev_delta", label: "Revenue Δ", delta_pct: 7.2, base: 142300, scenario: 152600 },
          { id: "ni_delta", label: "Net Income Δ", delta_pct: 17.5, base: 17100, scenario: 20100 },
          { id: "cash_runway", label: "Cash / Runway", delta_pct: 33.3, base: 6.0, scenario: 8.0 },
          { id: "debt_cov", label: "Debt Coverage", base_dscr: 1.35, scenario_dscr: 1.22 },
          { id: "liquidity", label: "Liquidity", base_current: 1.6, scenario_current: 1.5 },
          { id: "returns", label: "ROI/IRR/Payback", roi_pct: 16.8, payback_months: 42 }
        ],
        waterfall: [
          { driver: "Price Up", delta_profit: 50000 },
          { driver: "Loan Pmt", delta_profit: -12000 },
          { driver: "Efficiency", delta_profit: 8000 }
        ],
        advisor: {
          summary: "Feasible (ROI ~17%). Expect cash tightness for 2 months; runway improves to ~8 months by Q3.",
          actions: [
            { text: "Negotiate supplier terms (+8 days float).", impact: "cash", timeframe: "30d", confidence: "high" },
            { text: "Increase service price by 2%.", impact: "margin", timeframe: "60d", confidence: "medium" }
          ]
        },
        peers: {
          benchmarks: { gross_margin_pct: 0.19, rev_per_employee: 185000, ccc_days: 41 },
          insight: "Peers with similar purchases averaged ROI ~15%, Payback ~2.7 yrs.",
          sources: ["QuickBooks Cohort", "Gov Data"],
          used_priors: true
        },
        stress_tests: {
          scenarios: [
            { name: "Revenue -15%", success_rate: 0.74, min_cash: -18000, dscr: 1.12 },
            { name: "Costs +10%", success_rate: 0.81, min_cash: -6000, dscr: 1.20 }
          ],
          mc_summary: { success_rate: 0.84, worst_month: "M+2" }
        }
      };
    }
  }
}
