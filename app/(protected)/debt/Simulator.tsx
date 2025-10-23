"use client";
import React, { useState } from "react";

export default function Simulator({ scenarios, onApply }: { scenarios: any[]; onApply?: (s:any)=>void }){
  const [sel, setSel] = useState(scenarios?.[0]?.id || null);
  return (
    <div>
      <select value={sel||''} onChange={(e)=>setSel(e.target.value)} className="border p-1 rounded w-full text-sm">
        {(scenarios||[]).map((s:any)=> <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div className="mt-3 text-sm">
        Selected: {scenarios?.find((s:any)=>s.id===sel)?.name || '—'}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="text-sm bg-slate-100 px-2 py-1 rounded" onClick={()=>onApply && onApply(scenarios?.find((s:any)=>s.id===sel))}>Simulate</button>
        <button className="text-sm bg-slate-100 px-2 py-1 rounded">Send to Lab</button>
      </div>
    </div>
  );
}
