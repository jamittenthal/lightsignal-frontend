"use client";
import { useEffect, useRef, useState } from "react";
import { chatOrchestrator, type ChatMessage } from "../../lib/api";

/**
 * Scenario Lab — Chat simulator
 * - Keeps message history
 * - Sends history to /api/orchestrator_chat
 * - Shows assistant text + (optional) parsed JSON as pretty panel
 * - Adds quick suggestion chips
 */

const SEED: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I’m the Scenario Lab. Describe a change and I’ll simulate Base vs Scenario (e.g., “Buy a $50k truck at 7.5% for 36 months”, “Raise prices by 3%”, “Hire 2 techs next month”).",
  },
];

export default function ScenariosChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastParsed, setLastParsed] = useState<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, lastParsed]);

  async function sendText(text: string) {
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setLastParsed(null);

    try {
      // Nudge user messages so the Orchestrator knows this is a scenario conversation
      const nudged = next.map((m) =>
        m.role === "user"
          ? ({
              ...m,
              content: `scenario_chat: ${m.content} (company_id=demo)`,
            } as ChatMessage)
          : m
      );

      const res = await chatOrchestrator(nudged);
      setMessages((prev) => [...prev, res.message]);
      if (res.parsed) setLastParsed(res.parsed);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry—something went wrong running the simulation. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function onSend() {
    const text = input.trim();
    if (!text || loading) return;
    await sendText(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const suggestions = [
    "Buy a $50k truck at 7.5% for 36 months",
    "Hire 2 field techs at $28/hr starting next month",
    "Raise prices by 3% next quarter",
    "Cut overtime by 10% and add 1 dispatcher",
  ];

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Scenario Lab (Chat)</h2>
        {loading && <div className="text-sm text-slate-500">Simulating…</div>}
      </div>

      <div className="rounded-2xl bg-white shadow-sm border p-4">
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50"
              onClick={() => sendText(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="h-[60vh] overflow-y-auto space-y-3 pr-1 border rounded-xl p-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <Typing />}
          <div ref={endRef} />
        </div>

        {/* Input row */}
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe your scenario…"
            className="flex-1 rounded-xl border px-3 py-2"
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Optional: show parsed JSON returned by the assistant (if it emitted structured output) */}
      {lastParsed && (
        <section className="rounded-2xl bg-white shadow-sm border p-4">
          <h3 className="font-medium mb-2">Parsed Results</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(lastParsed, null, 2)}</pre>
        </section>
      )}

      <HintCard />
    </main>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-slate-900 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-900 rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-slate-100 text-slate-500 px-4 py-2 text-sm">
        Thinking…
      </div>
    </div>
  );
}

function HintCard() {
  return (
    <div className="rounded-2xl bg-white shadow-sm border p-4 text-sm">
      <div className="font-medium mb-2">Tips</div>
      <ul className="list-disc pl-6 space-y-1">
        <li>Be specific: amount, timing, rates, headcount, pricing.</li>
        <li>Combine changes: “+2 techs, +3% price, +$25k capex.”</li>
        <li>Ask “why” to get drivers, not just numbers.</li>
        <li>Say “compare to base” to get a diffs view.</li>
      </ul>
      <div className="text-xs text-slate-500 mt-3">
        The assistant may also return structured JSON for Base vs Scenario. If it does, you’ll see it above.
      </div>
    </div>
  );
}
