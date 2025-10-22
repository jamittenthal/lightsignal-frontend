"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { callIntent, BACKEND_URL } from "../../lib/api";

// Minimal types following the stub shape
type KPI = { id: string; label: string; value: any; formatted?: string; state?: string };
type NAICSResult = { code: string; title: string; sector?: string; subsector?: string };
type UploadFile = { id: string; file: string; type: string; issuer: string; effective?: string; expiration?: string; status: string; extracted_metadata?: any };

const STUB = {
  kpis: [
    { id: "profile_complete", label: "Business Overview Completed %", value: 0.84, formatted: "84%", state: "good" },
    { id: "sync_conf", label: "Data Sync Confidence", value: 0.92, formatted: "92%", state: "good" },
    { id: "primary_location", label: "Primary Location", value: "Clearwater, FL", state: "stable" },
    { id: "naics", label: "NAICS / Industry Code", value: "238220 (Plumbing, Heating, and AC)", state: "stable" },
    { id: "rev_bracket", label: "Revenue Size Bracket", value: "$1–2M", state: "stable" }
  ],
  general: {
    name: "LightSignal Demo Co.",
    entity_type: "LLC",
    ein_masked: "XX-XXX1234",
    locations: [
      { id: "hq", label: "HQ", address: "123 Gulf Blvd, Clearwater, FL", timezone: "America/New_York" }
    ],
    founded: "2018-04-01",
    timezone: "America/New_York",
    currency: "USD",
    owners: [ { name: "A. Owner", percent: 70 }, { name: "B. Partner", percent: 30 } ]
  },
  industry: { naics: { code: "238220", title: "Plumbing, Heating, and Air-Conditioning Contractors" }, sector: "Construction", subsector: "Specialty Trade Contractors", business_model: "B2C", categories: ["HVAC Service","Maintenance"], benchmark_set: "Construction — HVAC (Regional)" },
  operations: { employees_fte: 12, employees_pt: 3, hours: "Mon–Sat 8a–6p", vendors: ["Apex Logistics","Global Supply Ltd"], major_recurring: [{ name: "Rent", amount: 4200 }, { name: "Payroll", amount: 48000 }, { name: "Utilities", amount: 1200 }], service_areas: ["Pinellas County","Hillsborough County"] },
  financial: { accounting_system: "QuickBooks", avg_monthly_revenue: 142300, avg_monthly_expenses: 120900, avg_net_margin_pct: 0.15, fiscal_year_start: "01-01", top_expense_categories: ["Payroll","COGS","Rent"], banking_relationships: ["BofA","Amex"], history_window: "24m" },
  assets: [ { id: "veh-1", type: "Vehicle", name: "Ford Transit", purchase_date: "2022-05-10", cost: 52000, book_value: 40300, depr_method: "SL", schedule: "60m", maintenance_status: "On schedule" } ],
  customers: { mix: { consumer_pct: 0.7, business_pct: 0.3 }, monthly_volume: 260, retention_rate_pct: 0.78, repeat_ratio_pct: 0.61, market_region: "Tampa Bay Area", seasonality_tags: ["Spring uptick","Holiday spike"] },
  risk: { insurance: { carrier: "Hiscox", policy: "GL-123", renewal: "2025-11-30" }, debt_links: [{ href: "/debt", summary: "4 accounts connected" }], dependencies: { top_customers: ["City Facilities"], top_suppliers: ["Apex Logistics"] }, risk_factors: ["Hurricane season","Supply chain delays"] },
  objectives: { short_term: "Improve AR days < 35; launch maintenance plans.", mid_term: "Add second crew; expand to neighboring county.", long_term: "Diversify into light commercial installations." },
  uploads: [ { id: "doc-ein", file: "EIN_Confirmation.pdf", type: "EIN", issuer: "IRS", effective: "2018-04-01", expiration: null, status: "verified" } ],
  completeness: { percent: 0.84, missing: [ { section: "Assets & Equipment", item: "Upload latest maintenance logs" }, { section: "Industry Classification", item: "Confirm NAICS secondary code" } ] },
  _meta: { source: "lightsignal.orchestrator", confidence: "high", provenance: { baseline_source: "profile_demo", used_priors: true, prior_weight: 0.4 } }
};

