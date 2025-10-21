interface ConfidenceBadgeProps {
  confidence?: "low" | "medium" | "high";
}

export function ConfidenceBadge({ confidence = "medium" }: ConfidenceBadgeProps) {
  const colorMap: Record<string, string> = {
    low: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200", 
    high: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${colorMap[confidence]}`}>
      {confidence.toUpperCase()}
    </span>
  );
}

interface ProvenancePanelProps {
  provenance: {
    baseline_source?: string | null;
    sources?: string[];
    used_priors?: boolean;
    prior_weight?: number;
    confidence?: "low" | "medium" | "high";
  };
}

export function ProvenancePanel({ provenance }: ProvenancePanelProps) {
  return (
    <div className="border rounded-xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Data Provenance & Confidence</h3>
        <ConfidenceBadge confidence={provenance.confidence} />
      </div>
      <div className="mt-2 text-sm text-gray-700 space-y-1">
        <div>
          <strong>Baseline:</strong> {provenance.baseline_source ?? '—'}
        </div>
        <div>
          <strong>Used priors:</strong> {provenance.used_priors ? 'Yes' : 'No'} 
          {provenance.prior_weight ? ` (weight: ${provenance.prior_weight})` : ''}
        </div>
        <div>
          <strong>Sources:</strong> {(provenance.sources || []).length ? 
            (provenance.sources || []).join(', ') : '—'}
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <button className="text-blue-600 underline">Learn more about provenance</button>
      </div>
    </div>
  );
}