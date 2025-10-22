export default function KpiCard({ title, value, subtitle, children, className }: { title:string; value:string|number; subtitle?:string; children?:any; className?:string }) {
  return (
    <div className={(className||"") + " rounded-2xl border bg-white p-4 shadow-sm"}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
      {children}
    </div>
  );
}
