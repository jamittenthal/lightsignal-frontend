import React from "react";

export default function ProvenanceBadge({ source }: { source?: string }) {
  if (!source) return null;
  return (
    <span className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs bg-white">
      <span className="text-slate-600">{source}</span>
    </span>
  );
}
