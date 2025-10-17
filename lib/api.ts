// lib/api.ts

// Chat types used by the Scenarios page
export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

// Optional backend base (leave empty to use stubs)
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

// ---------- helpers ----------
async function tryJson(url: string, init?: RequestInit) {
  try {
    const r = await fetch(url, init);
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch {
    return null;
  }
}

// ---------- OVERVIEW ----------
export type FinancialOverview = {
  revenue_mtd: number;
  revenue_ytd: number;
  gross_margin_pct: number;
  cash_runway_months: number;
};

export async function getFinancialOverview(company_id = "demo"): Promise<FinancialOverview> {
  if (BASE) {
    const live = await tryJson(`${BASE}/financial/overview?company_id=${company_id}`, {
      // cache 1 min on server components; harmless on client
      next: { revalidate: 60 },
    });
    if (live) return live as FinancialOverview;
  }
  // Fallback demo numbers so the page renders during smoke tests
  return {
    revenue_mtd: 128000,
    revenue_ytd: 1523000,
    gross_margin_pct: 42,
    cash_runway_months: 11,
  };
}

// ---------- SCENARIOS (chat) ----------
export async function chatOrchestrator(input: string | ChatMessage[]) {
  const msgs: ChatMessage[] = typeof input === "string" ? [{ role: "user", content: input }] : input;

  if (BASE) {
    // If/when you have a backend endpoint, call it here and return its shape.
    const live = await tryJson(`${BASE}/scenarios/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
    if (live) return live;
  }

  // Stubbed reply so UI works
  return {
    message: { role: "assistant", content: `Stubbed reply for: "${msgs[msgs.length - 1].content}"` } as ChatMessage,
    parsed: { plan: [{ lever: "price", delta_pct: 5 }] },
  };
}

// ---------- INSIGHTS (research) ----------
export async function callResearch(query: string) {
  if (BASE) {
    const live = await tryJson(`${BASE}/research?q=${encodeURIComponent(query)}`);
    if (live) return live;
  }
  return {
    summary: `Stub research for “${query}”`,
    bullets: [
      "Market growth YoY ~3–5%",
      "Labor tight; wages trending up",
      "Permitting/regulation: moderate",
    ],
  };
}

// ---------- OPPORTUNITIES (watchlist + helpers) ----------
export type WatchItem = {
  id: string;
  title: string;
  status: "open" | "doing" | "done";
  category?: string;
  deadline?: string;
};

export async function addToWatchlist(item: Omit<WatchItem, "id" | "status"> & { status?: WatchItem["status"] }) {
  return { id: Math.random().toString(36).slice(2), status: "open", ...item };
}
export async function listWatchlist(company_id = "demo"): Promise<WatchItem[]> {
  return [
    { id: "a1", title: "Update pricing matrix", status: "open", category: "revenue", deadline: "2025-11-01" },
    { id: "b2", title: "Renew insurance", status: "doing", category: "admin", deadline: "2025-12-15" },
  ];
}
export async function updateWatchItem(args: { id: string; status: WatchItem["status"] }) {
  return { ok: true, ...args };
}
export function exportCSVUrl(_route = "/opportunities.csv") {
  // Real backend would return a signed URL. For now, a harmless placeholder.
  return "#";
}

// Profiles / simulate — no-op stubs the UI can call
export async function getOpportunityProfile(_company_id = "demo") {
  return { goals: ["Grow revenue 15%", "Improve GM to 45%"], owner: "You" };
}
export async function upsertOpportunityProfile(_profile: any, _company_id = "demo") {
  return { ok: true };
}
export async function simulateOpportunity(_item: any, _company_id = "demo") {
  return { ok: true, note: "Simulated (stub)." };
}

// “Intent router” used by the little chatbot
export async function callIntent(intent: string, payload: any, company_id = "demo") {
  return { ok: true, intent, payload, company_id };
}
