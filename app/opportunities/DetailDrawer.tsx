"use client";
import { addToOpportunitiesWatchlist } from "@/lib/api";
import { useState } from "react";
import { useDemoAwareNavigation } from "../../lib/navigation";

export default function DetailDrawer({ item, onClose }: { item: any; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const { navigate } = useDemoAwareNavigation();

  async function save() {
    setBusy(true);
    try {
      await addToOpportunitiesWatchlist({
        company_id: "demo",
        id: item.id,
        title: item.title,
        category: item.category || "other",
        deadline: item.deadline,
        date: item.date,
        fit_score: item.fit_score,
        roi_est: item.roi_est,
        link: item.link,
      });
      alert("Saved to watchlist");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function simulate() {
    setBusy(true);
    try {
      // navigate to /scenarios with type and id query params
      const searchParams = new URLSearchParams();
      if (item.category) searchParams.set("type", item.category);
      if (item.id) searchParams.set("id", item.id);
      navigate(`/scenarios?${searchParams.toString()}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end">
      <div className="h-full w-full max-w-lg bg-white shadow-xl p-6 overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <button onClick={onClose} className="text-slate-600">✕</button>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div><b>Category:</b> {item.category}</div>
          {item.date && <div><b>Date:</b> {item.date}</div>}
          {item.deadline && <div><b>Deadline:</b> {item.deadline}</div>}
          {typeof item.fit_score === "number" && <div><b>Fit:</b> {(item.fit_score*100).toFixed(0)}%</div>}
          {typeof item.roi_est === "number" && <div><b>ROI est:</b> {(item.roi_est*100).toFixed(0)}%</div>}
          {item.weather && <div><b>Weather:</b> {item.weather}</div>}
          {item.link && <div><a className="text-blue-600 underline" href={item.link} target="_blank">Open link</a></div>}
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={save} disabled={busy} className="rounded bg-black text-white px-4 py-2">Save to Watchlist</button>
          <button onClick={simulate} disabled={busy} className="rounded border px-4 py-2">Simulate in Scenario Lab</button>
        </div>
      </div>
    </div>
  );
}
