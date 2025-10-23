"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const router = useRouter();

  async function submit(e: any) {
    e.preventDefault();
    if (!agree) return alert("You must agree to Terms");
    try {
      const resp = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      if (!resp.ok) throw new Error("Signup failed");
      
      // Check for redirect URL in query params
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/overview';
      router.push(redirectTo);
    } catch (err: any) {
      alert(err?.message || "Signup failed");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 border rounded" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 border rounded" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree to Terms</label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded bg-black text-white">Create account</button>
        </div>
      </form>
    </div>
  );
}
