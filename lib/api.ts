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

/** ---- PRIMARY INTENT HELPER ---- */
export async function callIntent(
  intent: string,
  input: Record<string, any> = {},
  company_id = "demo"
): Promise<{ intent: string; company_id: string; result: any; warning?: string }> {
  return postJSON("/api/intent", { intent, company_id, input });
}

/** ---- DIRECT BACKEND HELPERS (existing endpoints) ---- */
export const callOverview = (company_id = "demo", periods = 12) =>
  postJSON("/api/overview", { company_id, periods });

export const callScenario = (company_id = "demo", inputs: Record<string, any> = {}) =>
  postJSON("/api/scenario", { company_id, inputs });

/** ---- OPPORTUNITY PROFILE ---- */
export const getOpportunityProfile = (company_id = "demo") =>
  getJSON(`/api/opportunity_profile/${company_id}`);

export const upsertOpportunityProfile = (payload: any) =>
  postJSON("/api/opportunity_profile", payload);

/** ---- WATCHLIST ---- */
export const listWatchlist = (company_id = "demo") =>
  getJSON(`/api/watchlist/${company_id}`);

export const addToWatchlist = (payload: any) =>
  postJSON("/api/watchlist/add", payload);

export const updateWatchItem = (payload: any) =>
  postJSON("/api/watchlist/update", payload);

/** ---- SIMULATE & EXPORT ---- */
export const simulateOpportunity = (opportunity: any, company_id = "demo") =>
  postJSON("/api/opportunities/simulate", { company_id, opportunity });

export const exportCSVUrl = (company_id = "demo") =>
  `${API_BASE}/api/opportunities/export.csv?company_id=${encodeURIComponent(company_id)}`;

/* ======================================================================
   LEGACY SHIMS (to keep /insights, /overview, /scenarios pages compiling)
   Keep these until those pages are migrated to the new helpers.
   ====================================================================== */

/** Old: callResearch(query, region?) -> now routes to intent "research_digest" */
export async function callResearch(query: string, region?: string, company_id = "demo") {
  return callIntent("research_digest", { query, region }, company_id);
}

/** Old: callOrchestrator(intent, input?) -> just forwards to callIntent */
export async function callOrchestrator(intent: string, input: Record<string, any> = {}, company_id = "demo") {
  return callIntent(intent, input, company_id);
}

/** Old: chatOrchestrator(message) -> send to /api/scenario as free-form scenario */
export async function chatOrchestrator(message: string, company_id = "demo") {
  // We treat it as a scenario chat; your backend /api/scenario already exists.
  return callScenario(company_id, { message });
}