// Utility: POST to backend-first endpoint, fallback to callIntent if available, then to stub
async function fetchProfile(companyId = "demo") {
  const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL || "";
  const url = `${apiRoot.replace(/\/$/, "")}/api/ai/profile/full`;
  const body = {
    company_id: companyId,
    include_financial_summary: true,
    include_assets: true,
    include_benchmarks: true,
    include_uploads: true,
    include_integrations: true,
  };

  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    if (!res.ok) throw new Error(`profile API failed (${res.status})`);
    return await res.json();
  } catch (e) {
    // Try helper fallback
    try {
      // callIntent signature is flexible; use secondary style
      const resp = await callIntent("business_profile", { company_id: companyId }, companyId);
      return resp && (resp.result ?? resp);
    } catch (e2) {
      return STUB;
    }
  }
}

function formatPercent(v: number | undefined) {
  if (v === undefined || v === null) return "—";
  if (v <= 1) return `${Math.round(v * 100)}%`;
  return String(v);
}

export default function ProfilePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("general");
  const [naicsResults, setNaicsResults] = useState<NAICSResult[]>([]);
  const [showNaicsDropdown, setShowNaicsDropdown] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ file: File; metadata: any } | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const d = await fetchProfile("demo");
      setData(d);
      setLoading(false);
    })();
  }, []);

  // Controlled field helpers: local edits that autosave on blur
  function updateLocal(path: string, value: any) {
    setData((prev: any) => {
      const copy = { ...(prev || {}) };
      const parts = path.split(".");
      let cur: any = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] || {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
  }

  // Improved save with useRef for stable timeout and better error handling
  const saveFieldDebounced = useCallback(async (path: string, value: any) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL || "";
        const url = `${apiRoot.replace(/\/$/, "")}/api/ai/profile/update`;
        const response = await fetch(url, { 
          method: "PATCH", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ company_id: "demo", path, value }), 
          cache: "no-store" 
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.completeness) {
            // Update completeness if backend returns it
            setData((prev: any) => ({ ...prev, completeness: result.completeness }));
          }
          setSavedAt(new Date().toLocaleTimeString());
        }
      } catch (e) {
        // Silent fail - show saved anyway for better UX
        setSavedAt(new Date().toLocaleTimeString() + " (offline)");
      }
    }, 600);
  }, []);

  // Enhanced NAICS search with dropdown results
  const searchNaics = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setNaicsResults([]);
      setShowNaicsDropdown(false);
      return;
    }
    
    try {
      const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL || "";
      const url = `${apiRoot.replace(/\/$/, "")}/api/ai/profile/industry/naics/search`;
      const resp = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ q, company_id: "demo" }), 
        cache: "no-store" 
      });
      
      if (!resp.ok) throw new Error("search failed");
      const results = await resp.json();
      
      if (Array.isArray(results)) {
        setNaicsResults(results);
        setShowNaicsDropdown(results.length > 0);
      }
    } catch (e) {
      // Fallback with mock results for demo
      const mockResults = [
        { code: "238220", title: "Plumbing, Heating, and Air-Conditioning Contractors", sector: "Construction", subsector: "Specialty Trade" },
        { code: "238210", title: "Electrical Contractors and Other Wiring Installation Contractors", sector: "Construction", subsector: "Specialty Trade" },
        { code: "238110", title: "Poured Concrete Foundation and Structure Contractors", sector: "Construction", subsector: "Specialty Trade" }
      ].filter(r => r.code.includes(q) || r.title.toLowerCase().includes(q.toLowerCase()));
      
      setNaicsResults(mockResults);
      setShowNaicsDropdown(mockResults.length > 0);
    }
  }, []);

  const selectNaics = useCallback((result: NAICSResult) => {
    const newNaics = {
      code: result.code,
      title: result.title,
      sector: result.sector,
      subsector: result.subsector
    };
    
    updateLocal('industry.naics', newNaics);
    
    // Update benchmark set based on selection
    const benchmarkSet = `${result.sector} — ${result.title.split(' ')[0]} (Regional)`;
    updateLocal('industry.benchmark_set', benchmarkSet);
    
    setShowNaicsDropdown(false);
    saveFieldDebounced('industry.naics', newNaics);
    saveFieldDebounced('industry.benchmark_set', benchmarkSet);
  }, [saveFieldDebounced]);

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDraggedFiles(files);
      simulateMetadataExtraction(files[0]);
    }
  }, []);

  const simulateMetadataExtraction = useCallback(async (file: File) => {
    // Simulate API call for metadata extraction
    const mockMetadata = {
      type: file.name.includes('EIN') ? 'EIN' : file.name.includes('insurance') ? 'Insurance' : 'Document',
      issuer: file.name.includes('EIN') ? 'IRS' : file.name.includes('insurance') ? 'Insurance Co' : 'Unknown',
      effective: new Date().toISOString().split('T')[0],
      expiration: null,
      extracted_data: {
        document_type: 'Business Document',
        confidence: 0.92
      }
    };
    
    setPendingUpload({ file, metadata: mockMetadata });
    setShowUploadModal(true);
  }, []);

  const acceptUpload = useCallback(async () => {
    if (!pendingUpload) return;
    
    const newUpload = {
      id: `upload-${Date.now()}`,
      file: pendingUpload.file.name,
      type: pendingUpload.metadata.type,
      issuer: pendingUpload.metadata.issuer,
      effective: pendingUpload.metadata.effective,
      expiration: pendingUpload.metadata.expiration,
      status: 'active',
      extracted_metadata: pendingUpload.metadata.extracted_data
    };
    
    const currentUploads = data?.uploads || [];
    const updatedUploads = [...currentUploads, newUpload];
    updateLocal('uploads', updatedUploads);
    
    // Update completeness
    const newCompleteness = Math.min(1.0, (data?.completeness?.percent || 0.84) + 0.02);
    updateLocal('completeness.percent', newCompleteness);
    
    setShowUploadModal(false);
    setPendingUpload(null);
    setDraggedFiles([]);
    
    await saveFieldDebounced('uploads', updatedUploads);
  }, [pendingUpload, data, saveFieldDebounced]);

  const rejectUpload = useCallback(() => {
    setShowUploadModal(false);
    setPendingUpload(null);
    setDraggedFiles([]);
  }, []);

  const kpis: KPI[] = useMemo(() => (data?.kpis ?? STUB.kpis), [data]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Business Profile</h1>
          <div className="text-sm text-gray-500 mt-1">Manage company details, industry, operations, financials, assets, and risk.</div>
        </div>
        <div className="text-right">
          <div className="text-sm">{data?._meta?.source && <span className="px-2 py-1 bg-slate-100 rounded">Source: {data._meta.source}</span>}</div>
          <div className="text-xs text-gray-500 mt-2">{savedAt ? `Saved ✓ ${savedAt}` : "Not saved"}</div>
        </div>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.id} className="p-4 rounded-xl border bg-white">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="mt-1 text-xl font-semibold">{k.formatted ?? (typeof k.value === 'number' ? formatPercent(k.value) : k.value ?? '—')}</div>
          </div>
        ))}
      </section>

      {/* Sticky sub-nav */}
      <nav className="sticky top-16 bg-slate-50 py-2 px-2 z-10">
        <div className="flex gap-2 overflow-x-auto text-sm">
          {[
            ["general","General Company"],
            ["industry","Industry"],
            ["operations","Operations"],
            ["financial","Financial"],
            ["assets","Assets"],
            ["customers","Customers & Market"],
            ["risk","Risk"],
            ["objectives","Objectives"],
            ["uploads","Uploads"],
            ["completeness","Completeness"],
          ].map(([id,label]) => (
            <a key={id as string} href={`#${id}`} onClick={() => setActiveSection(id as string)} className={`px-3 py-2 rounded-md ${activeSection===id? 'bg-white border':'hover:bg-white/60'}`}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections */}
      <div id="general" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">General Company Information</h2>
            <div className="text-sm text-gray-500">🏢 🧭</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">Business Name *</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" value={data?.general?.name ?? ""} onChange={(e)=> updateLocal('general.name', e.target.value)} onBlur={(e)=> saveFieldDebounced('general.name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Legal Entity Type</label>
              <select className="w-full mt-1 px-3 py-2 border rounded" value={data?.general?.entity_type ?? ''} onChange={(e)=> updateLocal('general.entity_type', e.target.value)} onBlur={(e)=> saveFieldDebounced('general.entity_type', e.target.value)}>
                <option value="LLC">LLC</option>
                <option value="S-Corp">S-Corp</option>
                <option value="C-Corp">C-Corp</option>
                <option value="Sole Prop">Sole Prop</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">EIN / Registration</label>
              <div className="mt-1 px-3 py-2 border rounded bg-slate-50">{data?.general?.ein_masked ?? '—'}</div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Timezone *</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" value={data?.general?.timezone ?? ''} onChange={(e)=> updateLocal('general.timezone', e.target.value)} onBlur={(e)=> saveFieldDebounced('general.timezone', e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-gray-600">Currency *</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" value={data?.general?.currency ?? ''} onChange={(e)=> updateLocal('general.currency', e.target.value)} onBlur={(e)=> saveFieldDebounced('general.currency', e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-gray-600">Founded Date</label>
              <input type="date" className="w-full mt-1 px-3 py-2 border rounded" value={data?.general?.founded ?? ''} onChange={(e)=> updateLocal('general.founded', e.target.value)} onBlur={(e)=> saveFieldDebounced('general.founded', e.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold">Locations</h3>
            <div className="mt-2 space-y-2">
              {(data?.general?.locations ?? []).map((loc: any, idx: number) => (
                <div key={loc.id ?? idx} className="flex gap-2 items-center">
                  <input className="flex-1 px-3 py-2 border rounded" value={loc.address ?? ''} onChange={(e)=> {
                    const arr = (data.general.locations || []).slice(); arr[idx] = { ...(arr[idx]||{}), address: e.target.value }; updateLocal('general.locations', arr);
                  }} onBlur={(e)=> saveFieldDebounced(`general.locations.${idx}`, (data.general.locations || [])[idx])} />
                  <button onClick={() => { const arr = (data.general.locations||[]).slice(); arr.splice(idx,1); updateLocal('general.locations', arr); saveFieldDebounced('general.locations', arr);} } className="px-2 py-1 border rounded text-sm">Remove</button>
                </div>
              ))}
              <div>
                <button onClick={() => { const arr = (data.general.locations||[]).slice(); arr.push({ id: `loc-${Date.now()}`, label: 'New', address: '', timezone: data.general.timezone }); updateLocal('general.locations', arr); saveFieldDebounced('general.locations', arr);} } className="px-3 py-2 rounded border">Add Location</button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold">Owners</h3>
            <div className="mt-2 space-y-2">
              {(data?.general?.owners ?? []).map((o: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input className="flex-1 px-3 py-2 border rounded" value={o.name ?? ''} onChange={(e)=> { const arr = (data.general.owners||[]).slice(); arr[idx] = { ...(arr[idx]||{}), name: e.target.value }; updateLocal('general.owners', arr);} } onBlur={(e)=> saveFieldDebounced(`general.owners.${idx}`, (data.general.owners||[])[idx])} />
                  <input type="number" className="w-28 px-3 py-2 border rounded" value={o.percent ?? ''} onChange={(e)=> { const arr = (data.general.owners||[]).slice(); arr[idx] = { ...(arr[idx]||{}), percent: Number(e.target.value) }; updateLocal('general.owners', arr);} } onBlur={(e)=> saveFieldDebounced(`general.owners.${idx}`, (data.general.owners||[])[idx])} />
                  <button onClick={() => { const arr = (data.general.owners||[]).slice(); arr.splice(idx,1); updateLocal('general.owners', arr); saveFieldDebounced('general.owners', arr);} } className="px-2 py-1 border rounded text-sm">Remove</button>
                </div>
              ))}
              <div>
                <button onClick={() => { const arr = (data.general.owners||[]).slice(); arr.push({ name: '', percent: 0 }); updateLocal('general.owners', arr); saveFieldDebounced('general.owners', arr);} } className="px-3 py-2 rounded border">Add Owner</button>
              </div>
            </div>
          </div>

        </section>
      </div>

      {/* Industry */}
      <div id="industry" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Industry Classification</h2>
            <div className="text-sm text-gray-500">🏭 📊</div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">NAICS Code</label>
              <div className="relative">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 mt-1 px-3 py-2 border rounded" 
                    value={data?.industry?.naics?.code ?? ''} 
                    onChange={(e) => {
                      updateLocal('industry.naics.code', e.target.value);
                      searchNaics(e.target.value);
                    }} 
                    onBlur={(e) => saveFieldDebounced('industry.naics.code', e.target.value)}
                    onFocus={() => {
                      if (naicsResults.length > 0) setShowNaicsDropdown(true);
                    }}
                  />
                  <button 
                    onClick={() => searchNaics(data?.industry?.naics?.code ?? '')} 
                    className="px-3 py-2 border rounded hover:bg-gray-50"
                  >
                    Search NAICS
                  </button>
                </div>
                
                {/* NAICS Dropdown */}
                {showNaicsDropdown && naicsResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {naicsResults.map((result) => (
                      <div
                        key={result.code}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectNaics(result)}
                      >
                        <div className="font-medium">{result.code} - {result.title}</div>
                        {result.sector && (
                          <div className="text-sm text-gray-500">{result.sector} → {result.subsector}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Benchmark source: <span className="px-2 py-1 bg-slate-100 rounded">{data?.industry?.benchmark_set ?? '—'}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Business Model</label>
              <select className="w-full mt-1 px-3 py-2 border rounded" value={data?.industry?.business_model ?? ''} onChange={(e)=> { updateLocal('industry.business_model', e.target.value); saveFieldDebounced('industry.business_model', e.target.value); }}>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Categories (comma separated)</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" value={(data?.industry?.categories || []).join(', ')} onChange={(e)=> updateLocal('industry.categories', e.target.value.split(',').map((s:string)=>s.trim()))} onBlur={(e)=> saveFieldDebounced('industry.categories', (data?.industry?.categories||[]))} />
            </div>

          </div>
        </section>
      </div>

      {/* Operations */}
      <div id="operations" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Operational Overview</h2>
            <div className="text-sm text-gray-500">⚙️ 🚛</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-600">Employees (FTE)</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border rounded" value={data?.operations?.employees_fte ?? ''} onChange={(e)=> updateLocal('operations.employees_fte', Number(e.target.value))} onBlur={(e)=> saveFieldDebounced('operations.employees_fte', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Primary Locations</label>
              <div className="mt-1 px-3 py-2 border rounded bg-slate-50">{(data?.general?.locations || []).map((l:any)=> l.label || l.address).join(', ') || '—'}</div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Hours</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" value={data?.operations?.hours ?? ''} onChange={(e)=> updateLocal('operations.hours', e.target.value)} onBlur={(e)=> saveFieldDebounced('operations.hours', e.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold">Major recurring expenses</h3>
            <ul className="mt-2 space-y-2">
              {(data?.operations?.major_recurring || []).map((m:any, i:number)=> (
                <li key={i} className="flex items-center gap-2">
                  <div className="flex-1">{m.name}</div>
                  <div className="w-28 text-right">${m.amount?.toLocaleString?.() ?? m.amount ?? '—'}</div>
                </li>
              ))}
            </ul>
            <div className="mt-2"><button onClick={()=> { const arr = (data.operations.major_recurring||[]).slice(); arr.push({ name: 'New', amount: 0 }); updateLocal('operations.major_recurring', arr); saveFieldDebounced('operations.major_recurring', arr);} } className="px-3 py-2 border rounded">Add Expense</button></div>
          </div>
        </section>
      </div>

      {/* Financial */}
      <div id="financial" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Financial Summary</h2>
            <div className="text-sm text-gray-500">💰 📈</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">Accounting System</label>
              <input className="w-full mt-1 px-3 py-2 border rounded" value={data?.financial?.accounting_system ?? ''} onChange={(e)=> updateLocal('financial.accounting_system', e.target.value)} onBlur={(e)=> saveFieldDebounced('financial.accounting_system', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Avg Monthly Revenue</label>
              <div className="mt-1 px-3 py-2 border rounded bg-slate-50">${data?.financial?.avg_monthly_revenue?.toLocaleString?.() ?? '—'}</div>
            </div>
          </div>

          <div className="mt-4"><button onClick={async ()=> { setLoading(true); try { await callIntent('financial_overview', { action: 'refresh' }, 'demo'); const fresh = await fetchProfile('demo'); setData(fresh); } catch {} finally { setLoading(false); } }} className="px-3 py-2 border rounded">Refresh from Accounting</button></div>
        </section>
      </div>

      {/* Assets */}
      <div id="assets" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assets & Equipment</h2>
            <div className="text-sm text-gray-500">🚚 🏗️</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Purchase</th>
                  <th className="px-2 py-2">Cost</th>
                  <th className="px-2 py-2">Book</th>
                  <th className="px-2 py-2">Depreciation</th>
                  <th className="px-2 py-2">Maintenance</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.assets||[]).map((a:any)=> (
                  <tr key={a.id} className="bg-white border-b">
                    <td className="px-2 py-2">{a.type}</td>
                    <td className="px-2 py-2">{a.name}</td>
                    <td className="px-2 py-2">{a.purchase_date}</td>
                    <td className="px-2 py-2">${a.cost?.toLocaleString?.() ?? a.cost}</td>
                    <td className="px-2 py-2">${a.book_value?.toLocaleString?.() ?? a.book_value}</td>
                    <td className="px-2 py-2">{a.depr_method} / {a.schedule}</td>
                    <td className="px-2 py-2">{a.maintenance_status}</td>
                    <td className="px-2 py-2"><a href={`/assets?id=${encodeURIComponent(a.id)}`} className="text-blue-600 hover:underline">Open in Asset Management</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex gap-2">
            <button onClick={()=> { const arr = (data.assets||[]).slice(); arr.push({ id: `asset-${Date.now()}`, type: 'Equipment', name: 'New', purchase_date: '', cost: 0, book_value: 0, depr_method: 'SL', schedule: '36m', maintenance_status: 'Unknown' }); updateLocal('assets', arr); saveFieldDebounced('assets', arr);} } className="px-3 py-2 border rounded">Add Asset</button>
            <button className="px-3 py-2 border rounded">Import CSV</button>
          </div>
        </section>
      </div>

      {/* Customers */}
      <div id="customers" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Customer & Market Data</h2>
            <div className="text-sm text-gray-500">👥 🛒</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-600">Consumer %</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border rounded" value={data?.customers?.mix?.consumer_pct ?? ''} onChange={(e)=> updateLocal('customers.mix.consumer_pct', Number(e.target.value))} onBlur={(e)=> saveFieldDebounced('customers.mix.consumer_pct', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Business %</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border rounded" value={data?.customers?.mix?.business_pct ?? ''} onChange={(e)=> updateLocal('customers.mix.business_pct', Number(e.target.value))} onBlur={(e)=> saveFieldDebounced('customers.mix.business_pct', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Monthly Volume</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border rounded" value={data?.customers?.monthly_volume ?? ''} onChange={(e)=> updateLocal('customers.monthly_volume', Number(e.target.value))} onBlur={(e)=> saveFieldDebounced('customers.monthly_volume', Number(e.target.value))} />
            </div>
          </div>
        </section>
      </div>

      {/* Risk */}
      <div id="risk" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Risk & Exposure Data</h2>
            <div className="text-sm text-gray-500">⚠️ 🧭</div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-600">Insurance</label>
            <div className="mt-1 px-3 py-2 border rounded bg-slate-50">{data?.risk?.insurance?.carrier ?? '—'} · {data?.risk?.insurance?.policy ?? ''}</div>
          </div>

          <div className="mt-2">
            <label className="text-xs text-gray-600">Debt obligations</label>
            <div className="mt-1"><a href="/debt" className="text-blue-600 hover:underline">View Debt tab ({data?.risk?.debt_links?.[0]?.summary ?? '—'})</a></div>
          </div>
        </section>
      </div>

      {/* Objectives */}
      <div id="objectives" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Strategic Objectives</h2>
            <div className="text-sm text-gray-500">🎯 🪜</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea className="md:col-span-3 w-full p-3 border rounded" value={data?.objectives?.short_term ?? ''} onChange={(e)=> updateLocal('objectives.short_term', e.target.value)} onBlur={(e)=> saveFieldDebounced('objectives.short_term', e.target.value)} />
            <textarea className="md:col-span-3 w-full p-3 border rounded" value={data?.objectives?.mid_term ?? ''} onChange={(e)=> updateLocal('objectives.mid_term', e.target.value)} onBlur={(e)=> saveFieldDebounced('objectives.mid_term', e.target.value)} />
            <textarea className="md:col-span-3 w-full p-3 border rounded" value={data?.objectives?.long_term ?? ''} onChange={(e)=> updateLocal('objectives.long_term', e.target.value)} onBlur={(e)=> saveFieldDebounced('objectives.long_term', e.target.value)} />
          </div>
        </section>
      </div>

      {/* Uploads */}
      <div id="uploads" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Uploads & Documentation</h2>
            <div className="text-sm text-gray-500">📁 🧾</div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-600">Upload files</label>
            <div 
              className="mt-2 p-8 border-2 border-dashed rounded-lg text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="text-gray-600">
                <div className="text-lg mb-2">📁</div>
                <div>Drag & drop files here or click to browse</div>
                <div className="text-sm text-gray-500 mt-1">Supports PDF, DOC, images</div>
              </div>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setDraggedFiles(files);
                    simulateMetadataExtraction(files[0]);
                  }
                }}
              />
            </div>

            {/* Upload Modal */}
            {showUploadModal && pendingUpload && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Extracted Metadata</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">File</label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 rounded">{pendingUpload.file.name}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Type</label>
                      <input 
                        className="w-full mt-1 px-3 py-2 border rounded" 
                        value={pendingUpload.metadata.type}
                        onChange={(e) => setPendingUpload(prev => prev ? {
                          ...prev, 
                          metadata: { ...prev.metadata, type: e.target.value }
                        } : null)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Issuer</label>
                      <input 
                        className="w-full mt-1 px-3 py-2 border rounded" 
                        value={pendingUpload.metadata.issuer}
                        onChange={(e) => setPendingUpload(prev => prev ? {
                          ...prev, 
                          metadata: { ...prev.metadata, issuer: e.target.value }
                        } : null)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Effective Date</label>
                      <input 
                        type="date"
                        className="w-full mt-1 px-3 py-2 border rounded" 
                        value={pendingUpload.metadata.effective}
                        onChange={(e) => setPendingUpload(prev => prev ? {
                          ...prev, 
                          metadata: { ...prev.metadata, effective: e.target.value }
                        } : null)}
                      />
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      Confidence: {(pendingUpload.metadata.extracted_data?.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={acceptUpload}
                      className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={rejectUpload}
                      className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500"><th className="px-2 py-2">File</th><th className="px-2 py-2">Type</th><th className="px-2 py-2">Issuer</th><th className="px-2 py-2">Effective</th><th className="px-2 py-2">Expiration</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Actions</th></tr>
                </thead>
                <tbody>
                  {(data?.uploads||[]).map((u:any)=> (
                    <tr key={u.id} className="bg-white border-b">
                      <td className="px-2 py-2">{u.file}</td>
                      <td className="px-2 py-2">{u.type}</td>
                      <td className="px-2 py-2">{u.issuer}</td>
                      <td className="px-2 py-2">{u.effective}</td>
                      <td className="px-2 py-2">{u.expiration ?? '—'}</td>
                      <td className="px-2 py-2">{u.status}</td>
                      <td className="px-2 py-2"> <button className="text-sm px-2 py-1 border rounded">Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Completeness */}
      <div id="completeness" className="space-y-3">
        <section className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Profile Completeness Meter</h2>
            <div className="text-sm text-gray-500">📊 ✅</div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Profile Completion</div>
              <div className="text-sm text-gray-600">
                {Math.round((data?.completeness?.percent ?? STUB.completeness.percent) * 100)}% complete
              </div>
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out" 
                style={{ width: `${(data?.completeness?.percent ?? STUB.completeness.percent) * 100}%` }} 
              />
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Incomplete Items</div>
              <div className="space-y-2">
                {(data?.completeness?.missing || STUB.completeness.missing).map((m: any, i: number) => {
                  const sectionId = m.section.toLowerCase().replace(/[^a-z]/g, '');
                  const isCurrentSection = activeSection === sectionId;
                  
                  return (
                    <div key={i} className={`flex items-center justify-between p-2 rounded ${isCurrentSection ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                      <div>
                        <div className="text-sm font-medium">{m.section}</div>
                        <div className="text-xs text-gray-600">{m.item}</div>
                      </div>
                      <a 
                        href={`#${sectionId}`} 
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveSection(sectionId);
                          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-blue-600 hover:underline text-sm px-2 py-1 rounded hover:bg-blue-100"
                      >
                        Go to section →
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {data?._meta && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">AI Analysis</div>
                <div className="text-sm">
                  Profile {Math.round((data.completeness?.percent ?? 0.84) * 100)}% complete — 
                  {data.completeness?.missing?.length === 0 
                    ? " all sections complete! Your profile provides maximum accuracy for insights and benchmarking." 
                    : ` adding ${data.completeness.missing?.length} missing items improves scenario accuracy and benchmarking confidence.`
                  }
                </div>
                {data._meta.confidence && (
                  <div className="mt-2 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      Confidence: {data._meta.confidence}
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>

        </section>
      </div>

      {loading && <div className="fixed inset-0 bg-black/5 pointer-events-none" />}
    </div>
  );
}
