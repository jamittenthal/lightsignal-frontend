import AssetsClient from "./AssetsClient";

export default async function AssetsPage() {
  // Server component: render client which will fetch data
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Asset Management</h1>
        <p className="text-sm text-slate-600">Unified asset registry, maintenance, telemetry, valuation, and compliance.</p>
      </header>

      <div className="rounded-2xl border bg-white p-4">
        {/* AssetsClient handles fetching and interactive UI */}
        <AssetsClient />
      </div>
    </div>
  );
}
