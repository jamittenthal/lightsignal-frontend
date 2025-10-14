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

export async function callIntent(
  intent: string,
  input: Record<string, any> = {},
  company_id = "demo"
): Promise<{ intent: string; company_id: string; result: any; warning?: string }> {
  return postJSON("/api/intent", { intent, company_id, input });
}

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
