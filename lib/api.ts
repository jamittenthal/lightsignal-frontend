// lib/api.ts — minimal but complete helpers so Next.js builds on Vercel

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://lightsignal-backend.onrender.com";

// ---- internals
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
  // accept both: callIntent(intent, "demo", {...})  OR  callIntent(intent, {...}, "demo")
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
  } else {
    if (isObj(a)) input = a;
    if (isStr(a)) companyId = a;
    if (isObj(b)) input = b;
    if (isStr(b)) companyId = b;
  }
  return { companyId, input };
}

// ---- core calls used everywhere
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
  return callIntent(intent, a as any, b as any);
}

export async function chatOrchestrator(message: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query: message });
}
export async function callResearch(query: string, companyId = "demo") {
  return callIntent("business_insights", companyId, { query });
}

// ---- opportunities helpers (safe stubs so build never breaks)
export type WatchItem = {
  id?: string;
  company_id?: string;
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

export async function listWatchlist(): Promise<WatchItem[]> {
  return [];
}
export async function addToWatchlist(item: WatchItem): Promise<WatchItem[]> {
  return [item];
}
export async function updateWatchItem(
  id: string,
  patch: Partial<WatchItem>
): Promise<WatchItem[]> {
  return [];
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

export type OpportunityProfile = {
  id: string;
  company?: string;
  summary?: string;
  fields?: Record<string, any>;
  [k: string]: any;
};
export async function getOpportunityProfile(id: string) {
  return null as OpportunityProfile | null;
}
export async function upsertOpportunityProfile(
  id: string,
  profile: OpportunityProfile
) {
  return { id, ...profile } as OpportunityProfile;
}
