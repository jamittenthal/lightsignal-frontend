"use client";

import { useEffect, useState } from "react";
import { callOrchestrator } from "../../lib/api";
import KpiCard from "@/components/KpiCard";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

export default function Overview() {
  const [kpis, setKpis] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await callOrchestrator("render_financial_overview for company_id=demo");

        const parsed = res.parsed || {};
        setKpis(parsed.kpis || parsed.base?.kpis || {});
        setBenchmarks(parsed.benchmarks || []);
        setInsights(parsed.insights || []);
      } catch (err) {
        console.error("Error loading overview:", err);
        setError("Failed to load financial overview.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-slate-500 text-sm">
        Loading company overview...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-red-600 text-sm">
        {error}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">
        Financial Overview
      </h1>

      {kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(kpis).map(([key, value]) => (
            <KpiCard key={key} label={key} value={value} />
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm">
          No KPI data available.
        </div>
      )}

      {benchmarks && benchmarks.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-700 mb-2">
            Peer Benchmarks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchmarks.map((b, i) => (
              <div
                key={i}
                className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm"
              >
                <div className="text-sm text-slate-600 font-medium">
                  {b.metric}
                </div>
                <div className="text-xl font-semibold">
                  {b.value ?? "—"}
                </div>
                <div className="text-xs text-slate-400">
                  Peer percentile: {b.peer_percentile ?? "—"}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights && insights.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-700 mb-2">
            Key Insights
          </h2>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            {insights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <ProvenanceBadge source="quickbooks" confidence="medium" />
    </div>
  );
}
