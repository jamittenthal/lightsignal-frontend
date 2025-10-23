"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";

export default function Header() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  async function handleLogout() {
    try {
      await fetch(`${API_ORIGIN}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    // best-effort navigate to /login
    router.push("/login");
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
