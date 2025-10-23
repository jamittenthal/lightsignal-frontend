"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) throw new Error("Login failed");
      
      // Check for redirect URL in query params
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/overview';
      router.push(redirectTo);
    } catch (err: any) {
      alert(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 border rounded" />
        <div className="flex justify-between items-center">
          <a href="/signup" className="text-sm">Sign up</a>
          <a href="/legal/forgot-password" className="text-sm">Forgot password</a>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded bg-black text-white">Log in</button>
          <a href={`${API}/auth/google`} className="px-4 py-2 rounded border">Continue with Google</a>
        </div>
      </form>
    </div>
  );
}
