// lib/api.ts
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "https://lightsignal-backend.onrender.com").replace(/\/$/, "");

// ---------- Types ----------
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

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

/** -------- Backwards-compat exports (legacy pages) -------- */

/** Legacy pages expect { parsed, text } from callOrchestrator */
export const callOrchestrator = async (
  intent: string,
  input: Record<string, any> = {},
  company_id = "demo"
): Promise<{ parsed: any; text: string }> => {
  const resp = await callIntent(intent, input, company_id);
  const parsed = resp.result;
  const text = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
  return { parsed, text };
};

/**
 * Legacy pages call chatOrchestrator with either:
 *  - a string question, OR
 *  - ChatMessage[] transcript (your /scenarios page)
 *
 * We accept both and return { parsed, text, message } where message is the assistant reply.
 */
export const chatOrchestrator = async (
  input: string | ChatMessage[],
  company_id = "demo",
  extras: Record<string, any> = {}
): Promise<{ parsed: any; text: string; message: ChatMessage }> => {
  const messages = Array.isArray(input) ? input : undefined;
  const question =
    typeof input === "string"
      ? input
      : [...input].reverse().find((m) => m.role === "user")?.content || "";

  const resp = await callIntent("scenario_chat", { question, messages, ...extras }, company_id);
  const parsed = resp.result;
  const text = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
  const message: ChatMessage = { role: "assistant", content: text };
  return { parsed, text, message };
};

/** Optional: messages-based helper name used elsewhere (same behavior as above) */
export const chatOrchestratorMessages = async (
  messages: ChatMessage[],
  company_id = "demo",
  extras: Record<string, any> = {}
): Promise<{ parsed: any; text: string; message: ChatMessage }> =>
  chatOrchestrator(messages, company_id, extras);

/**
 * Older /insights page expects:
 *   const res = await callResearch(q);
 *   setText(res.text); setParsed(res.parsed ?? null);
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

/** Raw new-shape if needed */
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
