"use client";

import React from "react";
import Link from "next/link";

export default function Landing() {
  return (
    <div className="p-8">
      <section className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold">LightSignal — Small business AI assistant</h1>
        <p className="text-gray-600">Analyze finances, forecast cash, and get smart recommendations for your business.</p>
        <div className="flex justify-center gap-4">
          <Link href="/demo" className="px-5 py-3 rounded bg-black text-white">Try Demo</Link>
          <Link href="/login" className="px-5 py-3 rounded border">Log in</Link>
          <Link href="/signup" className="px-5 py-3 rounded bg-white border">Sign up</Link>
        </div>
      </section>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <a href="/legal/privacy">Privacy</a> · <a href="/legal/terms">Terms</a> · <a href="/legal/contact">Contact</a>
      </footer>
    </div>
  );
}

/* NOTE: The previous file contained the Dashboard client component. It has been moved to app/demo/page.tsx to be used for demo mode and kept as-is. */
/* cleaned landing page — dashboard moved to /app/demo */

