import React from "react";

// Simple SVG-based charts for Business Insights
export function TrendlineChart({ data, width = 300, height = 120 }: { 
  data: Array<{ metric: string; series: number[] }>; 
  width?: number; 
  height?: number; 
}) {
  if (!data || data.length === 0) return <div className="text-slate-500 text-sm">No trend data available</div>;

  const colors = ["#3B82F6", "#EF4444", "#10B981"];
  
  return (
    <div className="space-y-2">
      {data.map((trend, idx) => {
        const series = trend.series || [];
        if (series.length < 2) return null;
        
        const min = Math.min(...series);
        const max = Math.max(...series);
        const range = max - min || 1;
        
        const points = series.map((value, i) => {
          const x = (i / (series.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          return `${x},${y}`;
        }).join(' ');
        
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-20 text-sm text-slate-600 capitalize">{trend.metric.replace('_', ' ')}</div>
            <svg width={width} height={height} className="border rounded">
              <polyline
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="2"
                points={points}
              />
              {series.map((value, i) => {
                const x = (i / (series.length - 1)) * width;
                const y = height - ((value - min) / range) * height;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={colors[idx % colors.length]}
                  />
                );
              })}
            </svg>
            <div className="text-sm text-slate-500">
              {series[series.length - 1]} 
              {trend.metric.includes('pct') && '%'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BarChart({ data, width = 300, height = 120 }: { 
  data: Array<{ driver: string; impact: number }>; 
  width?: number; 
  height?: number; 
}) {
  if (!data || data.length === 0) return <div className="text-slate-500 text-sm">No breakdown data available</div>;

  const maxAbs = Math.max(...data.map(d => Math.abs(d.impact)));
  const barHeight = height / data.length - 10;
  
  return (
    <div>
      <div className="text-sm font-medium mb-2">Profit Driver Breakdown</div>
      <svg width={width} height={height} className="border rounded bg-white">
        {data.map((item, idx) => {
          const barWidth = Math.abs(item.impact) / maxAbs * (width - 100);
          const x = item.impact >= 0 ? width / 2 : width / 2 - barWidth;
          const y = idx * (barHeight + 10) + 5;
          const color = item.impact >= 0 ? "#10B981" : "#EF4444";
          
          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="2"
              />
              <text
                x={10}
                y={y + barHeight / 2 + 4}
                className="text-xs fill-slate-700"
              >
                {item.driver}
              </text>
              <text
                x={width - 10}
                y={y + barHeight / 2 + 4}
                className="text-xs fill-slate-700"
                textAnchor="end"
              >
                ${(item.impact / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}
        <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="#E5E7EB" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function RadarChart({ data, width = 200, height = 200 }: { 
  data: { margins: number; growth: number; liquidity: number }; 
  width?: number; 
  height?: number; 
}) {
  if (!data) return <div className="text-slate-500 text-sm">No radar data available</div>;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  
  const metrics = [
    { label: 'Margins', value: data.margins || 0 },
    { label: 'Growth', value: data.growth || 0 },
    { label: 'Liquidity', value: data.liquidity || 0 }
  ];
  
  const angleStep = (2 * Math.PI) / metrics.length;
  
  const points = metrics.map((metric, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius * metric.value;
    const y = centerY + Math.sin(angle) * radius * metric.value;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div>
      <div className="text-sm font-medium mb-2">Peer Comparison Radar</div>
      <svg width={width} height={height} className="border rounded bg-white">
        {/* Grid circles */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map(r => (
          <circle
            key={r}
            cx={centerX}
            cy={centerY}
            r={radius * r}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}
        
        {/* Axis lines */}
        {metrics.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Data polygon */}
        <polygon
          points={points}
          fill="#3B82F6"
          fillOpacity="0.2"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        
        {/* Labels */}
        {metrics.map((metric, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = centerX + Math.cos(angle) * (radius + 15);
          const y = centerY + Math.sin(angle) * (radius + 15);
          return (
            <text
              key={i}
              x={x}
              y={y}
              className="text-xs fill-slate-700"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {metric.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function OpportunityMatrix({ data, width = 300, height = 200 }: { 
  data: Array<{ name: string; impact: string; difficulty: string }>; 
  width?: number; 
  height?: number; 
}) {
  if (!data || data.length === 0) return <div className="text-slate-500 text-sm">No opportunity data available</div>;

  const impactMap = { low: 0.2, medium: 0.5, high: 0.8 };
  const difficultyMap = { low: 0.2, medium: 0.5, high: 0.8 };
  
  return (
    <div>
      <div className="text-sm font-medium mb-2">Opportunity Matrix</div>
      <svg width={width} height={height} className="border rounded bg-white">
        {/* Grid lines */}
        <line x1={width/3} y1={0} x2={width/3} y2={height} stroke="#E5E7EB" strokeWidth="1" />
        <line x1={2*width/3} y1={0} x2={2*width/3} y2={height} stroke="#E5E7EB" strokeWidth="1" />
        <line x1={0} y1={height/3} x2={width} y2={height/3} stroke="#E5E7EB" strokeWidth="1" />
        <line x1={0} y1={2*height/3} x2={width} y2={2*height/3} stroke="#E5E7EB" strokeWidth="1" />
        
        {/* Axis labels */}
        <text x={width/2} y={height-5} className="text-xs fill-slate-500" textAnchor="middle">Difficulty →</text>
        <text x={10} y={height/2} className="text-xs fill-slate-500" transform={`rotate(-90 10 ${height/2})`} textAnchor="middle">Impact ↑</text>
        
        {/* Data points */}
        {data.map((item, idx) => {
          const x = (difficultyMap[item.difficulty as keyof typeof difficultyMap] || 0.5) * width;
          const y = height - (impactMap[item.impact as keyof typeof impactMap] || 0.5) * height;
          const color = item.impact === 'high' && item.difficulty === 'low' ? '#10B981' : 
                       item.impact === 'high' ? '#F59E0B' : '#6B7280';
          
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="6" fill={color} />
              <text x={x} y={y-10} className="text-xs fill-slate-700" textAnchor="middle">
                {item.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}