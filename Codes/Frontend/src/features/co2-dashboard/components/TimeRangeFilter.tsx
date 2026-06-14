// src/features/co2-dashboard/components/TimeRangeFilter.tsx
// Componente PRESENTACIONAL — Selector de rango de tiempo.

import React from 'react';
import { TimeRange } from '../../../types/sensor.types';

interface TimeRangeFilterProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: string) => void;
}

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ timeRange, onTimeRangeChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full">
      <h2 className="text-xl font-semibold mb-4">Filtro por periodo</h2>
      <select
        className="w-full mb-4 p-2 border rounded"
        value={timeRange}
        onChange={(e) => onTimeRangeChange(e.target.value)}
      >
        <option value="1h">Última hora</option>
        <option value="3h">Últimas 3 horas</option>
        <option value="12h">Últimas 12 horas</option>
        <option value="24h">Últimas 24 horas</option>
        <option value="7d">Últimos 7 días</option>
        <option value="june">Todo Junio</option>
      </select>
    </div>
  );
};

export default TimeRangeFilter;
