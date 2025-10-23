"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompany } from "./CompanyProvider";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";

export default function Header() {
  const { user, loading, companies, activeCompanyId, setActiveCompanyId } = useCompany();
  const [orgOpen, setOrgOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      // call backend via /auth/logout; header route also supports server-side
      await fetch(`${API_ORIGIN}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    // clear local active company
    try { localStorage.removeItem('active_company_id'); } catch (_) {}
    router.push('/login');
  }

  function onSwitchCompany(id: string) {
    setOrgOpen(false);
    setActiveCompanyId(id);
  }

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto max-w-5xl flex items-center justify-between gap-6 p-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">LightSignal</Link>
          <Link href="/overview">Overview</Link>
          <Link href="/opportunities">Opportunities</Link>
          <Link href="/health">Business Health</Link>
          <Link href="/demand">Demand</Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Org switcher: hidden if only one org */}
          {!loading && user && companies && companies.length > 1 && (
            <div className="relative">
              <button onClick={() => setOrgOpen((s) => !s)} className="px-3 py-1 border rounded flex items-center gap-2">
                <span className="text-sm">{(companies.find(c => c.company_id === activeCompanyId)?.name) || 'Select org'}</span>
                <span className="text-xs">▾</span>
              </button>
              {orgOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-40">
                  {companies.map((c) => (
                    <div key={c.company_id} className="p-2 hover:bg-slate-50 cursor-pointer" onClick={() => onSwitchCompany(c.company_id)}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !user && (
            <>
              <Link href="/demo" className="px-3 py-1 rounded border">Try Demo</Link>
              <Link href="/login" className="px-3 py-1">Log in</Link>
              <Link href="/signup" className="px-3 py-1 rounded bg-black text-white">Sign up</Link>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{user?.name ?? user?.email ?? "User"}</span>
              <Link href="/profile" className="text-sm">Profile</Link>
              <button onClick={handleLogout} className="text-sm">Logout</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
