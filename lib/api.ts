// lib/api.ts
// Universal API helper for all AI assistants (Orchestrator, Finance, Research)

export async function callOrchestrator(prompt: string) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/orchestrator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`orchestrator failed: ${r.status}`);
  return r.json();
}

export async function callFinance(prompt: string) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`finance failed: ${r.status}`);
  return r.json();
}

export async function callResearch(prompt: string) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`research failed: ${r.status}`);
  return r.json();
}
