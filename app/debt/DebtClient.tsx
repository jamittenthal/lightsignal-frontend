"use client";
import React, { useEffect, useState } from "react";
import KpiCard from "../../components/KpiCard";
import { ProvenanceBadge } from "../../components/ProvenanceBadge";
import { BACKEND_URL, callIntent } from "../../lib/api";
import ExportButtons from "./ExportButtons";
import Simulator from "./Simulator";
import { DonutChart, TrendChart, PaymentTimeline, AmortizationChart } from './components/DebtCharts';
import { DebtChatbot } from './components/DebtChatbot';

const STUB = {
	"kpis": [
		{ "id": "total_debt", "label": "Total Outstanding Debt", "value": 186400, "formatted": "$186,400", "accounts": 4, "state": "caution" },
		{ "id": "monthly_payments", "label": "Monthly Debt Payments", "value": 6200, "formatted": "$6,200", "state": "caution" },
		{ "id": "avg_rate", "label": "Average Interest Rate (Weighted)", "value": 0.068, "formatted": "6.8%", "state": "stable" },
		{ "id": "dti", "label": "Debt-to-Income Ratio (DTI)", "value": 0.42, "formatted": "42%", "state": "caution" },
		{ "id": "dscr", "label": "Debt Service Coverage Ratio (DSCR)", "value": 1.7, "formatted": "1.7×", "state": "good" },
		{ "id": "credit_util", "label": "Credit Utilization", "value": 0.48, "formatted": "48%", "state": "caution" },
		{ "id": "opt_potential", "label": "AI Optimization Potential", "value": 4900, "formatted": "$4,900/yr", "state": "good" }
	],
	"accounts": [
		{ "id": "eqp-001", "type": "equipment_loan", "lender": "CAT Financial", "original_balance": 82000, "current_balance": 57400, "rate_pct": 9.2, "term_months_remaining": 24, "payment_monthly": 2280, "next_due_date": "2025-11-05", "auto_debit": true },
		{ "id": "card-amex", "type": "credit_card", "lender": "American Express", "limit": 40000, "balance": 19200, "apr_pct": 14.5, "payment_monthly": 620, "next_due_date": "2025-10-28", "auto_debit": false, "age_months": 36 },
		{ "id": "loc-boa", "type": "loc", "lender": "BofA LOC", "limit": 60000, "balance": 9600, "apr_pct": 9.3, "payment_monthly": 310, "next_due_date": "2025-10-29", "auto_debit": true },
		{ "id": "veh-012", "type": "vehicle_loan", "lender": "Ford Credit", "original_balance": 52000, "current_balance": 40300, "rate_pct": 6.1, "term_months_remaining": 19, "payment_monthly": 2990, "next_due_date": "2025-11-02", "auto_debit": true, "balloon_payment": 22000, "balloon_due_months": 7 }
	],
	"charts": {
		"balance_by_type": [
			{ "type": "equipment_loan", "value": 57400 },
			{ "type": "credit_card", "value": 19200 },
			{ "type": "loc", "value": 9600 },
			{ "type": "vehicle_loan", "value": 40300 }
		],
		"balance_trend": [
			{ "month": "2025-07", "total": 198300 },
			{ "month": "2025-08", "total": 193800 },
			{ "month": "2025-09", "total": 189100 },
			{ "month": "2025-10", "total": 186400 }
		],
		"payments_timeline": [
			{ "date": "2025-10-28", "amount": 620, "account_id": "card-amex" },
			{ "date": "2025-10-29", "amount": 310, "account_id": "loc-boa" },
			{ "date": "2025-11-02", "amount": 2990, "account_id": "veh-012" },
			{ "date": "2025-11-05", "amount": 2280, "account_id": "eqp-001" }
		]
	},
	"utilization": {
		"total_limit": 100000,
		"total_revolving_balance": 28800,
		"utilization_pct": 0.288
	},
	"optimization": [
		{ "id": "refi-eqp", "type": "refinance", "target_account": "eqp-001", "from_rate_pct": 9.2, "to_rate_pct": 7.1, "est_annual_savings": 1200, "feasibility": "medium" },
		{ "id": "avalanche", "type": "payoff_strategy", "method": "avalanche", "est_interest_saved": 2400, "months_earlier": 4 },
		{ "id": "util-30", "type": "utilization", "action": "pay_down", "account_id": "loc-boa", "target_util_pct": 0.30, "credit_score_gain_est": 15 }
	],
	"scenarios": [
		{ "id": "extra_500", "name": "Add $500/month extra principal", "interest_saved": 2740, "months_earlier": 5, "new_monthly": 6700 },
		{ "id": "biweekly", "name": "Switch to biweekly payments", "interest_saved": 600, "months_earlier": 3 }
	],
	"risk": {
		"summary": "Low overall. Variable LOC rate reset expected in April (+0.5% est). Balloon payment in 7 months.",
		"alerts": [
			{ "id": "balloon", "severity": "warning", "text": "Vehicle loan balloon $22k due in 7 months.", "cta": "Simulate refinance" },
			{ "id": "reset", "severity": "info", "text": "LOC rate reset expected April.", "cta": "Lock fixed rate" }
		]
	},
	"credit_score": { "score": 79, "scale": "D&B/Experian (0-100)", "tier": "moderate", "factors": ["Utilization 48%","Short credit history on LOC"] },
	"recommendations": [
		{ "id": "rec_refi", "text": "Refinance equipment loan @7.1% (save ~$1,200/yr).", "impact": "high", "effort": "medium", "timeframe": "2 wks" },
		{ "id": "rec_biweekly", "text": "Switch to biweekly payments.", "impact": "medium", "effort": "low", "timeframe": "3 mo" }
	],
	"export": { "pdf_available": true, "csv_available": true }
};

