"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";

type Company = { company_id: string; name: string };

type CompanyContextShape = {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string) => void;
  user: any | null | undefined;
  loading: boolean;
};

const CompanyContext = createContext<CompanyContextShape | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_ORIGIN}/auth/session`, { credentials: "include" });
        if (!mounted) return;
        if (resp.ok) {
          const json = await resp.json();
          const ses = json.user ?? json;
          setUser(ses);

          // Normalize companies list from session. Try common shapes.
          const maybeCompanies = (ses && (ses.companies || ses.organizations || ses.accounts)) || [];
          const mapped: Company[] = Array.isArray(maybeCompanies)
            ? maybeCompanies.map((c: any) => ({ company_id: c.company_id || c.id || c.companyId || String(c), name: c.name || c.company_name || c.label || String(c.company_id || c.id || c) }))
            : [];
          setCompanies(mapped);

          // active company: check session fields then fallback to first company
          const act = ses.active_company_id || ses.activeCompanyId || ses.company_id || (mapped[0] && mapped[0].company_id) || null;
          setActiveCompanyIdState(act);
        } else {
          setUser(null);
          setCompanies([]);
          setActiveCompanyIdState(null);
        }
      } catch (e) {
        setUser(null);
        setCompanies([]);
        setActiveCompanyIdState(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function setActiveCompanyId(id: string) {
    // update locally and refresh pages so server/client data re-fetches
    setActiveCompanyIdState(id);
    try {
      localStorage.setItem('active_company_id', id);
    } catch (_) {}
    // try best-effort to inform backend: POST to /auth/set-company if available
    (async () => {
      try {
        await fetch('/auth/set-company', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: id }), credentials: 'include' });
      } catch (_) {}
      // refresh to re-run server components
      router.refresh();
    })();
  }

  return (
    <CompanyContext.Provider value={{ companies, activeCompanyId, setActiveCompanyId, user, loading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside CompanyProvider');
  return ctx;
}
