export function ProvenanceBadge({ source, confidence }: { source:string; confidence:number }) {
  const shade =
    confidence > 0.85 ? "bg-emerald-100 text-emerald-700"
    : confidence > 0.6 ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${shade}`}>
      {source} · {(confidence * 100).toFixed(0)}%
    </span>
  );
}
