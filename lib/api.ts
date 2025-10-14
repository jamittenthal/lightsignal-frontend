// lib/api.ts
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "https://lightsignal-backend.onrender.com").replace(/\/$/, "");

async function postJSON<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} -> ${res.status} ${res.statusText} :: ${text}`);
  }
  return res.json();
}

async function getJSON<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} -> ${res.status} ${res.statusText} :: ${text}`);
  }
  return res.json();
}

/** -------- Core unified helpers -------- */

export async function callIntent(
  intent: string,
  input: Record<string, any> = {},
  company_id = "demo"
): Promise<{ intent: string; company_id: string; result: any; warning?: string }> {
  return postJSON("/api/intent", { intent, company_id, input });
}

/** Financial Overview (direct API) */
export const getOverview = (company_id = "demo", periods = 12) =>
  postJSON("/api/overview", { company_id, periods });

/** Scenario API (direct) */
export const runScenario = (company_id = "demo", inputs: Record<string, any> = {}) =>
  postJSON("/api/scenario", { company_id, inputs });

/** -------- Opportunities feature helpers -------- */

// Profile
export const getOpportunityProfile = (company_id = "demo") =>
  getJSON(`/api/opportunity_profile/${company_id}`);

export const upsertOpportunityProfile = (payload: any) =>
  postJSON("/api/opportunity_profile", payload);

// Watchlist
export const listWatchlist = (company_id = "demo") =>
  getJSON(`/api/watchlist/${company_id}`);

export const addToWatchlist = (payload: any) =>
  postJSON("/api/watchlist/add", payload);

export const updateWatchItem = (payload: any) =>
  postJSON("/api/watchlist/update", payload);

// Simulate & Export
export const simulateOpportunity = (opportunity: any, company_id = "demo") =>
  postJSON("/api/opportunities/simulate", { company_id, opportunity });

export const exportCSVUrl = (company_id = "demo") =>
  `${API_BASE}/api/opportunities/export.csv?company_id=${encodeURIComponent(company_id)}`;

/** -------- Backwards-compat exports (used by existing pages) -------- */

/** Older pages ask for callOrchestrator — map to callIntent */
export const callOrchestrator = (
  intent: string,
  input: Record<string, any> = {},
  company_id = "demo"
) => callIntent(intent, input, company_id);

/** Older pages ask for chatOrchestrator — standardize on scenario_chat */
export const chatOrchestrator = (
  question: string,
  company_id = "demo",
  extras: Record<string, any> = {}
) => callIntent("scenario_chat", { question, ...extras }, company_id);

/**
 * Older /insights page expects:
 *   const res = await callResearch(q);
 *   setText(res.text);        // string
 *   setParsed(res.parsed??null); // object
 *
 * Provide a compat wrapper that returns that shape.
 */
export const callResearch = async (
  query: string,
  region?: string,
  company_id = "demo"
): Promise<{ text: string; parsed: any }> => {
  const resp = await callIntent("research_digest", { query, region }, company_id);
  const parsed = resp.result;
  const text = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
  return { text, parsed };
};

/** If you want the raw new-shape version elsewhere, use this: */
export const callResearchRaw = (
  query: string,
  region?: string,
  company_id = "demo"
) => callIntent("research_digest", { query, region }, company_id);

/** Convenience wrappers */
export const renderFinancialOverview = (company_id = "demo", periods = 12) =>
  callIntent("render_financial_overview", { periods }, company_id);

export const opportunities = (company_id = "demo", params: Record<string, any> = {}) =>
  callIntent("opportunities", params, company_id);
