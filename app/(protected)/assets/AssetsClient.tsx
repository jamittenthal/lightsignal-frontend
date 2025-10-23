"use client";
import React, { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import { BACKEND_URL, callIntent } from "@/lib/api";

const STUB = {
  "kpis": {
    "total_assets_by_type": { "vehicles": 6, "equipment": 14, "property": 2, "it": 18, "tools": 40 },
    "book_value_total": 485000,
    "replacement_value_total": 742000,
    "utilization": {
      "last_30d": { "avg_pct": 0.68, "idle_pct": 0.17 },
      "last_90d": { "avg_pct": 0.64, "idle_pct": 0.21 }
    },
    "downtime_availability": { "downtime_hours": 38, "availability_pct": 0.962, "mtbf_hours": 420, "mttr_hours": 3.4 },
    "maintenance_compliance_pct": 0.86,
    "upcoming_services": { "next_30d": 7, "next_60d": 12, "next_90d": 19, "items":[{"asset_id":"TRK-102","due":"2025-11-10","task":"Oil & filter"}] },
    "expiring_warranty_insurance": { "next_60d": 3, "items":[{"asset_id":"GEN-09","type":"warranty","expires":"2025-12-01"}] },
    "depreciation": { "mtd": 4200, "qtd": 11800, "ytd": 48600 },
    "capex_pipeline": { "count": 3, "amount": 128000 },
    "health_score": 78
  },
  "integrations": [
    { "id":"cmms","name":"CMMS","status":"connected","provenance":{"baseline_source":"cmms_demo","used_priors":false,"confidence":"medium"} },
    { "id":"telematics","name":"Telematics","status":"connected","provenance":{"baseline_source":"telematics_demo","used_priors":false,"confidence":"medium"} },
    { "id":"accounting","name":"QuickBooks","status":"connected","provenance":{"baseline_source":"quickbooks_demo","used_priors":false,"confidence":"medium"} }
  ],
  "registry": [
    {
      "asset_id":"TRK-102","category":"vehicle","type":"Box Truck","make":"Ford","model":"E-350","year":2021,
      "serial":"1FDWE3FN0MDC12345","site":"Yard A","status":"active","assigned_to":"Ops",
      "purchase_date":"2021-04-14","in_service_date":"2021-04-30",
      "purchase_price":52000,"salvage_value":8000,"useful_life_months":84,"depreciation_method":"straight_line",
      "book_value":38400,"replacement_value":78000,
      "meter_type":"mi","meter_reading":61250,
      "utilization_pct":0.74,"availability_pct":0.968,"mtbf_hours":520,"mttr_hours":2.1,
      "next_service_date":"2025-11-10","last_service_date":"2025-08-02",
      "telemetry":{"odometer":61250,"gps":[-82.821,27.98],"fuel":0.56,"dtc":[]},
      "docs":[{"name":"Title.pdf"},{"name":"Insurance-2025.pdf"}],
      "children":[{"asset_id":"REF-102A","type":"Reefer Unit"}]
    }
  ],
  "work_orders": [
    { "wo_id":"WO-2211","asset_id":"TRK-102","priority":"high","status":"open","opened":"2025-10-18","sla_hours":48,"parts_cost":180,"labor_cost":240,"downtime_hours":6,"summary":"Brake inspection" }
  ],
  "valuation": {
    "by_category": [
      { "category":"vehicles","book_value":238000,"replacement_value":372000 },
      { "category":"equipment","book_value":187000,"replacement_value":285000 }
    ]
  },
  "utilization": {
    "series_30d": [ { "date":"2025-10-01","active_hours":5.2,"idle_hours":1.1 }, { "date":"2025-10-02","active_hours":4.9,"idle_hours":1.3 } ]
  },
  "alerts": [
    { "severity":"high","text":"Overdue service: REF-102A by 14 days","cta":"Create Work Order" },
    { "severity":"medium","text":"Insurance expiring: TRK-102 on 2025-12-12","cta":"Renew" }
  ],
  "documents": { "count": 42, "expirations":[{"doc":"Insurance-2025.pdf","asset_id":"TRK-102","date":"2025-12-12"}] },
  "quick_actions": { "add_asset": true, "bulk_import": true, "scan_qr": true, "create_wo": true, "record_meter": true, "replace_vs_repair": true, "export_upcoming": true, "connect_integration": true },
  "export": { "pdf_available": true, "csv_available": true }
};

function formatPct(v: any) {
  if (v == null) return "—";
  return typeof v === 'number' ? `${(v*100).toFixed(0)}%` : String(v);
}

export default function AssetsClient() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showScan, setShowScan] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchFull() {
      try {
        const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
        const url = `${apiRoot.replace(/\/$/, "")}/api/ai/assets/full`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: "demo", range: "30d", include_registry: true, include_maintenance: true, include_telematics: true, include_documents: true }),
          cache: "no-store",
        });
        if (!resp.ok) throw new Error(`assets full API failed (${resp.status})`);
        const j = await resp.json();
        if (!mounted) return;
        setData(j);
      } catch (e) {
        try {
          const intentResp = await callIntent("asset_management", { company_id: "demo", range: "30d", include_registry: true }, "demo");
          if (intentResp) {
            if (!mounted) return;
            setData(intentResp);
            setLoading(false);
            return;
          }
        } catch (ie) {
          // ignore
        }
        if (!mounted) return;
        setData(STUB);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    fetchFull();
    return () => { mounted = false; };
  }, []);

  const kpis = data?.kpis || STUB.kpis;

  const registry = data?.registry || STUB.registry;

  const filtered = registry.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.asset_id || "").toLowerCase().includes(s) || (r.make || "").toLowerCase().includes(s) || (r.model || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-5 gap-4">
    <KpiCard title={`Total Assets (${Object.keys(kpis.total_assets_by_type || {}).length})`} value={Number(Object.values(kpis.total_assets_by_type || {}).reduce((a: any,b:any)=>a+b,0))}>
          <div className="text-xs text-slate-500 mt-2">Breakdown: {(kpis.total_assets_by_type && Object.entries(kpis.total_assets_by_type).map(([k,v])=>`${k}: ${v}`).join(' · ')) || '—'}</div>
        </KpiCard>

        <KpiCard title="Book Value" value={kpis.book_value_total ? `$${kpis.book_value_total.toLocaleString()}` : '—'} />
        <KpiCard title="Replacement Value" value={kpis.replacement_value_total ? `$${kpis.replacement_value_total.toLocaleString()}` : '—'} />
        <KpiCard title="Utilization (30d avg)" value={formatPct(kpis.utilization?.last_30d?.avg_pct)} subtitle={`Idle ${formatPct(kpis.utilization?.last_30d?.idle_pct)}`} />
        <KpiCard title="Health Score" value={kpis.health_score ? `${kpis.health_score}/100` : '—'} />
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets, make, model..." className="px-3 py-2 border rounded" />
              <select className="px-2 py-2 border rounded text-sm">
                <option value="">All categories</option>
                <option value="vehicle">Vehicles</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <div className="space-x-2">
              <button onClick={()=>setShowScan(true)} className="px-3 py-1 rounded bg-teal-600 text-white text-sm">Scan QR</button>
              <button className="px-3 py-1 rounded border text-sm" onClick={()=>alert('Bulk import not implemented in demo')}>Bulk Import</button>
              <button className="px-3 py-1 rounded border text-sm" onClick={()=>setShowReplace(true)}>Replace vs Repair</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 py-2">Asset ID</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Make / Model</th>
                  <th className="px-2 py-2">Serial / VIN</th>
                  <th className="px-2 py-2">Location</th>
                  <th className="px-2 py-2">Assigned</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(loading ? Array.from({length:3}) : filtered).map((r: any, i: number) => (
                  <tr key={r?.asset_id || i} className="border-t">
                    <td className="px-2 py-3 font-mono text-xs">{r?.asset_id || '—'}</td>
                    <td className="px-2 py-3">{r?.category || '—'}</td>
                    <td className="px-2 py-3">{r?.make ? `${r.make} ${r.model || ''}` : '—'}</td>
                    <td className="px-2 py-3">{r?.serial || '—'}</td>
                    <td className="px-2 py-3">{r?.site || '—'}</td>
                    <td className="px-2 py-3">{r?.assigned_to || '—'}</td>
                    <td className="px-2 py-3">{r?.status || '—'}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>{setSelectedAsset(r); setShowReplace(true);}} className="px-2 py-1 text-xs rounded border">Replace vs Repair</button>
                        <button onClick={()=>{setSelectedAsset(r); alert('Open WO modal (demo)');}} className="px-2 py-1 text-xs rounded border">Create WO</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Integrations & Data Sources</div>
          <div className="space-y-2">
            {(data?.integrations || STUB.integrations).map((it: any) => (
              <div key={it.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs text-slate-500">Status: {it.status}</div>
                </div>
                <div className="text-xs text-slate-400">Confidence: {it.provenance?.confidence || it.provenance?.confidence || '—'}</div>
              </div>
            ))}

            <div className="mt-2">
              <a href="/settings" className="text-sm text-teal-600">Connect Integration</a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Maintenance & Work Orders</div>
          <ul className="space-y-2 text-sm">
            {(data?.work_orders || STUB.work_orders).map((w: any) => (
              <li key={w.wo_id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{w.summary}</div>
                  <div className="text-xs text-slate-500">{w.wo_id} · {w.asset_id} · Priority: {w.priority}</div>
                </div>
                <div className="text-sm">
                  <div>Status: <span className="font-medium">{w.status}</span></div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">Alerts & Documents</div>
          <div className="space-y-2 text-sm">
            {(data?.alerts || STUB.alerts).map((a: any, i:number) => (
              <div key={i} className="p-2 border rounded">
                <div className="font-medium">{a.text}</div>
                <div className="text-xs text-slate-500 mt-1">Severity: {a.severity}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple modals/drawers */}
      {showScan && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-4 rounded w-[420px]">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Scan QR / Enter Asset ID</div>
              <button onClick={()=>setShowScan(false)} className="text-slate-500">Close</button>
            </div>
            <div>
              <input placeholder="Asset ID e.g. TRK-102" className="w-full border px-3 py-2 mb-2" onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; const found=(data?.registry||STUB.registry).find((x:any)=>x.asset_id===v); if(found){ setSelectedAsset(found); alert('Matched '+v); setShowScan(false);} else { alert('No match in demo'); } } }} />
              <div className="text-sm text-slate-500">Scan with device camera in mobile builds (demo shows input).</div>
            </div>
          </div>
        </div>
      )}

      {showReplace && (
        <div className="fixed right-0 top-0 h-full w-full md:w-[520px] bg-white border-l shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">Replace vs Repair{selectedAsset ? ` — ${selectedAsset.asset_id}` : ''}</div>
            <button onClick={()=>{ setShowReplace(false); setSelectedAsset(null); }} className="text-slate-500">Close</button>
          </div>
          <div className="space-y-3 text-sm">
            <div>Simple calculator demo: enter estimated repair cost and replacement cost.</div>
            <div className="flex gap-2">
              <input placeholder="Repair cost" className="px-2 py-2 border rounded w-1/2" />
              <input placeholder="Replacement cost" className="px-2 py-2 border rounded w-1/2" />
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-teal-600 text-white" onClick={async()=>{ try{ const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL; const url = `${apiRoot.replace(/\/$/, "")}/api/ai/assets/replace-vs-repair`; await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company_id:'demo', asset_id:selectedAsset?.asset_id || null}),}); alert('Requested replace-vs-repair (demo)'); } catch(e){ alert('Request failed in demo'); }}}>Run</button>
              <button className="px-3 py-1 rounded border" onClick={()=>alert('Show NPV/payback (demo)')}>Show results</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
