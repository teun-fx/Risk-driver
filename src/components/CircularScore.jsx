import React from 'react';

export default function CircularScore({ score, label, size = 140 }) {
  const radius = size * 0.386;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#6b7280' : '#dc2626';
  const center = size / 2;
  const stroke = size * 0.086;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text x={center} y={center - 2} textAnchor="middle" fontSize={size * 0.2} fontWeight="bold" fill="#111827">
          {score}
        </text>
        <text x={center} y={center + size * 0.14} textAnchor="middle" fontSize={size * 0.08} fill="#9ca3af">
          / 100
        </text>
      </svg>
      {label && <div className="mt-1 text-sm font-semibold text-gray-900">{label}</div>}
    </div>
  );
}
