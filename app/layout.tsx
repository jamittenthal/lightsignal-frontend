import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">LightSignal</h1>
            <nav className="space-x-4 text-sm">
              <a href="/" className="hover:underline">Dashboard</a>
              <a href="/overview" className="hover:underline">Financial Overview</a>
              <a href="/scenarios" className="hover:underline">Scenario Lab</a>
              <a href="/insights" className="hover:underline">Insights</a>
              <a href="/settings" className="hover:underline">Settings</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
