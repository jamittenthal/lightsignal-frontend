export type DemoProfile = {
  company_id: string;
  name: string;
  naics: string;
  region: string;
  employees: number;
  fiscal_year_end: string;
  today: string;
};

export type PLRow = { month: string; revenue: number; cogs: number; opex: number; other: number };
export type BS = { cash: number; receivables: number; inventory: number; current_liab: number; debt: number; equity: number };
export type CF = { operating: number; investing: number; financing: number };

export async function getFinancials(companyId = "demo") {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/finance/get_financials?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`get_financials failed: ${r.status}`);
  return r.json() as Promise<{ profile: DemoProfile; pl: PLRow[]; bs: BS; cf: CF }>;
}

export async function getBenchmarks(companyId = "demo") {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/finance/benchmarks?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`benchmarks failed: ${r.status}`);
  return r.json() as Promise<{ profile: DemoProfile; benchmarks: { metric: string; peer_median: number; peer_top_quartile: number }[] }>;
}

export async function computeKpis(companyId = "demo") {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const r = await fetch(`${base}/api/finance/compute_kpis?company_id=${encodeURIComponent(companyId)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`compute_kpis failed: ${r.status}`);
  return r.json() as Promise<{ profile: DemoProfile; kpis: Record<string, number> }>;
}
