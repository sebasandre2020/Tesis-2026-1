// src/features/co2-dashboard/components/CO2TrendChart.tsx
// Componente PRESENTACIONAL — Gráfica comparativa de tendencias de CO₂.

import React from 'react';
import { Chart } from 'primereact/chart';
import { ChartData, TimeRange } from '../../../types/sensor.types';
import { getTimeRangeLabel } from '../../../utils/formatters';

interface CO2TrendChartProps {
  data: ChartData;
  timeRange: TimeRange;
  loading?: boolean;
}

const hasData = (data: ChartData) =>
  data.datasets.length > 0 && data.datasets.some(d => d.data.some(v => v !== null && v !== undefined));

const CO2TrendChart: React.FC<CO2TrendChartProps> = ({ data, timeRange, loading = false }) => {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: false },
    },
  };

  return (
    <div className="comparative-chart bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-2">
        Tendencias de CO₂ — {getTimeRangeLabel(timeRange)}
      </h2>
      <div className="relative flex-1 min-h-[320px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        )}
        {!loading && !hasData(data) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-gray-500 font-medium">Sin lecturas en este período.</p>
            <p className="text-sm text-gray-400 mt-1">
              Aún no se han recibido lecturas de los sensores para el rango seleccionado.
            </p>
          </div>
        ) : (
          <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default CO2TrendChart;
