// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = { title: "LightSignal" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl flex items-center gap-6 p-4">
            <Link href="/" className="font-semibold">LightSignal</Link>
            <Link href="/overview">Overview</Link>
            <Link href="/opportunities">Opportunities</Link>
            <Link href="/payroll">Payroll & Hiring</Link>
            <Link href="/scenarios">Scenario Planning Lab</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl py-8">{children}</main>
      </body>
    </html>
  );
}
