// Tax Page Utility Functions and Validation
// This file contains utility functions used by the tax page and validates data structures

// Utility Functions
export function formatCurrency(v: number | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString ? `$${v.toLocaleString()}` : `$${v}`;
}

export function getKpiTooltip(id: string): string {
  const tooltips = {
    tax_liability_ytd: "Current year's projected taxes based on live accounting data",
    deductions_identified: "Count & total value of potential deductions not yet applied",
    effective_tax_rate: "Tax expense ÷ net income — compared to industry peers",
    savings_potential: "Amount the business could save with optimized structure & deductions",
    next_milestone: "Upcoming filing or payment date",
    plan_score: "Readiness rating based on projections, set-asides, and compliance"
  };
  return tooltips[id as keyof typeof tooltips] || "Tax optimization metric";
}

export function getStateColor(state: string): string {
  const colors = {
    good: "bg-green-100 text-green-800",
    caution: "bg-yellow-100 text-yellow-800",
    warning: "bg-red-100 text-red-800",
    stable: "bg-blue-100 text-blue-800"
  };
  return colors[state as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

export function planScoreBadge(score: number | undefined): { score: number | string; className: string } | string {
  if (score == null) return "—";
  const cls = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  return { score, className: cls };
}

// Type Definitions
export interface TaxKPI {
  id: string;
  label: string;
  value?: number;
  count?: number;
  value_total?: number;
  formatted?: string;
  formatted_value?: string;
  as_of_qtr?: string;
  state?: 'good' | 'caution' | 'warning' | 'stable';
  peer_avg?: number;
  provenance?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface TaxOpportunity {
  id: string;
  title: string;
  estimate: number;
  confidence: 'high' | 'medium' | 'low';
  irs_ref?: string;
  provenance?: string[];
  actions?: string[];
}

export interface TaxQuarterlyPlan {
  next_due_date: string;
  estimate_due: number;
  set_aside_weekly: number;
  scenarios?: Array<{
    name: string;
    delta_liability: number;
  }>;
}

export interface TaxData {
  kpis: TaxKPI[];
  overview?: {
    summary: string;
    charts?: {
      liability_forecast?: Array<{ quarter: string; projected: number; planned_payments: number }>;
      expense_mix?: Array<{ category: string; pct: number }>;
      peer_compare?: { yours: number; peer_avg: number };
    };
  };
  opportunities?: TaxOpportunity[];
  quarterly_plan?: TaxQuarterlyPlan;
  priority_actions?: Array<{
    id: string;
    text: string;
    impact: number;
    deadline: string;
    difficulty: 'low' | 'medium' | 'high';
  }>;
  export?: {
    pdf_available: boolean;
    csv_available?: boolean;
  };
}

// Data Validation Functions
export function validateTaxData(data: any): data is TaxData {
  if (!data || typeof data !== 'object') return false;
  
  // Check required fields
  if (!Array.isArray(data.kpis)) return false;
  
  // Validate KPIs structure
  for (const kpi of data.kpis) {
    if (!kpi.id || !kpi.label) return false;
    if (kpi.state && !['good', 'caution', 'warning', 'stable'].includes(kpi.state)) return false;
  }
  
  // Validate opportunities if present
  if (data.opportunities && Array.isArray(data.opportunities)) {
    for (const opp of data.opportunities) {
      if (!opp.id || !opp.title || typeof opp.estimate !== 'number') return false;
      if (opp.confidence && !['high', 'medium', 'low'].includes(opp.confidence)) return false;
    }
  }
  
  return true;
}

// Sample valid data for testing
export const SAMPLE_TAX_DATA: TaxData = {
  kpis: [
    { id: "tax_liability_ytd", label: "Estimated Tax Liability (YTD)", value: 46230, formatted: "$46,230", as_of_qtr: "Q3", state: "caution" },
    { id: "deductions_identified", label: "Identified Deduction Opportunities", count: 12, value_total: 14200, formatted_value: "$14,200", state: "good" },
    { id: "effective_tax_rate", label: "Effective Tax Rate", value: 0.148, peer_avg: 0.192, formatted: "14.8% vs 19.2%", state: "good" },
    { id: "plan_score", label: "Quarterly Tax Plan Score", value: 85, state: "good" }
  ],
  overview: {
    summary: "Effective rate at 14.8% due to accelerated depreciation and Sec. 179.",
    charts: {
      liability_forecast: [{ quarter: "Q4", projected: 11600, planned_payments: 8000 }],
      expense_mix: [{ category: "Deductible", pct: 0.82 }, { category: "Non-deductible", pct: 0.18 }],
      peer_compare: { yours: 0.148, peer_avg: 0.192 }
    }
  },
  opportunities: [
    { id: "sec179_vehicle", title: "Section 179 vehicle deduction", estimate: 7500, confidence: "high", irs_ref: "§179", provenance: ["QuickBooks"] }
  ],
  quarterly_plan: {
    next_due_date: "2026-01-15",
    estimate_due: 11600,
    set_aside_weekly: 1150,
    scenarios: [
      { name: "Buy equipment now", delta_liability: -2400 },
      { name: "Defer to Q1", delta_liability: 0 }
    ]
  },
  priority_actions: [
    { id: "p-sec179", text: "Maximize Section 179 before 12/31", impact: 32000, deadline: "2025-12-31", difficulty: "medium" }
  ],
  export: { pdf_available: true, csv_available: true }
};

// Validation Tests (can be run in browser console)
export function runValidationTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  const test = (name: string, condition: boolean) => {
    if (condition) {
      results.push(`✓ ${name}`);
      passed++;
    } else {
      results.push(`✗ ${name}`);
      failed++;
    }
  };

  // Test utility functions
  test('formatCurrency with valid number', formatCurrency(46230) === '$46,230');
  test('formatCurrency with undefined', formatCurrency(undefined) === '—');
  test('formatCurrency with zero', formatCurrency(0) === '$0');

  test('getKpiTooltip with valid id', getKpiTooltip('tax_liability_ytd').includes('projected taxes'));
  test('getKpiTooltip with invalid id', getKpiTooltip('invalid_id') === 'Tax optimization metric');

  test('getStateColor with good state', getStateColor('good') === 'bg-green-100 text-green-800');
  test('getStateColor with invalid state', getStateColor('invalid') === 'bg-gray-100 text-gray-800');

  const badge = planScoreBadge(85);
  test('planScoreBadge with good score', typeof badge === 'object' && badge.className === 'text-green-600');
  test('planScoreBadge with undefined', planScoreBadge(undefined) === '—');

  // Test data validation
  test('validateTaxData with valid data', validateTaxData(SAMPLE_TAX_DATA));
  test('validateTaxData with invalid data', !validateTaxData({ invalid: true }));
  test('validateTaxData with null', !validateTaxData(null));

  // Test sample data structure
  test('Sample data has required KPIs', SAMPLE_TAX_DATA.kpis.length > 0);
  test('Sample data has overview', !!SAMPLE_TAX_DATA.overview);
  test('Sample data has opportunities', !!SAMPLE_TAX_DATA.opportunities && SAMPLE_TAX_DATA.opportunities.length > 0);

  return { passed, failed, results };
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).taxPageValidation = {
    formatCurrency,
    getKpiTooltip,
    getStateColor,
    planScoreBadge,
    validateTaxData,
    SAMPLE_TAX_DATA,
    runValidationTests
  };
}