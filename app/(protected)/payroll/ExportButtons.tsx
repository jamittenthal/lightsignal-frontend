"use client";
import React from "react";

export function ExportButtons({ data }: { data: any }) {
  function exportCSV() {
    const kpis = data.kpis || [];
    const snapshot = data.snapshot || {};
    
    const csvData = [
      ['Metric', 'Value', 'Type'],
      ...kpis.map((k: any) => [
        k.label,
        typeof k.value === 'number' ? k.value : String(k.value || '—'),
        'KPI'
      ]),
      ['', '', ''],
      ['Role/Department', 'Headcount', 'Avg Comp Monthly', '% of Payroll'],
      ...(snapshot.by_role || []).map((r: any) => [
        r.role,
        r.headcount,
        r.avg_comp_month,
        Math.round((r.pct_of_payroll || 0) * 100) + '%'
      ])
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll_snapshot.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  function requestApproval() {
    alert('Approval request sent to finance team for review.');
  }

  return (
    <section className="flex gap-2">
      <button 
        className="rounded bg-slate-800 text-white px-3 py-1 hover:bg-slate-700" 
        onClick={exportPDF}
      >
        Export PDF
      </button>
      <button 
        className="rounded border px-3 py-1 hover:bg-slate-50" 
        onClick={exportCSV}
      >
        Export CSV
      </button>
      <button 
        className="rounded border px-3 py-1 hover:bg-slate-50" 
        onClick={requestApproval}
      >
        Request approval
      </button>
    </section>
  );
}