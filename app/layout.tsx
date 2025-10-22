// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { ToastProvider } from "../components/ui/ToastProvider";

export const metadata = { title: "LightSignal" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <ToastProvider>
          <header className="border-b bg-white">
            <nav className="mx-auto max-w-5xl flex items-center gap-6 p-4">
              <Link href="/" className="font-semibold">LightSignal</Link>
              <Link href="/overview">Overview</Link>
              <Link href="/opportunities">Opportunities</Link>
              <Link href="/health">Business Health</Link>
              <Link href="/fraud-compliance">Fraud & Compliance</Link>
              <Link href="/tax">Tax Optimization</Link>
              <Link href="/demand">Demand Forecasting</Link>
              <Link href="/debt">Debt Management Advisor</Link>
              <Link href="/inventory">Inventory & Multi-Location</Link>
              <Link href="/payroll">Payroll & Hiring</Link>
              <Link href="/scenarios">Scenario Planning Lab</Link>
              <Link href="/insights">Insights</Link>
              <Link href="/reviews">Customer Reviews & Reputation Intelligence</Link>
              <Link href="/assets">Asset Management</Link>
              <Link href="/settings">Settings</Link>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
