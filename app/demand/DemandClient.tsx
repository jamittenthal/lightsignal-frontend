"use client";
import React, { useState } from "react";
import ForecastChat from "./ForecastChat";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function DemandClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData || {});
  const timeline = data.timeline || [];
  const heatmap = data.heatmap || [];

  // Transform timeline data for Recharts
  const chartData = timeline.map((t: any) => ({
    date: new Date(t.date).toLocaleDateString(),
    p5: t.p5 || 0,
    p50: t.p50 || 0,
    p95: t.p95 || 0,
    markers: (t.markers || []).join(', '),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">Demand Overview</div>
          <div className="text-xs text-slate-500">3 / 6 / 12-month rolling forecast · p5/p50/p95 bands · event & weather markers</div>
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="text-xs text-slate-500 mb-2">Forecast Timeline</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip 
              formatter={(value, name) => [value, name === 'p50' ? 'Median' : name === 'p5' ? '5th %ile' : '95th %ile']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area type="monotone" dataKey="p95" stackId="1" stroke="#059669" fill="#d1fae5" fillOpacity={0.3} />
            <Area type="monotone" dataKey="p5" stackId="1" stroke="#059669" fill="#ffffff" fillOpacity={1} />
            <Line type="monotone" dataKey="p50" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="text-xs text-slate-500 mb-2">Heatmap Calendar</div>
        <div className="grid grid-cols-7 gap-1">
          {heatmap.map((h: any) => (
            <div key={h.date} title={`${h.date} · ${h.intensity}`} className={`h-8 rounded ${h.intensity > 70 ? 'bg-emerald-700' : h.intensity > 50 ? 'bg-emerald-500' : 'bg-emerald-200'} flex items-center justify-center text-xs`}>
              {h.events?.length ? '🎪' : h.weather === 'rain' ? '🌧️' : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="text-xs text-slate-500 mb-2">Products & Services</div>
        <ul className="text-sm">
          {(data.products_services || []).map((p: any) => (
            <li key={p.segment} className="flex justify-between border-b py-1"><span>{p.segment}</span><span className="text-slate-600">{p.delta_pct ? `${p.delta_pct}%` : '—'}</span></li>
          ))}
        </ul>
      </div>

      <ForecastChat />
    </div>
  );
}
