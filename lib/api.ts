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

// ---------- Opportunities: backend-first helpers + safe stub fallback ----------
export const OPPORTUNITIES_STUB = {
  kpis: [
    { id: "active", label: "Active Opportunities", value: 8, note: "8 new matches this week", state: "good" },
    { id: "potential_value", label: "Potential Revenue Value", value: 560000, formatted: "$560,000", state: "good" },
    { id: "fit_score_avg", label: "Fit Score (Avg)", value: 82, state: "good" },
    { id: "event_readiness", label: "Event Readiness Index", value: 88, state: "good" },
    { id: "historical_roi", label: "Historical ROI", value: 2.9, unit: "x", state: "good" }
  ],
  profile: {
    business_type: "Food Truck",
    region: "Tampa, FL",
    radius_miles: 50,
    types: ["event","rfp","grant","partnership"],
    budget_max: 5000,
    travel_range_miles: 60,
    staffing_capacity: "normal",
    risk_appetite: "low",
    auto_sync: true
  },
  feed: [
    {
      id: "EVT-TPA-1103",
      title: "Tampa Outdoor Market",
      source: "City Events",
      category: "event",
      event_date: "2025-11-03",
      est_revenue: 3400,
      est_cost: 250,
      fit_score: 90,
      confidence: "high",
      peer_outcome: "Avg vendor profit $3.4k, ROI 2.7×",
      weather: { temp_f: 75, rain_pct: 10, wind_mph: 8, attendance_impact: "high" },
      actions: { view_details: true, save: true, simulate: true }
    },
    {
      id: "RFP-CITY-HVAC-180K",
      title: "City HVAC Maintenance Bid",
      source: "Procurement Portal",
      category: "rfp",
      deadline: "2025-11-12",
      est_revenue: 180000,
      est_cost: 12000,
      fit_score: 91,
      confidence: "medium",
      peer_outcome: "Peer win rate 38%",
      actions: { view_details: true, save: true, simulate: true }
    },
    {
      id: "GRANT-SMB-20K",
      title: "State Small Business Grant",
      source: "State Gov",
      category: "grant",
      deadline: "2025-11-30",
      est_revenue: 20000,
      est_cost: 0,
      fit_score: 78,
      confidence: "medium",
      peer_outcome: "Avg award $14k",
      actions: { view_details: true, save: true, simulate: true }
    }
  ],
  details: {
    "EVT-TPA-1103": {
      summary: "Outdoor market with ~7,000 attendees.",
      financials: { total_cost: 2300, potential_gross_profit: 4800, roi_x: 2.1 },
      peers: { participants: 5, profitable: 3, avg_margin_pct: 19 },
      weather: { temp_f: 72, rain_pct: 10, wind_mph: 8, note: "High attendance probability" },
      ai_commentary: "Strong alignment with your audience; peer ROI 2.4×.",
      links: [{ label: "Registration", url: "https://example.com/reg" }]
    }
  },
  watchlist: [
    { id: "EVT-TPA-1103", title: "Tampa Outdoor Market", status: "Open", when: "2025-11-03", expected_roi_x: 2.2 },
    { id: "RFP-CITY-HVAC-180K", title: "City HVAC Maintenance Bid", status: "Applied", when: "2025-11-12", expected_roi_x: 3.1 }
  ],
  cost_roi_insights: {
    avg_roi_by_category: { rfp: 3.2, event: 1.9, partnership: 2.6 },
    top_activity: "Recurring local events",
    peer_compare_note: "You outperform peers by +0.4× on food festivals",
    ai_commentary: ["Best in weekend events with <10% rain risk", "Low success rate in federal contracts"]
  },
  events_explorer: [
    { id: "EVT-IND-EXPO", title: "Regional Industry Expo", date: "2025-12-05", fit_score: 81, weather_badge: { good_weather: true, rain_pct: 5 }, attendance_impact: "medium" }
  ],
  contracts: [
    { id: "RFP-COUNTY-COOL-250K", title: "County Cooling Upgrade", deadline: "2025-12-01", size: 250000, term_months: 24, competition: "medium", peer_win_rate: 0.31, confidence: 0.87 }
  ],
  seasonality: {
    best_windows: ["Apr-Jun", "Sep-Oct"],
    event_climate_outlook: [
      { month: "Apr", attendance_bump_pct: 18 },
      { month: "May", attendance_bump_pct: 16 }
    ]
  },
  performance_analytics: {
    wins: 7, losses: 3,
    roi_by_category: { event: 2.1, rfp: 3.0, partnership: 2.6 },
    learning_notes: ["Increase focus on community festivals", "Reduce long-distance listings"]
  },
  export: { pdf_available: true, csv_available: true, collab: true }
};

export async function fetchOpportunitiesFull(
  body: any = {},
  companyId: string = "demo"
) {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/opportunities/full`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, ...body }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`opportunities full API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // safe stub fallback
    return OPPORTUNITIES_STUB;
  }
}

