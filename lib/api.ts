// lib/api.ts — helpers the UI imports. Safe for SSR/CSR and Vercel builds.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://lightsignal-backend.onrender.com";

type JSONObject = Record<string, any>;

// ---------- HTTP helpers ----------
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
    const text = await res.text();
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
    const text = await res.text();
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

export async function chatOrchestrator(message: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query: message });
}

export async function callResearch(query: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query });
}

// ---------- Opportunities: watchlist + CSV (safe fallbacks) ----------
export type WatchItem = {
  id?: string;
  company_id?: string; // keep optional to avoid TS complaints
  title?: string;
  category?: string;
  date?: string;
  deadline?: string;
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

export async function listWatchlist(companyId: string = "demo") {
  try {
    return await getJSON<WatchItem[]>(
      `${BACKEND_URL}/api/watchlist?company_id=${encodeURIComponent(companyId)}`
    );
  } catch {
    // backend route may not exist yet; return empty so UI still works
    return [] as WatchItem[];
  }
}

export async function addToWatchlist(
  item: WatchItem,
  companyId: string = "demo"
) {
  try {
    return await postJSON<WatchItem[]>(
      `${BACKEND_URL}/api/watchlist?company_id=${encodeURIComponent(
        companyId
      )}`,
      item
    );
  } catch {
    // fallback: act as though it was added
    return [item] as WatchItem[];
  }
}

export async function updateWatchItem(
  id: string,
  patch: Partial<WatchItem>,
  companyId: string = "demo"
) {
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

// ---------- Opportunity profiles (stubbed; safe) ----------
export type OpportunityProfile = {
  id: string;
  company?: string;
  summary?: string;
  fields?: Record<string, any>;
  [k: string]: any;
};

export async function getOpportunityProfile(
  id: string,
  _companyId: string = "demo"
): Promise<OpportunityProfile | null> {
  // real route not defined yet; keep stub
  return null;
}

export async function upsertOpportunityProfile(
  id: string,
  profile: OpportunityProfile,
  _companyId: string = "demo"
): Promise<OpportunityProfile> {
  // stub returns the merged object
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
  let levers: Array<{ lever: string; delta_pct?: number; delta_abs?: number }>;
  let companyId = "demo";

  if (typeof a === "string" && Array.isArray(b)) {
    // Style #1
    scenario_name = a;
    levers = b;
    companyId = typeof c === "string" ? c : "demo";
  } else {
    // Style #2
    const item = a || {};
    scenario_name = item.title || item.name || "Quick Sim";
    companyId = typeof b === "string" ? b : "demo";
    levers = []; // quick simulate without explicit levers
  }

  return callIntent("scenario_planning_lab", companyId, {
    scenario_name,
    levers,
  });
}
