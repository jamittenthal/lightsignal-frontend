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

  // 2) Fallback: longest {...} block
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) {
    const blob = t.slice(s, e + 1);
    try {
      return JSON.parse(blob);
    } catch {}
  }

  // 3) final fallback
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

/** Generic one-shot to the Orchestrator (Overview tab may use this). */
export async function callOrchestrator(prompt: string): Promise<{
  text: string;
  parsed?: any;
}> {
  const resp = await api.post("/api/orchestrator", { prompt });
  const data = resp.data;

  if (typeof data?.result === "string") {
    return { text: data.result, parsed: tryExtractJson(data.result) };
  }
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { text, parsed: tryExtractJson(text) };
}

/** One-shot research (Insights tab) — same endpoint, research-triggered prompt. */
export async function callResearch(prompt: string): Promise<{
  text: string;
  parsed?: any;
}> {
  const resp = await api.post("/api/orchestrator", { prompt });
  const data = resp.data;

  if (typeof data?.result === "string") {
    return { text: data.result, parsed: tryExtractJson(data.result) };
  }
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { text, parsed: tryExtractJson(text) };
}

/** Chat with the Orchestrator (Scenarios tab). */
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

  if (typeof data?.result === "string") {
    const parsed = tryExtractJson(data.result);
    return { message: { role: "assistant", content: data.result }, parsed };
  }

  const content = typeof data === "string" ? data : JSON.stringify(data);
  return { message: { role: "assistant", content } };
}
