// src/components/MetricTabs.tsx
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
      className={`flex p-1 bg-gray-100/50 rounded-lg gap-1 border border-gray-100 ${className}`}
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
            onClick={() => onChange(metric)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-2 transition-all duration-200 outline-none whitespace-nowrap ${
              active
                ? 'bg-white text-utec-cyan shadow-sm border border-gray-200/50 scale-[1.02]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all ${active ? 'bg-utec-cyan scale-110' : 'bg-gray-300'}`}
              aria-hidden
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
};

export default MetricTabs;
