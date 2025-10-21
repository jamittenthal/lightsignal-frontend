import { useState } from "react";

interface AssistantPanelProps {
  suggestions: string[];
  onAsk: (question: string) => Promise<void>;
}

export function AssistantPanel({ suggestions, onAsk }: AssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  async function handleAsk(question: string) {
    setLoading(true);
    try {
      await onAsk(question);
      if (question === customQuestion) {
        setCustomQuestion("");
      }
    } finally {
      setLoading(false);
    }
  }

  const commonQuestions = [
    "Why is QuickBooks disconnected?",
    "Show missing scopes or credentials.",
    "How do I re-authenticate?",
    "What are the sync schedules?"
  ];

  return (
    <div className="border rounded-xl bg-white p-4">
      <h3 className="font-semibold">Troubleshooting Assistant</h3>
      <div className="mt-2 text-sm text-gray-600">
        Ask quick prompts to diagnose connection issues and get help.
      </div>
      
      {/* Custom question input */}
      <div className="mt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask a custom question..."
            className="flex-1 px-3 py-2 border rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && customQuestion.trim() && handleAsk(customQuestion)}
          />
          <button
            onClick={() => customQuestion.trim() && handleAsk(customQuestion)}
            disabled={loading || !customQuestion.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Common questions */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="text-sm font-medium">Common questions:</div>
        {commonQuestions.map((question) => (
          <button
            key={question}
            onClick={() => handleAsk(question)}
            disabled={loading}
            className="text-left px-3 py-2 border rounded hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold">AI Suggestions</h4>
          <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start justify-between">
                <span className="flex-1">{suggestion}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(suggestion)}
                  className="ml-2 text-xs text-blue-600 hover:underline flex-shrink-0"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="mt-3 text-sm text-gray-600">
          🤔 Assistant is thinking...
        </div>
      )}
    </div>
  );
}