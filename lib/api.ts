// lib/api.ts
// Frontend -> backend helpers + safe stubs so the app builds/runs now.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://lightsignal-backend.onrender.com";

// -------------------------
// Internals
// -------------------------
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

function normalizeIntentArgs(
  a?: string | Record<string, any>,
  b?: string | Record<string, any>
): { companyId: string; input: Record<string, any> } {
  // Accept both callIntent(intent, "demo", {...}) and callIntent(intent, {...}, "demo")
  let companyId = "demo";
  let input: Record<string, any> = {};

  const isStr = (v: any): v is string => typeof v === "string";
  const isObj = (v: any): v is Record<string, any> =>
    v != null && typeof v === "object" && !Array.isArray(v);

  if (isStr(a) && (isObj(b) || b === undefined)) {
    companyId = a;
    input = (b as Record<string, any>) || {};
  } else if ((isObj(a) || a === undefined) && (isStr(b) || b === undefined)) {
    input = (a as Record<string, any>) || {};
    companyId = (b as string) || "demo";
  } else if (a === undefined && b === undefined) {
    // default ok
  } else {
    // Fallback: try to coerce
    if (isObj(a)) input = a;
    if (isStr(a)) companyId = a;
    if (isObj(b)) input = b;
    if (isStr(b)) companyId = b;
  }
  return { companyId, input };
}

// -------------------------
// Core intent calls (supports both arg orders)
// -------------------------
// Overloads for TS friendliness:
export function callIntent(
  intent: string,
  companyId?: string,
  input?: Record<string, any>
): Promise<any>;
export function callIntent(
  intent: string,
  input?: Record<string, any>,
  companyId?: string
): Promise<any>;
export function callIntent(
  intent: string,
  a?: string | Record<string, any>,
  b?: string | Record<string, any>
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
  companyId?: string,
  input?: Record<string, any>
): Promise<any>;
export function callOrchestrator(
  intent: string,
  input?: Record<string, any>,
  companyId?: string
): Promise<any>;
export function callOrchestrator(
  intent: string,
  a?: string | Record<string, any>,
  b?: string | Record<string, any>
): Promise<any> {
  const { companyId, input } = normalizeIntentArgs(a, b);
  return callIntent(intent, companyId, input);
}

// Simple chat shim (routes through business_insights so you can test now)
export async function chatOrchestrator(message: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query: message });
}

// Insights / “Research”
export async function callResearch(query: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query });
}

// -------------------------
// Opportunities helpers (stubs for now; swap to backend later)
// -------------------------
type WatchItem = {
  id: string;
  title?: string;
  category?: string;
  notes?: string;
  pinned?: boolean;
  meta?: Record<string, any>;
};

const WATCHLIST_KEY = "ls_watchlist";
const OPP_PROFILES_KEY = "ls_opp_profiles";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function exportCSVUrl(
  companyId: string = "demo",
  intent: string = "opportunities"
) {
  // Placeholder URL so UI doesn't break; point to real backend route later
  return `${BACKEND_URL}/api/export.csv?company_id=${encodeURIComponent(
    companyId
  )}&intent=${encodeURIComponent(intent)}`;
}

export async function listWatchlist(): Promise<WatchItem[]> {
  return readLocal<WatchItem[]>(WATCHLIST_KEY, []);
}

export async function addToWatchlist(item: WatchItem): Promise<WatchItem[]> {
  const list = readLocal<WatchItem[]>(WATCHLIST_KEY, []);
  const idx = list.findIndex((w) => w.id === item.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...item };
  else list.push(item);
  writeLocal(WATCHLIST_KEY, list);
  return list;
}

export async function updateWatchItem(
  id: string,
  patch: Partial<WatchItem>
): Promise<WatchItem[]> {
  const list = readLocal<WatchItem[]>(WATCHLIST_KEY, []);
  const idx = list.findIndex((w) => w.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    writeLocal(WATCHLIST_KEY, list);
  }
  return list;
}

export async function simulateOpportunity(
  scenarioName: string,
  levers: Array<{ lever: string; delta_pct?: number; delta_abs?: number }>,
  companyId: string = "demo"
) {
  return callIntent("scenario_planning_lab", companyId, {
    scenario_name: scenarioName,
    levers,
  });
}

type OpportunityProfile = {
  id: string;
  company?: string;
  summary?: string;
  fields?: Record<string, any>;
};

export async function getOpportunityProfile(
  id: string
): Promise<OpportunityProfile | null> {
  const all = readLocal<Record<string, OpportunityProfile>>(
    OPP_PROFILES_KEY,
    {}
  );
  return all[id] || null;
}

export async function upsertOpportunityProfile(
  id: string,
  profile: OpportunityProfile
): Promise<OpportunityProfile> {
  const all = readLocal<Record<string, OpportunityProfile>>(
    OPP_PROFILES_KEY,
    {}
  );
  all[id] = { ...(all[id] || {}), ...profile, id };
  writeLocal(OPP_PROFILES_KEY, all);
  return all[id];
}
