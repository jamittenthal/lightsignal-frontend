"use client";
import { useState } from "react";
import { callResearch } from "../../lib/api";

export default function Insights() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any | null>(null);

  const suggestions = [
    "HVAC expansion in Austin, TX — market, labor, regulation",
    "Phoenix labor market for HVAC techs — wages and licensing",
    "Commercial rent & insurance trends in Dallas for small service shops",
    "Seasonality and demand signals for residential HVAC in Nashville",
  ];

  async function run(q: string) {
    setLoading(true);
    setText(null);
    setParsed(null);
    try {
      const res = await callResearch(q);
      setText(res.text);
      setParsed(res.parsed ?? null);
    } catch (e) {
      setText("Sorry — research request failed.");
      setParsed(null);
    } finally {
      setLoading(false);
    }
  }

  const digest = parsed?.digest;

  return (
    <main className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Insights (Research Scout)</h2>

      <div className="rounded-2xl bg-white shadow-sm border p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50"
              onClick={() => run(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about a market/location/industry… e.g., 'HVAC in Austin: demand, labor, regulation'"
            className="flex-1 rounded-xl border px-3 py-2"
          />
          <button
            onClick={() => {
              const q = query.trim();
              if (q) run(q);
            }}
            disabled={loading || !query.trim()}
            className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {/* Pretty view if we have the rich digest */}
      {digest && (
        <section className="rounded-2xl bg-white shadow-sm border p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Demand" items={digest.demand} />
            <Card title="Competition" items={digest.competition} />
            <Card
              title="Labor"
              items={[
                digest?.labor?.availability_note,
                digest?.labor?.licensing,
                digest?.labor?.wage_range_hour
                  ? `Wages: $${digest.labor.wage_range_hour[0]}–$${digest.labor.wage_range_hour[1]}/hr`
                  : null,
              ]}
            />
            <Card
              title="Costs"
              items={[
                digest?.costs?.rent_note,
                digest?.costs?.insurance_note,
                digest?.costs?.fuel_or_materials_note,
                digest?.costs?.tax_or_fee_note,
              ]}
            />
            <Card title="Seasonality" items={[digest?.seasonality]} />
            <Card title="Regulatory" items={digest.regulatory} />
            <Card title="Customer Profile" items={digest.customer_profile} />
            <Card title="Risks" items={digest.risks} />
            <Card title="Opportunities" items={digest.opportunities} />
          </div>

          {Array.isArray(parsed?.benchmarks) && parsed.benchmarks.length > 0 && (
            <div>
              <div className="font-medium mb-1">Benchmarks</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {parsed.benchmarks.map((b: any, i: number) => (
                  <div key={i} className="rounded-full border px-3 py-1 bg-slate-50">
                    <span className="text-slate-500 mr-1">{b.metric}:</span>
                    {typeof b.peer_median === "number" ? b.peer_median : b.value ?? "—"}
                    {b.region ? <span className="text-slate-500 ml-2">{b.region}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(parsed?.sources) && parsed.sources.length > 0 && (
            <div className="rounded-xl bg-slate-50 border p-3 text-sm">
              <div className="font-medium mb-1">Sources</div>
              <ul className="list-disc pl-6">
                {parsed.sources.map((s: any, i: number) => (
                  <li key={i}>
                    {s.title}{" "}
                    {s.url ? (
                      <a
                        className="text-sky-600 underline underline-offset-2"
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        link
                      </a>
                    ) : null}{" "}
                    {s.note ? <span className="text-slate-500">— {s.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed?.so_what && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm">
              <div className="font-medium mb-1">So what</div>
              <div>{parsed.so_what}</div>
            </div>
          )}
        </section>
      )}

      {/* Raw fallback (if not a digest shape) */}
      {text && !digest && (
        <section className="rounded-2xl bg-white shadow-sm border p-4">
          <div className="font-medium mb-2">Raw result</div>
          <pre className="text-xs overflow-x-auto">{text}</pre>
        </section>
      )}
    </main>
  );
}

function Card({ title, items }: { title: string; items?: any[] }) {
  const list = (items || []).filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div className="rounded-xl border p-3">
      <div className="font-medium mb-2">{title}</div>
      <ul className="list-disc pl-6 text-sm">
        {list.map((x, i) => (
          <li key={i}>{String(x)}</li>
        ))}
      </ul>
    </div>
  );
}
