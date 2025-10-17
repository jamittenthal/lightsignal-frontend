// app/overview/page.tsx
import { getFinancialOverview } from "@/lib/api";

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function Overview() {
  const data = await getFinancialOverview("demo"); // uses live if available, else stubs

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Financial Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Revenue (MTD)" value={usd(data.revenue_mtd)} />
        <Metric label="Revenue (YTD)" value={usd(data.revenue_ytd)} />
        <Metric label="Gross Margin" value={`${data.gross_margin_pct}%`} />
        <Metric label="Cash Runway" value={`${data.cash_runway_months} mo`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
