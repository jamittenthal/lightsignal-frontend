// lib/api.ts
import axios from "axios";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "https://lightsignal-backend.onrender.com";

const api = axios.create({
  baseURL: BASE,
  timeout: 60_000,
});

function tryExtractJson(text: string | undefined): any | undefined {
  if (!text) return undefined;

  // 1) Strip ```json fences if present
  let t = text;
  if (t.includes("```")) {
    t = t.replace(/```json/gi, "```");
    const parts = t.split("```");
    for (const p of parts) {
      const start = p.indexOf("{");
      const end = p.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const blob = p.slice(start, end + 1);
        try {
          return JSON.parse(blob);
        } catch {}
      }
    }
  }

  // 2) Fallback: take the longest {...} block
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) {
    const blob = t.slice(s, e + 1);
    try {
      return JSON.parse(blob);
    } catch {}
  }

  // 3) final fallback: plain parse
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

/**
 * Chat with the Orchestrator via the backend.
 */
export async function chatOrchestrator(messages: ChatMessage[]): Promise<{
  message: ChatMessage;
  parsed?: any;
}> {
  const resp = await api.post("/api/orchestrator_chat", { messages });
  const data = resp.data;

  if (data?.message && typeof data.message.content === "string") {
    const parsed = data.parsed ?? tryExtractJson(data.message.content);
    return { message: data.message, parsed };
  }

  // One-shot format fallback
  if (typeof data?.result === "string") {
    const parsed = tryExtractJson(data.result);
    return { message: { role: "assistant", content: data.result }, parsed };
  }

  const content = typeof data === "string" ? data : JSON.stringify(data);
  return { message: { role: "assistant", content } };
}

/**
 * One-shot research call (used by Insights tab).
 * We post a single prompt to /api/orchestrator which will auto-route to Research Scout
 * when the prompt looks like a market/location/industry request.
 */
export async function callResearch(prompt: string): Promise<{
  text: string;
  parsed?: any;
}> {
  const resp = await api.post("/api/orchestrator", { prompt });
  const data = resp.data;

  // Backend normally returns { assistant_id, result }
  if (typeof data?.result === "string") {
    return { text: data.result, parsed: tryExtractJson(data.result) };
  }

  // Fallback: stringify whatever came back
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { text, parsed: tryExtractJson(text) };
}
