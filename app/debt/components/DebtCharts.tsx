import React from 'react';

export function DonutChart({ 
  data, 
  width = 200, 
  height = 200 
}: { 
  data: Array<{ type: string; value: number }>; 
  width?: number; 
  height?: number; 
}) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">No balance data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const innerRadius = radius * 0.6;

  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EC4899', // pink
  ];

  let cumulativeAngle = 0;
  const paths = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;

    const x1 = centerX + Math.cos(startAngle) * radius;
    const y1 = centerY + Math.sin(startAngle) * radius;
    const x2 = centerX + Math.cos(endAngle) * radius;
    const y2 = centerY + Math.sin(endAngle) * radius;

    const x3 = centerX + Math.cos(endAngle) * innerRadius;
    const y3 = centerY + Math.sin(endAngle) * innerRadius;
    const x4 = centerX + Math.cos(startAngle) * innerRadius;
    const y4 = centerY + Math.sin(startAngle) * innerRadius;

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    cumulativeAngle += angle;

    return {
      path: pathData,
      color: colors[index % colors.length],
      type: item.type,
      value: item.value,
      percentage: (percentage * 100).toFixed(1)
    };
  });

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex items-center gap-4">
      <svg width={width} height={height}>
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.path}
            fill={path.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="text-lg font-semibold fill-gray-700"
        >
          ${(total / 1000).toFixed(0)}k
        </text>
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          className="text-sm fill-gray-500"
        >
          Total Debt
        </text>
      </svg>
      <div className="space-y-2">
        {paths.map((path, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: path.color }}
            />
            <span className="text-gray-700">{formatType(path.type)}</span>
            <span className="text-gray-500">${(path.value / 1000).toFixed(0)}k</span>
            <span className="text-gray-400">({path.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ 
  data, 
  width = 300, 
  height = 120 
}: { 
  data: Array<{ month: string; total: number }>; 
  width?: number; 
  height?: number; 
}) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">No trend data available</div>;
  }

  const values = data.map(d => d.total);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((item.total - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <div className="text-sm font-medium mb-2 text-gray-700">Debt Balance Trend</div>
      <svg width={width} height={height} className="border rounded bg-white">
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={points}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((item.total - min) / range) * height;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="#3B82F6"
            />
          );
        })}
        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * width;
          return (
            <text
              key={index}
              x={x}
              y={height + 15}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {item.month.split('-')[1]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function PaymentTimeline({ 
  payments 
}: { 
  payments: Array<{ date: string; amount: number; account_id: string }> 
}) {
  if (!payments || payments.length === 0) {
    return <div className="text-gray-500 text-sm">No upcoming payments</div>;
  }

  const sortedPayments = [...payments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div>
      <div className="text-sm font-medium mb-3 text-gray-700">Upcoming Payments</div>
      <div className="space-y-3">
        {sortedPayments.map((payment, index) => {
          const date = new Date(payment.date);
          const isOverdue = date < new Date();
          const isUpcoming = date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isOverdue ? 'bg-red-50 border-red-200' :
                isUpcoming ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  isOverdue ? 'bg-red-500' :
                  isUpcoming ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    ${payment.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {payment.account_id}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {date.toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AmortizationChart({ 
  account,
  width = 400, 
  height = 200 
}: { 
  account: any;
  width?: number; 
  height?: number; 
}) {
  if (!account || !account.current_balance || !account.rate_pct) {
    return <div className="text-gray-500 text-sm">No amortization data available</div>;
  }

  // Simple amortization calculation for visualization
  const monthlyRate = account.rate_pct / 100 / 12;
  const termMonths = account.term_months_remaining || 24;
  const balance = account.current_balance;
  const payment = account.payment_monthly;

  const schedule = [];
  let remainingBalance = balance;

  for (let month = 1; month <= Math.min(termMonths, 24); month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = payment - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);
    
    schedule.push({
      month,
      principal: principalPayment,
      interest: interestPayment,
      balance: remainingBalance
    });

    if (remainingBalance <= 0) break;
  }

  const maxPayment = Math.max(...schedule.map(s => s.principal + s.interest));

  return (
    <div>
      <div className="text-sm font-medium mb-2 text-gray-700">
        Amortization Schedule - {account.lender}
      </div>
      <svg width={width} height={height} className="border rounded bg-white">
        {schedule.map((entry, index) => {
          const x = (index / (schedule.length - 1)) * (width - 40) + 20;
          const principalHeight = (entry.principal / maxPayment) * height * 0.8;
          const interestHeight = (entry.interest / maxPayment) * height * 0.8;
          const totalHeight = principalHeight + interestHeight;
          
          return (
            <g key={index}>
              {/* Principal portion */}
              <rect
                x={x - 8}
                y={height - totalHeight}
                width={16}
                height={principalHeight}
                fill="#10B981"
              />
              {/* Interest portion */}
              <rect
                x={x - 8}
                y={height - interestHeight}
                width={16}
                height={interestHeight}
                fill="#EF4444"
              />
              {/* Month label */}
              {index % 3 === 0 && (
                <text
                  x={x}
                  y={height + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {entry.month}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Legend */}
        <g transform="translate(10, 10)">
          <rect x={0} y={0} width={12} height={12} fill="#10B981" />
          <text x={16} y={10} className="text-xs fill-gray-700">Principal</text>
          <rect x={80} y={0} width={12} height={12} fill="#EF4444" />
          <text x={96} y={10} className="text-xs fill-gray-700">Interest</text>
        </g>
      </svg>
    </div>
  );
}