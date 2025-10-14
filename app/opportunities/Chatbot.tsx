"use client";
import { useState } from "react";
import { callIntent } from "@/lib/api";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const resp = await callIntent("opportunities", { nl_query: q }, "demo");
      setMessages((m) => [...m, { role: "user", text: q }, { role: "ai", json: resp.result }]);
      setQ("");
    } catch (e: any) {
      setMessages((m) => [...m, { role: "user", text: q }, { role: "error", text: e.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 rounded-full bg-black text-white px-4 py-3 shadow-lg"
      >
        {open ? "Close AI Scout" : "AI Scout"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-96 max-h-[70vh] rounded-xl border bg-white shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b font-medium">AI Scout</div>
          <div className="p-3 overflow-auto space-y-3 text-sm">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="text-right">
                  <div className="inline-block rounded-lg bg-slate-900 text-white px-3 py-2">{m.text}</div>
                </div>
              ) : m.role === "ai" ? (
                <pre key={i} className="text-xs bg-slate-50 rounded p-2 overflow-auto">
                  {JSON.stringify(m.json, null, 2)}
                </pre>
              ) : (
                <div key={i} className="text-red-600">{m.text}</div>
              )
            )}
            {messages.length === 0 && (
              <div className="text-slate-500">
                Try: “Find government contracts I can bid on this month.” or “Show food festivals next weekend.”
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-2 text-sm"
              placeholder="Ask about opportunities…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button onClick={ask} disabled={loading} className="rounded bg-black text-white px-3">
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
