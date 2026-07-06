// src/features/co2-dashboard/components/TimeRangeFilter.tsx
// Componente PRESENTACIONAL — Selector de rango de tiempo con soporte para rango personalizado.

import React from 'react';
import { TimeRange } from '../../../types/sensor.types';

interface TimeRangeFilterProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: string) => void;
  customFrom?: string;
  customTo?: string;
  onCustomFromChange?: (v: string) => void;
  onCustomToChange?: (v: string) => void;
  onApplyCustomRange?: (from: string, to: string) => void;
}

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  timeRange,
  onTimeRangeChange,
  customFrom = '',
  customTo = '',
  onCustomFromChange,
  onCustomToChange,
  onApplyCustomRange,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col gap-3 lg:absolute lg:inset-0 overflow-y-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Filtro por periodo</h2>
        <select
          className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
        >
          <option value="1h">Última hora</option>
          <option value="3h">Últimas 3 horas</option>
          <option value="12h">Últimas 12 horas</option>
          <option value="24h">Últimas 24 horas</option>
          <option value="7d">Últimos 7 días</option>
          <option value="june">Todo Junio</option>
          <option value="custom">Personalizado...</option>
        </select>
      </div>

      {timeRange === 'custom' && (
        <div className="flex flex-col gap-3 border-t pt-3 border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="datetime-local"
              className="w-full p-1.5 border rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              value={customFrom}
              onChange={(e) => onCustomFromChange && onCustomFromChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="datetime-local"
              className="w-full p-1.5 border rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              value={customTo}
              onChange={(e) => onCustomToChange && onCustomToChange(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors mt-1"
            onClick={() => onApplyCustomRange && onApplyCustomRange(customFrom, customTo)}
          >
            Aplicar Filtro
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeRangeFilter;
