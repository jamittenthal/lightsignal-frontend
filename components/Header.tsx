"use client";

import React, { useEffect, useState } from "react";
import PrefixedLink from "./PrefixedLink";
import { useRouter } from "next/navigation";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";

export default function Header() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const resp = await fetch(`${API_ORIGIN}/auth/session`, { credentials: "include" });
        if (!mounted) return;
        if (resp.ok) {
          const json = await resp.json();
          setUser(json.user ?? json);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // client-side detection of demo prefix
    try {
      const p = window.location?.pathname || '';
      setIsDemo(p.startsWith('/demo'));
    } catch (e) {
      setIsDemo(false);
    }
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${API_ORIGIN}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    // best-effort navigate to /login
    router.push("/login");
  }

  // helper to prefix demo path when in demo mode
  const prefix = (p: string) => (isDemo ? `/demo${p.startsWith('/') ? p : `/${p}`}` : p);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto max-w-5xl flex items-center justify-between gap-6 p-4">
        <div className="flex items-center gap-6">
          <PrefixedLink href="/" className="font-semibold">LightSignal</PrefixedLink>
          <PrefixedLink href="/overview">Overview</PrefixedLink>
          <PrefixedLink href="/opportunities">Opportunities</PrefixedLink>
          <PrefixedLink href="/health">Business Health</PrefixedLink>
          <PrefixedLink href="/demand">Demand</PrefixedLink>
        </div>

        <div className="flex items-center gap-3">
          {isDemo && (
            <div className="flex items-center gap-2">
              <div className="text-xs p-2 bg-amber-50 border rounded-full">Demo Mode — sample data</div>
              <button onClick={() => router.push('/login')} className="px-3 py-1 rounded border text-sm">Switch to Real Account</button>
            </div>
          )}

          {!loading && !user && !isDemo && (
            <>
              <PrefixedLink href="/demo" className="px-3 py-1 rounded border">Try Demo</PrefixedLink>
              <PrefixedLink href="/login" className="px-3 py-1">Log in</PrefixedLink>
              <PrefixedLink href="/signup" className="px-3 py-1 rounded bg-black text-white">Sign up</PrefixedLink>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{user?.name ?? user?.email ?? "User"}</span>
              <PrefixedLink href="/profile" className="text-sm">Profile</PrefixedLink>
              <button onClick={handleLogout} className="text-sm">Logout</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