export async function searchOpportunities(
  body: any = {},
  companyId: string = "demo"
) {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/opportunities/search`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, ...body }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`opportunities search API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // fallback: return minimal shape
    return { feed: [], ok: false, error: (e && (e as any).message) || "search failed" };
  }
}

export async function fetchOpportunityDetail(id: string, companyId: string = "demo") {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/opportunities/detail`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, id }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`opportunity detail API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // try stub details
    return OPPORTUNITIES_STUB.details?.[id] || null;
  }
}

// ---------- Reviews / Reputation helpers (backend-first, safe stub fallback) ----------
export const REVIEWS_STUB = {
  kpis: [
    { id: "avg_rating", label: "Average Rating (All Platforms)", value: 4.6, count: 1243, state: "good", note: "Weighted across Google/Yelp/Facebook" },
    { id: "volume_30d", label: "Review Volume (30 Days)", value: 42, delta_pct: 0.12, state: "good" },
    { id: "sentiment_score", label: "Sentiment Score", value: 78, state: "good" },
    { id: "sentiment_split", label: "Positive / Neutral / Negative", value: { pos: 0.78, neu: 0.12, neg: 0.10 }, state: "good" },
    { id: "response_rate", label: "Response Rate", value: 0.63, formatted: "63%", state: "caution" },
    { id: "csi", label: "Customer Satisfaction Index", value: 82, state: "good" }
  ],
  integrations: [
    { id: "google", name: "Google Business", status: "connected", last_sync: "2025-10-20T14:12:00Z" },
    { id: "yelp", name: "Yelp", status: "connected", last_sync: "2025-10-20T14:12:00Z" },
    { id: "facebook", name: "Facebook", status: "connected", last_sync: "2025-10-20T14:12:00Z" }
  ],
  feed: [
    {
      id: "rev_g_101",
      platform: "google",
      rating: 5,
      text: "Super friendly staff and fast service!",
      author: "Alex R.",
      created_at: "2025-10-19",
      sentiment: "positive",
      sentiment_score: 0.91,
      keywords: ["staff","speed"],
      location: "Downtown",
      product: null,
      responded: true,
      response: "Thanks so much, Alex! See you again soon."
    },
    {
      id: "rev_y_77",
      platform: "yelp",
      rating: 2,
      text: "Delivery was late and packaging leaked.",
      author: "Emily S.",
      created_at: "2025-10-18",
      sentiment: "negative",
      sentiment_score: 0.18,
      keywords: ["delivery","packaging"],
      location: "Suburb",
      product: "Cold Brew Kit",
      responded: false,
      response: null
    }
  ],
  analysis: {
    keywords_top: [{ term: "staff", count: 143 }, { term: "delivery", count: 58 }],
    themes_positive: ["Friendly staff","Fast service","Good prices"],
    themes_negative: ["Slow delivery","Packaging issues","Billing confusion"],
    trend_notes: ["Sentiment +6 pts MoM","Delivery complaints down 18%"]
  },
  by_location: [
    { location: "Downtown", avg_rating: 4.8, sentiment: 82, volume_30d: 21 },
    { location: "Suburb", avg_rating: 4.3, sentiment: 68, volume_30d: 14 }
  ],
  by_product: [
    { product: "Cold Brew Kit", avg_rating: 4.9, sentiment: 88 },
    { product: "Grinder", avg_rating: 3.8, sentiment: 55 }
  ],
  recommendations: [
    { id: "rec_packaging", text: "Improve packaging consistency; leaky lids mentioned 17× this month.", impact: "medium", confidence: "high", cta: "Add to Task List" }
  ],
  campaigns: { qr_pages: [{ id: "qr_main", title: "Main Review QR", url: "https://example.com/r/main", scan_count: 128 }] },
  reports: { pdf_available: true, csv_available: true }
};

export async function fetchReviewsFull(body: any = {}, companyId: string = "demo") {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/reviews/full`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, ...body }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`reviews full API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // try secondary fallback via callIntent helper if available
    try {
      return await callIntent("reviews_intelligence", { company_id: companyId, ...body }, companyId);
    } catch (e2) {
      return REVIEWS_STUB as any;
    }
  }
}

export async function draftReviewReply(reviewId: string, body: any = {}, companyId: string = "demo") {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/reviews/respond`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, review_id: reviewId, draft: true, ...body }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`respond API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // safe stub: return a polite draft
    return { draft: `Hi, thanks for your feedback — we're sorry to hear about this. We'll follow up to make it right.` };
  }
}

export async function askReputationAdvisor(query: string, filters: any = {}, companyId: string = "demo") {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/reviews/ask`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, query, filters }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`advisor API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // fallback: simple answer
    return { answer: `I found ${REVIEWS_STUB.analysis.keywords_top?.length || 0} top topics. Try filtering by "delivery".` };
  }
}

export async function addToOpportunitiesWatchlist(item: any, companyId: string = "demo") {
  try {
    const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    const url = `${apiRoot.replace(/\/$/, "")}/api/ai/opportunities/watchlist`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, ...item }),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`watchlist API failed (${resp.status})`);
    return await resp.json();
  } catch (e) {
    // best-effort: return array with the item
    return [item];
  }
}
