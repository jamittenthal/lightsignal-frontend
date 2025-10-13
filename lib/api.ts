// lib/api.ts
// Helpers for Orchestrator, Finance, Research, and chat-based scenarios.

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

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function chatOrchestrator(messages: ChatMessage[]) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/orchestrator_chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`chat orchestrator failed: ${r.status}`);
  return r.json() as Promise<{ message: ChatMessage; parsed: any }>;
}
