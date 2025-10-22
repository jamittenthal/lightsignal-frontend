"use client";
import React, { useEffect, useMemo, useState } from "react";
import KpiCard from "../../components/KpiCard";
import { fetchReviewsFull, draftReviewReply } from "../../lib/api";

export default function ReviewsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    setData(initialData || {});
  }, [initialData]);

  async function refresh() {
    setLoading(true);
    try {
      const fresh = await fetchReviewsFull({}, "demo");
      setData(fresh || initialData);
    } catch (e) {
      // swallow - keep existing data/stub
    } finally {
      setLoading(false);
    }
  }

  const kpis = data.kpis || [];
  const integrations = data.integrations || [];
  const feed = data.feed || [];
  const analysis = data.analysis || {};

  const quickSummary = useMemo(() => {
    if (!analysis || !analysis.trend_notes) return "—";
    return analysis.trend_notes.join(" · ");
  }, [analysis]);

  async function onDraftReply(review: any) {
    setSelected(review);
    setDraft("Generating draft...");
    try {
      const res = await draftReviewReply(review.id, { tone: "friendly" }, "demo");
      setDraft(res?.draft || res?.text || "—");
    } catch (e) {
      setDraft("—");
    }
  }

  function formatPct(v: number | undefined) {
    if (v == null) return "—";
    return `${Math.round((v as number) * 100)}%`;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(kpis.length ? kpis : []).map((k: any) => {
          let displayValue = k.formatted;
          if (!displayValue) {
            if (k.id === 'sentiment_split' && typeof k.value === 'object' && k.value) {
              // Handle sentiment split object: convert to formatted string
              const { pos, neu, neg } = k.value;
              displayValue = `${formatPct(pos)} pos, ${formatPct(neu)} neu, ${formatPct(neg)} neg`;
            } else if (typeof k.value === 'number') {
              displayValue = k.id === 'avg_rating' ? `${k.value} ★` : k.value;
            } else {
              displayValue = k.value;
            }
          }
          return (
            <KpiCard key={k.id} title={k.label} value={displayValue} subtitle={k.note} />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="rounded border bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">Review Dashboard Overview</div>
                <div className="text-xs text-slate-500">Unified feed · filters · AI summary</div>
              </div>
              <div className="text-xs text-slate-500">{loading ? 'Refreshing...' : <button onClick={refresh} className="underline">Refresh</button>}</div>
            </div>

            <div className="mt-3 text-sm text-slate-600">{quickSummary}</div>

            <div className="mt-4 space-y-2">
              {feed.map((r: any) => (
                <div key={r.id} className="border-b py-2 flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{r.author || '—'} <span className="text-xs text-slate-500">· {r.platform}</span></div>
                    <div className="text-sm text-slate-700">{r.text}</div>
                    <div className="text-xs text-slate-500 mt-1">{r.created_at} · {r.location || '—'} · {r.product || '—'}</div>
                    <div className="text-xs text-slate-500 mt-1">Sentiment: {r.sentiment || '—'} · Score: {r.sentiment_score ?? '—'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm">{r.rating != null ? `${r.rating}★` : '—'}</div>
                    <div className="flex gap-2">
                      <button className="text-xs underline" onClick={() => onDraftReply(r)}>Draft Reply</button>
                      <button className="text-xs underline" onClick={() => setSelected(r)}>Open</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border bg-white p-4">
            <div className="text-sm font-semibold">AI Review Analysis Engine</div>
            <div className="text-xs text-slate-500">Sentiment, keywords, themes</div>
            <div className="mt-3">
              <div className="text-sm font-medium">Positive Themes</div>
              <ul className="list-disc ml-5 text-sm text-slate-700">
                {(analysis.themes_positive || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
              </ul>
              <div className="text-sm font-medium mt-2">Negative Themes</div>
              <ul className="list-disc ml-5 text-sm text-slate-700">
                {(analysis.themes_negative || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </div>

        </div>

        <aside className="space-y-4">
          <div className="rounded border bg-white p-4">
            <div className="text-sm font-semibold">Review Source Integrations</div>
            <div className="text-xs text-slate-500">Connectors & sync health</div>
            <ul className="mt-2 text-sm">
              {(integrations || []).map((it: any) => (
                <li key={it.id} className="flex justify-between py-1 border-b">
                  <div>{it.name}</div>
                  <div className="text-xs text-slate-500">{it.status}{it.last_sync ? ` · synced ${new Date(it.last_sync).toLocaleDateString()}` : ''}</div>
                </li>
              ))}
            </ul>
            {(!integrations || integrations.length === 0) && (
              <div className="mt-3 text-sm">
                No platforms connected — <button className="underline">Create Review Landing Page</button>
              </div>
            )}
          </div>

          <div className="rounded border bg-white p-4">
            <div className="text-sm font-semibold">Campaigns & QR Builder</div>
            <div className="text-xs text-slate-500">Generate QR codes and track scans</div>
            <div className="mt-2 text-sm">{(data.campaigns?.qr_pages || []).map((q: any) => <div key={q.id} className="py-1 flex justify-between"><div>{q.title}</div><div className="text-xs text-slate-500">{q.scan_count} scans</div></div>)}</div>
            <div className="mt-3">
              <button className="rounded bg-slate-100 px-3 py-1 text-sm">Create QR</button>
            </div>
          </div>

          <div className="rounded border bg-white p-4">
            <div className="text-sm font-semibold">Reports & Exports</div>
            <div className="text-xs text-slate-500">PDF & CSV exports</div>
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-slate-100 px-3 py-1 text-sm">Reputation PDF</button>
              <button className="rounded bg-slate-100 px-3 py-1 text-sm">Trends CSV</button>
            </div>
          </div>
        </aside>
      </div>

      {/* Right drawer / response center */}
      {selected && (
        <div className="fixed right-4 top-16 w-96 max-w-full rounded border bg-white p-4 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-semibold">Review</div>
              <div className="text-xs text-slate-500">{selected.author} · {selected.platform}</div>
            </div>
            <button className="text-xs text-slate-500" onClick={() => { setSelected(null); setDraft(""); }}>Close</button>
          </div>

          <div className="mt-3 text-sm text-slate-700">{selected.text}</div>

          <div className="mt-3">
            <div className="text-xs text-slate-500">AI Draft</div>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} className="w-full mt-1 border rounded p-2 h-24 text-sm" />
            <div className="flex gap-2 mt-2">
              <button className="rounded bg-slate-100 px-3 py-1 text-sm" onClick={() => onDraftReply(selected)}>Regenerate Draft</button>
              <button className="rounded bg-emerald-600 text-white px-3 py-1 text-sm" onClick={() => alert('Send disabled in demo (requires OAuth)')}>Send</button>
              <button className="rounded bg-slate-100 px-3 py-1 text-sm" onClick={() => { /* mark resolved locally */ alert('Marked resolved (demo)'); }}>Mark Resolved</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
