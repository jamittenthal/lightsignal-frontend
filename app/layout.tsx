// app/layout.tsx
import React from "react";
import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";
import Header from "../components/Header";

export const metadata = { title: "LightSignal" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Keep layout as a server component; Header is a client component that checks session.
  // We render children directly; pages that need protection should use AuthGate.
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <ToastProvider>
          <Header />
          <main className="mx-auto max-w-5xl py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
