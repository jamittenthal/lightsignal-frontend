"use client";

import { useEffect, useRef, useState } from "react";
import {
  chatOrchestrator,
  type ChatMessage,
} from "../../lib/api";

type KPIMap = Record<string, number>;
type Visual = { type: "bar" | "line"; title: string; labels: string[]; values: number[] };

function Bubble({ role, content }: { role: "assistant" | "user" | "system"; content: string }) {
  if (role === "system") {
    // Hide or render subtly; we'll hide to keep UI simple
    return null;
  }
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          mine ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="text-xs text-slate-500 italic">assistant is typing…</div>
  );
}

function SectionCard({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function ScenariosPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<any | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setInput("");

    const nextMsgs: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(nextMsgs);
    setLoading(true);
    try {
      // Our helper accepts string | ChatMessage[]
      const res = await chatOrchestrator(nextMsgs);
      // Append assistant reply bubble
      setMessages((prev) => [...prev, res.message]);
      if (res.parsed) setParsed(res.parsed);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — scenario chat failed." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  // Extract a few convenience bits from parsed JSON if present
  const k: KPIMap =
    parsed?.kpis ??
    parsed?.base?.kpis ??
    {};
  const visuals: Visual[] = Array.isArray(parsed?.visuals) ? parsed.visuals : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Scenario Lab</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat side */}
        <div>
          <SectionCard title="Chat">
            <div className="h-[46vh] overflow-y-auto space-y-3 pr-1 border rounded-xl p-3 mb-3">
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role} content={m.content} />
              ))}
              {loading && <Typing />}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder='Ask a scenario question (e.g., "Can we afford 2 new vans?")'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
              />
              <button
                onClick={send}
                disabled={loading}
                className="rounded bg-black text-white px-4 py-2"
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Parsed output side */}
        <div className="space-y-6">
          <SectionCard title="KPIs">
            {Object.keys(k).length === 0 ? (
              <div className="text-sm text-slate-500">No KPIs yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(k).map(([key, val]) => (
                  <div key={key} className="rounded-lg border p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{key}</div>
                    <div className="text-lg font-semibold">{val}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Visuals">
            {visuals.length === 0 ? (
              <div className="text-sm text-slate-500">No visuals yet.</div>
            ) : (
              <div className="space-y-3">
                {visuals.map((v, i) => (
                  <div key={i} className="rounded border p-3">
                    <div className="font-medium">{v.title}</div>
                    <div className="text-xs text-slate-500 mb-2">({v.type})</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <tbody>
                          {v.labels.map((label, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="py-1 pr-4 text-slate-600">{label}</td>
                              <td className="py-1">{v.values[idx]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Raw JSON (debug)">
            <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto">
              {parsed ? JSON.stringify(parsed, null, 2) : "—"}
            </pre>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
