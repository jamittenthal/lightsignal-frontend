"use client";

import React, { useEffect, useRef, useState } from "react";
import { chatOrchestrator, type ChatMessage } from "../../lib/api";

// --- Small UI bits kept local so the file is self-contained ---

function Bubble(props: { role: "user" | "assistant" | "system"; content: string }) {
  const { role, content } = props;
  const mine = role === "user";
  const sys = role === "system";
  const base =
    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-6 shadow";
  const color = sys
    ? "bg-gray-200 text-gray-800"
    : mine
    ? "bg-blue-600 text-white"
    : "bg-gray-100 text-gray-900";
  const align = mine ? "self-end text-right" : "self-start";
  return (
    <div className={`flex ${align}`}>
      <div className={`${base} ${color}`}>{content || ""}</div>
    </div>
  );
}

function Typing() {
  return (
    <div className="self-start">
      <div className="bg-gray-100 text-gray-700 rounded-2xl px-4 py-2 text-sm shadow">
        <span className="inline-block animate-pulse">…</span>
      </div>
    </div>
  );
}

// --- Page ---

export default function ScenariosPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! Describe a scenario to test (e.g., “Increase price by 5%”)." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function onSend() {
    const q = input.trim();
    if (!q) return;
    setInput("");

    // Append user's message locally
    const nextMsgs: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(nextMsgs);
    setLoading(true);

    try {
      // Our lib supports string | ChatMessage[]
      const res = await chatOrchestrator(nextMsgs, "demo");

      // Try to extract a reply content from various shapes
      let replyText =
        res?.message?.content ??
        res?.message?.text ??
        res?.result?.text ??
        (typeof res?.result === "string" ? res.result : undefined) ??
        res?.text ??
        (res?.parsed ? JSON.stringify(res.parsed, null, 2) : "Ok.");

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: typeof replyText === "string" ? replyText : "Ok.",
        json: res?.parsed ?? undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res?.parsed) setParsed(res.parsed);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — scenario chat failed." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Let Enter submit (Shift+Enter for newline)
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Scenario Planning Lab (Chat)</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Chat column */}
        <div className="md:col-span-2 flex flex-col">
          <div className="h-[50vh] overflow-y-auto space-y-3 pr-1 border rounded-xl p-3 mb-3 bg-white">
            {messages.map((m, i) => (
              <Bubble
                key={i}
                // Map 'ai' -> 'assistant' so the component always sees the right union
                role={(m.role === "ai" ? "assistant" : m.role) as "user" | "assistant" | "system"}
                content={m.content ?? m.text ?? ""}
              />
            ))}
            {loading && <Typing />}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g., 'Increase price by 5% and reduce marketing by 10%'"
              className="flex-1 border rounded-xl p-3 text-sm min-h-[56px]"
            />
            <button
              onClick={onSend}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tip: Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for a new line.
          </p>
        </div>

        {/* Parsed JSON / Debug column */}
        <div className="md:col-span-1">
          <div className="border rounded-xl p-3 bg-white">
            <div className="text-sm font-medium mb-2">Parsed / JSON</div>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
              {parsed ? JSON.stringify(parsed, null, 2) : "—"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
