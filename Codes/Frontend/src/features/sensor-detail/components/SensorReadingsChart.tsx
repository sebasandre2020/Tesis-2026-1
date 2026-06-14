// src/features/sensor-detail/components/SensorReadingsChart.tsx
// Componente PRESENTACIONAL — Gráfica de lecturas recientes de un sensor.

import React from 'react';
import { Chart } from 'primereact/chart';
import { ChartData } from '../../../types/sensor.types';

interface SensorReadingsChartProps {
  data: ChartData;
  title?: string;
  loading?: boolean;
}

const hasData = (data: ChartData) =>
  data.datasets.length > 0 && data.datasets.some(d => d.data.length > 0);

const SensorReadingsChart: React.FC<SensorReadingsChartProps> = ({
  data,
  title = 'Lecturas Recientes',
  loading = false,
}) => {
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
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="relative flex-1 min-h-[280px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <p className="text-gray-500">Cargando lecturas...</p>
          </div>
        )}
        {!loading && !hasData(data) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-gray-500 font-medium">Sin lecturas en este período.</p>
            <p className="text-sm text-gray-400 mt-1">
              Aún no se han recibido datos de este sensor para el rango seleccionado.
            </p>
          </div>
        ) : (
          <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default SensorReadingsChart;
