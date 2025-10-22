import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Liability Forecast Chart
export function LiabilityForecastChart({ data }: { data: Array<{ quarter: string; projected: number; planned_payments: number }> }) {
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-500">No forecast data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="quarter" />
        <YAxis />
        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
        <Bar dataKey="projected" fill="#3b82f6" name="Projected" />
        <Bar dataKey="planned_payments" fill="#10b981" name="Planned Payments" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Expense Mix Pie Chart
export function ExpenseMixChart({ data }: { data: Array<{ category: string; pct: number }> }) {
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-500">No expense data</div>;
  }

  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={5}
          dataKey="pct"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, '']} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Peer Comparison Chart
export function PeerComparisonChart({ data }: { data: { yours: number; peer_avg: number } }) {
  if (!data) {
    return <div className="h-32 flex items-center justify-center text-gray-500">No comparison data</div>;
  }

  const chartData = [
    { name: 'Your Rate', value: data.yours * 100, fill: '#3b82f6' },
    { name: 'Peer Average', value: data.peer_avg * 100, fill: '#94a3b8' }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 30]} />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '']} />
        <Bar dataKey="value" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Quarterly Set-aside Chart
export function SetAsideChart({ weeklyAmount, weeksUntilDue }: { weeklyAmount: number; weeksUntilDue: number }) {
  if (!weeklyAmount || !weeksUntilDue) {
    return <div className="h-32 flex items-center justify-center text-gray-500">No set-aside data</div>;
  }

  const data = Array.from({ length: Math.min(weeksUntilDue, 12) }, (_, i) => ({
    week: `Week ${i + 1}`,
    accumulated: (i + 1) * weeklyAmount
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Accumulated']} />
        <Line type="monotone" dataKey="accumulated" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}