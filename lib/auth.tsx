"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "";

export function useSession() {
  const [user, setUser] = useState<any | undefined>();
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/auth/session`, { credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setUser(json.user ?? json);
        } else {
          setUser(null);
        }
      } catch (e) {
        if (!mounted) return;
        setUser(null);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return user;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const router = useRouter();

  // while undefined -> loading; null -> not logged in
  useEffect(() => {
    if (user === null) {
      // If this is the demo shell, do not force redirect; demo should be public
      try {
        const p = window.location?.pathname || '';
        if (p.startsWith('/demo')) {
          // allow unauthenticated demo access
          return;
        }
      } catch (e) {
        // ignore
      }
      router.replace('/login');
    }
  }, [user, router]);

  if (user === undefined) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (user === null) return null; // redirecting
  return <>{children}</>;
}
