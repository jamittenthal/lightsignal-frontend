import DebtClient from "./DebtClient";

export const metadata = { title: "Debt Management Advisor" };

export default async function DebtPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Debt Management Advisor</h1>
        <p className="text-sm text-slate-600">Analyze debt, optimize financing, and simulate payoff scenarios.</p>
      </header>

      <DebtClient />
    </div>
  );
}
