// src/features/sensor-detail/components/SensorReadingsChart.tsx
// Componente PRESENTACIONAL — Gráfica de lecturas recientes de un sensor.

import React from 'react';
import { Chart } from 'primereact/chart';
import { ChartData } from '../../../types/sensor.types';

interface SensorReadingsChartProps {
  data: ChartData;
  title?: string;
}

const SensorReadingsChart: React.FC<SensorReadingsChartProps> = ({ data, title = 'Lecturas Recientes' }) => {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="col-span-2 bg-white p-4 rounded-lg shadow-md border border-gray-200" style={{ height: '400px' }}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div style={{ height: '100%' }}>
        <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
      </div>
    </div>
  );
};

export default SensorReadingsChart;
