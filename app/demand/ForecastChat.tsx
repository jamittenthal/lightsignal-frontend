"use client";
import React, { useState } from "react";

export default function ForecastChat() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  async function ask() {
    if (!query) return;
    const q = query;
    setQuery("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: q }]);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://lightsignal-backend.onrender.com";
      const resp = await fetch(`${apiUrl}/api/ai/demand/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const json = await resp.json().catch(() => ({ answer: "No answer" }));
      setMessages((m) => [...m, { role: "ai", content: json.answer || json.text || JSON.stringify(json) }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", content: "Sorry, I couldn't reach the forecast service." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-6 bottom-6 w-80 z-50">
      <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
        <div className="bg-teal-600 text-white p-3 flex items-center gap-2">🤖 <div className="font-semibold">Forecast Analyst</div></div>
        <div className="p-3 max-h-56 overflow-y-auto text-sm space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={m.role === 'user' ? 'inline-block bg-slate-100 px-2 py-1 rounded' : 'inline-block bg-teal-50 px-2 py-1 rounded'}>{m.content}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask Forecast Analyst..." className="flex-1 rounded px-2 py-2 border" />
            <button onClick={ask} disabled={loading} className="px-3 py-2 bg-teal-600 text-white rounded">Ask</button>
          </div>
        </div>
      </div>
    </div>
  );
}