function fmtMoney(v: any) {
	if (v == null) return "—";
	if (typeof v === "string") return v;
	return `$${Number(v).toLocaleString()}`;
}

export default function DebtClient() {
	const [data, setData] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showSimulator, setShowSimulator] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const apiRoot = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
				const url = `${apiRoot.replace(/\/$/, "")}/api/ai/debt/full`;
				const resp = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ company_id: "demo", range: "YTD", include_market_rates: true, include_credit_score: true, include_integrations: true }),
					cache: "no-store",
				});
				if (!resp.ok) throw new Error(`debt full API failed (${resp.status})`);
				const json = await resp.json();
				if (!mounted) return;
				setData(json);
			} catch (e: any) {
				// fallback to callIntent helper if available
				try {
					const intentResp = await callIntent("debt_advisor", { company_id: "demo", range: "YTD" }, "demo");
					if (intentResp) {
						setData(intentResp);
						setLoading(false);
						return;
					}
				} catch (ie) {
					// ignore
				}
				// final fallback to STUB
				setError((e && e.message) || "failed");
				setData(STUB);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const kpis = data?.kpis || [];

	return (
		<div className="space-y-6">
			<section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
				{(loading ? STUB.kpis : kpis).map((k: any) => (
					<div key={k.id} className="rounded-2xl border bg-white p-4 shadow-sm">
						<div className="text-xs text-slate-500">{k.label}</div>
						<div className="text-lg font-semibold mt-1">{k.formatted || (typeof k.value === 'number' ? (k.id==='avg_rate' ? `${(k.value*100).toFixed(1)}%` : fmtMoney(k.value)) : String(k.value || '—'))}</div>
						<div className="text-xs text-slate-400 mt-1">{k.accounts ? `${k.accounts} accounts` : ''}</div>
					</div>
				))}
			</section>

			<section className="grid md:grid-cols-3 gap-4">
				<div className="md:col-span-2 rounded-2xl border bg-white p-4">
					<div className="flex items-start justify-between">
						<div>
							<div className="text-sm font-semibold mb-2">Debt Overview</div>
							<div className="text-xs text-slate-500">Unified table of loans, cards, and lines grouped by type.</div>
						</div>
						<div className="text-xs text-slate-400">{loading ? 'Loading…' : error ? `Using stub (${error})` : 'Live data'}</div>
					</div>

					<div className="mt-3 overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-white">
								<tr className="text-left text-xs text-slate-500">
									<th className="pb-2">Lender</th>
									<th className="pb-2">Original / Current</th>
									<th className="pb-2">Rate</th>
									<th className="pb-2">Term (mo)</th>
									<th className="pb-2">Monthly</th>
									<th className="pb-2">Next Due</th>
									<th className="pb-2">Auto</th>
								</tr>
							</thead>
							<tbody>
								{(data?.accounts || STUB.accounts).map((a: any) => (
									<tr key={a.id} className="border-t">
										<td className="py-2">{a.lender} <div className="text-xs text-slate-400">{a.type}</div></td>
										<td className="py-2">{a.original_balance ? fmtMoney(a.original_balance) + ' / ' : ''}{fmtMoney(a.current_balance || a.balance)}</td>
										<td className="py-2">{(a.rate_pct || a.apr_pct) ? `${(a.rate_pct || a.apr_pct).toFixed ? (a.rate_pct || a.apr_pct).toFixed(2) : a.rate_pct || a.apr_pct}%` : '—'}</td>
										<td className="py-2">{a.term_months_remaining ?? '—'}</td>
										<td className="py-2">{fmtMoney(a.payment_monthly)}</td>
										<td className="py-2">{a.next_due_date || '—'}</td>
										<td className="py-2">{a.auto_debit ? 'Auto' : 'Manual'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<div className="text-xs text-slate-500 mb-2">Balance by type</div>
							<svg className="w-full h-36" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
								{/* simple donut: render arcs proportional to values */}
								{(() => {
									const items = data?.charts?.balance_by_type || STUB.charts.balance_by_type;
									const total = items.reduce((s: number, it: any) => s + (it.value || 0), 0) || 1;
									let start = 0;
									return items.map((it: any, i: number) => {
										const v = it.value || 0;
										const frac = v / total;
										const end = start + frac * Math.PI * 2;
										const x1 = 100 + 40 * Math.cos(start);
										const y1 = 50 + 40 * Math.sin(start);
										const x2 = 100 + 40 * Math.cos(end);
										const y2 = 50 + 40 * Math.sin(end);
										const large = frac > 0.5 ? 1 : 0;
										const d = `M ${100} ${50} L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`;
										start = end;
										const colors = ["#0f766e", "#c026d3", "#f97316", "#ef4444", "#3b82f6"];
										return <path key={i} d={d} fill={colors[i % colors.length]} stroke="#fff" />;
									});
								})()}
							</svg>
						</div>

						<div>
							<div className="text-xs text-slate-500 mb-2">Balance trend</div>
							<svg className="w-full h-36" viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet">
								{(() => {
									const trend = data?.charts?.balance_trend || STUB.charts.balance_trend;
									if (!trend || trend.length === 0) return null;
									const max = Math.max(...trend.map((t: any) => Number(t.total || 0)), 1);
									const points = trend.map((t: any, i: number) => `${(i / Math.max(1, trend.length - 1) * 200).toFixed(1)},${(80 - (Number(t.total) / max) * 70).toFixed(1)}`).join(' ');
									return <polyline fill="none" stroke="#0f766e" strokeWidth={2} points={points} />;
								})()}
							</svg>

							<div className="text-xs text-slate-400 mt-2">Upcoming payments timeline</div>
							<ul className="mt-2 text-sm">
								{(data?.charts?.payments_timeline || STUB.charts.payments_timeline).map((p: any) => (
									<li key={p.date} className="flex justify-between"><span>{p.date}</span><span>{fmtMoney(p.amount)}</span></li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border bg-white p-4">
					<div className="text-sm font-semibold mb-2">Integrations & Sync</div>
					<div className="text-xs text-slate-500">Accounting, Banking, Lenders, Equipment, SBA. Connect to sync balances and provenance badges.</div>
					<div className="mt-3 space-y-2 text-sm">
						<div className="flex items-center justify-between"><div>QuickBooks (QBO)</div><div className="text-xs text-slate-400">Not connected</div></div>
						<div className="flex items-center justify-between"><div>Plaid</div><div className="text-xs text-slate-400">Connected · last sync 2025-10-20</div></div>
						<div className="flex items-center justify-between"><div>BofA</div><div className="text-xs text-slate-400">Connected</div></div>
					</div>

					<div className="mt-4">
						<div className="text-sm font-semibold mb-2">Credit Utilization</div>
						<div className="text-lg font-semibold">{Math.round(((data?.utilization?.utilization_pct ?? STUB.utilization.utilization_pct) * 100))}%</div>
						<div className="text-xs text-slate-500 mt-1">Limit ${((data?.utilization?.total_limit)||STUB.utilization.total_limit).toLocaleString()} · Revolving ${((data?.utilization?.total_revolving_balance)||STUB.utilization.total_revolving_balance).toLocaleString()}</div>
					</div>

					<div className="mt-4">
						<div className="text-sm font-semibold">Risk Summary</div>
						<div className="text-xs text-slate-500 mt-1">{data?.risk?.summary || STUB.risk.summary}</div>
						<ul className="mt-2 text-sm">
							{(data?.risk?.alerts || STUB.risk.alerts).map((a: any) => (
								<li key={a.id} className="flex justify-between"><span>{a.text}</span><button className="text-xs text-blue-600">{a.cta}</button></li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<section className="grid md:grid-cols-3 gap-4">
				<div className="md:col-span-2 rounded-2xl border bg-white p-4">
					<div className="text-sm font-semibold mb-2">AI Debt Optimization Engine</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{(data?.optimization || STUB.optimization).map((o: any) => (
							<div key={o.id} className="border rounded p-3">
								<div className="text-sm font-semibold">{o.type === 'refinance' ? 'Refinance' : o.type}</div>
								<div className="text-xs text-slate-500 mt-1">{o.est_annual_savings ? `$${o.est_annual_savings}/yr` : o.est_interest_saved ? `$${o.est_interest_saved}` : ''}</div>
								<div className="mt-2 flex gap-2">
									<button className="text-sm bg-slate-100 px-2 py-1 rounded">Simulate</button>
									<button className="text-sm bg-slate-100 px-2 py-1 rounded">Add Reminder</button>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border bg-white p-4">
					<div className="text-sm font-semibold mb-2">Scenario Simulator</div>
					<Simulator scenarios={(data?.scenarios || STUB.scenarios)} onApply={(s:any)=>{ /* navigate to Scenario Lab - stub */ }} />
				</div>
			</section>

			<section className="grid md:grid-cols-3 gap-4">
				<div className="md:col-span-2 rounded-2xl border bg-white p-4">
					<div className="text-sm font-semibold mb-2">Credit Score & Lender Readiness</div>
					<div className="text-lg font-semibold">{data?.credit_score?.score ?? STUB.credit_score.score} / {data?.credit_score?.scale ?? STUB.credit_score.scale}</div>
					<div className="text-xs text-slate-500 mt-1">{(data?.credit_score?.tier || STUB.credit_score.tier)}</div>
				</div>

				<div className="rounded-2xl border bg-white p-4">
					<div className="text-sm font-semibold mb-2">Recommendations & Action Plan</div>
					<ul className="text-sm mt-2 space-y-2">
						{(data?.recommendations || STUB.recommendations).map((r:any)=> (
							<li key={r.id} className="flex justify-between items-start"><div><div className="font-semibold">{r.text}</div><div className="text-xs text-slate-500">Impact: {r.impact} · Effort: {r.effort}</div></div><div className="space-y-1"><button className="text-sm bg-slate-100 px-2 py-1 rounded">Simulate</button><button className="text-sm bg-slate-100 px-2 py-1 rounded">Send to Lab</button></div></li>
						))}
					</ul>
				</div>
			</section>

			<ExportButtons data={data || STUB} />

			{/* Floating Chatbot */}
			<DebtChatbot />

			{/* Simulator Modal */}
			{showSimulator && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-semibold">Debt Scenario Simulator</h2>
								<button 
									onClick={() => setShowSimulator(false)}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							<Simulator 
								scenarios={data?.scenarios || STUB.scenarios} 
								onApply={(s: any) => {
									console.log('Apply scenario:', s);
									setShowSimulator(false);
								}} 
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
