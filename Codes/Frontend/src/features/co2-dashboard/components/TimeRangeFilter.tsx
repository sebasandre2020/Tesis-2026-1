// src/features/co2-dashboard/components/TimeRangeFilter.tsx
import React from 'react';
import { TbFilter, TbCalendarTime } from 'react-icons/tb';
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
    <div className="bg-gray-100/50 p-5 rounded-xl border border-gray-200 flex flex-col gap-4 lg:h-full overflow-y-auto">
      <div>
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
          <TbFilter className="mr-1.5" /> Ventana de Análisis
        </h2>
        <div className="relative">
          <select
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-utec-black focus:ring-2 focus:ring-utec-cyan/20 focus:border-utec-cyan outline-none appearance-none cursor-pointer transition-all"
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
          >
            <option value="1h">Última hora</option>
            <option value="3h">Últimas 3 horas</option>
            <option value="12h">Últimas 12 horas</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
            <option value="june">Todo Junio</option>
            <option value="custom">Rango Personalizado</option>
          </select>
          <TbCalendarTime className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {timeRange === 'custom' && (
        <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Fecha Inicio</label>
            <input
              type="datetime-local"
              className="w-full p-2 bg-white border border-gray-200 rounded text-xs font-mono focus:ring-2 focus:ring-utec-cyan/20 outline-none transition-all"
              value={customFrom}
              onChange={(e) => onCustomFromChange && onCustomFromChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Fecha Fin</label>
            <input
              type="datetime-local"
              className="w-full p-2 bg-white border border-gray-200 rounded text-xs font-mono focus:ring-2 focus:ring-utec-cyan/20 outline-none transition-all"
              value={customTo}
              onChange={(e) => onCustomToChange && onCustomToChange(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="w-full py-2 bg-utec-cyan hover:bg-utec-cyan/90 text-white rounded text-xs font-bold uppercase tracking-widest shadow-sm shadow-utec-cyan/20 transition-all active:scale-[0.98]"
            onClick={() => onApplyCustomRange && onApplyCustomRange(customFrom, customTo)}
          >
            Aplicar Filtro
          </button>
        </div>
      )}
      
      <div className="mt-auto opacity-50">
        <p className="text-[9px] text-gray-500 font-medium italic">
          Seleccione un intervalo para visualizar tendencias históricas en la gráfica principal.
        </p>
      </div>
    </div>
  );
};

export default TimeRangeFilter;
