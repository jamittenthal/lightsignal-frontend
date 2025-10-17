// lib/api.ts — UI helpers, safe for Vercel (SSR/CSR).

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://lightsignal-backend.onrender.com";

// ---------- shared types ----------
export type ChatMessage = {
  role: "user" | "ai" | "system";
  text?: string;
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
