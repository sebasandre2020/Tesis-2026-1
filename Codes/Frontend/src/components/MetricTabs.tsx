// src/components/MetricTabs.tsx
// Tira de pestañas para cambiar de métrica (CO₂ / Polvo / Temperatura / Humedad).
// Reutilizada por el chart del sensor-detail y el chart del dashboard.

import React from 'react';
import { MetricType } from '../types/sensor.types';
import { METRIC_META, METRIC_ORDER } from '../utils/formatters';

interface MetricTabsProps {
  value: MetricType;
  onChange: (metric: MetricType) => void;
  className?: string;
}

const MetricTabs: React.FC<MetricTabsProps> = ({ value, onChange, className = '' }) => {
  return (
    <div
      role="tablist"
      aria-label="Métrica"
      className={`flex gap-1 border-b border-gray-200 overflow-x-auto ${className}`}
    >
      {METRIC_ORDER.map(metric => {
        const meta = METRIC_META[metric];
        const active = metric === value;
        return (
          <button
            key={metric}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`chart-panel-${metric}`}
            onClick={() => onChange(metric)}
            className={`px-3 py-2 text-sm font-medium rounded-t-md flex items-center gap-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap ${
              active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <span
              className="dot inline-block w-2 h-2 rounded-full"
              style={{ background: active ? '#fff' : meta.color }}
              aria-hidden
            />
            {meta.label}
            <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-70'}`}>
              ({meta.shortUnit})
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MetricTabs;
