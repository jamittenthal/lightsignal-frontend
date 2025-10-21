"use client";
import React, { useState } from "react";

export default function DemandSimulator() {
  const [inputs, setInputs] = useState({
    add_events: 0,
    discount_pct: 0,
    weather_change: "none",
    marketing_boost: 0
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://lightsignal-backend.onrender.com";
      const resp = await fetch(`${apiUrl}/api/ai/demand/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company_id: "demo",
          inputs 
        }),
      });
      const json = await resp.json().catch(() => ({
        outputs: {
          revenue_delta_pct: inputs.add_events * 7 + inputs.marketing_boost * 2 - inputs.discount_pct * 0.3,
          margin_delta_pts: -inputs.discount_pct * 0.8,
          staffing_delta_fte: Math.max(0, inputs.add_events * 0.5)
        }
      }));
      setResults(json.outputs || json);
    } catch (e) {
      // Fallback calculation
      setResults({
        revenue_delta_pct: inputs.add_events * 7 + inputs.marketing_boost * 2 - inputs.discount_pct * 0.3,
        margin_delta_pts: -inputs.discount_pct * 0.8,
        staffing_delta_fte: Math.max(0, inputs.add_events * 0.5)
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Scenario Impact Simulator</div>
      <div className="text-sm text-slate-600">Run quick what-if scenarios and see projected impacts.</div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500">Additional Events</label>
          <input 
            type="number" 
            min="0" 
            max="10"
            value={inputs.add_events}
            onChange={(e) => setInputs(prev => ({ ...prev, add_events: parseInt(e.target.value) || 0 }))}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        
        <div>
          <label className="text-xs text-slate-500">Discount % (0-50)</label>
          <input 
            type="number" 
            min="0" 
            max="50"
            value={inputs.discount_pct}
            onChange={(e) => setInputs(prev => ({ ...prev, discount_pct: parseInt(e.target.value) || 0 }))}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        
        <div>
          <label className="text-xs text-slate-500">Marketing Boost %</label>
          <input 
            type="number" 
            min="0" 
            max="100"
            value={inputs.marketing_boost}
            onChange={(e) => setInputs(prev => ({ ...prev, marketing_boost: parseInt(e.target.value) || 0 }))}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        
        <button 
          onClick={runSimulation}
          disabled={loading}
          className="w-full px-3 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Simulation"}
        </button>
      </div>

      {results && (
        <div className="mt-4 p-3 bg-slate-50 rounded">
          <div className="text-xs text-slate-500 mb-2">Projected Impact</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Revenue Change:</span>
              <span className={results.revenue_delta_pct > 0 ? "text-green-600" : "text-red-600"}>
                {results.revenue_delta_pct > 0 ? "+" : ""}{results.revenue_delta_pct?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Margin Change:</span>
              <span className={results.margin_delta_pts > 0 ? "text-green-600" : "text-red-600"}>
                {results.margin_delta_pts > 0 ? "+" : ""}{results.margin_delta_pts?.toFixed(1)} pts
              </span>
            </div>
            <div className="flex justify-between">
              <span>Staffing Need:</span>
              <span>{results.staffing_delta_fte?.toFixed(1)} FTE</span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <a href="/scenarios" className="text-sm text-teal-700 underline hover:text-teal-800">
          Run Full Simulation in Scenario Planning Lab →
        </a>
      </div>
    </div>
  );
}