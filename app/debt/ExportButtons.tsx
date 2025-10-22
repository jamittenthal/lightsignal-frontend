"use client";
import React from "react";

export default function ExportButtons({ data }: { data: any }) {
  return (
    <div className="rounded-2xl border bg-white p-4 flex items-center justify-between">
      <div className="text-sm">Exports & Reports</div>
      <div className="flex gap-2">
        <button className="text-sm bg-slate-100 px-3 py-1 rounded">Download PDF</button>
        <button className="text-sm bg-slate-100 px-3 py-1 rounded">Export CSV</button>
      </div>
    </div>
  );
}
