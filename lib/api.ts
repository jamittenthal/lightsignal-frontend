// lib/api.ts
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://lightsignal-backend.onrender.com";

export async function callIntent(intent: string, companyId = "demo", input: any = {}) {
  const res = await fetch(`${BACKEND_URL}/api/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent, company_id: companyId, input }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Intent call failed (${res.status}): ${txt}`);
  }
  return res.json();
}
