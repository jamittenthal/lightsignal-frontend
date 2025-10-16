// lib/api.ts
// One place for frontend -> backend/API helpers.
// - Uses your backend: https://lightsignal-backend.onrender.com
// - Provides client-side stubs (localStorage) for features without backend endpoints yet.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://lightsignal-backend.onrender.com";

// -------------------------
// Generic helpers
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

// -------------------------
// Core intent call
// -------------------------
export async function callIntent(
  intent: string,
  companyId: string = "demo",
  input: any = {}
) {
  return postJSON(`${BACKEND_URL}/api/intent`, {
    intent,
    company_id: companyId,
    input,
  });
}

// Aliases some pages expect
export async function callOrchestrator(
  intent: string,
  companyId: string = "demo",
  input: any = {}
) {
  return callIntent(intent, companyId, input);
}

export async function chatOrchestrator(
  message: string,
  companyId: string = "demo"
) {
  // Simple “chat” shim: route via business_insights so you can test now.
  return callIntent("business_insights", companyId, { query: message });
}

// -------------------------
// Insights / Research (pages import callResearch)
// -------------------------
export async function callResearch(
  query: string,
  companyId: string = "demo"
) {
  // Route to business_insights intent with a query input (works for now)
  return callIntent("business_insights", companyId, { query });
}

// -------------------------
// Opportunities helpers
// (these pages already import the following names)
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
  // If/when you add a real backend export route, update this.
  // For now, return a placeholder that won’t crash the UI if clicked.
  return `${BACKEND_URL}/api/export.csv?company_id=${encodeURIComponent(
    companyId
  )}&intent=${encodeURIComponent(intent)}`;
}

export async function listWatchlist(): Promise<WatchItem[]> {
  return readLocal<WatchItem[]>(WATCHLIST_KEY, []);
}

export async function addToWatchlist(item: WatchItem): Promise<WatchItem[]> {
  const list = readLocal<WatchItem[]>(WATCHLIST_KEY, []);
  const existingIdx = list.findIndex((w) => w.id === item.id);
  if (existingIdx >= 0) list[existingIdx] = { ...list[existingIdx], ...item };
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

// Simulate an opportunity (send to scenario planning)
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

// Opportunity Profile (client-side stub for now)
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
