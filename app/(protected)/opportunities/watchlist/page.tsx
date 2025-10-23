"use client";
import { listWatchlist, updateWatchItem, exportCSVUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function WatchlistPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRows(await listWatchlist("demo"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await updateWatchItem({ company_id: "demo", id, status });
    await load();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <div className="flex items-center gap-3">
          <a className="text-sm underline" href={exportCSVUrl("demo")}>Export CSV</a>
          <Link className="text-sm underline" href="/opportunities">Back to Opportunities</Link>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-slate-500">Nothing saved yet.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Date</Th>
                <Th>Deadline</Th>
                <Th>Fit</Th>
                <Th>ROI</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={i}>
                  <Td>{r.title}</Td>
                  <Td>{r.category}</Td>
                  <Td>{r.date || "—"}</Td>
                  <Td>{r.deadline || "—"}</Td>
                  <Td>{typeof r.fit_score === "number" ? (r.fit_score * 100).toFixed(0) + "%" : "—"}</Td>
                  <Td>{typeof r.roi_est === "number" ? (r.roi_est * 100).toFixed(0) + "%" : "—"}</Td>
                  <Td>{r.status}</Td>
                  <Td className="space-x-2">
                    {["Open", "Applied", "Attended", "Won", "Lost", "Closed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(r.id, s)}
                        className="px-2 py-1 rounded border text-xs"
                      >
                        {s}
                      </button>
                    ))}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: any; className?: string }) {
  return <th className={`text-left px-3 py-2 text-xs font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: any; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
